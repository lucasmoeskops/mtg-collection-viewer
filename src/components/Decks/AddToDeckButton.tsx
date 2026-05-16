"use client";

import { AccountContext } from "@/context/AccountContextProvider";
import { addCardToDeck, getDeckList } from "@/db/decks";
import MagicCardLike from "@/interfaces/MagicCardLike";
import { CardDeckPreview } from "@/types/CardDeckPreview";
import { Check, PlaylistAdd } from "@mui/icons-material";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Tooltip,
  Typography,
} from "@mui/material";
import { MouseEvent, useContext, useState } from "react";

export function AddToDeckButton({ card }: { card: MagicCardLike }) {
  const { accountId, isAuthenticated, cards: ownedCards } = useContext(AccountContext);
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [decks, setDecks] = useState<CardDeckPreview[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<number | "">("");
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const open = Boolean(anchorEl);
  const amountOwned = ownedCards.find((c) => c.id === card.id)?.amount_owned ?? 0;

  const handleOpen = async (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    setAdded(false);
    setSelectedDeckId("");
    setDecks(await getDeckList(accountId));
  };

  const handleAdd = async () => {
    if (!selectedDeckId) return;
    setAdding(true);
    await addCardToDeck(Number(selectedDeckId), card.id, "mainboard");
    setAdding(false);
    setAdded(true);
  };

  if (!isAuthenticated) return null;

  return (
    <>
      <Tooltip title={amountOwned === 0 ? "You don't own this card" : "Add to a deck"}>
        <span>
          <IconButton
            size="small"
            onClick={handleOpen}
            disabled={amountOwned === 0}
            style={{ verticalAlign: "middle", marginLeft: 2 }}
          >
            <PlaylistAdd fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ p: 2, width: 280 }}>
          <Typography variant="subtitle2" gutterBottom>
            Add to deck
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {card.name} · You own {amountOwned}
          </Typography>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel>Select deck</InputLabel>
            <Select
              value={selectedDeckId}
              label="Select deck"
              onChange={(e) => {
                setSelectedDeckId(e.target.value as number);
                setAdded(false);
              }}
            >
              {decks.length === 0 && (
                <MenuItem disabled>No decks yet</MenuItem>
              )}
              {decks.map((deck) => (
                <MenuItem key={deck.id} value={deck.id}>
                  {deck.name}
                  {deck.commander_name ? ` — ${deck.commander_name}` : ""}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box mt={2} display="flex" justifyContent="flex-end" alignItems="center">
            {added ? (
              <Typography variant="body2" color="success.main" display="flex" alignItems="center" gap={0.5}>
                <Check fontSize="small" /> Added to deck
              </Typography>
            ) : (
              <Button
                variant="contained"
                size="small"
                onClick={handleAdd}
                disabled={!selectedDeckId || adding}
              >
                Add to deck
              </Button>
            )}
          </Box>
        </Box>
      </Popover>
    </>
  );
}
