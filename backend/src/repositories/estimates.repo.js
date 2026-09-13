import { db, nowIso } from "../config/db.js";
import { generateEstimateNumber } from "../utils/response.js";

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
    // Point-in-time snapshot of the customer's details exactly as they were
    // when this estimate was submitted — NOT a live lookup against the
    // (mutable, phone-keyed) `customers` table. This mirrors how
    // estimate_items snapshots product name/price so a later product edit
    // can never silently rewrite a past estimate; the same protection now
    // applies to the customer's name/address/etc. Falls back to the live
    // customer record only for legacy rows that somehow have no snapshot
    // (should not happen after the startup backfill migration in db.js).
    customer:
      r.customer_name != null
        ? {
            id: r.customer_id,
            name: r.customer_name,
            phone: r.customer_phone,
            email: r.customer_email,
            address: r.customer_address,
            city: r.customer_city,
            state: r.customer_state,
            pincode: r.customer_pincode,
          }
        : CustomerRepo.findById(r.customer_id),
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

/**
 * Generates an estimate number that does not already exist in the database,
 * retrying with a fresh random candidate a few times before giving up.
 *
 * This is a pre-check, not a hard guarantee — see the comment on
 * `EstimateRepo.createWithItems` for the second layer of protection
 * (catching the UNIQUE constraint at insert time) that closes the small
 * remaining race window between this check and the actual INSERT.
 */
function generateUniqueEstimateNumber({ maxAttempts = 10 } = {}) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const candidate = generateEstimateNumber();
    const exists = db.prepare("SELECT 1 FROM estimates WHERE estimate_number = ?").get(candidate);
    if (!exists) return candidate;
  }
  // Extremely unlikely fallback if every one of maxAttempts random 5-digit
  // candidates for the current year was already taken: widen the number
  // space with a millisecond-resolution timestamp suffix instead of a
  // 5-digit random draw. Still passed through the same insert-time
  // collision retry in createWithItems as a final safety net.
  const year = new Date().getFullYear();
  return `RR-${year}-${Date.now().toString().slice(-8)}`;
}

export const CustomerRepo = {
  /**
   * Upserts the master customer record keyed by phone number, so the admin
   * Customers page always reflects the latest known contact details for a
   * repeat customer (useful for outreach/CRM purposes).
   *
   * IMPORTANT: this intentionally does NOT affect what a past estimate
   * displays. Each estimate stores its own point-in-time snapshot of the
   * customer's name/address/etc. in the `estimates.customer_*` columns
   * (see EstimateRepo.createWithItems / rowToEstimate), so a later update
   * here — e.g. a repeat customer moving house, or a family member reusing
   * the same phone number with a different name for a different order —
   * can no longer retroactively change what an admin sees on an already
   * placed, possibly already-fulfilled, estimate.
   */
  create(c) {
    const phone = String(c.phone).trim();
    const existing = db.prepare("SELECT id FROM customers WHERE phone = ?").get(phone);
    if (existing) {
      db
        .prepare(
          `UPDATE customers
           SET name=?, email=?, address=?, city=?, state=?, pincode=?, updated_at=?
           WHERE id=?`
        )
        .run(c.name, c.email || null, c.address, c.city, c.state, c.pincode, nowIso(), existing.id);
      return rowToCustomer(db.prepare("SELECT * FROM customers WHERE id = ?").get(existing.id));
    }

    const info = db
      .prepare(`INSERT INTO customers (name, phone, email, address, city, state, pincode, updated_at) VALUES (?,?,?,?,?,?,?,?)`)
      .run(c.name, phone, c.email || null, c.address, c.city, c.state, c.pincode, nowIso());
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
  /**
   * Creates an estimate + its line items in one transaction, and assigns
   * the estimate_number itself (rather than trusting a pre-generated value
   * from the caller). This closes two gaps together:
   *
   *  1. `estimate_number` has a UNIQUE NOT NULL constraint, but the old
   *     "RR-<year>-<5-digit random>" scheme (only 90,000 values/year) had
   *     no existence pre-check and no retry — a collision surfaced to the
   *     customer as a raw 500 error despite their estimate data being
   *     perfectly valid. `generateUniqueEstimateNumber()` below pre-checks
   *     for an existing row and retries with a fresh candidate a few times.
   *  2. Even with a pre-check, a same-millisecond race between the SELECT
   *     and the INSERT (or, in a future multi-process deployment behind a
   *     load balancer, a genuinely concurrent request) could still collide.
   *     The whole insert is therefore wrapped in its own retry loop that
   *     catches the specific "UNIQUE constraint failed: estimates.estimate_number"
   *     error, rolls back, generates a new number, and tries again — a
   *     customer only ever sees a failure if every attempt is exhausted.
   */
  createWithItems({ customerId, customerSnapshot, subtotal, totalDiscount, estimatedTotal, customerNotes, items }) {
    const MAX_ATTEMPTS = 5;
    let lastError;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const estimateNumber = generateUniqueEstimateNumber();
      db.exec("BEGIN");
      try {
        const info = db
          .prepare(
            `INSERT INTO estimates
             (estimate_number, customer_id, subtotal, total_discount, estimated_total, customer_notes,
              customer_name, customer_phone, customer_email, customer_address, customer_city, customer_state, customer_pincode,
              updated_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
          )
          .run(
            estimateNumber,
            customerId,
            subtotal,
            totalDiscount,
            estimatedTotal,
            customerNotes || null,
            customerSnapshot.name,
            customerSnapshot.phone,
            customerSnapshot.email || null,
            customerSnapshot.address,
            customerSnapshot.city,
            customerSnapshot.state,
            customerSnapshot.pincode,
            nowIso()
          );
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
        const isEstimateNumberCollision = /UNIQUE constraint failed:\s*estimates\.estimate_number/i.test(e.message || "");
        if (isEstimateNumberCollision && attempt < MAX_ATTEMPTS) {
          lastError = e;
          console.warn(`[Estimate] estimate_number collision on attempt ${attempt} (${estimateNumber}); retrying with a new number.`);
          continue;
        }
        throw e;
      }
    }
    // Unreachable in practice (the loop always returns or throws), but
    // keeps the function's control flow explicit for readers/linters.
    throw lastError;
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
    // estimate.customer is already the point-in-time snapshot from
    // rowToEstimate — no live CustomerRepo lookup here on purpose.
    return { ...estimate, items };
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
    // Note: the "c"/customers join above is only used to search/filter by
    // the customer's *current* name/phone (so old estimates stay findable
    // even after a customer updates their details) — the returned
    // estimate.customer itself still comes from rowToEstimate's snapshot.
    const items = rows.map(rowToEstimate);
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
    return rows.map(rowToEstimate);
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

