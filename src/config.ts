const BACKEND = (process.env.EXPO_PUBLIC_BACKEND_URL || "https://africashop.win").replace(/\/+$/, "");

// The production website proxies this API path to its FastAPI application.
export const API_BASE = `${BACKEND}/api`;

export const STORAGE_KEYS = {
  token: "afrishop_token",
  user: "afrishop_user",
  cart: "afrishop_cart_v1",
  language: "afrishop_language",
  favorites: "afrimarket_favorites",
  biometric: "afrimarket_biometric_login",
  address: "afrimarket_delivery_address",
} as const;
