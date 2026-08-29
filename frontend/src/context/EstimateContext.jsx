import { createContext, useContext, useEffect, useMemo, useState } from "react";

const EstimateContext = createContext(null);
const STORAGE_KEY = "rr_estimate_items";

export function EstimateProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(product, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          nameEn: product.nameEn,
          nameTa: product.nameTa,
          unit: product.unit,
          imageUrl: product.imageUrl,
          originalPrice: product.originalPrice,
          discountedPrice: product.discountedPrice,
          quantity,
        },
      ];
    });
  }

  function updateQuantity(productId, quantity) {
    setItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: Math.max(1, quantity) } : i))
    );
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }

  function clear() {
    setItems([]);
  }

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, i) => sum + i.originalPrice * i.quantity, 0);
    const estimatedTotal = items.reduce((sum, i) => sum + (i.discountedPrice ?? i.originalPrice) * i.quantity, 0);
    return { subtotal, estimatedTotal, discount: subtotal - estimatedTotal, count: items.reduce((s, i) => s + i.quantity, 0) };
  }, [items]);

  return (
    <EstimateContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, totals }}>
      {children}
    </EstimateContext.Provider>
  );
}

export function useEstimate() {
  const ctx = useContext(EstimateContext);
  if (!ctx) throw new Error("useEstimate must be used within EstimateProvider");
  return ctx;
}
