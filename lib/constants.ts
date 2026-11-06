export const CATEGORIES = [
  "Food",
  "Groceries",
  "Transport",
  "Rent",
  "Bills",
  "Shopping",
  "Health",
  "Entertainment",
  "Travel",
  "Other",
] as const;

// Lump-sum categories that would distort the "daily average" and the month-end pace.
export const EXCLUDED_FROM_DAILY_AVG: readonly string[] = ["Rent", "Bills"];

export const PAY_METHODS = ["UPI", "Card", "Cash", "Net banking"] as const;

// One colour per category, used consistently in chips, charts and the transaction list.
export const CATEGORY_COLORS: Record<string, string> = {
  Food: "#fb923c",
  Groceries: "#4ade80",
  Transport: "#38bdf8",
  Rent: "#818cf8",
  Bills: "#c084fc",
  Shopping: "#f472b6",
  Health: "#2dd4bf",
  Entertainment: "#facc15",
  Travel: "#60a5fa",
  Other: "#94a3b8",
};

export const categoryColor = (name: string) => CATEGORY_COLORS[name] ?? "#94a3b8";
