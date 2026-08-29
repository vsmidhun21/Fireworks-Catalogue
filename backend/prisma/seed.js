// SAMPLE / PLACEHOLDER DATA ONLY.
// Category names come from the client-supplied reference PDF. Prices,
// descriptions and images below are placeholders for demo purposes.
// The client must supply final product data, images, prices, discounts
// and Tamil translations via the admin panel (see PROJECT_SPEC.md).

import bcrypt from "bcryptjs";
import { db } from "../src/config/db.js";
import { CategoryRepo } from "../src/repositories/categories.repo.js";
import { ProductRepo } from "../src/repositories/products.repo.js";
import { SettingsRepo } from "../src/repositories/estimates.repo.js";
import { AdminUserRepo } from "../src/repositories/adminUsers.repo.js";

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

const categories = [
  { nameEn: "Single Sound Crackers", nameTa: "ஒரு சத்தம் வெடிகள்", descriptionEn: "Classic single-burst crackers." },
  { nameEn: "Ground Chakkars", nameTa: "தரை சக்கரம்", descriptionEn: "Spinning ground fireworks in various sizes." },
  { nameEn: "Flower Pots", nameTa: "மலர் குண்டு", descriptionEn: "Colourful fountain-style flower pots." },
  { nameEn: "Rockets", nameTa: "ராக்கெட்", descriptionEn: "Sky-bound rockets and whistling rockets." },
  { nameEn: "Sparklers", nameTa: "மத்தாப்பு", descriptionEn: "Hand-held sparklers in multiple sizes and colours." },
  { nameEn: "Children's Special", nameTa: "குழந்தைகள் சிறப்பு", descriptionEn: "Fun, low-noise crackers made for kids." },
  { nameEn: "Repeating Shots", nameTa: "தொடர் வெடிகள்", descriptionEn: "Multi-shot aerial repeaters." },
  { nameEn: "Gift Boxes", nameTa: "பரிசு பெட்டி", descriptionEn: "Assorted cracker gift boxes for celebrations." },
];

const productsByCategory = {
  "Single Sound Crackers": [
    { code: "SSC-001", nameEn: "3 1/2'' Lakshmi", nameTa: "3 1/2'' லக்ஷ்மி", unit: "Box (25 pcs)", price: 450, discounted: 380 },
    { code: "SSC-002", nameEn: "4'' Gold Lakshmi", nameTa: "4'' கோல்ட் லக்ஷ்மி", unit: "Box (25 pcs)", price: 620, discounted: 520, featured: true },
    { code: "SSC-003", nameEn: "2 3/4' Kuruvi", nameTa: "2 3/4' குருவி", unit: "Box (50 pcs)", price: 300, discounted: 255 },
  ],
  "Ground Chakkars": [
    { code: "GC-001", nameEn: "Ground Chakkar Special", nameTa: "தரை சக்கரம் ஸ்பெஷல்", unit: "Box (10 pcs)", price: 380, discounted: 320, featured: true },
    { code: "GC-002", nameEn: "Ground Chakkar Deluxe (Spinner)", nameTa: "டீலக்ஸ் சக்கரம்", unit: "Box (10 pcs)", price: 520, discounted: 440 },
  ],
  "Flower Pots": [
    { code: "FP-001", nameEn: "Flower Pots Special", nameTa: "மலர் குண்டு ஸ்பெஷல்", unit: "Box (5 pcs)", price: 410, discounted: 350, featured: true },
    { code: "FP-002", nameEn: "Colour Koti Deluxe", nameTa: "கலர் கோடி டீலக்ஸ்", unit: "Box (5 pcs)", price: 560, discounted: 480 },
  ],
  "Rockets": [
    { code: "RK-001", nameEn: "Super Rocket", nameTa: "சூப்பர் ராக்கெட்", unit: "Box (10 pcs)", price: 700, discounted: 600, featured: true },
    { code: "RK-002", nameEn: "Whistling Rocket", nameTa: "விசில் ராக்கெட்", unit: "Box (10 pcs)", price: 480, discounted: 410 },
  ],
  "Sparklers": [
    { code: "SP-001", nameEn: "7 Cm Colour Sparklers", nameTa: "7 செ.மீ கலர் மத்தாப்பு", unit: "Box (10 pcs)", price: 90, discounted: 75 },
    { code: "SP-002", nameEn: "10 Cm Electric Sparklers", nameTa: "10 செ.மீ எலெக்ட்ரிக் மத்தாப்பு", unit: "Box (10 pcs)", price: 130, discounted: 110, featured: true },
    { code: "SP-003", nameEn: "12 Cm Colour Sparklers", nameTa: "12 செ.மீ கலர் மத்தாப்பு", unit: "Box (10 pcs)", price: 160, discounted: 135 },
  ],
  "Children's Special": [
    { code: "CS-001", nameEn: "Disco Wheel", nameTa: "டிஸ்கோ வீல்", unit: "Piece", price: 60, discounted: 50 },
    { code: "CS-002", nameEn: "Butterfly", nameTa: "பட்டாம்பூச்சி", unit: "Box (5 pcs)", price: 150, discounted: 125, featured: true },
  ],
  "Repeating Shots": [
    { code: "RS-001", nameEn: "30 Shot", nameTa: "30 ஷாட்", unit: "Piece", price: 950, discounted: 820 },
    { code: "RS-002", nameEn: "120 Shot (Pandiyan)", nameTa: "120 ஷாட் (பாண்டியன்)", unit: "Piece", price: 3200, discounted: 2800, featured: true },
  ],
  "Gift Boxes": [
    { code: "GB-001", nameEn: "25 Item Gift Box", nameTa: "25 பொருள் பரிசு பெட்டி", unit: "Box", price: 2200, discounted: 1900, featured: true },
    { code: "GB-002", nameEn: "40 Item Gift Box", nameTa: "40 பொருள் பரிசு பெட்டி", unit: "Box", price: 4500, discounted: 3900 },
  ],
};

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
  console.log("  -> username: admin / password: Admin@123 (CHANGE THIS BEFORE PRODUCTION)");

  console.log("Seeding categories & products...");
  let sortOrder = 0;
  for (const cat of categories) {
    sortOrder += 1;
    let category = CategoryRepo.findBySlug(slugify(cat.nameEn));
    if (!category) {
      category = CategoryRepo.create({
        nameEn: cat.nameEn,
        nameTa: cat.nameTa,
        slug: slugify(cat.nameEn),
        descriptionEn: cat.descriptionEn,
        sortOrder,
      });
    }

    const products = productsByCategory[cat.nameEn] || [];
    let pSort = 0;
    for (const p of products) {
      pSort += 1;
      const existingProduct = ProductRepo.findByCode(p.code);
      if (existingProduct) continue;
      ProductRepo.create({
        categoryId: category.id,
        productCode: p.code,
        nameEn: p.nameEn,
        nameTa: p.nameTa,
        slug: slugify(p.nameEn) + "-" + p.code.toLowerCase(),
        descriptionEn: `${p.nameEn} — premium quality, safe and vibrant. Placeholder description; replace with final client-approved copy.`,
        unit: p.unit,
        originalPrice: p.price,
        discountedPrice: p.discounted,
        isFeatured: !!p.featured,
        sortOrder: pSort,
      });
    }
  }

  console.log("Seeding website settings...");
  SettingsRepo.setMany({
    business_name: "Sri RR Crackers",
    phone_primary: "87540 66248",
    phone_secondary: "88257 21391",
    whatsapp_number: "918754066248",
    email: "info@srirrcrackers.example",
    address: "D.No: 2/557/16, Amman Tower, Southside School (Opp), Chinnakamanpatti, Sivakasi - 626 189, Tamil Nadu, India",
    business_hours: "Mon - Sun: 9:00 AM - 9:00 PM",
    google_maps_url: "",
    facebook_url: "",
    instagram_url: "",
  });

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
