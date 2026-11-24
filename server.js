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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 MCF Agent (Maya) running on port ${PORT}`);
  console.log(`📋 Leads: http://localhost:${PORT}/leads\n`);
});
