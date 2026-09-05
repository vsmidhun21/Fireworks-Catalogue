import bcrypt from "bcryptjs";
import { db } from "../src/config/db.js";
import { CategoryRepo } from "../src/repositories/categories.repo.js";
import { ProductRepo } from "../src/repositories/products.repo.js";
import { SettingsRepo } from "../src/repositories/estimates.repo.js";
import { AdminUserRepo } from "../src/repositories/adminUsers.repo.js";

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

const fullCatalogue = [
  {
    category: "SINGLE SOUND CRACKERS",
    categoryTa: "ஒரு சத்தம் வெடிகள்",
    items: [
      { code: "001", nameEn: "3 1/2'' Lakshmi", nameTa: "3.5 இன்ச் லட்சுமி", unit: "Pkt", price: 130, discounted: 130 },
      { code: "002", nameEn: "4'' Lakshmi", nameTa: "4 இன்ச் லட்சுமி", unit: "Pkt", price: 180, discounted: 180 },
      { code: "003", nameEn: "4'' Gold Lakshmi", nameTa: "4 இன்ச் கோல்டு லட்சுமி", unit: "Pkt", price: 350, discounted: 350, featured: true },
      { code: "005", nameEn: "2 3/4' Kuruvi", nameTa: "2.75 இன்ச் குருவி", unit: "Pkt", price: 110, discounted: 110 },
      { code: "006", nameEn: "2 Sound Crackers", nameTa: "2 சவுண்ட்", unit: "Pkt", price: 400, discounted: 400 },
    ],
  },
  {
    category: "GROUND CHAKKARS",
    categoryTa: "தரை சக்கரம்",
    items: [
      { code: "007", nameEn: "Ground Chakkar Big (10 Pcs)", nameTa: "தரைச்சக்கரம் பெரியது", unit: "Box", price: 300, discounted: 300 },
      { code: "008", nameEn: "Ground Chakkar Special", nameTa: "தரைச்சக்கரம் ஸ்பெஷல்", unit: "Box", price: 600, discounted: 600, featured: true },
      { code: "009", nameEn: "Ground Chakkar Deluxe", nameTa: "தரைச்சக்கரம் டீலக்ஸ்", unit: "Box", price: 1200, discounted: 1200 },
      { code: "010", nameEn: "Ground Chakkar Big (Spinner)", nameTa: "ஸ்பின்னர் பெரியது", unit: "Box", price: 450, discounted: 450 },
      { code: "011", nameEn: "Ground Chakkar Special (Spinner)", nameTa: "ஸ்பின்னர் ஸ்பெஷல்", unit: "Box", price: 1000, discounted: 1000 },
      { code: "012", nameEn: "Ground Chakkar Asoka (Spinner)", nameTa: "ஸ்பின்னர் அசோகா", unit: "Box", price: 750, discounted: 750 },
      { code: "013", nameEn: "Ground Chakkar Deluxe (Spinner)", nameTa: "ஸ்பின்னர் டீலக்ஸ்", unit: "Box", price: 1600, discounted: 1600 },
    ],
  },
  {
    category: "FLOWER POTS",
    categoryTa: "பூந்தொட்டி",
    items: [
      { code: "014", nameEn: "Flower Pots Small", nameTa: "பூச்சட்டி சிறியது", unit: "Box", price: 500, discounted: 500 },
      { code: "015", nameEn: "Flower Pots Big", nameTa: "பூச்சட்டி பெரியது", unit: "Box", price: 700, discounted: 700 },
      { code: "016", nameEn: "Flower Pots Special", nameTa: "பூச்சட்டி ஸ்பெஷல்", unit: "Box", price: 1000, discounted: 1000, featured: true },
      { code: "017", nameEn: "Flower Pots Asoka", nameTa: "பூச்சட்டி அசோகா", unit: "Box", price: 1500, discounted: 1500 },
      { code: "018", nameEn: "Colour Koti", nameTa: "கலர் கோட்டி", unit: "Box", price: 2100, discounted: 2100 },
      { code: "019", nameEn: "Colour Koti Deluxe", nameTa: "கலர் கோட்டி டீலக்ஸ்", unit: "Box", price: 3800, discounted: 3800, featured: true },
    ],
  },
  {
    category: "ROCKETS",
    categoryTa: "ராக்கெட்",
    items: [
      { code: "020", nameEn: "Rocket Bomb", nameTa: "ராக்கெட் பாம்", unit: "Box", price: 700, discounted: 700 },
      { code: "021", nameEn: "Super Rocket", nameTa: "சூப்பர் ராக்கெட்", unit: "Box", price: 1000, discounted: 1000, featured: true },
      { code: "022", nameEn: "Whistling Rocket", nameTa: "விசிலிங் ராக்கெட்", unit: "Box", price: 1600, discounted: 1600 },
    ],
  },
  {
    category: "TWINKLING STAR",
    categoryTa: "சாட்டை",
    items: [
      { code: "023", nameEn: "1 1/2 Twinkling Star", nameTa: "1.5 அடி சாட்டை", unit: "Box", price: 300, discounted: 300 },
      { code: "024", nameEn: "4'' Twinkling Star", nameTa: "4 அடி சாட்டை", unit: "Box", price: 600, discounted: 600 },
    ],
  },
  {
    category: "BIJILI CRACKERS",
    categoryTa: "பிஜிலி பட்டாசு",
    items: [
      { code: "025", nameEn: "Red Bijili", nameTa: "சிவப்பு பிஜிலி", unit: "Bag", price: 330, discounted: 330 },
      { code: "026", nameEn: "Gold Bijili", nameTa: "கோல்டு பிஜிலி", unit: "Bag", price: 360, discounted: 360 },
    ],
  },
  {
    category: "BOMB",
    categoryTa: "வெடி குண்டு",
    items: [
      { code: "027", nameEn: "555 Bomb", nameTa: "555 பாம்", unit: "Box", price: 800, discounted: 800, featured: true },
      { code: "028", nameEn: "Jurassic Bomb", nameTa: "ஜூராசிக் பாம்", unit: "Box", price: 1000, discounted: 1000 },
      { code: "029", nameEn: "Dixty Bomb", nameTa: "டிக்சி பாம்", unit: "Box", price: 1200, discounted: 1200 },
      { code: "031", nameEn: "Nuclear Bomb", nameTa: "நியூக்ளியர் பாம்", unit: "Box", price: 3200, discounted: 3200, featured: true },
    ],
  },
  {
    category: "PAPER BOMB",
    categoryTa: "பேப்பர் பாம்",
    items: [
      { code: "032", nameEn: "1/4 Kg Paper Bomb", nameTa: "பேப்பர் பாம் கலர் கி", unit: "Box", price: 500, discounted: 500 },
      { code: "033", nameEn: "1/2 Kg Paper Bomb", nameTa: "பேப்பர் பாம் அரை கி", unit: "Box", price: 1000, discounted: 1000 },
      { code: "034", nameEn: "1 Kg Paper Bomb", nameTa: "பேப்பர் பாம் 1 கி", unit: "Box", price: 2000, discounted: 2000, featured: true },
    ],
  },
  {
    category: "WALA GARLANDS",
    categoryTa: "வாலா சரவெடி",
    items: [
      { code: "035", nameEn: "1000 Wala", nameTa: "1000 வாலா", unit: "Box", price: 2500, discounted: 2500, featured: true },
      { code: "036", nameEn: "2000 Wala", nameTa: "2000 வாலா", unit: "Box", price: 5000, discounted: 5000 },
      { code: "037", nameEn: "5000 Wala", nameTa: "5000 வாலா", unit: "Box", price: 12500, discounted: 12500 },
      { code: "107", nameEn: "90 WATTS", nameTa: "90 வாட்ஸ்", unit: "Box", price: 2100, discounted: 2100 },
    ],
  },
  {
    category: "SPARKLERS",
    categoryTa: "கம்பி மத்தாப்பு",
    items: [
      { code: "039", nameEn: "7 Cm Electric Sparklers", nameTa: "7 செ.மீ எலக்ட்ரிக் கம்பிகள்", unit: "Box", price: 100, discounted: 100 },
      { code: "040", nameEn: "7 Cm Colour Sparklers", nameTa: "7 செ.மீ கலர் கம்பிகள்", unit: "Box", price: 140, discounted: 140 },
      { code: "041", nameEn: "7 Cm Green Sparklers", nameTa: "7 செ.மீ பச்சை கம்பிகள்", unit: "Box", price: 160, discounted: 160 },
      { code: "042", nameEn: "7 Cm Red Sparklers", nameTa: "7 செ.மீ சிவப்பு கம்பிகள்", unit: "Box", price: 210, discounted: 210 },
      { code: "043", nameEn: "10 Cm Electric Sparklers", nameTa: "10 செ.மீ எலக்ட்ரிக் கம்பிகள்", unit: "Box", price: 200, discounted: 200, featured: true },
      { code: "044", nameEn: "10 Cm Colour Sparklers", nameTa: "10 செ.மீ கலர் கம்பிகள்", unit: "Box", price: 220, discounted: 220 },
      { code: "045", nameEn: "10 Cm Green Sparklers", nameTa: "10 செ.மீ பச்சை கம்பிகள்", unit: "Box", price: 250, discounted: 250 },
      { code: "046", nameEn: "12 Cm Electric Sparklers", nameTa: "12 செ.மீ எலக்ட்ரிக் கம்பிகள்", unit: "Box", price: 310, discounted: 310 },
      { code: "047", nameEn: "12 Cm Colour Sparklers", nameTa: "12 செ.மீ கலர் கம்பிகள்", unit: "Box", price: 330, discounted: 330 },
      { code: "048", nameEn: "12 Cm Green Sparklers", nameTa: "12 செ.மீ பச்சை கம்பிகள்", unit: "Box", price: 370, discounted: 370 },
      { code: "049", nameEn: "15 Cm Electric Sparklers", nameTa: "15 செ.மீ எலக்ட்ரிக் கம்பிகள்", unit: "Box", price: 420, discounted: 420 },
      { code: "050", nameEn: "15 Cm Colour Sparklers", nameTa: "15 செ.மீ கலர் கம்பிகள்", unit: "Box", price: 440, discounted: 440 },
      { code: "051", nameEn: "15 Cm Green Sparklers", nameTa: "15 செ.மீ பச்சை கம்பிகள்", unit: "Box", price: 500, discounted: 500 },
      { code: "052", nameEn: "30 Cm Electric Sparklers", nameTa: "30 செ.மீ எலக்ட்ரிக் கம்பிகள்", unit: "Box", price: 480, discounted: 480, featured: true },
      { code: "053", nameEn: "30 Cm Colour Sparklers", nameTa: "30 செ.மீ கலர் கம்பிகள்", unit: "Box", price: 540, discounted: 540 },
      { code: "054", nameEn: "50 Cm Electric Sparklers", nameTa: "50 செ.மீ எலக்ட்ரிக் கம்பிகள்", unit: "Box", price: 1800, discounted: 1800 },
      { code: "055", nameEn: "50 Cm Colour Sparklers", nameTa: "50 செ.மீ கலர் கம்பிகள்", unit: "Box", price: 2000, discounted: 2000 },
      { code: "056", nameEn: "Dancing Umbrella", nameTa: "டான்சிங் அம்பர்ல்லா", unit: "Box", price: 2200, discounted: 2200 },
      { code: "112", nameEn: "15 CM RED SPARKLERS", nameTa: "15 செ.மீ சிவப்பு மத்தாப்பு", unit: "Box", price: 580, discounted: 580 },
    ],
  },
  {
    category: "CHILDRENS SPECIAL",
    categoryTa: "குழந்தைகள் சிறப்பு",
    items: [
      { code: "057", nameEn: "Tin Beer", nameTa: "டின் பீர்", unit: "Box", price: 1000, discounted: 1000 },
      { code: "058", nameEn: "6'' Tin", nameTa: "6 இன்ச் டின்", unit: "Box", price: 2000, discounted: 2000 },
      { code: "059", nameEn: "Big Show", nameTa: "பிக் ஷோ", unit: "Box", price: 1500, discounted: 1500 },
      { code: "061", nameEn: "Disco Wheel", nameTa: "டிஸ்கோ வீல்", unit: "Box", price: 500, discounted: 500 },
      { code: "062", nameEn: "Pamparam", nameTa: "பம்பரம்", unit: "Box", price: 1000, discounted: 1000 },
      { code: "063", nameEn: "Helicopter", nameTa: "ஹெலிகாப்டர்", unit: "Box", price: 800, discounted: 800, featured: true },
      { code: "064", nameEn: "Butterfly", nameTa: "பட்டாம்பூச்சி", unit: "Box", price: 900, discounted: 900 },
      { code: "065", nameEn: "Selfi Stick", nameTa: "செல்பி ஸ்டிக்", unit: "Box", price: 400, discounted: 400 },
      { code: "066", nameEn: "Photo Flash", nameTa: "போட்டோ பிளாஷ்", unit: "Box", price: 500, discounted: 500 },
      { code: "067", nameEn: "Sky Shot", nameTa: "ஸ்கை சாட்", unit: "Box", price: 500, discounted: 500 },
      { code: "068", nameEn: "Golden Shower", nameTa: "கோல்டன் சவர்", unit: "Box", price: 600, discounted: 600 },
    ],
  },
  {
    category: "PEACOCK FOUNTAINS",
    categoryTa: "பீகாக் பவுண்டன்",
    items: [
      { code: "069", nameEn: "Crackling Peacock", nameTa: "கிராக்ளிங் பீகாக்", unit: "Box", price: 2000, discounted: 2000 },
      { code: "070", nameEn: "Bada Peacock", nameTa: "படா பீகாக்", unit: "Box", price: 3600, discounted: 3600, featured: true },
      { code: "108", nameEn: "PEACOCK PARTY", nameTa: "பீகாக் பார்ட்டி", unit: "Box", price: 2200, discounted: 2200 },
    ],
  },
  {
    category: "NEW ARRIVALS 2025",
    categoryTa: "புதிய வரவுகள் 2025",
    items: [
      { code: "072", nameEn: "Smoke", nameTa: "ஸ்மோக்", unit: "Box", price: 1600, discounted: 1600 },
      { code: "073", nameEn: "Gittar", nameTa: "கிட்டார்", unit: "Box", price: 2500, discounted: 2500, featured: true },
      { code: "074", nameEn: "Icone", nameTa: "ஐ கோன்", unit: "Box", price: 3000, discounted: 3000 },
      { code: "076", nameEn: "Parking Car", nameTa: "பார்க்கிங் கார்", unit: "Box", price: 2300, discounted: 2300 },
      { code: "077", nameEn: "Tri Color", nameTa: "ட்ரை கலர்", unit: "Box", price: 700, discounted: 700 },
      { code: "111", nameEn: "VEL FOUNTAIN", nameTa: "வேல் பவுண்டன்", unit: "Bag", price: 1900, discounted: 1900 },
    ],
  },
  {
    category: "PENCILS",
    categoryTa: "பென்சில் மத்தாப்பு",
    items: [
      { code: "078", nameEn: "Pop Hot", nameTa: "பாப் ஹாட்", unit: "Box", price: 1000, discounted: 1000 },
      { code: "080", nameEn: "Sivakasi Special Pencil", nameTa: "சிவகாசி ஸ்பெஷல் பென்சில்", unit: "Box", price: 1900, discounted: 1900 },
      { code: "081", nameEn: "Pop Corn Pencil", nameTa: "பாப்கார்ன் பென்சில்", unit: "Box", price: 1800, discounted: 1800 },
    ],
  },
  {
    category: "REPEATING SHOTS",
    categoryTa: "தொடர் வெடிகள் (ஷாட்ஸ்)",
    items: [
      { code: "082", nameEn: "7 Shot", nameTa: "7 சாட்", unit: "Box", price: 1000, discounted: 1000 },
      { code: "083", nameEn: "12 Shot", nameTa: "12 சாட்", unit: "Box", price: 2200, discounted: 2200 },
      { code: "084", nameEn: "30 Shot", nameTa: "30 சாட்", unit: "Box", price: 3800, discounted: 3800, featured: true },
      { code: "085", nameEn: "60 Shot", nameTa: "60 சாட்", unit: "Box", price: 7600, discounted: 7600 },
      { code: "086", nameEn: "120 Shot (PANDIYAN)", nameTa: "120 சாட்", unit: "Box", price: 15200, discounted: 15200, featured: true },
      { code: "087", nameEn: "240 Shot", nameTa: "240 சாட்", unit: "Box", price: 30400, discounted: 30400 },
    ],
  },
  {
    category: "AERIAL FANCY",
    categoryTa: "வானவேடிக்கை பேன்சி",
    items: [
      { code: "088", nameEn: "Chotta Fancy", nameTa: "சோட்டா பேன்சி", unit: "Box", price: 500, discounted: 500 },
      { code: "089", nameEn: "2'' Fancy", nameTa: "2 இன்ச் பேன்சி", unit: "Box", price: 1000, discounted: 1000 },
      { code: "090", nameEn: "2'' Fancy (3 Pcs)", nameTa: "2 இன்ச் பேன்சி (3 பீஸ்)", unit: "Box", price: 2800, discounted: 2800 },
      { code: "091", nameEn: "3 1/2'' Fancy", nameTa: "3.5 இன்ச் பேன்சி", unit: "Box", price: 3600, discounted: 3600 },
      { code: "092", nameEn: "4'' Fancy", nameTa: "4 இன்ச் பேன்சி", unit: "Box", price: 4100, discounted: 4100 },
      { code: "093", nameEn: "4'' Fancy 7 Step", nameTa: "4 இன்ச் பேன்சி 7 ஸ்டெப்", unit: "Box", price: 4600, discounted: 4600, featured: true },
      { code: "109", nameEn: "5'' FANCY (2 PCS)", nameTa: "5 இன்ச் பேன்சி", unit: "Box", price: 8200, discounted: 8200 },
      { code: "110", nameEn: "4'' FANCY (2 PCS)", nameTa: "4 இன்ச் பேன்சி", unit: "Box", price: 7800, discounted: 7800 },
    ],
  },
  {
    category: "COLOUR MATCHES",
    categoryTa: "கலர் தீப்பெட்டி",
    items: [
      { code: "094", nameEn: "5 in 1 Mini", nameTa: "5 இன் 1 மினி", unit: "Box", price: 300, discounted: 300 },
      { code: "095", nameEn: "King 10 in 1", nameTa: "கிங் 10 இன் 1", unit: "Box", price: 2200, discounted: 2200 },
    ],
  },
  {
    category: "COMBO PACK",
    categoryTa: "காம்போ பேக்",
    items: [
      { code: "096", nameEn: "Silver Combo", nameTa: "சில்வர் காம்போ", unit: "Box", price: 30000, discounted: 30000 },
      { code: "097", nameEn: "Gold Combo", nameTa: "கோல்டு காம்போ", unit: "Box", price: 50000, discounted: 50000 },
      { code: "098", nameEn: "Diamond Combo", nameTa: "டைமண்ட் காம்போ", unit: "Box", price: 70000, discounted: 70000 },
      { code: "099", nameEn: "Platinum Combo", nameTa: "பிளாட்டினம் காம்போ", unit: "Box", price: 100000, discounted: 100000, featured: true },
    ],
  },
  {
    category: "GIFT BOX",
    categoryTa: "பரிசு பெட்டி",
    items: [
      { code: "100", nameEn: "20 Item Gift Box", nameTa: "கிப்ட் பாக்ஸ் - 20", unit: "Box", price: 3250, discounted: 3250 },
      { code: "101", nameEn: "25 Item Gift Box", nameTa: "கிப்ட் பாக்ஸ் - 25", unit: "Box", price: 4000, discounted: 4000, featured: true },
      { code: "102", nameEn: "30 Item Gift Box", nameTa: "கிப்ட் பாக்ஸ் - 30", unit: "Box", price: 4500, discounted: 4500 },
      { code: "103", nameEn: "35 Item Gift Box", nameTa: "கிப்ட் பாக்ஸ் - 35", unit: "Box", price: 5500, discounted: 5500 },
      { code: "104", nameEn: "40 Item Gift Box", nameTa: "கிப்ட் பாக்ஸ் - 40", unit: "Box", price: 6500, discounted: 6500, featured: true },
      { code: "105", nameEn: "45 Item Gift Box", nameTa: "கிப்ட் பாக்ஸ் - 45", unit: "Box", price: 8000, discounted: 8000 },
    ],
  },
];

async function main() {
  console.log("Seeding admin user...");
  const existingAdmin = AdminUserRepo.findByLogin("admin");
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    AdminUserRepo.create({
      username: "admin",
      email: "admin@srirrcrackers.example",
      passwordHash,
      fullName: "Sri RR Crackers Admin",
    });
  }

  console.log("Seeding official catalogue categories & products from Price List 2025...");
  let sortOrder = 0;
  for (const catGroup of fullCatalogue) {
    sortOrder += 1;
    const slug = slugify(catGroup.category);
    let category = CategoryRepo.findBySlug(slug);
    if (!category) {
      category = CategoryRepo.create({
        nameEn: catGroup.category,
        nameTa: catGroup.categoryTa,
        slug: slug,
        descriptionEn: `Official ${catGroup.category} from Sivakasi factory.`,
        sortOrder,
      });
    } else {
      CategoryRepo.update(category.id, {
        nameEn: catGroup.category,
        nameTa: catGroup.categoryTa,
        sortOrder,
      });
    }

    let pSort = 0;
    for (const p of catGroup.items) {
      pSort += 1;
      const existingProduct = ProductRepo.findByCode(p.code);
      if (existingProduct) {
        ProductRepo.update(existingProduct.id, {
          categoryId: category.id,
          nameEn: p.nameEn,
          nameTa: p.nameTa,
          unit: p.unit,
          originalPrice: p.price,
          discountedPrice: p.discounted,
          isFeatured: !!p.featured,
          sortOrder: pSort,
        });
      } else {
        ProductRepo.create({
          categoryId: category.id,
          productCode: p.code,
          nameEn: p.nameEn,
          nameTa: p.nameTa,
          slug: slugify(p.nameEn) + "-" + p.code.toLowerCase(),
          descriptionEn: `${p.nameEn} — 100% genuine Sivakasi fireworks, premium sound & visual effects.`,
          unit: p.unit,
          originalPrice: p.price,
          discountedPrice: p.discounted,
          isFeatured: !!p.featured,
          sortOrder: pSort,
        });
      }
    }
  }

  console.log("Seeding website settings...");
  SettingsRepo.setMany({
    business_name: "Sri RR Crackers",
    phone_primary: "87540 66248",
    phone_secondary: "88257 21391",
    whatsapp_number: "918754066248",
    email: "srirrcrackers@gmail.com",
    address: "D.No : 2/557/16, Amman Tower, Southside School (Opp), Chinnakamanpatti, Sivakasi - 626 189",
    business_hours: "Mon - Sun: 8:00 AM - 10:00 PM",
    google_maps_url: "",
    facebook_url: "",
    instagram_url: "",
    header_ticker_items: [
      {
        id: "ticker-1",
        highlight_text: "MEGA DIWALI SALE",
        highlight_color: "#fbbf24",
        highlight_text_color: "#020617",
        message_text: "Special Diwali Festive Discounts Live! Up to 90% Off Retail Prices!",
        is_active: true,
      },
      {
        id: "ticker-2",
        highlight_text: "SIVAKASI DIRECT",
        highlight_color: "#f43f5e",
        highlight_text_color: "#ffffff",
        message_text: "100% Genuine Certified Green Crackers Directly from Sivakasi Factory",
        is_active: true,
      },
      {
        id: "ticker-3",
        highlight_text: "PAN-INDIA DISPATCH",
        highlight_color: "#34d399",
        highlight_text_color: "#020617",
        message_text: "Fast & Safe Transport Across India · Minimum Order ₹3,000",
        is_active: true,
      },
      {
        id: "ticker-4",
        highlight_text: "QUICK ESTIMATE",
        highlight_color: "#22d3ee",
        highlight_text_color: "#020617",
        message_text: "Select Crackers & Get Instant Quotation in 1-Click with Zero Payment Advance!",
        is_active: true,
      },
      {
        id: "ticker-5",
        highlight_text: "CALL / WHATSAPP",
        highlight_color: "#f59e0b",
        highlight_text_color: "#020617",
        message_text: "Helpline: +91 87540 66248 | +91 88257 21391",
        is_active: true,
      },
    ],
  });

  console.log("Official catalog seed complete! All products and categories loaded.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
