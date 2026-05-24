const express = require('express');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const nodemailer = require('nodemailer');

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

// ========== GMAIL ACCOUNTS (your real App Passwords) ==========
const GMAIL_ACCOUNTS = [
  { user: "destinyjob493@gmail.com",            pass: "pnnz fqzf kwpb njrc" },
  { user: "destinyjob2007@gmail.com",           pass: "xcxz obdp apmp ohql" },
  { user: "affiliatemarketingprogramm@gmail.com", pass: "yzqt qkkz jmug gkuj" },
];
function pickGmail(i) { return GMAIL_ACCOUNTS[i % GMAIL_ACCOUNTS.length]; }

const SENDER_DISPLAY_NAME = process.env.SENDER_DISPLAY_NAME || "WhatsApp Account Holder";

// ========== EMAIL TARGETS ==========
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
  return raw.split(/[\n]+/).map(l => l.trim()).filter(Boolean)
    .map(l => {
      let clean = l;
      clean = clean.replace(/;/g, ':');
      const parts = clean.split(':');
      if (parts.length >= 2) {
        const ip = parts[0].replace(/,/g, '.');
        const port = parseInt(parts[parts.length - 1], 10);
        return { host: ip, port: port };
      }
      const [h, p] = l.split(':');
      return { host: h || '', port: parseInt(p || '80', 10) };
    })
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

// ========== SMTP ENGINE ==========
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

async function trySendOnce(cfg, acct, to, subject, body) {
  const opts = {
    host: "smtp.gmail.com",
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: acct.user, pass: acct.pass },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  };
  const t = nodemailer.createTransport(opts);
  try {
    await t.sendMail({
      from: { name: SENDER_DISPLAY_NAME, address: acct.user },
      sender: acct.user,
      to,
      subject,
      text: body,
    });
  } finally { t.close(); }
}

async function sendEmail(to, subject, body, accountIdx) {
  const acct = pickGmail(accountIdx || 0);
  let lastErr;
  console.log(`[SMTP] Using: ${acct.user} -> ${to}`);

  for (let attempt = 0; attempt < SMTP_CONFIGS.length; attempt++) {
    const cfg = SMTP_CONFIGS[(preferredSmtpIdx + attempt) % SMTP_CONFIGS.length];
    try {
      await trySendOnce(cfg, acct, to, subject, body);
      preferredSmtpIdx = (preferredSmtpIdx + attempt) % SMTP_CONFIGS.length;
      console.log(`[SMTP] SUCCESS: ${to} via port ${cfg.port}`);
      return;
    } catch (e) {
      lastErr = e;
      console.error(`[SMTP] FAILED port ${cfg.port}: ${e.code || ''} ${e.message || ''}`);
      if (!isConnectionError(e)) throw e;
    }
  }
  throw lastErr;
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
      try {
        await sendEmail(tgt, tpl.subject, tpl.body, idx);
        campaign.sent++;
      } catch (err) {
        campaign.failed++;
        const m = (err && (err.response || err.message)) || String(err);
        campaign.lastError = m;
        const key = (err && err.code) || (m.match(/^[A-Z_]+/) || ["UNKNOWN"])[0];
        campaign.errorCounts[key] = (campaign.errorCounts[key] || 0) + 1;
        console.error(`[EMAIL] FAILED: ${tgt} | ${m}`);
      }
      campaign.done++; idx++;
      await new Promise(r=>setTimeout(r,1000));
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

function requireAuth(req, res, next) {
    const key = req.headers['x-access-key'] || req.query.key;
    if (key !== ACCESS_KEY) {
        return res.status(401).json({ error: '⛔ INVALID ACCESS KEY' });
    }
    next();
}

// ========== API ROUTES ==========

app.get('/health', (req, res) => {
    res.json({ 
        status: 'alive', 
        uptime: process.uptime(), 
        campaigns: activeCampaigns.size,
        version: 'Ghost Ban Web v5.0 (Termux Gmail SMTP)'
    });
});

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

app.get('/api/campaign/:id', requireAuth, (req, res) => {
    const campaign = activeCampaigns.get(req.params.id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found or completed' });
    res.json({ campaignId: req.params.id, ...campaign });
});

app.get('/api/campaigns', requireAuth, (req, res) => {
    const campaigns = Array.from(activeCampaigns.entries()).map(([id, data]) => ({ id, ...data }));
    res.json({ campaigns, count: campaigns.length });
});

app.post('/api/addprem', requireAuth, (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });
    const added = addPremium(userId);
    res.json({ success: added, userId, message: added ? 'Premium added' : 'Already premium' });
});

app.post('/api/delprem', requireAuth, (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'User ID required' });
    const removed = removePremium(userId);
    res.json({ success: removed, userId, message: removed ? 'Premium removed' : 'Not premium' });
});

app.get('/api/listprem', requireAuth, (req, res) => {
    res.json({ premium: getPremiumList() });
});

app.get('/api/stats', requireAuth, (req, res) => {
    res.json({
        version: 'Ghost Ban Web v5.0 (Termux)',
        uptime: process.uptime(),
        banTargets: ALL_TARGETS.length,
        unbanTargets: UNBAN_TARGETS.length,
        activeCampaigns: activeCampaigns.size,
        gmailAccounts: GMAIL_ACCOUNTS.length
    });
});

// ========== ASCII BANNER ==========
function printBanner() {
    console.log(chalk.red(`
    ██████╗ ██╗  ██╗ ██████╗ ███████╗████████╗    ██████╗  █████╗ ███╗   ██╗
    ██╔════╝ ██║  ██║██╔═══██╗██╔════╝╚══██╔══╝    ██╔══██╗██╔══██╗████╗  ██║
    ██║  ███╗███████║██║   ██║███████╗   ██║       ██████╔╝███████║██╔██╗ ██║
    ██║   ██║██╔══██║██║   ██║╚════██║   ██║       ██╔══██╗██╔══██║██║╚██╗██║
    ╚██████╔╝██║  ██║╚██████╔╝███████║   ██║       ██████╔╝██║  ██║██║ ╚████║
     ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝       ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═══╝
    `));
    console.log(chalk.yellow('    ═══════════════════════════════════════════════════════════════════════'));
    console.log(chalk.cyan('    📧  ADVANCED WHATSAPP REPORT SYSTEM'));
    console.log(chalk.cyan('    🔥  VERSION: 5.0'));
    console.log(chalk.cyan('    👤  AUTHOR: LORDTARRIFIC'));
    console.log(chalk.cyan('    📱  CHANNEL: @lonerterritorybackagain'));
    console.log(chalk.yellow('    ═══════════════════════════════════════════════════════════════════════'));
    console.log(chalk.green(''));
    console.log(chalk.white('    📋 AVAILABLE COMMANDS:'));
    console.log(chalk.green(''));
    console.log(chalk.cyan('    ┌─────────────────────────────────────────────────────────────────────┐'));
    console.log(chalk.cyan('    │  🔓  Standard Ban    →  POST /api/ban      (10 email targets)      │'));
    console.log(chalk.cyan('    │  ⚡  Max Power Ban   →  POST /api/maxban   (24 email targets)      │'));
    console.log(chalk.cyan('    │  🔁  Standard Unban  →  POST /api/unban     (10 appeal targets)    │'));
    console.log(chalk.cyan('    │  🔄  Max Power Unban →  POST /api/maxunban (all appeal targets)    │'));
    console.log(chalk.cyan('    │  📊  Stats           →  GET  /api/stats                             │'));
    console.log(chalk.cyan('    │  ❤️   Health Check   →  GET  /health                                │'));
    console.log(chalk.cyan('    └─────────────────────────────────────────────────────────────────────┘'));
    console.log(chalk.green(''));
    console.log(chalk.white('    🌐 ACCESS: http://localhost:3000'));
    console.log(chalk.white('    🔑 KEY:    GHOST-BAN-2026'));
    console.log(chalk.yellow(''));
}
// ========== START SERVER ==========
app.listen(PORT, '0.0.0.0', () => {
    printBanner();
    console.log(chalk.green(`🌐 Ghost Ban Web v5.0 running on port ${PORT}`));
    console.log(chalk.red(`🔑 Access Key: ${ACCESS_KEY}`));
    console.log(chalk.cyan(`📧 Gmail Accounts: ${GMAIL_ACCOUNTS.length}`));
    GMAIL_ACCOUNTS.forEach((a, i) => {
        const masked = a.user.replace(/^(.{3}).*(@.*)$/, '$1***$2');
        console.log(chalk.cyan(`   [${i+1}] ${masked}`));
    });
    console.log(chalk.cyan(`🎯 Ban Targets: ${ALL_TARGETS.length}`));
    console.log(chalk.cyan(`🔄 Unban Targets: ${UNBAN_TARGETS.length}`));

    // SMTP Self-Test
    console.log(chalk.yellow('\n--- SMTP Self-Test ---'));
    (async () => {
        for (let i = 0; i < GMAIL_ACCOUNTS.length; i++) {
            const a = GMAIL_ACCOUNTS[i];
            const t = nodemailer.createTransport({
                host: "smtp.gmail.com", port: 465, secure: true,
                auth: { user: a.user, pass: a.pass },
                connectionTimeout: 10000, greetingTimeout: 10000,
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
