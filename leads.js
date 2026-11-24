// Lead management - stores customer info and conversation stats
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(LEADS_FILE)) fs.writeFileSync(LEADS_FILE, '{}');
}

function getLeads() {
  ensureDataDir();
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function getLead(phone) {
  return getLeads()[phone] || null;
}

function saveLead(phone, data) {
  const leads = getLeads();
  leads[phone] = { phone, ...leads[phone], ...data };
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  console.log(`📋 Lead saved/updated: ${phone}`, data);
}

function updateLead(phone, updates) {
  saveLead(phone, updates);
}

function getAllLeads() {
  return Object.values(getLeads()).sort((a, b) =>
    new Date(b.lastContact || b.firstContact) - new Date(a.lastContact || a.firstContact)
  );
}

function getLeadStats() {
  const leads = getAllLeads();
  return {
    total: leads.length,
    named: leads.filter(l => l.name).length,
    activeToday: leads.filter(l => {
      if (!l.lastContact) return false;
      const today = new Date().toDateString();
      return new Date(l.lastContact).toDateString() === today;
    }).length
  };
}

module.exports = { getLead, saveLead, updateLead, getAllLeads, getLeadStats };
