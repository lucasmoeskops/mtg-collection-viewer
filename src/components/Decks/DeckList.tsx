"use client";

import { AccountContext } from "@/context/AccountContextProvider";
import { createDeck, deleteDeck, getDeckList } from "@/db/decks";
import { CardDeckPreview } from "@/types/CardDeckPreview";
import { Add } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useContext, useEffect, useState } from "react";
import DeckCard from "./DeckCard";

export default function DeckList() {
  const { accountId, isAuthenticated, getSubpageUrl } = useContext(AccountContext);
  const [decks, setDecks] = useState<CardDeckPreview[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const loadDecks = useCallback(async () => {
    if (accountId < 0) return;
    setDecks(await getDeckList(accountId));
  }, [accountId]);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await createDeck(accountId, newName.trim(), newDescription.trim());
      setDialogOpen(false);
      setNewName("");
      setNewDescription("");
      await loadDecks();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (deckId: number) => {
    await deleteDeck(accountId, deckId);
    await loadDecks();
  };

  if (!isAuthenticated) return null;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Commander Decks</Typography>
        <Button startIcon={<Add />} variant="contained" onClick={() => setDialogOpen(true)}>
          New Deck
        </Button>
      </Box>

      <Alert variant="outlined" severity="info" sx={{ mb: 3 }}>
        <strong>Commander rules recap</strong>
        <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
          <li>100-card deck — each card appears exactly once (basic lands are the exception)</li>
          <li>One <strong>Commander</strong>: a legendary Creature, Spacecraft, or Vehicle that starts in the Command Zone</li>
          <li>Every card must be within your Commander&apos;s <strong>color identity</strong> — the colors of all mana symbols on the card</li>
          <li>The Commander can be cast from the Command Zone; each subsequent cast costs {"{2}"} more</li>
        </ul>
      </Alert>

      {decks.length === 0 ? (
        <Typography color="textSecondary">
          No decks yet. Create your first Commander deck!
        </Typography>
      ) : (
        <Box display="flex" flexWrap="wrap" gap={2}>
          {decks.map((deck) => (
            <Box
              key={deck.id}
              sx={{ width: { xs: "100%", sm: "calc(50% - 8px)", md: "calc(33.33% - 11px)" } }}
            >
              <DeckCard deck={deck} onDelete={handleDelete} getSubpageUrl={getSubpageUrl} />
            </Box>
          ))}
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>New Commander Deck</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Deck name"
            fullWidth
            margin="normal"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            multiline
            rows={2}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={creating || !newName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
