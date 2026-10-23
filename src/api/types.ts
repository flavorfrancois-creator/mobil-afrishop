export type Promo = {
  enabled?: boolean;
  promo_price?: number;
  start?: string;
  end?: string;
} | null;

export type Product = {
  id: string;
  shop_id: string;
  shop_name: string;
  currency: string;
  currency_symbol: string;
  name: string;
  short_description?: string;
  description?: string;
  image: string;
  gallery?: string[];
  category: string;
  subcategory?: string;
  stock: number;
  price_simple: number;
  shipping_fee?: number;
  promo?: Promo;
  status?: string;
  views?: number;
  sold?: number;
  display_price: number;
  is_promo?: boolean;
  promo_price?: number;
  variants?: Variant[];
};

export type Variant = {
  id: string;
  label?: string;
  price?: number;
  price_simple?: number;
  stock?: number;
  image?: string;
};

export type QuoteShop = {
  shop_id: string;
  shop_name: string;
  shop_currency?: string;
  fx_rate?: number;
  shipping_buyer?: number;
  customs_fee?: number;
};

export type Quote = {
  buyer_currency: string;
  shops: QuoteShop[];
  subtotal: number;
  shipping: number;
  customs: number;
  total_without_customs: number;
  total_with_customs: number;
};

export type DeletionRequest = { status: string } | null;

export type Category = {
  id: string;
  name: string;
  parent?: string | null;
  status?: string;
};

export type Shop = {
  id: string;
  name: string;
  owner_name?: string;
  country?: string;
  region?: string;
  city?: string;
  logo?: string;
  description?: string;
  currency?: string;
  currency_symbol?: string;
  return_policy?: string;
  sale_conditions?: string;
};

export type OrderItem = {
  product_id: string;
  name: string;
  image?: string;
  qty: number;
  unit_price: number;
  line_total: number;
};

export type Order = {
  id: string;
  ref: string;
  tracking_number?: string;
  shop_name?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  currency_symbol: string;
  status: string;
  payment_status?: string;
  created_at?: string;
  address?: string;
  delivered_confirmed?: boolean;
  status_history?: { status: string; at?: string }[];
};

export type WalletBucket = { pending: number; available: number };

export type Wallet = {
  wallets: Record<string, WalletBucket>;
  total_available: number;
  total_pending: number;
  transactions: any[];
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  country?: string;
  currency?: string;
  language?: string;
};
