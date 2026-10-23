export function formatAmount(amount: number): string {
  const rounded = Math.round(amount);
  // Group thousands with a thin space (common in FR currency formatting)
  return rounded.toLocaleString("fr-FR").replace(/\u202f/g, "\u00a0");
}

export function formatPrice(amount: number, symbol: string): string {
  return `${formatAmount(amount)}\u00a0${symbol}`;
}
