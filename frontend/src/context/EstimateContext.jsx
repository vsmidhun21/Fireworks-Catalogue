import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useSettings } from "./SettingsContext";
import { calcDiscountedPrice, globalDiscountPercent } from "../utils/format";

const EstimateContext = createContext(null);
const STORAGE_KEY = "rr_estimate_items";

export function EstimateProvider({ children }) {
  const { settings } = useSettings();
  const discountPct = globalDiscountPercent(settings);
  const [storedItems, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedItems));
  }, [storedItems]);

  // Unit offer prices are always derived from the original price and the
  // current global discount, so a changed setting never leaves stale cart prices.
  const items = useMemo(
    () => storedItems.map((i) => ({ ...i, discountedPrice: calcDiscountedPrice(i.originalPrice, discountPct) })),
    [storedItems, discountPct]
  );

  const MIN_ORDER_AMOUNT = 3000;

  function addItem(product, quantity = 1) {
    setItems((prev) => {
      const unitDiscounted = calcDiscountedPrice(product.originalPrice, discountPct);
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + quantity, originalPrice: product.originalPrice, discountedPrice: unitDiscounted } : i));
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
    const estimatedTotal = items.reduce((sum, i) => sum + i.discountedPrice * i.quantity, 0);
    // Admin-configured global discount (Admin Settings)
    const discountPercent = discountPct;
    const discount = subtotal - estimatedTotal;
    const isMinOrderMet = estimatedTotal >= MIN_ORDER_AMOUNT;
    const amountNeededForMinOrder = Math.max(0, MIN_ORDER_AMOUNT - estimatedTotal);

    return {
      subtotal,
      estimatedTotal,
      discount,
      discountPercent,
      count: items.reduce((s, i) => s + i.quantity, 0),
      minOrderAmount: MIN_ORDER_AMOUNT,
      isMinOrderMet,
      amountNeededForMinOrder,
    };
  }, [items, discountPct]);

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
