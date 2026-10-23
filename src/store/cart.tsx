import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { Product, Variant } from "@/src/api/types";
import { STORAGE_KEYS } from "@/src/config";
import { storage } from "@/src/utils/storage";

export type CartLine = {
  id: string; // line key: product id, or "productId:variantId"
  product_id: string;
  variant_id: string | null;
  variant_label: string;
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
  add: (product: Product, qty?: number, variant?: Variant | null) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  groups: CurrencyGroup[];
  payload: { product_id: string; qty: number; variant_id: string | null }[];
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function variantPrice(product: Product, variant?: Variant | null) {
  if (variant) return Number(variant.price_simple ?? variant.price ?? product.display_price ?? 0);
  return Number(
    product.is_promo
      ? (product.promo_price ?? product.display_price ?? 0)
      : (product.display_price ?? product.price_simple ?? 0),
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<any>(STORAGE_KEYS.cart, []);
      if (Array.isArray(saved)) {
        // Older carts stored the product id as the line id with no variant.
        setLines(
          saved.map((l: any) => ({
            ...l,
            product_id: l.product_id ?? l.id,
            variant_id: l.variant_id ?? null,
            variant_label: l.variant_label ?? "",
          })),
        );
      }
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (hydrated) storage.setItem(STORAGE_KEYS.cart, lines as any);
  }, [lines, hydrated]);

  const add = useCallback((product: Product, qty = 1, variant: Variant | null = null) => {
    const key = variant ? `${product.id}:${variant.id}` : product.id;
    const stock = Number(variant?.stock ?? product.stock ?? 0);
    setLines((prev) => {
      const existing = prev.find((l) => l.id === key);
      if (existing) {
        return prev.map((l) =>
          l.id === key ? { ...l, qty: Math.min(l.qty + qty, Math.max(1, stock)) } : l,
        );
      }
      const line: CartLine = {
        id: key,
        product_id: product.id,
        variant_id: variant?.id ?? null,
        variant_label: variant?.label ?? "",
        name: product.name,
        image: variant?.image || product.image,
        shop_id: product.shop_id,
        shop_name: product.shop_name,
        currency_symbol: product.currency_symbol,
        unit_price: variantPrice(product, variant),
        shipping_fee: product.shipping_fee ?? 0,
        qty: Math.min(qty, Math.max(1, stock)),
        stock,
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

  const payload = useMemo(
    () => lines.map((l) => ({ product_id: l.product_id, qty: l.qty, variant_id: l.variant_id })),
    [lines],
  );

  const value = useMemo(
    () => ({ lines, count, add, setQty, remove, clear, groups, payload }),
    [lines, count, add, setQty, remove, clear, groups, payload],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
