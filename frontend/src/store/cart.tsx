import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { Product } from "@/src/api/types";
import { STORAGE_KEYS } from "@/src/config";
import { storage } from "@/src/utils/storage";

export type CartLine = {
  id: string;
  name: string;
  image: string;
  shop_id: string;
  shop_name: string;
  currency_symbol: string;
  unit_price: number;
  shipping_fee: number;
  qty: number;
  stock: number;
};

export type CurrencyGroup = {
  symbol: string;
  subtotal: number;
  lines: CartLine[];
};

type CartContextValue = {
  lines: CartLine[];
  count: number;
  add: (product: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  groups: CurrencyGroup[];
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<CartLine[]>(STORAGE_KEYS.cart, []);
      if (Array.isArray(saved)) setLines(saved);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (hydrated) storage.setItem(STORAGE_KEYS.cart, lines);
  }, [lines, hydrated]);

  const add = useCallback((product: Product, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.id === product.id);
      const price = product.display_price ?? product.price_simple;
      if (existing) {
        return prev.map((l) =>
          l.id === product.id
            ? { ...l, qty: Math.min(l.qty + qty, Math.max(1, product.stock)) }
            : l,
        );
      }
      const line: CartLine = {
        id: product.id,
        name: product.name,
        image: product.image,
        shop_id: product.shop_id,
        shop_name: product.shop_name,
        currency_symbol: product.currency_symbol,
        unit_price: price,
        shipping_fee: product.shipping_fee ?? 0,
        qty,
        stock: product.stock,
      };
      return [...prev, line];
    });
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    setLines((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: Math.max(0, Math.min(qty, l.stock || qty)) } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = useMemo(() => lines.reduce((sum, l) => sum + l.qty, 0), [lines]);

  const groups = useMemo<CurrencyGroup[]>(() => {
    const map = new Map<string, CurrencyGroup>();
    for (const l of lines) {
      const g = map.get(l.currency_symbol) ?? { symbol: l.currency_symbol, subtotal: 0, lines: [] };
      g.subtotal += l.unit_price * l.qty;
      g.lines.push(l);
      map.set(l.currency_symbol, g);
    }
    return Array.from(map.values());
  }, [lines]);

  const value = useMemo(
    () => ({ lines, count, add, setQty, remove, clear, groups }),
    [lines, count, add, setQty, remove, clear, groups],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
