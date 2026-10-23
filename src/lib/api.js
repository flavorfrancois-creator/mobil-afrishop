const MAIN_API_BASE_URL = "https://africashop.win/api";
const MOBILE_API_BASE_URL = "https://africashop.win/api/mobile";

export function formatMoney(value, currency) {
  const amount = Number(value || 0);
  return `${amount.toFixed(2)} ${currency || ""}`.trim();
}

export function productPrice(product, selectedVariant = null) {
  if (selectedVariant) {
    return Number(
      selectedVariant.price_simple ??
        selectedVariant.price ??
        product.display_price ??
        product.promo_price ??
        0
    );
  }
  if (product.is_promo && product.promo_price !== undefined) {
    return Number(product.promo_price);
  }
  return Number(product.display_price ?? 0);
}

export async function apiFetch(path, options = {}, token, base = "main") {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const body =
    options.body && typeof options.body !== "string"
      ? JSON.stringify(options.body)
      : options.body;

  const response = await fetch(
    `${base === "mobile" ? MOBILE_API_BASE_URL : MAIN_API_BASE_URL}${path}`,
    {
      ...options,
      headers,
      body,
    }
  );

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || data.message || "Request failed");
  }
  return data;
}
