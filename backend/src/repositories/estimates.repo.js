import { db, nowIso } from "../config/db.js";
import { generateEstimateNumber } from "../utils/response.js";

function rowToCustomer(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    phone: r.phone || r.mobile,
    alternatePhone: r.alternate_phone || null,
    email: r.email,
    address: r.address,
    city: r.city,
    state: r.state,
    pincode: r.pincode,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function rowToEstimate(r) {
  if (!r) return null;
  let customerObj = null;
  if (r.customer_name != null) {
    customerObj = {
      id: r.customer_id,
      name: r.customer_name,
      phone: r.customer_phone,
      alternatePhone: r.customer_alternate_phone || null,
      email: r.customer_email,
      address: r.customer_address,
      city: r.customer_city,
      state: r.customer_state,
      pincode: r.customer_pincode,
    };
  } else if (r.customer_id) {
    customerObj = await CustomerRepo.findById(r.customer_id);
  }

  return {
    id: r.id,
    estimateNumber: r.estimate_number,
    customerId: r.customer_id,
    subtotal: Number(r.subtotal || 0),
    totalDiscount: Number(r.total_discount || 0),
    estimatedTotal: Number(r.estimated_total || 0),
    status: r.status,
    customerNotes: r.customer_notes,
    adminNotes: r.admin_notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    customer: customerObj,
  };
}

function rowToItem(r) {
  if (!r) return null;
  return {
    id: r.id,
    estimateId: r.estimate_id,
    productId: r.product_id,
    productCode: r.product_code,
    productNameEn: r.product_name_en,
    productNameTa: r.product_name_ta,
    unit: r.unit,
    quantity: Number(r.quantity || 0),
    originalUnitPrice: Number(r.original_unit_price != null ? r.original_unit_price : r.original_price_at_time || 0),
    discountedUnitPrice: r.discounted_unit_price != null ? Number(r.discounted_unit_price) : (r.discounted_price_at_time != null ? Number(r.discounted_price_at_time) : null),
    lineTotal: Number(r.line_total != null ? r.line_total : r.total || 0),
    createdAt: r.created_at,
  };
}

async function generateUniqueEstimateNumber({ maxAttempts = 10 } = {}) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const candidate = generateEstimateNumber();
    const exists = await db.prepare("SELECT 1 FROM estimates WHERE estimate_number = ?").get(candidate);
    if (!exists) return candidate;
  }
  const year = new Date().getFullYear();
  return `RR-${year}-${Date.now().toString().slice(-8)}`;
}

export const CustomerRepo = {
  async create(c) {
    const phone = String(c.phone).trim();
    const alternatePhone = c.alternatePhone ? String(c.alternatePhone).trim() : null;
    const existing = await db.prepare("SELECT id FROM customers WHERE phone = ? OR mobile = ?").get(phone, phone);
    if (existing) {
      await db
        .prepare(
          `UPDATE customers
           SET name=?, email=?, address=?, city=?, state=?, pincode=?, phone=?, mobile=?, alternate_phone=?, updated_at=?
           WHERE id=?`
        )
        .run(c.name, c.email || null, c.address, c.city, c.state, c.pincode, phone, phone, alternatePhone, nowIso(), existing.id);
      const row = await db.prepare("SELECT * FROM customers WHERE id = ?").get(existing.id);
      return rowToCustomer(row);
    }

    const info = await db
      .prepare(`INSERT INTO customers (name, phone, mobile, alternate_phone, email, address, city, state, pincode, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`)
      .run(c.name, phone, phone, alternatePhone, c.email || null, c.address, c.city, c.state, c.pincode, nowIso());
    const row = await db.prepare("SELECT * FROM customers WHERE id = ?").get(Number(info.lastInsertRowid));
    return rowToCustomer(row);
  },
  async findById(id) {
    const row = await db.prepare("SELECT * FROM customers WHERE id = ?").get(id);
    return rowToCustomer(row);
  },
  async list({ limit = 10, offset = 0 } = {}) {
    const totalRow = await db.prepare("SELECT COUNT(*) as c FROM customers").get();
    const total = Number(totalRow?.c || 0);
    const rows = await db.prepare("SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?").all(Number(limit), Number(offset));
    const items = await Promise.all(
      rows.map(rowToCustomer).map(async (c) => {
        const estCountRow = await db.prepare("SELECT COUNT(*) as c FROM estimates WHERE customer_id = ?").get(c.id);
        return {
          ...c,
          estimateCount: Number(estCountRow?.c || 0),
        };
      })
    );
    return { items, total };
  },
  async listAll() {
    const res = await CustomerRepo.list({ limit: 100000, offset: 0 });
    return res.items;
  },
  async findWithEstimates(id) {
    const customer = await CustomerRepo.findById(id);
    if (!customer) return null;
    const estRows = await db.prepare("SELECT * FROM estimates WHERE customer_id = ? ORDER BY created_at DESC").all(id);
    const estimates = await Promise.all(estRows.map(rowToEstimate));
    return { ...customer, estimates };
  },
};

export const EstimateRepo = {
  async createWithItems({ customerId, customerSnapshot, subtotal, totalDiscount, estimatedTotal, customerNotes, items }) {
    const MAX_ATTEMPTS = 5;
    let lastError;
    const conn = await db.pool.getConnection();

    try {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const estimateNumber = await generateUniqueEstimateNumber();
        await conn.beginTransaction();
        try {
          const [info] = await conn.query(
            `INSERT INTO estimates
             (estimate_number, customer_id, subtotal, total_discount, estimated_total, customer_notes,
              customer_name, customer_phone, customer_alternate_phone, customer_email, customer_address, customer_city, customer_state, customer_pincode,
              updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
              estimateNumber,
              customerId,
              subtotal,
              totalDiscount,
              estimatedTotal,
              customerNotes || null,
              customerSnapshot.name,
              customerSnapshot.phone,
              customerSnapshot.alternatePhone || null,
              customerSnapshot.email || null,
              customerSnapshot.address,
              customerSnapshot.city,
              customerSnapshot.state,
              customerSnapshot.pincode,
              nowIso(),
            ]
          );
          const estimateId = Number(info.insertId);

          for (const it of items) {
            await conn.query(
              `INSERT INTO estimate_items
               (estimate_id, product_id, product_code, product_name_en, product_name_ta, unit, quantity, original_unit_price, discounted_unit_price, line_total, original_price_at_time, discounted_price_at_time, total)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
              [
                estimateId,
                it.productId,
                it.productCode,
                it.productNameEn,
                it.productNameTa || null,
                it.unit,
                it.quantity,
                it.originalUnitPrice,
                it.discountedUnitPrice ?? null,
                it.lineTotal,
                it.originalUnitPrice,
                it.discountedUnitPrice ?? null,
                it.lineTotal,
              ]
            );
          }
          await conn.commit();
          return await EstimateRepo.findByIdWithDetails(estimateId);
        } catch (e) {
          await conn.rollback();
          const isCollision = e.code === "ER_DUP_ENTRY" || /duplicate entry/i.test(e.message || "") || /UNIQUE constraint failed/i.test(e.message || "");
          if (isCollision && attempt < MAX_ATTEMPTS) {
            lastError = e;
            console.warn(`[Estimate] estimate_number collision on attempt ${attempt} (${estimateNumber}); retrying with a new number.`);
            continue;
          }
          throw e;
        }
      }
      throw lastError;
    } finally {
      conn.release();
    }
  },
  async findByNumber(estimateNumber) {
    const row = await db.prepare("SELECT * FROM estimates WHERE estimate_number = ?").get(estimateNumber);
    const estimate = await rowToEstimate(row);
    if (!estimate) return null;
    const itemRows = await db.prepare("SELECT * FROM estimate_items WHERE estimate_id = ?").all(estimate.id);
    const items = itemRows.map(rowToItem);
    return { ...estimate, items };
  },
  async findByIdWithDetails(id) {
    const row = await db.prepare("SELECT * FROM estimates WHERE id = ?").get(id);
    const estimate = await rowToEstimate(row);
    if (!estimate) return null;
    const itemRows = await db.prepare("SELECT * FROM estimate_items WHERE estimate_id = ?").all(id);
    const items = itemRows.map(rowToItem);
    return { ...estimate, items };
  },
  async list({ status, search, limit = 20, offset = 0 } = {}) {
    const clauses = [];
    const params = [];
    let join = "JOIN customers c ON c.id = e.customer_id";
    if (status) {
      clauses.push("e.status = ?");
      params.push(status);
    }
    if (search) {
      clauses.push("(e.estimate_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR c.mobile LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const totalRow = await db.prepare(`SELECT COUNT(*) as c FROM estimates e ${join} ${where}`).get(...params);
    const total = Number(totalRow?.c || 0);
    const rows = await db
      .prepare(`SELECT e.* FROM estimates e ${join} ${where} ORDER BY e.created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, Number(limit), Number(offset));
    const items = await Promise.all(rows.map(rowToEstimate));
    return { items, total };
  },
  async setStatus(id, status) {
    await db.prepare("UPDATE estimates SET status=?, updated_at=? WHERE id=?").run(status, nowIso(), id);
    return await EstimateRepo.findByIdWithDetails(id);
  },
  async setAdminNotes(id, adminNotes) {
    await db.prepare("UPDATE estimates SET admin_notes=?, updated_at=? WHERE id=?").run(adminNotes, nowIso(), id);
    return await EstimateRepo.findByIdWithDetails(id);
  },
  async countByStatus(statuses) {
    if (!statuses.length) return 0;
    const placeholders = statuses.map(() => "?").join(",");
    const row = await db.prepare(`SELECT COUNT(*) as c FROM estimates WHERE status IN (${placeholders})`).get(...statuses);
    return Number(row?.c || 0);
  },
  async countAll() {
    const row = await db.prepare("SELECT COUNT(*) as c FROM estimates").get();
    return Number(row?.c || 0);
  },
  async recent(limit = 8) {
    const rows = await db.prepare("SELECT * FROM estimates ORDER BY created_at DESC LIMIT ?").all(Number(limit));
    return await Promise.all(rows.map(rowToEstimate));
  },
};

export const SettingsRepo = {
  async getAll() {
    const rows = await db.prepare("SELECT * FROM website_settings").all();
    const result = {};
    for (const r of rows) {
      let val = r.setting_value;
      if (typeof val === "string" && (val.startsWith("[") || val.startsWith("{"))) {
        try {
          val = JSON.parse(val);
        } catch {
          // keep as raw string if JSON parsing fails
        }
      }
      result[r.setting_key] = val;
    }
    return result;
  },
  async setMany(obj) {
    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();
      for (const [key, value] of Object.entries(obj)) {
        const valToStore =
          typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : String(value ?? "");
        await conn.query(
          `INSERT INTO website_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = VALUES(updated_at)`,
          [key, valToStore, nowIso()]
        );
      }
      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },
};
