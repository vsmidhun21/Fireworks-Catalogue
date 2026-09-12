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

  const MIN_ORDER_AMOUNT = 3000;

  function addItem(product, quantity = 1) {
    setItems((prev) => {
      const unitDiscounted = product.discountedPrice != null ? product.discountedPrice : Math.round(product.originalPrice * 0.10);
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + quantity, discountedPrice: unitDiscounted } : i));
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
          discountedPrice: unitDiscounted,
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
    const estimatedTotal = items.reduce(
      (sum, i) => sum + (i.discountedPrice != null ? i.discountedPrice : Math.round(i.originalPrice * 0.10)) * i.quantity,
      0
    );
    const discount = subtotal - estimatedTotal;
    const isMinOrderMet = estimatedTotal >= MIN_ORDER_AMOUNT;
    const amountNeededForMinOrder = Math.max(0, MIN_ORDER_AMOUNT - estimatedTotal);

    return {
      subtotal,
      estimatedTotal,
      discount,
      count: items.reduce((s, i) => s + i.quantity, 0),
      minOrderAmount: MIN_ORDER_AMOUNT,
      isMinOrderMet,
      amountNeededForMinOrder,
    };
  }, [items]);

  return (
    <EstimateContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, totals, MIN_ORDER_AMOUNT }}>
      {children}
    </EstimateContext.Provider>
  );
}

export function useEstimate() {
  const ctx = useContext(EstimateContext);
  if (!ctx) throw new Error("useEstimate must be used within EstimateProvider");
  return ctx;
}
