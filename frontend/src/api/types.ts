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
};

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
};
