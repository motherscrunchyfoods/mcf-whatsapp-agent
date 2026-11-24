// Shopify token manager — auto-refreshes via client credentials grant
const axios = require('axios');

let cachedToken = null;
let tokenExpiry = 0;

async function getShopifyToken() {
  const now = Date.now();

  // Cached token still valid (5 min buffer before expiry)
  if (cachedToken && now < tokenExpiry - 300000) {
    return cachedToken;
  }

  // First call: use env token if available, assume ~24h validity
  if (process.env.SHOPIFY_ACCESS_TOKEN && !cachedToken) {
    cachedToken = process.env.SHOPIFY_ACCESS_TOKEN;
    tokenExpiry = now + 82800000; // 23 hours
    return cachedToken;
  }

  // Auto-refresh using client credentials
  if (!process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) {
    throw new Error('No Shopify credentials for token refresh');
  }

  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.SHOPIFY_CLIENT_ID,
    client_secret: process.env.SHOPIFY_CLIENT_SECRET
  });

  const res = await axios.post(
    `https://${process.env.SHOPIFY_STORE_URL}/admin/oauth/access_token`,
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  cachedToken = res.data.access_token;
  tokenExpiry = now + (res.data.expires_in * 1000);
  console.log('🔑 Shopify token auto-refreshed');
  return cachedToken;
}

module.exports = { getShopifyToken };
