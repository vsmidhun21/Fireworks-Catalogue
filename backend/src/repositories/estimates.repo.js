import { db, nowIso } from "../config/db.js";

function rowToCustomer(r) {
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    address: r.address,
    city: r.city,
    state: r.state,
    pincode: r.pincode,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToEstimate(r) {
  if (!r) return null;
  return {
    id: r.id,
    estimateNumber: r.estimate_number,
    customerId: r.customer_id,
    subtotal: r.subtotal,
    totalDiscount: r.total_discount,
    estimatedTotal: r.estimated_total,
    status: r.status,
    customerNotes: r.customer_notes,
    adminNotes: r.admin_notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
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
    quantity: r.quantity,
    originalUnitPrice: r.original_unit_price,
    discountedUnitPrice: r.discounted_unit_price,
    lineTotal: r.line_total,
    createdAt: r.created_at,
  };
}

export const CustomerRepo = {
  create(c) {
    const info = db
      .prepare(`INSERT INTO customers (name, phone, email, address, city, state, pincode, updated_at) VALUES (?,?,?,?,?,?,?,?)`)
      .run(c.name, c.phone, c.email || null, c.address, c.city, c.state, c.pincode, nowIso());
    return rowToCustomer(db.prepare("SELECT * FROM customers WHERE id = ?").get(Number(info.lastInsertRowid)));
  },
  findById(id) {
    return rowToCustomer(db.prepare("SELECT * FROM customers WHERE id = ?").get(id));
  },
  list({ limit = 10, offset = 0 } = {}) {
    const total = db.prepare("SELECT COUNT(*) as c FROM customers").get().c;
    const rows = db.prepare("SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?").all(limit, offset);
    const items = rows.map(rowToCustomer).map((c) => ({
      ...c,
      estimateCount: db.prepare("SELECT COUNT(*) as c FROM estimates WHERE customer_id = ?").get(c.id).c,
    }));
    return { items, total };
  },
  listAll() {
    return CustomerRepo.list({ limit: 100000, offset: 0 }).items;
  },
  findWithEstimates(id) {
    const customer = CustomerRepo.findById(id);
    if (!customer) return null;
    const estimates = db.prepare("SELECT * FROM estimates WHERE customer_id = ? ORDER BY created_at DESC").all(id).map(rowToEstimate);
    return { ...customer, estimates };
  },
};

export const EstimateRepo = {
  createWithItems({ estimateNumber, customerId, subtotal, totalDiscount, estimatedTotal, customerNotes, items }) {
    db.exec("BEGIN");
    try {
      const info = db
        .prepare(
          `INSERT INTO estimates (estimate_number, customer_id, subtotal, total_discount, estimated_total, customer_notes, updated_at)
           VALUES (?,?,?,?,?,?,?)`
        )
        .run(estimateNumber, customerId, subtotal, totalDiscount, estimatedTotal, customerNotes || null, nowIso());
      const estimateId = Number(info.lastInsertRowid);

      const insertItem = db.prepare(
        `INSERT INTO estimate_items
         (estimate_id, product_id, product_code, product_name_en, product_name_ta, unit, quantity, original_unit_price, discounted_unit_price, line_total)
         VALUES (?,?,?,?,?,?,?,?,?,?)`
      );
      for (const it of items) {
        insertItem.run(
          estimateId,
          it.productId,
          it.productCode,
          it.productNameEn,
          it.productNameTa || null,
          it.unit,
          it.quantity,
          it.originalUnitPrice,
          it.discountedUnitPrice ?? null,
          it.lineTotal
        );
      }
      db.exec("COMMIT");
      return EstimateRepo.findByIdWithDetails(estimateId);
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  },
  findByNumber(estimateNumber) {
    const estimate = rowToEstimate(db.prepare("SELECT * FROM estimates WHERE estimate_number = ?").get(estimateNumber));
    if (!estimate) return null;
    const items = db.prepare("SELECT * FROM estimate_items WHERE estimate_id = ?").all(estimate.id).map(rowToItem);
    return { ...estimate, items };
  },
  findByIdWithDetails(id) {
    const estimate = rowToEstimate(db.prepare("SELECT * FROM estimates WHERE id = ?").get(id));
    if (!estimate) return null;
    const items = db.prepare("SELECT * FROM estimate_items WHERE estimate_id = ?").all(id).map(rowToItem);
    const customer = CustomerRepo.findById(estimate.customerId);
    return { ...estimate, items, customer };
  },
  list({ status, search, limit = 20, offset = 0 } = {}) {
    const clauses = [];
    const params = [];
    let join = "JOIN customers c ON c.id = e.customer_id";
    if (status) {
      clauses.push("e.status = ?");
      params.push(status);
    }
    if (search) {
      clauses.push("(e.estimate_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
    const total = db.prepare(`SELECT COUNT(*) as c FROM estimates e ${join} ${where}`).get(...params).c;
    const rows = db
      .prepare(`SELECT e.* FROM estimates e ${join} ${where} ORDER BY e.created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset);
    const items = rows.map(rowToEstimate).map((e) => ({ ...e, customer: CustomerRepo.findById(e.customerId) }));
    return { items, total };
  },
  setStatus(id, status) {
    db.prepare("UPDATE estimates SET status=?, updated_at=? WHERE id=?").run(status, nowIso(), id);
    return EstimateRepo.findByIdWithDetails(id);
  },
  setAdminNotes(id, adminNotes) {
    db.prepare("UPDATE estimates SET admin_notes=?, updated_at=? WHERE id=?").run(adminNotes, nowIso(), id);
    return EstimateRepo.findByIdWithDetails(id);
  },
  countByStatus(statuses) {
    const placeholders = statuses.map(() => "?").join(",");
    return db.prepare(`SELECT COUNT(*) as c FROM estimates WHERE status IN (${placeholders})`).get(...statuses).c;
  },
  countAll() {
    return db.prepare("SELECT COUNT(*) as c FROM estimates").get().c;
  },
  recent(limit = 8) {
    const rows = db.prepare("SELECT * FROM estimates ORDER BY created_at DESC LIMIT ?").all(limit);
    return rows.map(rowToEstimate).map((e) => ({ ...e, customer: CustomerRepo.findById(e.customerId) }));
  },
};

export const SettingsRepo = {
  getAll() {
    const rows = db.prepare("SELECT * FROM website_settings").all();
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
  setMany(obj) {
    const stmt = db.prepare(
      `INSERT INTO website_settings (setting_key, setting_value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(setting_key) DO UPDATE SET setting_value = excluded.setting_value, updated_at = excluded.updated_at`
    );
    db.exec("BEGIN");
    try {
      for (const [key, value] of Object.entries(obj)) {
        const valToStore =
          typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : String(value ?? "");
        stmt.run(key, valToStore, nowIso());
      }
      db.exec("COMMIT");
    } catch (e) {
      db.exec("ROLLBACK");
      throw e;
    }
  },
};

