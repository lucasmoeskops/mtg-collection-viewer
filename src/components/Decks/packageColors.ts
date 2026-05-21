export const PACKAGE_COLORS = [
  "#e53935",
  "#1e88e5",
  "#43a047",
  "#fb8c00",
  "#8e24aa",
  "#00897b",
  "#d81b60",
  "#3949ab",
  "#546e7a",
  "#f9a825",
];

export function getPackageColor(packageId: number): string {
  return PACKAGE_COLORS[packageId % PACKAGE_COLORS.length];
}

export function getPackageInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return name.slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
