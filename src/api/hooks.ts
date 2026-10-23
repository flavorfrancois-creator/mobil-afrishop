import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "./client";
import { Category, DeletionRequest, Order, Product, Quote, Shop, Wallet } from "./types";

export function useProducts(params?: {
  category?: string;
  promo?: number;
  shop_id?: string;
}) {
  return useQuery({
    queryKey: ["products", params ?? {}],
    queryFn: async () => {
      const data = await apiFetch<{ products: Product[] }>("/products", { params });
      return data.products ?? [];
    },
  });
}

export function useProduct(id?: string) {
  return useQuery({
    queryKey: ["product", id],
    enabled: !!id,
    queryFn: async () => {
      const data = await apiFetch<{ product: Product }>(`/products/${id}`);
      return data.product;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const data = await apiFetch<{ categories: Category[] }>("/categories");
      return (data.categories ?? []).filter((c) => !c.parent);
    },
  });
}

export function useShops() {
  return useQuery({
    queryKey: ["shops"],
    queryFn: async () => {
      const data = await apiFetch<{ shops: Shop[] }>("/shops");
      return data.shops ?? [];
    },
  });
}

export function useShop(id?: string) {
  return useQuery({
    queryKey: ["shop", id],
    enabled: !!id,
    queryFn: async () => {
      const data = await apiFetch<{ shop: Shop }>(`/shops/${id}`);
      return data.shop;
    },
  });
}

export function useOrders(enabled: boolean) {
  return useQuery({
    queryKey: ["orders"],
    enabled,
    queryFn: async () => {
      const data = await apiFetch<{ orders: Order[] }>("/orders/mine");
      return data.orders ?? [];
    },
  });
}

export function useQuote(items: { product_id: string; qty: number; variant_id: string | null }[]) {
  return useQuery({
    queryKey: ["quote", items],
    enabled: items.length > 0,
    retry: false,
    queryFn: async () => apiFetch<Quote>("/orders/quote", { method: "POST", body: { items } }),
  });
}

export function useDeletionRequest(enabled: boolean) {
  return useQuery({
    queryKey: ["deletion"],
    enabled,
    queryFn: async () => {
      const data = await apiFetch<{ request: DeletionRequest }>("/account/deletion");
      return data.request ?? null;
    },
  });
}

export function useWallet(enabled: boolean) {
  return useQuery({
    queryKey: ["wallet"],
    enabled,
    queryFn: async () => apiFetch<Wallet>("/wallet"),
  });
}
