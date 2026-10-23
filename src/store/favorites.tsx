import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { Product } from "@/src/api/types";
import { STORAGE_KEYS } from "@/src/config";
import { storage } from "@/src/utils/storage";

type FavoritesContextValue = {
  favorites: Product[];
  isFavorite: (id: string) => boolean;
  toggle: (product: Product) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const saved = await storage.getItem<any>(STORAGE_KEYS.favorites, []);
      if (Array.isArray(saved)) setFavorites(saved);
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (hydrated) storage.setItem(STORAGE_KEYS.favorites, favorites as any);
  }, [favorites, hydrated]);

  const isFavorite = useCallback((id: string) => favorites.some((p) => p.id === id), [favorites]);

  const toggle = useCallback((product: Product) => {
    setFavorites((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [
            {
              id: product.id,
              shop_id: product.shop_id,
              shop_name: product.shop_name,
              currency: product.currency,
              currency_symbol: product.currency_symbol,
              name: product.name,
              image: product.image,
              category: product.category,
              stock: product.stock,
              price_simple: product.price_simple,
              display_price: product.display_price,
              promo_price: product.promo_price,
              is_promo: product.is_promo,
            },
            ...prev,
          ],
    );
  }, []);

  const value = useMemo(() => ({ favorites, isFavorite, toggle }), [favorites, isFavorite, toggle]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
