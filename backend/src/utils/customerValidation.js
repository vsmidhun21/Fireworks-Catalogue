// Same customer-field rules as the public estimate endpoint (estimate.routes.js),
// packaged for the admin manual-estimate endpoint. Returns a list of error strings.
export function validateCustomerInput(customer) {
  const errors = [];
  if (!customer || typeof customer !== "object") return ["customer is required"];
  const s = (v) => String(v ?? "").trim();
  if (!s(customer.name) || !s(customer.phone) || !s(customer.address) || !s(customer.city) || !s(customer.state) || !s(customer.pincode)) {
    errors.push("name, phone, address, city, state and pincode are required");
    return errors;
  }
  if (!/^\p{L}[\p{L} .'-]{1,79}$/u.test(s(customer.name))) errors.push("name must contain letters, spaces, apostrophes or hyphens");
  if (!/^[6-9]\d{9}$/.test(s(customer.phone))) errors.push("phone must be a valid 10-digit mobile number");
  if (s(customer.alternatePhone) && !/^[6-9]\d{9}$/.test(s(customer.alternatePhone))) errors.push("alternatePhone must be a valid 10-digit mobile number");
  if (s(customer.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s(customer.email))) errors.push("email must be valid");
  if (!/^\p{L}[\p{L} .'-]{1,49}$/u.test(s(customer.city))) errors.push("city must contain letters, spaces, apostrophes or hyphens");
  if (!/^\p{L}[\p{L} .'-]{1,49}$/u.test(s(customer.state))) errors.push("state must contain letters, spaces, apostrophes or hyphens");
  if (!/^\d{6}$/.test(s(customer.pincode))) errors.push("pincode must be a 6-digit number");
  return errors;
}

export function normalizeCustomerInput(customer) {
  const s = (v) => String(v ?? "").trim();
  return {
    name: s(customer.name),
    phone: s(customer.phone),
    alternatePhone: s(customer.alternatePhone) || null,
    email: s(customer.email) || null,
    address: s(customer.address),
    city: s(customer.city),
    state: s(customer.state),
    pincode: s(customer.pincode),
  };
}
