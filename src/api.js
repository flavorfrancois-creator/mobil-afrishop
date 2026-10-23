export const API_URL = "https://africashop.win/api";
export const MOBILE_API_URL = `${API_URL}/mobile`;

export async function apiFetch(path, options = {}, token, mobile = false) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const body =
    options.body && typeof options.body !== "string"
      ? JSON.stringify(options.body)
      : options.body;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(`${mobile ? MOBILE_API_URL : API_URL}${path}`, {
      ...options,
      headers,
      body,
      signal: options.signal || controller.signal,
    });
    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : {};

    if (!response.ok) {
      const message =
        data.detail || data.message || `La requête a échoué (${response.status}).`;
      const error = new Error(
        typeof message === "string" ? message : JSON.stringify(message)
      );
      error.status = response.status;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

export function money(value, currency = "") {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return `0.00 ${currency}`.trim();
  return `${new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)} ${currency}`.trim();
}

export function productPrice(product, variant) {
  if (variant) {
    return Number(
      variant.price_simple ??
        variant.price ??
        product.display_price ??
        product.promo_price ??
        0
    );
  }
  return Number(
    product.is_promo
      ? product.promo_price ?? product.display_price ?? 0
      : product.display_price ?? 0
  );
}
