// Mother's Crunchy Foods - Complete Product Knowledge Base

const MCF_KNOWLEDGE = {
  brand: "Mother's Crunchy Foods (MCF)",
  tagline: "Premium Air-Roasted Makhana & Healthy Snacks",
  website: "https://www.motherscrunchyfoods.in",
  whatsapp: "+91-84484-75025",
  phone: "+91-84484-75025",
  email: "contact@motherscrunchyfoods.in",
  address: "13-A, Maidan Garhi, South Delhi, New Delhi - 110068",
  fssai: "13326002000059",
  trackOrder: "https://www.motherscrunchyfoods.in/apps/parcelpanel",

  keyFeatures: [
    "Air-roasted, NOT fried",
    "No palm oil",
    "No artificial flavours",
    "100% Handpicked",
    "Makhana sourced from Mithila, Bihar",
    "FSSAI Licensed brand"
  ],

  products: {
    makhanaFlavors: [
      { name: "Peri Peri", price: 279, weight: "77g", mrp: 299, spice: "medium-high" },
      { name: "Salt & Pepper", price: 279, weight: "77g", mrp: 299, spice: "mild" },
      { name: "Tangy Tomato", price: 279, weight: "77g", mrp: 299, spice: "mild" },
      { name: "Cheese & Cheddar", price: 279, weight: "77g", mrp: 299, spice: "none" },
      { name: "Butter Bliss", price: 279, weight: "77g", mrp: 299, spice: "none" },
      { name: "Bhujjia Blast", price: 279, weight: "77g", mrp: 299, spice: "medium" },
      { name: "Creamy Onion", price: 279, weight: "77g", mrp: 299, spice: "mild" },
      { name: "Minty Pudhina", price: 279, weight: "77g", mrp: 299, spice: "mild" },
      { name: "Tadka Feast Crunch", price: 279, weight: "90g", mrp: 299, spice: "medium" },
      { name: "Sweet Thai Chilli Crunch", price: 279, weight: "90g", mrp: 299, spice: "medium" },
      { name: "Spicy Garlic Crunch", price: 279, weight: "90g", mrp: 299, spice: "high" },
      { name: "Magic Masala", price: 279, weight: "77g", mrp: 299, spice: "medium" },
      { name: "Chatpata Chaska", price: 279, weight: "77g", mrp: 299, spice: "medium-high" },
      { name: "Green Chilli", price: 279, weight: "77g", mrp: 299, spice: "high" },
      { name: "Plain/Raw Makhana", price: 279, weight: "90g", mrp: 299, spice: "none" }
    ],

    makhanaCombos: [
      { name: "2-Pack Combo (77g x2)", price: 449, mrp: 598, discount: "25% off", note: "Pick any 2 flavours" },
      { name: "2-Pack with Raw Makhana (90g)", price: 499, mrp: 658, discount: "24% off" }
    ],

    trailMixes: [
      { name: "SuperSeed Nut Mix", price: 359, weight: "250g+" },
      { name: "Shahi Dry Fruit Mix", price: 472, weight: "250g+" },
      { name: "Royal Trail Mix", price: 626, weight: "250g+" },
      { name: "Crimson Berry Mix", price: 507, weight: "250g+" },
      { name: "Berry Crown Mix", price: 540, weight: "250g+" },
      { name: "Omega Crunch Mix", price: 315, weight: "250g+" },
      { name: "Signature Royal Mix", price: 679, weight: "250g+" },
      { name: "Berry Nut Trail Mix", price: 577, weight: "250g+" }
    ],

    nuts: [
      { name: "Almond Royale", price: 459, weight: "200g/300g/600g" },
      { name: "Royal Kaju (Cashews)", price: 559, weight: "250g/500g" },
      { name: "Walnut Royale", price: 656, weight: "200g/400g" },
      { name: "Royal Pista (Pistachios)", price: 1468, weight: "200g/350g/500g" },
      { name: "Chia Seeds", price: 256, weight: "200g/300g/700g" }
    ],

    driedFruits: [
      { name: "Sapphire Berries", price: 699 },
      { name: "Crimson Berries", price: 499 },
      { name: "Ruby Strawberry", price: 429 },
      { name: "Royal Munakka (Raisins)", price: 327 },
      { name: "Royal Medjool Dates", price: 599, weight: "250g/350g/900g" },
      { name: "Royal Anjeer (Figs)", price: 559 },
      { name: "Mango Royale", price: 401 },
      { name: "Kiwi Royale", price: 274 }
    ],

    giftCombos: [
      { name: "SuperSeed + Royal Munakka", price: 686 },
      { name: "Crimson Berry + Signature Royal Mix", price: 1235 },
      { name: "Premium Gift Box (3 items)", price: 1315 }
    ]
  },

  policies: {
    shipping: "FREE shipping on all orders above Rs. 499. Flat Rs. 49 for orders below Rs. 499.",
    cod: "Cash on Delivery available on most pin codes across India.",
    tracking: "Order track karne ke liye: https://www.motherscrunchyfoods.in/apps/parcelpanel",
    returns: "Return/refund ke liye team se contact karein: contact@motherscrunchyfoods.in"
  },

  salesPitches: {
    freeShipping: "Rs. 499 se upar order par FREE delivery milti hai! 🚚",
    combo: "2-Pack combo mein 25% bachao! Koi bhi 2 flavours choose kar sakte ho 😊",
    gifting: "Gift dena hai kisi ko? Hamari Gift Combos dekhiye - ekdum perfect packaging ke saath!",
    health: "Air-roasted hain, fried nahi! Guilt-free snacking for the whole family 💪"
  }
};

module.exports = MCF_KNOWLEDGE;
