const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL;

// All marketplace calls go through our same-origin proxy -> africashop.win/api
export const API_BASE = `${BACKEND}/api/afm`;

export const STORAGE_KEYS = {
  token: "afrishop_token",
  user: "afrishop_user",
  cart: "afrishop_cart_v1",
  language: "afrishop_language",
} as const;
