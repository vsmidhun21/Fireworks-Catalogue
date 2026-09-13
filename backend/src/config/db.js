import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  decimalNumbers: true,
});

export const db = {
  pool,
  prepare(sql) {
    return {
      async get(...args) {
        const params = args.flat();
        const [rows] = await pool.query(sql, params);
        return rows && rows.length > 0 ? rows[0] : null;
      },
      async all(...args) {
        const params = args.flat();
        const [rows] = await pool.query(sql, params);
        return rows || [];
      },
      async run(...args) {
        const params = args.flat();
        const [result] = await pool.query(sql, params);
        return {
          lastInsertRowid: result.insertId,
          changes: result.affectedRows,
        };
      },
    };
  },
  async query(sql, params = []) {
    const [rows] = await pool.query(sql, params);
    return rows;
  },
  async execute(sql, params = []) {
    const [result] = await pool.query(sql, params);
    return result;
  },
};

export function nowIso() {
  return new Date();
}