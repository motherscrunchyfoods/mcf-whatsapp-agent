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

// ─── Product Catalog Config ───────────────────────────────────────────────────
const CATALOG_ID = '39905451575769041';
const CATALOG_THUMBNAIL_SKU = 'MCF-DF-023'; // Crimson Berries as default thumbnail

// Sends the full product catalog browser (all 300+ products with photos)
async function sendFullCatalog(phoneNumberId, phone, lang) {
  const isHindi = lang === 'Hindi' || lang.includes('Hinglish');
  await sendCatalogMessage(
    phoneNumberId, phone,
    isHindi
      ? '🛍️ *Mother\'s Crunchy Foods ka poora catalog!*\n\nMakhana, Dry Fruits, Trail Mixes, Gift Combos — sab kuch yahan hai.\nProduct pe tap karo aur seedha order karo! 🛒'
      : '🛍️ *Mother\'s Crunchy Foods full catalog!*\n\nMakhana, Dry Fruits, Trail Mixes, Gift Combos — all here.\nTap any product to view details & order! 🛒',
    CATALOG_THUMBNAIL_SKU
  );
}

// Sends specific category products
async function sendCategoryProducts(phoneNumberId, phone, lang, category) {
  const isHindi = lang === 'Hindi' || lang.includes('Hinglish');

  const categories = {
    makhana: {
      title: isHindi ? '🍿 Makhana Flavours' : '🍿 Makhana Flavours',
      body: isHindi ? 'Hamare premium air-roasted makhana — NEVER fried!' : 'Our premium air-roasted makhana — NEVER fried!',
      skus: ['MCF-MAK-001', 'MCF-MAK-002', 'MCF-MAK-003', 'MCF-MAK-004', 'MCF-MAK-005',
             'MCF-MAK-006', 'MCF-MAK-007', 'MCF-MAK-008', 'MCF-MAK-009', 'MCF-MAK-010']
    },
    combo: {
      title: isHindi ? '🎯 Combo Packs' : '🎯 Combo Packs',
      body: isHindi ? '24% OFF ke saath 2-pack combos — best value!' : '2-pack combos with 24% OFF — best value!',
      skus: ['MCF-BDL-MAK-P2-CC-GC', 'MCF-BDL-MAK-P2-CM-CO', 'MCF-BDL-MAK-P2-CC-CO',
             'MCF-BDL-MAK-P2-CH-PR', 'MCF-BDL-MAK-P2-PR-STC', 'MCF-BDL-MAK-P2-BH-RAW',
             'MCF-BDL-MAK-P2-BH-TT', 'MCF-BDL-MAK-P2-CM-TF']
    },
    dryfruits: {
      title: isHindi ? '🌰 Dry Fruits & Nuts' : '🌰 Dry Fruits & Nuts',
      body: isHindi ? 'Premium quality dry fruits — natural & fresh!' : 'Premium dry fruits — natural & fresh!',
      skus: ['MCF-DF-023', 'MCF-BDL-RA-SNM-200-250']
    }
  };

  const cat = categories[category];
  if (!cat) {
    await sendFullCatalog(phoneNumberId, phone, lang);
    return;
  }

  try {
    await sendMultiProductMessage(
      phoneNumberId, phone,
      cat.title, cat.body,
      CATALOG_ID,
      [{ title: cat.title, skus: cat.skus }]
    );
  } catch {
    // Fallback to full catalog if multi-product fails (SKUs might not match)
    await sendFullCatalog(phoneNumberId, phone, lang);
  }
}

async function sendWelcome(phoneNumberId, phone, lang) {
  const isHindi = lang === 'Hindi' || lang.includes('Hinglish');
  await sendButtonMessage(
    phoneNumberId, phone,
    isHindi
      ? '🙏 *Namaste! Main Maya hoon — Mother\'s Crunchy Foods ki AI assistant!*\n\n300+ products hain — Makhana, Dry Fruits, Trail Mixes, Gift Combos!\n\nMain kaise help karoon?'
      : '👋 *Hi! I\'m Maya — AI assistant for Mother\'s Crunchy Foods!*\n\n300+ products — Makhana, Dry Fruits, Trail Mixes, Gift Combos!\n\nHow can I help you today?',
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
      await sendCategoryProducts(phoneNumberId, phone, lang, 'combo');
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
