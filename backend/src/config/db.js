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
  // Shared hosting MySQL (Hostinger) typically enforces a low wait_timeout.
  // A smaller pool keeps each physical connection in frequent rotation so it
  // stays "warm" and under the server's idle-timeout, instead of spreading
  // traffic across many rarely-used connections that the server silently
  // drops and mysql2 then has to re-establish (each re-establish counts
  // against max_connections_per_hour).
  connectionLimit: 5,
  maxIdle: 5,
  idleTimeout: 60000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  queueLimit: 0,
  charset: "utf8mb4",
  decimalNumbers: true,
});

// Log unexpected pool-level connection errors instead of letting them
// surface as unhandled events (which could otherwise crash the process and
// force a full restart + fresh batch of new connections).
pool.on("error", (err) => {
  console.error("[mysql pool error]", err.code || err.message);
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