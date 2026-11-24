// Meta Official WhatsApp Cloud API - 100% Ban-Safe
const axios = require('axios');

const BASE_URL = 'https://graph.facebook.com/v18.0';

function headers() {
  return {
    Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json'
  };
}

async function sendTextMessage(phoneNumberId, to, text) {
  await axios.post(`${BASE_URL}/${phoneNumberId}/messages`, {
    messaging_product: 'whatsapp',
    to,
    type: 'text',
    text: { body: text, preview_url: false }
  }, { headers: headers() });
}

// 3 quick-reply buttons (title max 20 chars each)
async function sendButtonMessage(phoneNumberId, to, body, buttons) {
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body },
      action: {
        buttons: buttons.slice(0, 3).map((btn, i) => ({
          type: 'reply',
          reply: { id: btn.id || `btn_${i}`, title: btn.title.substring(0, 20) }
        }))
      }
    }
  };
  await axios.post(`${BASE_URL}/${phoneNumberId}/messages`, payload, { headers: headers() });
}

// List menu (4-10 options grouped in sections)
async function sendListMessage(phoneNumberId, to, body, buttonLabel, sections) {
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'list',
      body: { text: body },
      action: {
        button: buttonLabel.substring(0, 20),
        sections: sections.map(s => ({
          title: s.title.substring(0, 24),
          rows: s.rows.slice(0, 10).map(r => ({
            id: r.id,
            title: r.title.substring(0, 24),
            description: (r.description || '').substring(0, 72)
          }))
        }))
      }
    }
  };
  await axios.post(`${BASE_URL}/${phoneNumberId}/messages`, payload, { headers: headers() });
}

// CTA URL button (website link)
async function sendCTAButton(phoneNumberId, to, body, displayText, url) {
  const payload = {
    messaging_product: 'whatsapp',
    to,
    type: 'interactive',
    interactive: {
      type: 'cta_url',
      body: { text: body },
      action: {
        name: 'cta_url',
        parameters: {
          display_text: displayText.substring(0, 20),
          url
        }
      }
    }
  };
  await axios.post(`${BASE_URL}/${phoneNumberId}/messages`, payload, { headers: headers() });
}

// Mark message as read (blue ticks)
async function markAsRead(phoneNumberId, messageId) {
  try {
    await axios.post(`${BASE_URL}/${phoneNumberId}/messages`, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    }, { headers: headers() });
  } catch {
    // Non-critical
  }
}

module.exports = { sendTextMessage, sendButtonMessage, sendListMessage, sendCTAButton, markAsRead };
