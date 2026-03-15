export const CATEGORIES = [
  "Food",
  "Transport",
  "Entertainment",
  "Shopping",
  "Health",
  "Utilities",
  "Rent",
  "Other"
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Food: "#10B981", // Emerald primary
  Transport: "#3B82F6", // Blue
  Entertainment: "#F59E0B", // Amber
  Shopping: "#EC4899", // Pink
  Health: "#EF4444", // Red
  Utilities: "#8B5CF6", // Violet
  Rent: "#06B6D4", // Cyan
  Other: "#6B7280" // Gray
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};
