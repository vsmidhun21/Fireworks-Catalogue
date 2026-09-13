import { DatabaseSync } from "node:sqlite";
import mysql from "mysql2/promise";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

async function run() {
  console.log("Connecting to SQLite (source) and Hostinger MySQL (target)...");
  const sqliteDb = new DatabaseSync(path.join(__dirname, "../../data/app.db"));

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || "82.25.121.116",
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: "utf8mb4",
  });

  console.log("Connected to Hostinger MySQL!");

  const getColumns = async (table) => {
    const [cols] = await conn.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
      [process.env.DB_NAME, table]
    );
    return cols.map((c) => c.COLUMN_NAME.toLowerCase());
  };

  console.log("Updating Hostinger MySQL schema...");

  // 1. admin_users
  let cols = await getColumns("admin_users");
  if (!cols.includes("password_hash")) {
    await conn.query("ALTER TABLE admin_users ADD COLUMN password_hash VARCHAR(255) NULL AFTER password");
    await conn.query("UPDATE admin_users SET password_hash = password WHERE password_hash IS NULL");
  }
  if (!cols.includes("full_name")) await conn.query("ALTER TABLE admin_users ADD COLUMN full_name VARCHAR(255) NULL");
  if (!cols.includes("is_active")) await conn.query("ALTER TABLE admin_users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1");
  if (!cols.includes("last_login_at")) await conn.query("ALTER TABLE admin_users ADD COLUMN last_login_at VARCHAR(100) NULL");

  // 2. customers
  cols = await getColumns("customers");
  if (!cols.includes("phone")) {
    await conn.query("ALTER TABLE customers ADD COLUMN phone VARCHAR(50) NULL AFTER name");
    await conn.query("UPDATE customers SET phone = mobile WHERE phone IS NULL");
  }

  // 3. estimates
  cols = await getColumns("estimates");
  if (!cols.includes("total_discount")) await conn.query("ALTER TABLE estimates ADD COLUMN total_discount DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER subtotal");
  if (!cols.includes("estimated_total")) await conn.query("ALTER TABLE estimates ADD COLUMN estimated_total DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER total_discount");
  if (!cols.includes("customer_notes")) await conn.query("ALTER TABLE estimates ADD COLUMN customer_notes TEXT NULL AFTER status");
  if (!cols.includes("admin_notes")) await conn.query("ALTER TABLE estimates ADD COLUMN admin_notes TEXT NULL AFTER customer_notes");
  if (!cols.includes("customer_name")) await conn.query("ALTER TABLE estimates ADD COLUMN customer_name VARCHAR(255) NULL");
  if (!cols.includes("customer_phone")) await conn.query("ALTER TABLE estimates ADD COLUMN customer_phone VARCHAR(50) NULL");
  if (!cols.includes("customer_email")) await conn.query("ALTER TABLE estimates ADD COLUMN customer_email VARCHAR(255) NULL");
  if (!cols.includes("customer_address")) await conn.query("ALTER TABLE estimates ADD COLUMN customer_address TEXT NULL");
  if (!cols.includes("customer_city")) await conn.query("ALTER TABLE estimates ADD COLUMN customer_city VARCHAR(100) NULL");
  if (!cols.includes("customer_state")) await conn.query("ALTER TABLE estimates ADD COLUMN customer_state VARCHAR(100) NULL");
  if (!cols.includes("customer_pincode")) await conn.query("ALTER TABLE estimates ADD COLUMN customer_pincode VARCHAR(20) NULL");

  // 4. estimate_items
  cols = await getColumns("estimate_items");
  if (!cols.includes("product_code")) await conn.query("ALTER TABLE estimate_items ADD COLUMN product_code VARCHAR(100) NULL AFTER product_id");
  if (!cols.includes("product_name_en")) await conn.query("ALTER TABLE estimate_items ADD COLUMN product_name_en VARCHAR(255) NULL AFTER product_code");
  if (!cols.includes("product_name_ta")) await conn.query("ALTER TABLE estimate_items ADD COLUMN product_name_ta VARCHAR(255) NULL AFTER product_name_en");
  if (!cols.includes("unit")) await conn.query("ALTER TABLE estimate_items ADD COLUMN unit VARCHAR(100) NULL DEFAULT 'Box' AFTER product_name_ta");
  if (!cols.includes("original_unit_price")) await conn.query("ALTER TABLE estimate_items ADD COLUMN original_unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER quantity");
  if (!cols.includes("discounted_unit_price")) await conn.query("ALTER TABLE estimate_items ADD COLUMN discounted_unit_price DECIMAL(10,2) NULL AFTER original_unit_price");
  if (!cols.includes("line_total")) await conn.query("ALTER TABLE estimate_items ADD COLUMN line_total DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER discounted_unit_price");

  // 5. promotions
  await conn.query(`
    CREATE TABLE IF NOT EXISTS promotions (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      subtitle TEXT NULL,
      image_url TEXT NOT NULL,
      cta_label VARCHAR(255) NULL,
      cta_url TEXT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_promotions_active_sort (is_active, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // 6. gift_boxes
  await conn.query(`
    CREATE TABLE IF NOT EXISTS gift_boxes (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name_en VARCHAR(255) NOT NULL,
      name_ta VARCHAR(255) NULL,
      description_en TEXT NULL,
      description_ta TEXT NULL,
      image_url TEXT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_gift_boxes_active_sort (is_active, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log("Schema is fully prepared on Hostinger MySQL!");

  // Now migrate data if needed
  console.log("Checking data sync from SQLite to Hostinger MySQL...");

  // Disable FK checks during migration
  await conn.query("SET FOREIGN_KEY_CHECKS = 0");

  try {
    // 1. admin_users
    const sqliteAdmins = sqliteDb.prepare("SELECT * FROM admin_users").all();
    for (const a of sqliteAdmins) {
      const [existing] = await conn.query("SELECT id FROM admin_users WHERE username = ? OR email = ?", [a.username, a.email]);
      if (existing.length === 0) {
        await conn.query(
          "INSERT INTO admin_users (id, username, email, password, password_hash, full_name, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [a.id, a.username, a.email, a.password_hash, a.password_hash, a.full_name, a.is_active, a.created_at, a.updated_at]
        );
      } else {
        await conn.query(
          "UPDATE admin_users SET password_hash = ?, full_name = ?, is_active = ? WHERE id = ?",
          [a.password_hash, a.full_name, a.is_active, existing[0].id]
        );
      }
    }
    console.log("admin_users synced");

    // 2. categories
    const sqliteCategories = sqliteDb.prepare("SELECT * FROM categories").all();
    for (const c of sqliteCategories) {
      await conn.query(
        `INSERT INTO categories (id, name_en, name_ta, slug, description_en, description_ta, image_url, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name_en = VALUES(name_en),
           name_ta = VALUES(name_ta),
           slug = VALUES(slug),
           description_en = VALUES(description_en),
           description_ta = VALUES(description_ta),
           image_url = VALUES(image_url),
           sort_order = VALUES(sort_order),
           is_active = VALUES(is_active),
           updated_at = VALUES(updated_at)`,
        [c.id, c.name_en, c.name_ta, c.slug, c.description_en, c.description_ta, c.image_url, c.sort_order, c.is_active, c.created_at, c.updated_at]
      );
    }
    console.log(`categories synced (${sqliteCategories.length} records)`);

    // 3. products
    const sqliteProducts = sqliteDb.prepare("SELECT * FROM products").all();
    for (const p of sqliteProducts) {
      await conn.query(
        `INSERT INTO products (id, category_id, product_code, name_en, name_ta, slug, description_en, description_ta, unit, original_price, discounted_price, image_url, is_featured, is_new_arrival, is_active, sort_order, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           category_id = VALUES(category_id),
           product_code = VALUES(product_code),
           name_en = VALUES(name_en),
           name_ta = VALUES(name_ta),
           slug = VALUES(slug),
           description_en = VALUES(description_en),
           description_ta = VALUES(description_ta),
           unit = VALUES(unit),
           original_price = VALUES(original_price),
           discounted_price = VALUES(discounted_price),
           image_url = VALUES(image_url),
           is_featured = VALUES(is_featured),
           is_new_arrival = VALUES(is_new_arrival),
           is_active = VALUES(is_active),
           sort_order = VALUES(sort_order),
           updated_at = VALUES(updated_at)`,
        [
          p.id,
          p.category_id,
          p.product_code,
          p.name_en,
          p.name_ta,
          p.slug,
          p.description_en,
          p.description_ta,
          p.unit,
          p.original_price,
          p.discounted_price,
          p.image_url,
          p.is_featured,
          p.is_new_arrival,
          p.is_active,
          p.sort_order,
          p.created_at,
          p.updated_at,
        ]
      );
    }
    console.log(`products synced (${sqliteProducts.length} records)`);

    // 4. website_settings
    const sqliteSettings = sqliteDb.prepare("SELECT * FROM website_settings").all();
    for (const s of sqliteSettings) {
      await conn.query(
        `INSERT INTO website_settings (setting_key, setting_value, updated_at)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           setting_value = VALUES(setting_value),
           updated_at = VALUES(updated_at)`,
        [s.setting_key, s.setting_value, s.updated_at]
      );
    }
    console.log(`website_settings synced (${sqliteSettings.length} records)`);

    // 5. promotions
    const sqlitePromotions = sqliteDb.prepare("SELECT * FROM promotions").all();
    for (const pr of sqlitePromotions) {
      await conn.query(
        `INSERT INTO promotions (id, title, subtitle, image_url, cta_label, cta_url, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           subtitle = VALUES(subtitle),
           image_url = VALUES(image_url),
           cta_label = VALUES(cta_label),
           cta_url = VALUES(cta_url),
           sort_order = VALUES(sort_order),
           is_active = VALUES(is_active),
           updated_at = VALUES(updated_at)`,
        [pr.id, pr.title, pr.subtitle, pr.image_url, pr.cta_label, pr.cta_url, pr.sort_order, pr.is_active, pr.created_at, pr.updated_at]
      );
    }
    console.log(`promotions synced (${sqlitePromotions.length} records)`);

    // 6. gift_boxes
    const sqliteGiftBoxes = sqliteDb.prepare("SELECT * FROM gift_boxes").all();
    for (const gb of sqliteGiftBoxes) {
      await conn.query(
        `INSERT INTO gift_boxes (id, name_en, name_ta, description_en, description_ta, image_url, sort_order, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name_en = VALUES(name_en),
           name_ta = VALUES(name_ta),
           description_en = VALUES(description_en),
           description_ta = VALUES(description_ta),
           image_url = VALUES(image_url),
           sort_order = VALUES(sort_order),
           is_active = VALUES(is_active),
           updated_at = VALUES(updated_at)`,
        [gb.id, gb.name_en, gb.name_ta, gb.description_en, gb.description_ta, gb.image_url, gb.sort_order, gb.is_active, gb.created_at, gb.updated_at]
      );
    }
    console.log(`gift_boxes synced (${sqliteGiftBoxes.length} records)`);

    // 7. customers
    const sqliteCustomers = sqliteDb.prepare("SELECT * FROM customers").all();
    for (const cu of sqliteCustomers) {
      await conn.query(
        `INSERT INTO customers (id, name, phone, mobile, email, address, city, state, pincode, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           phone = VALUES(phone),
           mobile = VALUES(mobile),
           email = VALUES(email),
           address = VALUES(address),
           city = VALUES(city),
           state = VALUES(state),
           pincode = VALUES(pincode),
           updated_at = VALUES(updated_at)`,
        [cu.id, cu.name, cu.phone, cu.phone, cu.email, cu.address, cu.city, cu.state, cu.pincode, cu.created_at, cu.updated_at]
      );
    }
    console.log(`customers synced (${sqliteCustomers.length} records)`);

    // 8. estimates
    const sqliteEstimates = sqliteDb.prepare("SELECT * FROM estimates").all();
    for (const es of sqliteEstimates) {
      await conn.query(
        `INSERT INTO estimates (id, estimate_number, customer_id, subtotal, total_discount, estimated_total, status, customer_notes, admin_notes, customer_name, customer_phone, customer_email, customer_address, customer_city, customer_state, customer_pincode, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           subtotal = VALUES(subtotal),
           total_discount = VALUES(total_discount),
           estimated_total = VALUES(estimated_total),
           status = VALUES(status),
           customer_notes = VALUES(customer_notes),
           admin_notes = VALUES(admin_notes),
           customer_name = VALUES(customer_name),
           customer_phone = VALUES(customer_phone),
           customer_email = VALUES(customer_email),
           customer_address = VALUES(customer_address),
           customer_city = VALUES(customer_city),
           customer_state = VALUES(customer_state),
           customer_pincode = VALUES(customer_pincode),
           updated_at = VALUES(updated_at)`,
        [
          es.id,
          es.estimate_number,
          es.customer_id,
          es.subtotal,
          es.total_discount,
          es.estimated_total,
          es.status,
          es.customer_notes,
          es.admin_notes,
          es.customer_name,
          es.customer_phone,
          es.customer_email,
          es.customer_address,
          es.customer_city,
          es.customer_state,
          es.customer_pincode,
          es.created_at,
          es.updated_at,
        ]
      );
    }
    console.log(`estimates synced (${sqliteEstimates.length} records)`);

    // 9. estimate_items
    const sqliteEstimateItems = sqliteDb.prepare("SELECT * FROM estimate_items").all();
    for (const ei of sqliteEstimateItems) {
      await conn.query(
        `INSERT INTO estimate_items (id, estimate_id, product_id, product_code, product_name_en, product_name_ta, unit, quantity, original_unit_price, discounted_unit_price, line_total, total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           quantity = VALUES(quantity),
           product_code = VALUES(product_code),
           product_name_en = VALUES(product_name_en),
           product_name_ta = VALUES(product_name_ta),
           unit = VALUES(unit),
           original_unit_price = VALUES(original_unit_price),
           discounted_unit_price = VALUES(discounted_unit_price),
           line_total = VALUES(line_total),
           total = VALUES(total)`,
        [
          ei.id,
          ei.estimate_id,
          ei.product_id,
          ei.product_code,
          ei.product_name_en,
          ei.product_name_ta,
          ei.unit,
          ei.quantity,
          ei.original_unit_price,
          ei.discounted_unit_price,
          ei.line_total,
          ei.line_total,
        ]
      );
    }
    console.log(`estimate_items synced (${sqliteEstimateItems.length} records)`);

  } finally {
    await conn.query("SET FOREIGN_KEY_CHECKS = 1");
  }

  console.log("Migration finished successfully!");
  await conn.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

