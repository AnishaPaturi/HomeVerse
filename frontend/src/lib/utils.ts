/**
 * General utility functions
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number = 0, currency = "INR"): string {
  const safeAmount = isNaN(amount) ? 0 : amount;
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(safeAmount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(safeAmount);
}

export function formatIndianBudget(amount?: number): string {
  const safeAmount = amount === undefined || amount === null || isNaN(amount) ? 0 : amount;
  if (safeAmount >= 10000000) {
    const cr = safeAmount / 10000000;
    return `₹${cr % 1 === 0 ? cr : cr.toFixed(2)} Cr`;
  }
  if (safeAmount >= 100000) {
    const l = safeAmount / 100000;
    return `₹${l % 1 === 0 ? l : l.toFixed(1)} Lakhs`;
  }
  return formatCurrency(safeAmount);
}

export function formatDate(dateString: string | Date): string {
  const date = typeof dateString === "string" ? new Date(dateString) : dateString;
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    try {
      return window.crypto.randomUUID();
    } catch (_) {}
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
