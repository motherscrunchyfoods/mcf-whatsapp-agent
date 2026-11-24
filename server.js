// MCF WhatsApp Agent - Main Server
// Meta Official Cloud API webhook handler
require('dotenv').config();
const express = require('express');
const { handleMessage } = require('./agent');
const { getAllLeads, getLeadStats } = require('./leads');

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: '🟢 MCF WhatsApp Agent (Maya) is live!' });
});

// Meta webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

// Incoming WhatsApp messages
app.post('/webhook', async (req, res) => {
  res.status(200).json({ status: 'ok' }); // Respond immediately

  try {
    const body = req.body;
    if (body.object !== 'whatsapp_business_account') return;

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'messages') continue;
        const value = change.value;
        if (!value.messages?.length) continue;

        const phoneNumberId = value.metadata.phone_number_id;
        for (const message of value.messages) {
          handleMessage(message, phoneNumberId).catch(console.error);
        }
      }
    }
  } catch (err) {
    console.error('Webhook error:', err.message);
  }
});

// Simple leads dashboard
app.get('/leads', (req, res) => {
  res.json({ stats: getLeadStats(), leads: getAllLeads() });
});

// Shopify OAuth callback — captures access token from Partner app installation
app.get('/shopify/callback', async (req, res) => {
  const { code, shop } = req.query;
  if (!code || !shop) return res.send('Missing code or shop');

  try {
    const axios = require('axios');
    const response = await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code
    });
    const token = response.data.access_token;
    console.log(`\n🛍️ SHOPIFY ACCESS TOKEN FOR ${shop}:\n${token}\n`);
    res.send(`<h2>✅ Token captured!</h2><p>Add this to Railway env vars as <b>SHOPIFY_ACCESS_TOKEN</b>:</p><pre style="background:#f0f0f0;padding:16px;font-size:14px">${token}</pre><p>Store: ${shop}</p>`);
  } catch (err) {
    console.error('Shopify OAuth error:', err.message);
    res.send('Error: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 MCF Agent (Maya) running on port ${PORT}`);
  console.log(`📋 Leads: http://localhost:${PORT}/leads\n`);
});
