const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const chalk = require('chalk');
const https = require('https');
const net = require('net');

// ========== CONFIG ==========
const ACCESS_KEY = process.env.ACCESS_KEY || 'GHOST-BAN-2026';
const PORT = process.env.PORT || 3000;
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';

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
  if (!PROXIES_ENABLED) {
    console.log(chalk.yellow('[PROXY] Proxies disabled. Set USE_PROXIES=1 to enable.'));
    return [];
  }
  const pf = path.join(__dirname,"proxy.txt");
  if (fs.existsSync(pf)) { 
    const l=parseProxies(fs.readFileSync(pf,"utf8")); 
    if(l.length) {
      console.log(chalk.green(`[PROXY] Loaded ${l.length} proxies from proxy.txt`));
      console.log(chalk.yellow(`[PROXY] First proxy: ${l[0].host}:${l[0].port}`));
      return l; 
    } 
  }
  const e = process.env.PROXY_LIST||"";
  if (e.trim()) { const l=parseProxies(e); if(l.length) return l; }
  console.log(chalk.red('[PROXY] USE_PROXIES=1 but no proxies found!'));
  return [];
}
const PROXIES = loadProxies();
function pickProxy(i) { return PROXIES.length ? PROXIES[i%PROXIES.length] : null; }

// ========== RESEND EMAIL API (replaces Gmail SMTP) ==========
// Resend uses HTTP API - works on ALL hosts (Render, Railway, etc.)
// Free tier: 3,000 emails/month
// Sign up: https://resend.com

const SENDER_EMAIL = process.env.SENDER_EMAIL || "onboarding@resend.dev";
const SENDER_NAME = process.env.SENDER_NAME || "WhatsApp Account Holder";

function sendEmailViaResend(to, subject, body) {
  return new Promise((resolve, reject) => {
    if (!RESEND_API_KEY) {
      return reject(new Error('RESEND_API_KEY not configured'));
    }

    const postData = JSON.stringify({
      from: `${SENDER_NAME} <${SENDER_EMAIL}>`,
      to: [to],
      subject: subject,
      text: body,
    });

    const options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ id: parsed.id, status: 'sent' });
          } else {
            reject(new Error(parsed.message || `HTTP ${res.statusCode}`));
          }
        } catch {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
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
        await sendEmailViaResend(tgt, tpl.subject, tpl.body);
        campaign.sent++;
        console.log(`[EMAIL] SUCCESS: ${tgt} | Campaign: ${cid}`);
      } catch (err) {
        campaign.failed++;
        const m = (err && err.message) || String(err);
        campaign.lastError = m;
        const key = (err && err.code) || (m.match(/^[A-Z_]+/) || ["UNKNOWN"])[0];
        campaign.errorCounts[key] = (campaign.errorCounts[key] || 0) + 1;
        console.error(`[EMAIL] FAILED: ${tgt} | Reason: ${m}`);
      }
      campaign.done++; idx++;
      await new Promise(r=>setTimeout(r,500)); // Rate limit: 2 emails/sec
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
        version: 'Ghost Ban Web v3.0 (Resend API)',
        resendConfigured: !!RESEND_API_KEY
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
        version: 'Ghost Ban Web v3.0 (Resend API)',
        uptime: process.uptime(),
        proxies: px,
        banTargets: ALL_TARGETS.length,
        unbanTargets: UNBAN_TARGETS.length,
        activeCampaigns: activeCampaigns.size,
        resendConfigured: !!RESEND_API_KEY,
        senderEmail: SENDER_EMAIL
    });
});

// ========== START SERVER ==========
app.listen(PORT, () => {
    console.log(chalk.green(`🌐 Ghost Ban Web v3.0 running on port ${PORT}`));
    console.log(chalk.red(`🔑 Access Key: ${ACCESS_KEY}`));
    console.log(chalk.cyan(`📧 Email Service: Resend API`));
    console.log(chalk.cyan(`📤 Sender: ${SENDER_NAME} <${SENDER_EMAIL}>`));
    console.log(chalk.cyan(`🎯 Ban Targets: ${ALL_TARGETS.length}`));
    console.log(chalk.cyan(`🔄 Unban Targets: ${UNBAN_TARGETS.length}`));

    if (!RESEND_API_KEY) {
        console.log(chalk.red(`
⚠️  WARNING: RESEND_API_KEY not set!`));
        console.log(chalk.yellow(`   Get free API key at: https://resend.com`));
        console.log(chalk.yellow(`   Set env var: RESEND_API_KEY=your_key_here`));
    } else {
        console.log(chalk.green(`
✅ Resend API configured`));
    }
});
