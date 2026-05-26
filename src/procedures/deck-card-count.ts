export const LAND_TYPES: Record<string, string> = {
  W: "Plains",
  U: "Island",
  B: "Swamp",
  R: "Mountain",
  G: "Forest",
};

export function computeDeckCardCount(
  mainboardAndCommanderCount: number,
  basicLands: Record<string, number>,
  commanderColors: string[],
): number {
  const landTypes = commanderColors.length === 0 ? ["Wastes"] : commanderColors.map((c) => LAND_TYPES[c]).filter(Boolean);
  const basicLandsTotal = landTypes.reduce((sum, lt) => sum + (basicLands[lt] ?? 0), 0);
  return mainboardAndCommanderCount + basicLandsTotal;
}
