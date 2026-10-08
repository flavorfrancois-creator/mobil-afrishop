const BACKEND = process.env.EXPO_PUBLIC_BACKEND_URL;

const normalizedBackend = BACKEND?.replace(/\/$/, "");
export const API_BASE =
  normalizedBackend === "https://africashop.win"
    ? `${normalizedBackend}/api`
    : `${normalizedBackend}/api/afm`;

export const STORAGE_KEYS = {
  token: "afrishop_token",
  user: "afrishop_user",
  cart: "afrishop_cart_v1",
  language: "afrishop_language",
} as const;
