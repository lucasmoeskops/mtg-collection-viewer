"use client";

import { Box, Paper, Typography } from "@mui/material";

export const STAT_TYPE_KEYS = [
  "Planeswalkers",
  "Creatures",
  "Sorceries",
  "Instants",
  "Enchantments",
  "Lands",
  "Other",
] as const;

export const STAT_SYMBOL_KEYS = ["W", "U", "B", "R", "G", "C", "X", "Generic"] as const;

export type DeckStatsData = {
  typeCounts: Record<string, number>;
  manaCurve: Record<number, number>;
  maxCurveCount: number;
  symbolCounts: Record<string, number>;
};

export default function DeckStats({ stats }: { stats: DeckStatsData }) {
  return (
    <Box mb={3} display="flex" gap={2} flexWrap="wrap">
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="caption" color="textSecondary" display="block" gutterBottom fontWeight="bold">
          Card types
        </Typography>
        {STAT_TYPE_KEYS.map((type) => (
          <Box key={type} display="flex" justifyContent="space-between" gap={3}>
            <Typography variant="body2" color={stats.typeCounts[type] === 0 ? "text.disabled" : "text.primary"}>
              {type}
            </Typography>
            <Typography variant="body2" color={stats.typeCounts[type] === 0 ? "text.disabled" : "text.primary"}>
              {stats.typeCounts[type]}
            </Typography>
          </Box>
        ))}
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="caption" color="textSecondary" display="block" gutterBottom fontWeight="bold">
          Mana curve
        </Typography>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((cmc) => {
          const count = stats.manaCurve[cmc] ?? 0;
          return (
            <Box key={cmc} display="flex" alignItems="center" gap={1} mb={0.25}>
              <Typography
                variant="body2"
                sx={{ minWidth: 20, textAlign: "right", color: count === 0 ? "text.disabled" : "text.primary" }}
              >
                {cmc === 7 ? "7+" : cmc}
              </Typography>
              <Box sx={{ width: 96, height: 10, bgcolor: "grey.100", borderRadius: 0.5 }}>
                {count > 0 && (
                  <Box
                    sx={{
                      height: "100%",
                      width: `${(count / stats.maxCurveCount) * 100}%`,
                      bgcolor: "primary.main",
                      borderRadius: 0.5,
                      opacity: 0.75,
                    }}
                  />
                )}
              </Box>
              <Typography variant="body2" sx={{ minWidth: 16, color: count === 0 ? "text.disabled" : "text.primary" }}>
                {count || ""}
              </Typography>
            </Box>
          );
        })}
      </Paper>

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="caption" color="textSecondary" display="block" gutterBottom fontWeight="bold">
          Mana symbols
        </Typography>
        {STAT_SYMBOL_KEYS.filter((sym) => (stats.symbolCounts[sym] ?? 0) > 0).map((sym) => (
          <Box key={sym} display="flex" justifyContent="space-between" gap={3}>
            <Typography variant="body2">{sym === "Generic" ? "Generic" : `{${sym}}`}</Typography>
            <Typography variant="body2">{stats.symbolCounts[sym]}</Typography>
          </Box>
        ))}
        {STAT_SYMBOL_KEYS.every((sym) => !stats.symbolCounts[sym]) && (
          <Typography variant="body2" color="text.disabled">
            No mana costs
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
