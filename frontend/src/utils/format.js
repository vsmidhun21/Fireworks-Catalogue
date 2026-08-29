export function formatCurrency(amount) {
  if (amount == null) return "";
  return `₹${Number(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function discountPercent(original, discounted) {
  if (!discounted || discounted >= original) return 0;
  return Math.round(((original - discounted) / original) * 100);
}

export function whatsappLink(number, message = "") {
  const clean = (number || "").replace(/[^0-9]/g, "");
  const text = encodeURIComponent(message);
  return `https://wa.me/${clean}${text ? `?text=${text}` : ""}`;
}
