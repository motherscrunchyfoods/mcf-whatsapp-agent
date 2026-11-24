// MCF WhatsApp AI Agent - Maya v3.0
// Interactive messages + Multi-language + Smart menus
const OpenAI = require('openai');
const { sendTextMessage, sendButtonMessage, sendListMessage, sendCTAButton, sendCatalogMessage, sendMultiProductMessage, markAsRead } = require('./whatsapp');
const { getLead, saveLead } = require('./leads');

// ─── AI Client ────────────────────────────────────────────────────────────────
function createAIClient() {
  if (process.env.GROQ_API_KEY) {
    return {
      client: new OpenAI({ apiKey: process.env.GROQ_API_KEY, baseURL: 'https://api.groq.com/openai/v1' }),
      model: process.env.AI_MODEL || 'qwen/qwen3.8-27b'
    };
  }
  if (process.env.GEMINI_API_KEY) {
    return {
      client: new OpenAI({ apiKey: process.env.GEMINI_API_KEY, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' }),
      model: process.env.AI_MODEL || 'gemini-1.5-flash'
    };
  }
  throw new Error('No AI API key! Add GROQ_API_KEY to .env');
}

const { client: aiClient, model: AI_MODEL } = createAIClient();
console.log(`🤖 AI Engine: Groq | Model: ${AI_MODEL}`);

// ─── Conversation Memory ──────────────────────────────────────────────────────
const conversations = new Map();

// ─── Language Detection ───────────────────────────────────────────────────────
function detectLanguage(text) {
  const devanagari = (text.match(/[ऀ-ॿ]/g) || []).length;
  const tamil     = (text.match(/[஀-௿]/g) || []).length;
  const bengali   = (text.match(/[ঀ-৿]/g) || []).length;
  const telugu    = (text.match(/[ఀ-౿]/g) || []).length;
  const gujarati  = (text.match(/[઀-૿]/g) || []).length;
  const punjabi   = (text.match(/[਀-੿]/g) || []).length;
  const ascii     = (text.match(/[a-zA-Z]/g) || []).length;
  const total     = text.replace(/\s/g, '').length || 1;

  if (tamil    > 2) return 'Tamil';
  if (bengali  > 2) return 'Bengali';
  if (telugu   > 2) return 'Telugu';
  if (gujarati > 2) return 'Gujarati';
  if (punjabi  > 2) return 'Punjabi';
  if (devanagari > 2) return 'Hindi';
  if (devanagari > 0 && ascii > 0) return 'Hinglish (mix of Hindi and English)';
  if (ascii / total > 0.5) return 'English';
  return 'Hindi';
}

// ─── Interactive Trigger Detection ───────────────────────────────────────────
function detectIntent(text) {
  const t = text.toLowerCase();
  if (t.includes('flavour') || t.includes('flavor') || t.includes('taste') ||
      t.includes('कौन') || t.includes('flavors') || t.includes('variety') ||
      t.includes('फ्लेवर') || t.includes('स्वाद')) return 'show_flavours';
  if (t.includes('price') || t.includes('cost') || t.includes('rate') ||
      t.includes('कीमत') || t.includes('दाम') || t.includes('rupee') ||
      t.includes('₹') || t.includes('rs.')) return 'show_pricing';
  if (t.includes('catalog') || t.includes('catalogue') || t.includes('all product') ||
      t.includes('sabhi product') || t.includes('product dekho') || t.includes('product dikhao') ||
      t.includes('product dikha') || t.includes('product list') || t.includes('product dekhna') ||
      t.includes('products') || t.includes('browse') || t.includes('shop') ||
      t.includes('सभी') || t.includes('dry fruit') || t.includes('trail mix') ||
      t.includes('gift') || t.includes('dikhao') || t.includes('dikha')) return 'show_catalog';
  if (t.includes('offer') || t.includes('discount') || t.includes('deal') ||
      t.includes('ऑफर') || t.includes('छूट') || t.includes('combo')) return 'show_offers';
  if (t.includes('track') || t.includes('tracking') || t.includes('status') ||
      t.includes('kahan hai') || t.includes('kahan h') || t.includes('पहुंचा') ||
      t.includes('delivery') || t.includes('shipped') || t.includes('dispatch') ||
      t.includes('मेरा order') || t.includes('order track') || t.includes('order status') ||
      t.includes('order kahan') || t.includes('parcel') || t.includes('courier')) return 'track_order';
  if (t.includes('order') || t.includes('buy') || t.includes('kharidna') ||
      t.includes('खरीद') || t.includes('purchase')) return 'show_order_cta';
  if (t === 'hi' || t === 'hello' || t === 'namaste' || t === 'hii' ||
      t === 'hey' || t === 'नमस्ते' || t.length < 10) return 'greeting';
  return 'general';
}

// ─── Interactive Menus ────────────────────────────────────────────────────────
async function sendFlavoursMenu(phoneNumberId, phone, lang) {
  const isHindi = lang === 'Hindi' || lang.includes('Hinglish');
  await sendListMessage(
    phoneNumberId, phone,
    isHindi
      ? '🍿 Hamare paas ye sabhi flavours hain! Kaunsa try karna chahoge?'
      : '🍿 Here are all our flavours! Which one interests you?',
    isHindi ? 'Flavours Dekho' : 'View Flavours',
    [
      {
        title: isHindi ? '🔥 Bestsellers' : '🔥 Best Sellers',
        rows: [
          { id: 'peri_peri',    title: 'Peri Peri',         description: isHindi ? 'Spicy & tangy — sabka favourite!' : 'Spicy & tangy — most loved!' },
          { id: 'salt_pepper',  title: 'Salt & Pepper',     description: isHindi ? 'Classic, office snacking perfect' : 'Classic, great for office snacking' },
          { id: 'cheese',       title: 'Cheese & Cheddar',  description: isHindi ? 'Kids aur adults dono love karte' : 'Loved by kids and adults alike' },
          { id: 'bhujjia',      title: 'Bhujjia Blast',     description: isHindi ? 'Indian masala twist!' : 'Desi masala twist!' },
        ]
      },
      {
        title: isHindi ? '✨ Naye Flavours' : '✨ New Arrivals',
        rows: [
          { id: 'butter_bliss', title: 'Butter Bliss',      description: isHindi ? 'Creamy & mild — kids favorite' : 'Creamy & mild — kids fav' },
          { id: 'thai_chilli',  title: 'Sweet Thai Chilli',  description: isHindi ? 'Sweet + spicy combo!' : 'Sweet meets spicy!' },
          { id: 'magic_masala', title: 'Magic Masala',       description: isHindi ? 'Chatpata masala blast' : 'Chatpata masala burst' },
          { id: 'tangy_tomato', title: 'Tangy Tomato',       description: isHindi ? 'Tomato ka desi twist' : 'Desi tomato twist' },
        ]
      },
      {
        title: isHindi ? '🌿 Healthy Options' : '🌿 Healthy Options',
        rows: [
          { id: 'raw_makhana', title: 'Plain Makhana',      description: isHindi ? 'Unflavoured, cooking ke liye' : 'Unflavoured, great for cooking' },
          { id: 'trail_mix',   title: 'Trail Mix',          description: isHindi ? 'Nuts, seeds, dry fruits ka mix' : 'Nuts, seeds & dry fruits blend' },
        ]
      }
    ]
  );
}

async function sendOffersMenu(phoneNumberId, phone, lang) {
  const isHindi = lang === 'Hindi' || lang.includes('Hinglish');
  await sendButtonMessage(
    phoneNumberId, phone,
    isHindi
      ? '🔥 *Aaj ke Hot Offers!*\n\n📦 Single Pack — ₹279 (MRP ₹299) → *6% OFF*\n🎯 2-Pack Combo — ₹449 (MRP ₹598) → *24% OFF*\n🚚 Free Delivery on orders above ₹499\n\n*Combo mein 2 alag flavours choose kar sakte ho!*'
      : '🔥 *Today\'s Hot Offers!*\n\n📦 Single Pack — ₹279 (MRP ₹299) → *6% OFF*\n🎯 2-Pack Combo — ₹449 (MRP ₹598) → *24% OFF*\n🚚 Free Delivery above ₹499\n\n*Choose any 2 flavours in combo!*',
    [
      { id: 'order_now',   title: isHindi ? '🛒 Order Karo' : '🛒 Order Now' },
      { id: 'flavours',    title: isHindi ? '🍿 Flavours Dekho' : '🍿 See Flavours' },
      { id: 'more_info',   title: isHindi ? 'ℹ️ Aur Jaano' : 'ℹ️ More Info' },
    ]
  );
}

async function sendOrderCTA(phoneNumberId, phone, lang) {
  const isHindi = lang === 'Hindi' || lang.includes('Hinglish');
  await sendCTAButton(
    phoneNumberId, phone,
    isHindi
      ? '🛒 Order karne ke liye neeche click karo!\n\n✅ 24% OFF Combos available\n✅ Cash on Delivery available\n✅ Fast Delivery across India'
      : '🛒 Click below to place your order!\n\n✅ 24% OFF Combos available\n✅ Cash on Delivery available\n✅ Fast delivery across India',
    isHindi ? '🛒 Order Karo' : '🛒 Order Now',
    'https://www.motherscrunchyfoods.in'
  );
}

// ─── Product Category Menu ────────────────────────────────────────────────────
// (WhatsApp catalog_message requires Live app mode — using rich list menus instead)
async function sendFullCatalog(phoneNumberId, phone, lang) {
  const isHindi = lang === 'Hindi' || lang.includes('Hinglish');
  await sendListMessage(
    phoneNumberId, phone,
    isHindi
      ? '🛍️ *Mother\'s Crunchy Foods — 300+ Products!*\n\nAir-roasted makhana, premium dry fruits, trail mixes aur gift combos.\n\nKaunsi category mein interest hai?'
      : '🛍️ *Mother\'s Crunchy Foods — 300+ Products!*\n\nAir-roasted makhana, premium dry fruits, trail mixes & gift combos.\n\nWhich category interests you?',
    isHindi ? '🛍️ Category Dekho' : '🛍️ Browse Categories',
    [
      {
        title: isHindi ? '🍿 Makhana' : '🍿 Makhana',
        rows: [
          { id: 'cat_bestseller', title: '🔥 Best Sellers',    description: isHindi ? 'Peri Peri, Cheese, Salt & Pepper — ₹279' : 'Peri Peri, Cheese, Salt & Pepper — ₹279 each' },
          { id: 'cat_newmak',    title: '✨ New Flavours',     description: isHindi ? 'Thai Chilli, Magic Masala, Chatpata — ₹279' : 'Thai Chilli, Magic Masala, Chatpata — ₹279' },
          { id: 'cat_combo',     title: '🎯 2-Pack Combos',   description: isHindi ? '24% OFF — koi bhi 2 flavours! ₹449' : '24% OFF — any 2 flavours! ₹449' },
          { id: 'cat_multipack', title: '📦 3 & 5 Pack',      description: isHindi ? 'Aur bhi zyada savings!' : 'Even bigger savings!' },
        ]
      },
      {
        title: isHindi ? '🌰 Dry Fruits & Nuts' : '🌰 Dry Fruits & Nuts',
        rows: [
          { id: 'cat_dryfruits', title: '🫐 Dry Fruits',       description: isHindi ? 'Dates ₹599, Anjeer ₹559, Berries ₹499+' : 'Dates ₹599, Anjeer ₹559, Berries ₹499+' },
          { id: 'cat_nuts',      title: '🥜 Premium Nuts',     description: isHindi ? 'Almonds ₹459, Cashews ₹559, Walnuts ₹656' : 'Almonds ₹459, Cashews ₹559, Walnuts ₹656' },
          { id: 'cat_trail',     title: '🥗 Trail Mixes',      description: isHindi ? 'Healthy mix ₹315–₹679' : 'Healthy blend ₹315–₹679' },
        ]
      },
      {
        title: isHindi ? '🎁 Gift & Special' : '🎁 Gift & Special',
        rows: [
          { id: 'cat_gift',      title: '🎁 Gift Combos',      description: isHindi ? 'Gifting ke liye perfect ₹686–₹1315' : 'Perfect gifting packs ₹686–₹1315' },
          { id: 'cat_all',       title: '🌐 Poora Catalog',    description: isHindi ? 'Sab kuch website par dekho' : 'View all 300+ products on website' },
        ]
      }
    ]
  );
}

async function sendCategoryProducts(phoneNumberId, phone, lang, category) {
  await sendFullCatalog(phoneNumberId, phone, lang);
}

// ─── Order Tracking ───────────────────────────────────────────────────────────
const orderTrackingPending = new Map(); // phone → true (waiting for order number)

async function sendOrderTrackingPrompt(phoneNumberId, phone, lang) {
  const isHindi = lang === 'Hindi' || lang.includes('Hinglish');
  orderTrackingPending.set(phone, true);
  await sendTextMessage(phoneNumberId, phone,
    isHindi
      ? '📦 Apna *Order Number* share karo (jaise: #1234)\n\nOrder number aapko email ya SMS mein mila hoga.'
      : '📦 Please share your *Order Number* (e.g. #1234)\n\nYou can find it in your order confirmation email or SMS.'
  );
}

async function handleOrderTracking(phoneNumberId, phone, lang, orderText) {
  const isHindi = lang === 'Hindi' || lang.includes('Hinglish');
  orderTrackingPending.delete(phone);

  // Extract order number
  const match = orderText.match(/#?(\d{3,6})/);
  const orderNum = match ? match[1] : null;

  if (!orderNum) {
    await sendTextMessage(phoneNumberId, phone,
      isHindi
        ? '❌ Order number nahi mila. Dobara try karo — jaise: #1234 ya sirf 1234 likhein.'
        : '❌ Could not find order number. Try again — e.g. #1234 or just 1234.'
    );
    return;
  }

  // If Shopify API is available, fetch real status
  if (process.env.SHOPIFY_STORE_URL) {
    try {
      const axios = require('axios');
      const { getShopifyToken } = require('./shopify-token');
      const token = await getShopifyToken();
      const res = await axios.get(
        `https://${process.env.SHOPIFY_STORE_URL}/admin/api/2026-10/orders.json?name=${encodeURIComponent('#' + orderNum)}&status=any`,
        { headers: { 'X-Shopify-Access-Token': token } }
      );
      const orders = res.data.orders;
      if (orders && orders.length > 0) {
        const order = orders[0];
        const status = order.fulfillment_status || 'confirmed';
        const financialStatus = order.financial_status;
        const trackingUrl = order.fulfillments?.[0]?.tracking_url || null;

        const statusEmoji = { fulfilled: '🚚', partial: '📦', null: '✅', confirmed: '✅', unfulfilled: '📦' };
        const statusText = {
          fulfilled: isHindi ? 'Shipped (Bhej diya gaya)' : 'Shipped',
          unfulfilled: isHindi ? 'Processing (Taiyaar ho raha hai)' : 'Processing',
          partial: isHindi ? 'Partially Shipped' : 'Partially Shipped',
          null: isHindi ? 'Order Confirmed' : 'Order Confirmed'
        };

        const emoji = statusEmoji[status] || '📦';
        const statusLabel = statusText[status] || status;

        let msg = isHindi
          ? `${emoji} *Order #${orderNum} Status*\n\nStatus: *${statusLabel}*\nPayment: ${financialStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}`
          : `${emoji} *Order #${orderNum} Status*\n\nStatus: *${statusLabel}*\nPayment: ${financialStatus === 'paid' ? '✅ Paid' : '⏳ Pending'}`;

        if (trackingUrl) {
          await sendCTAButton(phoneNumberId, phone, msg,
            isHindi ? '🚚 Order Track Karo' : '🚚 Track Order',
            trackingUrl
          );
        } else {
          await sendTextMessage(phoneNumberId, phone, msg);
        }
        return;
      }
    } catch (err) {
      console.error('Shopify order lookup error:', err.message);
    }
  }

  // Fallback: redirect to website
  await sendCTAButton(phoneNumberId, phone,
    isHindi
      ? `📦 *Order #${orderNum}*\n\nShiprocket tracking pe apna order status check karo. Order number aur email/phone ready rakhein.`
      : `📦 *Order #${orderNum}*\n\nTrack your order status via Shiprocket. Keep your order number and email/phone ready.`,
    isHindi ? '🚚 Track Karo' : '🚚 Track Order',
    'https://www.motherscrunchyfoods.in'
  );
}

async function sendWelcome(phoneNumberId, phone, lang) {
  const isHindi = lang === 'Hindi' || lang.includes('Hinglish');
  await sendButtonMessage(
    phoneNumberId, phone,
    isHindi
      ? '🙏 *Namaste! Main Maya hoon — Mother\'s Crunchy Foods ki AI assistant!*\n\n300+ products hain — Makhana, Dry Fruits, Trail Mixes, Gift Combos!\n\n💡 *Tip:* Chat ke upar 🛍️ catalog icon tap karke saare products photos ke saath directly browse kar sakte ho!\n\nMain kaise help karoon?'
      : '👋 *Hi! I\'m Maya — AI assistant for Mother\'s Crunchy Foods!*\n\n300+ products — Makhana, Dry Fruits, Trail Mixes, Gift Combos!\n\n💡 *Tip:* Tap the 🛍️ catalog icon at the top of the chat to browse all products with photos!\n\nHow can I help you today?',
    [
      { id: 'browse_catalog', title: isHindi ? '🛍️ Products Dekho' : '🛍️ Browse Products' },
      { id: 'offers',         title: isHindi ? '🔥 Offers Dekho' : '🔥 See Offers' },
      { id: 'order_now',      title: isHindi ? '🛒 Order Karo' : '🛒 Order Now' },
    ]
  );
}

// ─── Maya's System Prompt v3.0 ────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are "Maya" - the friendly WhatsApp AI assistant for Mother's Crunchy Foods (MCF), a premium healthy snacks brand from India.

## 🌐 CRITICAL LANGUAGE RULE
STEP 1: Look at the customer's LATEST message.
STEP 2: Identify the language of THAT message specifically.
STEP 3: Reply ONLY in that language — even if previous messages were in a different language.

- English message → reply in English ONLY
- Hindi message → reply in Hindi ONLY
- Hinglish message → reply in Hinglish ONLY
- Tamil/Bengali/Telugu/Gujarati/Punjabi → reply in that language

This is NON-NEGOTIABLE. Never reply in Hindi if the customer wrote in English.

## 🏢 Brand Information
- Brand: Mother's Crunchy Foods (MCF)
- Website: https://www.motherscrunchyfoods.in
- WhatsApp: +91-84484-75025
- Email: contact@motherscrunchyfoods.in
- FSSAI Licence: 13326002000059

## ✨ Brand USPs
✅ Air-roasted, NEVER fried — guilt-free snacking
✅ No palm oil
✅ No artificial flavours or preservatives
✅ Premium Mithila Makhana from Bihar
✅ FSSAI licensed & certified

## 🛍️ CURRENT OFFERS
🔥 6% OFF on single packs (₹279, MRP ₹299)
🔥 24% OFF on 2-Pack Combos (₹449, MRP ₹598)
🔥 FREE Shipping on orders above ₹499
🛵 Cash on Delivery available

## 🍿 PRODUCTS
Flavoured Makhana (₹279 each):
Best Sellers: Peri Peri, Salt & Pepper, Cheese & Cheddar, Bhujjia Blast, Butter Bliss, Tangy Tomato, Creamy Onion
New: Sweet Thai Chilli, Magic Masala, Chatpata Chaska, Green Chilli, Spicy Garlic Crunch

2-Pack Combo: ₹449 | 3-Pack & 5-Pack: bigger savings!

Trail Mixes: ₹315–₹679
Nuts: Almonds ₹459, Cashews ₹559, Walnuts ₹656
Dry Fruits: Dates ₹599, Anjeer ₹559, Berries ₹499–₹699

Gift Combos: ₹686–₹1315

## 📱 SOCIAL MEDIA
Instagram: @motherscrunchyfoods | Facebook & YouTube: motherscrunchyfoods

## 🧠 SALES SKILLS
- Gifting → recommend Gift Combos or 2-Pack
- Kids → Butter Bliss or Cheese & Cheddar
- Diet/health → "Air-roasted, low calorie, high protein!"
- Office → Salt & Pepper or Cheese & Cheddar
- Single pack → upsell to 2-Pack Combo (24% savings)
- Below ₹499 → push for free shipping threshold

## 📏 RESPONSE RULES
- SHORT: 2-4 sentences max (WhatsApp hai, novel nahi!)
- 1-2 emojis max per message
- End with ONE clear question or CTA
- Warm and friendly, never robotic
- For ordering: always mention https://www.motherscrunchyfoods.in`;

// ─── Handle Incoming WhatsApp Message ────────────────────────────────────────
async function handleMessage(message, phoneNumberId) {
  const phone = message.from;
  const msgType = message.type;

  if (message.id) await markAsRead(phoneNumberId, message.id);

  let userText = '';
  let buttonId = '';

  if (msgType === 'text') {
    userText = message.text?.body?.trim() || '';
  } else if (msgType === 'interactive') {
    const btnReply = message.interactive?.button_reply;
    const listReply = message.interactive?.list_reply;
    buttonId = btnReply?.id || listReply?.id || '';
    userText = btnReply?.title || listReply?.title || '';
  } else {
    await sendTextMessage(phoneNumberId, phone,
      "Namaste! 🙏 Text message bhejo — main help karungi!"
    );
    return;
  }

  if (!userText && !buttonId) return;

  console.log(`📨 [${phone}]: ${userText} ${buttonId ? `[btn:${buttonId}]` : ''}`);

  // Detect language
  const lang = detectLanguage(userText || 'hi');
  console.log(`🌐 Language: ${lang}`);

  // Handle button/list interactions directly
  if (buttonId) {
    await handleButtonAction(buttonId, phoneNumberId, phone, lang);
    trackLead(phone, userText, false);
    return;
  }

  // Handle order tracking conversation (waiting for order number)
  if (orderTrackingPending.get(phone)) {
    await handleOrderTracking(phoneNumberId, phone, lang, userText);
    return;
  }

  // Detect intent for smart interactive responses
  const intent = detectIntent(userText);

  if (!conversations.has(phone)) conversations.set(phone, []);
  const history = conversations.get(phone);
  const isNew = history.length === 0;

  // Send interactive menus for specific intents
  if (isNew && intent === 'greeting') {
    await sendWelcome(phoneNumberId, phone, lang);
    trackLead(phone, userText, true);
    return;
  }
  if (intent === 'show_flavours') {
    // Send catalog filtered to makhana, with text list as fallback
    await sendCategoryProducts(phoneNumberId, phone, lang, 'makhana');
    trackLead(phone, userText, isNew);
    return;
  }
  if (intent === 'show_catalog') {
    await sendFullCatalog(phoneNumberId, phone, lang);
    trackLead(phone, userText, isNew);
    return;
  }
  if (intent === 'show_offers') {
    await sendOffersMenu(phoneNumberId, phone, lang);
    trackLead(phone, userText, isNew);
    return;
  }
  if (intent === 'show_order_cta') {
    await sendOrderCTA(phoneNumberId, phone, lang);
    trackLead(phone, userText, isNew);
    return;
  }
  if (intent === 'track_order') {
    await sendOrderTrackingPrompt(phoneNumberId, phone, lang);
    trackLead(phone, userText, isNew);
    return;
  }

  // General AI response with language enforcement
  history.push({ role: 'user', content: userText });
  if (history.length > 20) conversations.set(phone, history.slice(-20));

  const langInstruction = `\n\n⚡ CURRENT MESSAGE LANGUAGE DETECTED: "${lang}"\nYou MUST reply in ${lang} ONLY. This is mandatory.`;

  try {
    const response = await aiClient.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 400,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + langInstruction },
        ...conversations.get(phone)
      ]
    });

    const reply = response.choices[0].message.content;
    history.push({ role: 'assistant', content: reply });

    await sendTextMessage(phoneNumberId, phone, reply);

    // After AI response, show order CTA if purchase intent
    if (intent === 'show_pricing' || userText.toLowerCase().includes('buy')) {
      setTimeout(() => sendOrderCTA(phoneNumberId, phone, lang), 1500);
    }

    trackLead(phone, userText, isNew);
    console.log(`✅ Reply sent to ${phone}`);

  } catch (error) {
    console.error(`❌ Error:`, error.message);
    await sendTextMessage(phoneNumberId, phone,
      "Oops! Thodi technical difficulty. Please try again or visit: https://www.motherscrunchyfoods.in 🙏"
    );
  }
}

// ─── Handle Button/List Selections ───────────────────────────────────────────
async function handleButtonAction(buttonId, phoneNumberId, phone, lang) {
  const isHindi = lang === 'Hindi' || lang.includes('Hinglish');

  switch (buttonId) {
    case 'browse_catalog':
      await sendFullCatalog(phoneNumberId, phone, lang);
      break;

    case 'flavours':
      await sendCategoryProducts(phoneNumberId, phone, lang, 'makhana');
      break;

    case 'combos':
    case 'cat_combo':
      await sendCTAButton(phoneNumberId, phone,
        isHindi
          ? '🎯 *2-Pack Combos — 24% OFF!*\n\nKoi bhi 2 flavours choose karo:\nPeri Peri, Cheese, Salt & Pepper, Bhujjia Blast, Butter Bliss, Thai Chilli aur aur bhi!\n\n📦 2-Pack: ₹449 (MRP ₹598)\n🚚 Free delivery above ₹499'
          : '🎯 *2-Pack Combos — 24% OFF!*\n\nChoose any 2 flavours:\nPeri Peri, Cheese, Salt & Pepper, Bhujjia Blast, Butter Bliss, Thai Chilli & more!\n\n📦 2-Pack: ₹449 (MRP ₹598)\n🚚 Free delivery above ₹499',
        isHindi ? '🛒 Combo Order Karo' : '🛒 Order Combo',
        'https://www.motherscrunchyfoods.in/collections/makhana-combo'
      );
      break;

    case 'cat_bestseller':
      await sendCTAButton(phoneNumberId, phone,
        isHindi
          ? '🔥 *Best Selling Makhana!*\n\n🥇 Peri Peri — spicy & tangy\n🥈 Salt & Pepper — classic\n🥉 Cheese & Cheddar — kids fav\n4️⃣ Bhujjia Blast — desi tadka\n5️⃣ Butter Bliss — creamy & mild\n\n₹279 each | 2-Pack ₹449 (24% OFF)'
          : '🔥 *Best Selling Makhana!*\n\n🥇 Peri Peri — spicy & tangy\n🥈 Salt & Pepper — classic\n🥉 Cheese & Cheddar — kids fav\n4️⃣ Bhujjia Blast — desi tadka\n5️⃣ Butter Bliss — creamy & mild\n\n₹279 each | 2-Pack ₹449 (24% OFF)',
        isHindi ? '🛒 Order Karo' : '🛒 Order Now',
        'https://www.motherscrunchyfoods.in/collections/makhana'
      );
      break;

    case 'cat_newmak':
      await sendCTAButton(phoneNumberId, phone,
        isHindi
          ? '✨ *Naye Flavours — Try Karo!*\n\n🌶️ Sweet Thai Chilli\n🌿 Magic Masala\n💫 Chatpata Chaska\n🟢 Green Chilli\n🧄 Spicy Garlic Crunch\n🍅 Tangy Tomato\n\n₹279 each | Combo mein aur savings!'
          : '✨ *New Flavours — Try Now!*\n\n🌶️ Sweet Thai Chilli\n🌿 Magic Masala\n💫 Chatpata Chaska\n🟢 Green Chilli\n🧄 Spicy Garlic Crunch\n🍅 Tangy Tomato\n\n₹279 each | Save more in combos!',
        isHindi ? '🛒 Order Karo' : '🛒 Order Now',
        'https://www.motherscrunchyfoods.in/collections/makhana'
      );
      break;

    case 'cat_dryfruits':
      await sendCTAButton(phoneNumberId, phone,
        isHindi
          ? '🫐 *Premium Dry Fruits!*\n\n📅 Medjool Dates — ₹599\n🌿 Royal Anjeer — ₹559\n🫐 Crimson Berries — ₹499\n🫐 Wild Blueberries — ₹699\n\n100% natural, no added sugar!'
          : '🫐 *Premium Dry Fruits!*\n\n📅 Medjool Dates — ₹599\n🌿 Royal Anjeer — ₹559\n🫐 Crimson Berries — ₹499\n🫐 Wild Blueberries — ₹699\n\n100% natural, no added sugar!',
        isHindi ? '🛒 Order Karo' : '🛒 Order Now',
        'https://www.motherscrunchyfoods.in/collections/dry-fruits'
      );
      break;

    case 'cat_nuts':
      await sendCTAButton(phoneNumberId, phone,
        isHindi
          ? '🥜 *Premium Nuts!*\n\n🌰 California Almonds — ₹459\n💰 Premium Cashews — ₹559\n🧠 Walnuts — ₹656\n\nFresh roasted, premium quality!'
          : '🥜 *Premium Nuts!*\n\n🌰 California Almonds — ₹459\n💰 Premium Cashews — ₹559\n🧠 Walnuts — ₹656\n\nFresh roasted, premium quality!',
        isHindi ? '🛒 Order Karo' : '🛒 Order Now',
        'https://www.motherscrunchyfoods.in/collections/nuts'
      );
      break;

    case 'cat_trail':
      await sendCTAButton(phoneNumberId, phone,
        isHindi
          ? '🥗 *Trail Mixes!*\n\nNuts, seeds, dry fruits ka perfect blend.\n₹315–₹679\n\nWorkout ke baad ya office snack ke liye perfect!'
          : '🥗 *Trail Mixes!*\n\nPerfect blend of nuts, seeds & dry fruits.\n₹315–₹679\n\nIdeal post-workout or office snack!',
        isHindi ? '🛒 Order Karo' : '🛒 Order Now',
        'https://www.motherscrunchyfoods.in/collections/trail-mix'
      );
      break;

    case 'cat_gift':
      await sendCTAButton(phoneNumberId, phone,
        isHindi
          ? '🎁 *Gift Combos — Perfect Gifting!*\n\nBirthday, anniversary, festivals — sab ke liye!\n\n🎀 Small Gift Box — ₹686\n🎁 Medium Gift Hamper — ₹999\n👑 Premium Gift Box — ₹1315\n\nBeautiful packaging included!'
          : '🎁 *Gift Combos — Perfect for Gifting!*\n\nBirthday, anniversary, festivals & more!\n\n🎀 Small Gift Box — ₹686\n🎁 Medium Gift Hamper — ₹999\n👑 Premium Gift Box — ₹1315\n\nBeautiful packaging included!',
        isHindi ? '🎁 Gift Order Karo' : '🎁 Order Gift Pack',
        'https://www.motherscrunchyfoods.in/collections/gift-hampers'
      );
      break;

    case 'cat_multipack':
    case 'cat_all':
      await sendCTAButton(phoneNumberId, phone,
        isHindi
          ? '🌐 *Poora Catalog Dekho!*\n\n300+ products — Makhana, Dry Fruits, Nuts, Trail Mixes, Gift Hampers.\n\nWebsite par sabhi products photos, reviews aur prices ke saath hain!'
          : '🌐 *Browse Full Catalog!*\n\n300+ products — Makhana, Dry Fruits, Nuts, Trail Mixes, Gift Hampers.\n\nAll products with photos, reviews & prices on website!',
        isHindi ? '🌐 Website Kholo' : '🌐 Open Website',
        'https://www.motherscrunchyfoods.in'
      );
      break;

    case 'offers':
      await sendOffersMenu(phoneNumberId, phone, lang);
      break;

    case 'order_now':
      await sendOrderCTA(phoneNumberId, phone, lang);
      break;

    case 'more_info':
      await sendButtonMessage(phoneNumberId, phone,
        isHindi
          ? '🌿 *Mother\'s Crunchy Foods ke baare mein:*\n\n✅ Air-roasted — fried nahi!\n✅ No palm oil\n✅ No artificial flavours\n✅ FSSAI certified\n✅ Premium Mithila Makhana\n\nHumari social media bhi follow karo: @motherscrunchyfoods'
          : '🌿 *About Mother\'s Crunchy Foods:*\n\n✅ Air-roasted — never fried!\n✅ No palm oil\n✅ No artificial flavours\n✅ FSSAI certified\n✅ Premium Mithila Makhana\n\nFollow us: @motherscrunchyfoods',
        [
          { id: 'order_now', title: isHindi ? '🛒 Order Karo' : '🛒 Order Now' },
          { id: 'flavours',  title: isHindi ? '🍿 Flavours' : '🍿 Flavours' },
        ]
      );
      break;

    // Flavour selections from list menu
    case 'peri_peri':
    case 'salt_pepper':
    case 'cheese':
    case 'bhujjia':
    case 'butter_bliss':
    case 'thai_chilli':
    case 'magic_masala':
    case 'tangy_tomato':
    case 'raw_makhana':
    case 'trail_mix': {
      const flavourNames = {
        peri_peri: 'Peri Peri', salt_pepper: 'Salt & Pepper', cheese: 'Cheese & Cheddar',
        bhujjia: 'Bhujjia Blast', butter_bliss: 'Butter Bliss', thai_chilli: 'Sweet Thai Chilli',
        magic_masala: 'Magic Masala', tangy_tomato: 'Tangy Tomato',
        raw_makhana: 'Plain Makhana', trail_mix: 'Trail Mix'
      };
      const name = flavourNames[buttonId];
      await sendButtonMessage(
        phoneNumberId, phone,
        isHindi
          ? `😋 *${name}* — bahut badiya choice!\n\n₹279 mein single pack ya ₹449 mein 2-Pack Combo (24% OFF) loge?\nCombo mein koi bhi 2 flavours choose kar sakte ho!`
          : `😋 *${name}* — great choice!\n\nSingle pack ₹279 or 2-Pack Combo ₹449 (24% OFF)?\nIn combo you can pick any 2 flavours!`,
        [
          { id: 'order_now',  title: isHindi ? '🛒 Order Karo' : '🛒 Order Now' },
          { id: 'flavours',   title: isHindi ? '🍿 Aur Dekho' : '🍿 See More' },
          { id: 'offers',     title: isHindi ? '🔥 Offers' : '🔥 Offers' },
        ]
      );
      break;
    }

    default:
      await sendWelcome(phoneNumberId, phone, lang);
  }
}

// ─── Lead Tracking ────────────────────────────────────────────────────────────
function trackLead(phone, userText, isNew) {
  const now = new Date().toISOString();
  const existing = getLead(phone);
  const updates = { lastContact: now, messageCount: (existing?.messageCount || 0) + 1 };
  if (isNew) updates.firstContact = now;

  const nameMatch = userText.match(/(?:mera naam|my name is|naam hai|i am|main hoon|I'm)\s+([A-Za-zऀ-ॿ]+)/i);
  if (nameMatch?.[1] && !existing?.name) updates.name = nameMatch[1];

  const text = userText.toLowerCase();
  const interests = existing?.interests ? [...existing.interests] : [];
  if (text.includes('gift') && !interests.includes('gifting')) interests.push('gifting');
  if (text.includes('makhana') && !interests.includes('makhana')) interests.push('makhana');
  if ((text.includes('diet') || text.includes('weight') || text.includes('healthy')) && !interests.includes('health')) interests.push('health');
  if ((text.includes('office') || text.includes('work')) && !interests.includes('office')) interests.push('office');
  if ((text.includes('kid') || text.includes('child') || text.includes('bachha')) && !interests.includes('kids')) interests.push('kids');
  if (interests.length) updates.interests = [...new Set(interests)];

  saveLead(phone, updates);
}

module.exports = { handleMessage };
