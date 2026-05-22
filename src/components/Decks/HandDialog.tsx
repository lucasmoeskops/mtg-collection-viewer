"use client";

import MagicCardLike from "@/interfaces/MagicCardLike";
import { Casino } from "@mui/icons-material";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";

export type HandCard =
  | { type: "card"; card: MagicCardLike }
  | { type: "land"; landType: string };

const LAND_CARD_STYLE: Record<string, { bg: string; color: string }> = {
  Plains: { bg: "#fafaf0", color: "#555" },
  Island: { bg: "#ddeeff", color: "#336" },
  Swamp: { bg: "#2a2a2a", color: "#ccc" },
  Mountain: { bg: "#7a2a00", color: "#fdd" },
  Forest: { bg: "#1a5c1a", color: "#dfd" },
  Wastes: { bg: "#888", color: "#eee" },
};

interface HandDialogProps {
  handCards: HandCard[] | null;
  onClose: () => void;
  onDrawAgain: () => void;
  onCardClick: (card: { name: string; image_url: string }) => void;
}

export default function HandDialog({
  handCards,
  onClose,
  onDrawAgain,
  onCardClick,
}: HandDialogProps) {
  return (
    <Dialog open={!!handCards} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Opening Hand</DialogTitle>
      <DialogContent>
        <Box
          display="flex"
          gap={1.5}
          flexWrap="wrap"
          justifyContent="center"
          pt={1}
        >
          {handCards?.map((hc, i) =>
            hc.type === "card" ? (
              hc.card.image_url ? (
                <Box
                  key={i}
                  component="img"
                  src={hc.card.image_url}
                  alt={hc.card.name}
                  onClick={() => onCardClick(hc.card)}
                  sx={{
                    width: 110,
                    borderRadius: 1.5,
                    boxShadow: 3,
                    cursor: "pointer",
                  }}
                />
              ) : (
                <Box
                  key={i}
                  sx={{
                    width: 110,
                    height: 154,
                    borderRadius: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    p: 1,
                  }}
                >
                  <Typography variant="caption" align="center">
                    {hc.card.name}
                  </Typography>
                </Box>
              )
            ) : (
              <Box
                key={i}
                sx={{
                  width: 110,
                  height: 154,
                  borderRadius: 1.5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: LAND_CARD_STYLE[hc.landType]?.bg ?? "#ccc",
                  boxShadow: 3,
                }}
              >
                <Typography
                  variant="body2"
                  fontWeight="bold"
                  align="center"
                  sx={{ color: LAND_CARD_STYLE[hc.landType]?.color ?? "#333" }}
                >
                  {hc.landType}
                </Typography>
              </Box>
            ),
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button startIcon={<Casino />} onClick={onDrawAgain}>
          Draw again
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
