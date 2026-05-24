const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const nodemailer = require('nodemailer');
const https = require('https');
const net = require('net');

// ========== CONFIG ==========
const ACCESS_KEY = process.env.ACCESS_KEY || 'GHOST-BAN-2026';
const PORT = process.env.PORT || 3000;

// ========== PREMIUM DATABASE ==========
const PREMIUM_DB_PATH = path.join(__dirname, 'premium.json');
function loadPremiumDB() {
    if (!fs.existsSync(PREMIUM_DB_PATH)) return { premium: [], resellers: [] };
    try { return JSON.parse(fs.readFileSync(PREMIUM_DB_PATH)); } catch { return { premium: [], resellers: [] }; }
}
function savePremiumDB(data) { fs.writeFileSync(PREMIUM_DB_PATH, JSON.stringify(data, null, 2)); }
function isAdmin(userId) { return userId === 'admin'; }
function addPremium(userId) {
    const db = loadPremiumDB();
    if (!db.premium.includes(userId.toString())) { db.premium.push(userId.toString()); savePremiumDB(db); return true; }
    return false;
}
function removePremium(userId) {
    const db = loadPremiumDB();
    const idx = db.premium.indexOf(userId.toString());
    if (idx !== -1) { db.premium.splice(idx, 1); savePremiumDB(db); return true; }
    return false;
}
function getPremiumList() { return loadPremiumDB().premium; }

// ========== EMAIL ENGINE (from Telegram bot) ==========
const GMAIL_ACCOUNTS = [
  { user: process.env.GMAIL_1 || "destinyjob2007@gmail.com", pass: process.env.GMAIL_PASS_1 || "fdta vkdb mmhb quaa" },
  { user: process.env.GMAIL_2 || "destinyjob493@gmail.com",      pass: process.env.GMAIL_PASS_2 || "cuyh xtef wcgp mlgr" },
  { user: process.env.GMAIL_3 || "affiliatemarketingprogramm@gmail.com",   pass: process.env.GMAIL_PASS_3 || "golc mqlm ufip ssdz" },
];
function pickGmail(i) { return GMAIL_ACCOUNTS[i % GMAIL_ACCOUNTS.length]; }

const SENDER_DISPLAY_NAME = process.env.SENDER_DISPLAY_NAME || "WhatsApp Account Holder";

const ALL_TARGETS = [
  "support@support.whatsapp.com","support@whatsapp.com","info@whatsapp.com",
  "business@whatsapp.com","businesssupport@whatsapp.com","abuse@whatsapp.com",
  "abuse@support.whatsapp.com","security@whatsapp.com","security@support.whatsapp.com",
  "phishing@whatsapp.com","spam@whatsapp.com","android@support.whatsapp.com",
  "ios@support.whatsapp.com","web@support.whatsapp.com","desktop@support.whatsapp.com",
  "appeals@support.whatsapp.com","reports@support.whatsapp.com","support@meta.com",
  "abuse@meta.com","android_web@support.whatsapp.com","ios_web@support.whatsapp.com",
  "webclient_web@support.whatsapp.com","1483635209301664@support.whatsapp.com",
  "businesscomplaints@support.whatsapp.com",
];
const BASIC_TARGETS = ALL_TARGETS.slice(0, 10);

const UNBAN_TARGETS = [
  "appeals@support.whatsapp.com","support@support.whatsapp.com","support@whatsapp.com",
  "abuse@whatsapp.com","reports@support.whatsapp.com","businesscomplaints@support.whatsapp.com",
  "abuse@meta.com","support@meta.com","security@whatsapp.com","info@whatsapp.com",
];

// Load templates
const getTemplates = require("./templates");
const getUnbanTemplates = require("./unban_templates");

// ========== PROXIES ==========
const PROXIES_ENABLED = process.env.USE_PROXIES === "1";
function parseProxies(raw) {
  return raw.split(/[\n,]+/).map(l => l.trim()).filter(Boolean)
    .map(l => { const [h,p] = l.split(":"); return {host:h||"",port:parseInt(p||"80",10)}; })
    .filter(p => p.host && !isNaN(p.port));
}
function loadProxies() {
  if (!PROXIES_ENABLED) return [];
  const pf = path.join(__dirname,"proxy.txt");
  if (fs.existsSync(pf)) { const l=parseProxies(fs.readFileSync(pf,"utf8")); if(l.length) return l; }
  const e = process.env.PROXY_LIST||"";
  if (e.trim()) { const l=parseProxies(e); if(l.length) return l; }
  return [];
}
const PROXIES = loadProxies();
function pickProxy(i) { return PROXIES.length ? PROXIES[i%PROXIES.length] : null; }

function createProxiedSocket(proxy, host, port) {
  return new Promise((res,rej) => {
    const s = net.connect(proxy.port, proxy.host, () => {
      s.write(`CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\nProxy-Connection: Keep-Alive\r\n\r\n`);
      let buf="";
      const onD = c => { buf+=c.toString(); if(buf.includes("\r\n\r\n")){ s.removeListener("data",onD); buf.includes("200")?res(s):(s.destroy(),rej(new Error("fail"))); }};
      s.on("data",onD);
    });
    s.setTimeout(8000);
    s.on("timeout",()=>{s.destroy();rej(new Error("timeout"));});
    s.on("error",rej);
  });
}

// ========== SMTP ENGINE ==========
const USE_PROXY_FOR_SMTP = process.env.USE_PROXY_FOR_SMTP === "1";
const SMTP_CONFIGS = [
  { port: 465, secure: true  },
  { port: 587, secure: false },
];
let preferredSmtpIdx = 0;

function isConnectionError(e) {
  if (!e) return false;
  const code = e.code || "";
  return ["ETIMEDOUT","ECONNREFUSED","ECONNRESET","ENETUNREACH","EHOSTUNREACH","ESOCKET","EAI_AGAIN"].includes(code);
}

async function trySendOnce(cfg, acct, to, subject, body, proxy) {
  const opts = {
    host: "smtp.gmail.com",
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: acct.user, pass: acct.pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  };
  let socket;
  if (proxy && USE_PROXY_FOR_SMTP) {
    try { socket = await createProxiedSocket(proxy,"smtp.gmail.com",cfg.port); opts.socket = socket; } catch {}
  }
  const t = nodemailer.createTransport(opts);
  try {
    await t.sendMail({
      from: { name: SENDER_DISPLAY_NAME, address: acct.user },
      sender: acct.user,
      to,
      subject,
      text: body,
    });
  } finally { t.close(); if(socket) socket.destroy(); }
}

async function sendEmail(to, subject, body, proxy, accountIdx) {
  const acct = pickGmail(accountIdx || 0);
  let lastErr;
  for (let attempt = 0; attempt < SMTP_CONFIGS.length; attempt++) {
    const cfg = SMTP_CONFIGS[(preferredSmtpIdx + attempt) % SMTP_CONFIGS.length];
    try {
      await trySendOnce(cfg, acct, to, subject, body, proxy);
      preferredSmtpIdx = (preferredSmtpIdx + attempt) % SMTP_CONFIGS.length;
      return;
    } catch (e) {
      lastErr = e;
      if (!isConnectionError(e)) throw e;
    }
  }
  throw lastErr;
}

// ========== META API CHECK ==========
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

function metaCheckNumber(phone) {
  // Meta API is OPTIONAL — if not configured, return a friendly message
  if (!META_ACCESS_TOKEN || !PHONE_NUMBER_ID) {
    return Promise.resolve({
      statusCode: 200,
      body: { messages: [{ id: "local-check" }] },
      _localMode: true,
      _phone: phone
    });
  }

  const num = phone.replace(/[\s\-()\u200e]/g, "").replace(/^\+/, "");
  const body = JSON.stringify({ messaging_product: "whatsapp", to: num, type: "text", text: { body: "." } });
  return new Promise(res => {
    const req = https.request({
      hostname: "graph.facebook.com",
      path: `/v18.0/${PHONE_NUMBER_ID}/messages`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${META_ACCESS_TOKEN}`,
        "Content-Length": Buffer.byteLength(body)
      }
    }, (r) => {
      let d = "";
      r.on("data", c => d += c);
      r.on("end", () => {
        try { res({ statusCode: r.statusCode, body: JSON.parse(d) }); }
        catch { res({ statusCode: r.statusCode, body: {}, parseError: true }); }
      });
    });
    req.on("error", err => res({ statusCode: 0, body: {}, networkError: err.message }));
    req.write(body);
    req.end();
  });
}

function interpretMetaResult(r) {
  // Local mode: Meta API not configured, show email-only message
  if (r._localMode) {
    return {
      emoji: "📧",
      status: "EMAIL-ONLY MODE",
      detail: "Ban reports are sent via email. Meta API check is not configured.",
      banned: null,
      _localMode: true
    };
  }

  const { statusCode, body, networkError } = r;
  if (networkError) return { emoji: "⚠️", status: "Network Error", detail: networkError, banned: null };
  if (statusCode === 200 && body.messages) return { emoji: "✅", status: "Active", detail: "Number is registered and active on WhatsApp.", banned: false };
  const code = body.error && body.error.code;
  const msg = (body.error && body.error.message) || "Unknown error";
  if (code === 131026) return { emoji: "🔴", status: "Likely Banned", detail: "Number appears banned or not on WhatsApp.", banned: true };
  if (code === 131047) return { emoji: "🟡", status: "Active", detail: "Active — re-engagement required.", banned: false };
  if (code === 131051) return { emoji: "🟢", status: "Active", detail: "Number is active on WhatsApp.", banned: false };
  if (code === 131000) return { emoji: "⚠️", status: "Unknown", detail: "Meta error. Please try again.", banned: null };
  if (code === 100) return { emoji: "⚠️", status: "Invalid Number", detail: "Include country code e.g. +2347XXXXXXXXX.", banned: null };
  if (code === 190) return { emoji: "🔑", status: "Token Error", detail: "Meta token is expired or invalid.", banned: null };
  return { emoji: "⚠️", status: `Unknown (${code || statusCode})`, detail: msg, banned: null };
}

// ========== CAMPAIGN ENGINE ==========
const activeCampaigns = new Map();

function campaignId() { return "GHOST-" + Date.now().toString(36).toUpperCase(); }

async function runCampaign(phone, targets, maxPower, mode) {
  mode = mode || "ban";
  const isUnban = mode === "unban";
  const templates = isUnban ? getUnbanTemplates(phone) : getTemplates(phone);
  const totalEmails = maxPower ? targets.length*templates.length : targets.length;
  const cid = campaignId();
  const campaign = {done:0,sent:0,failed:0,lastError:"",errorCounts:{}};
  activeCampaigns.set(cid, campaign);

  let idx=0;
  for (const tgt of targets) {
    const tpls = maxPower ? templates : [templates[idx%templates.length]];
    for (const tpl of tpls) {
      const proxy=pickProxy(idx);
      try {
        await sendEmail(tgt, tpl.subject, tpl.body, proxy, idx);
        campaign.sent++;
      } catch (err) {
        campaign.failed++;
        const m = (err && (err.response || err.message)) || String(err);
        campaign.lastError = m;
        const key = (err && err.code) || (m.match(/^[A-Z_]+/) || ["UNKNOWN"])[0];
        campaign.errorCounts[key] = (campaign.errorCounts[key] || 0) + 1;
        console.error("send failed -> target:", tgt, "reason:", m);
      }
      campaign.done++; idx++;
      await new Promise(r=>setTimeout(r,800));
    }
  }

  const result = {...campaign, cid, totalEmails, mode};
  activeCampaigns.delete(cid);
  return result;
}

// ========== EXPRESS APP ==========
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== AUTH MIDDLEWARE ==========
function requireAuth(req, res, next) {
    const key = req.headers['x-access-key'] || req.query.key;
    if (key !== ACCESS_KEY) {
        return res.status(401).json({ error: '⛔ INVALID ACCESS KEY' });
    }
    next();
}

// ========== API ROUTES ==========

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'alive', 
        uptime: process.uptime(), 
        campaigns: activeCampaigns.size,
        version: 'Ghost Ban Web v2.0'
    });
});

// Standard Ban
app.post('/api/ban', requireAuth, async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });

    try {
        const result = await runCampaign(phoneNumber, BASIC_TARGETS, false, "ban");
        res.json({ success: true, campaignId: result.cid, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Max Power Ban
app.post('/api/maxban', requireAuth, async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });

    try {
        const result = await runCampaign(phoneNumber, ALL_TARGETS, true, "ban");
        res.json({ success: true, campaignId: result.cid, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Standard Unban
app.post('/api/unban', requireAuth, async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });

    try {
        const result = await runCampaign(phoneNumber, BASIC_TARGETS, false, "unban");
        res.json({ success: true, campaignId: result.cid, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Max Power Unban
app.post('/api/maxunban', requireAuth, async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });

    try {
        const result = await runCampaign(phoneNumber, UNBAN_TARGETS, true, "unban");
        res.json({ success: true, campaignId: result.cid, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Check Ban Status
app.post('/api/check', requireAuth, async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });

    try {
        const result = await metaCheckNumber(phoneNumber);
        const info = interpretMetaResult(result);
        res.json({ success: true, phoneNumber, ...info });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Inspect Number (alias for check)
app.post('/api/inspect', requireAuth, async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ error: 'Phone number required' });

    try {
        const result = await metaCheckNumber(phoneNumber);
        const info = interpretMetaResult(result);
        res.json({ success: true, phoneNumber, ...info });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get Campaign Status
app.get('/api/campaign/:id', requireAuth, (req, res) => {
    const campaign = activeCampaigns.get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found or completed' });
    res.json({ campaignId: req.params.id, ...campaign });
});

// List active campaigns
app.get('/api/campaigns', requireAuth, (req, res) => {
    const campaigns = Array.from(activeCampaigns.entries()).map(([id, data]) => ({ id, ...data }));
    res.json({ campaigns, count: campaigns.length });
});

// Add premium
app.post('/api/addprem', requireAuth, (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });
    const added = addPremium(userId);
    res.json({ success: added, userId, message: added ? 'Premium added' : 'Already premium' });
});

// Remove premium
app.post('/api/delprem', requireAuth, (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });
    const removed = removePremium(userId);
    res.json({ success: removed, userId, message: removed ? 'Premium removed' : 'Not premium' });
});

// List premium
app.get('/api/listprem', requireAuth, (req, res) => {
    res.json({ premium: getPremiumList() });
});

// Stats
app.get('/api/stats', requireAuth, (req, res) => {
    const px = PROXIES.length ? `${PROXIES.length} active` : "none (direct mode)";
    res.json({
        version: 'Ghost Ban Web v2.0',
        uptime: process.uptime(),
        proxies: px,
        gmailAccounts: GMAIL_ACCOUNTS.length,
        banTargets: ALL_TARGETS.length,
        unbanTargets: UNBAN_TARGETS.length,
        activeCampaigns: activeCampaigns.size
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(chalk.green(`🌐 Ghost Ban Web running on port ${PORT}`));
    console.log(chalk.red(`🔑 Access Key: ${ACCESS_KEY}`));
    console.log(chalk.cyan(`📧 Gmail Accounts: ${GMAIL_ACCOUNTS.length}`));
    console.log(chalk.cyan(`🎯 Ban Targets: ${ALL_TARGETS.length}`));
    console.log(chalk.cyan(`🔄 Unban Targets: ${UNBAN_TARGETS.length}`));

    // SMTP self-test
    console.log(chalk.yellow('\n--- SMTP Self-Test ---'));
    (async () => {
        for (let i = 0; i < GMAIL_ACCOUNTS.length; i++) {
            const a = GMAIL_ACCOUNTS[i];
            const t = nodemailer.createTransport({
                host: "smtp.gmail.com", port: 465, secure: true,
                auth: { user: a.user, pass: a.pass },
                connectionTimeout: 8000, greetingTimeout: 8000,
            });
            try {
                await t.verify();
                console.log(chalk.green(`  [${i+1}] ${a.user} -> OK`));
            } catch (e) {
                console.log(chalk.red(`  [${i+1}] ${a.user} -> FAIL: ${e.message}`));
            } finally { try { t.close(); } catch {} }
        }
        console.log(chalk.yellow('--- End Self-Test ---\n'));
    })();
});
