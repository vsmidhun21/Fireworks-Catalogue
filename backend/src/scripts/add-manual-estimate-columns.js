// Idempotent alternative to migrations/001_manual_estimates.sql.
// Usage (from /backend, with .env configured):  node src/scripts/add-manual-estimate-columns.js
import mysql from "mysql2/promise";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../.env") });

const conn = await mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
});

try {
  const [rows] = await conn.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'estimates'",
    [process.env.DB_NAME]
  );
  const cols = rows.map((r) => r.COLUMN_NAME.toLowerCase());
  if (!cols.includes("discount_percent")) {
    await conn.query("ALTER TABLE estimates ADD COLUMN discount_percent DECIMAL(5,2) NULL DEFAULT NULL");
    console.log("Added estimates.discount_percent");
  }
  if (!cols.includes("source")) {
    await conn.query("ALTER TABLE estimates ADD COLUMN source VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER'");
    console.log("Added estimates.source");
  }
  console.log("Manual-estimate columns are in place.");
} finally {
  await conn.end();
}
