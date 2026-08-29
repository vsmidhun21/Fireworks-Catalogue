export function ok(res, data, message = "Success", status = 200) {
  return res.status(status).json({ success: true, data, message });
}

export function fail(res, message = "Error", status = 400, errors = []) {
  return res.status(status).json({ success: false, message, errors });
}

export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function generateEstimateNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 89999);
  return `RR-${year}-${rand}`;
}
