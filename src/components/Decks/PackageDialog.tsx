"use client";

import {
  addCardToPackage,
  createPackage,
  deletePackage,
  removeCardFromPackage,
  updatePackage,
} from "@/db/packages";
import { CardDeckCard, DeckPackage } from "@/types/CardDeckData";
import { Add, Close } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { getPackageColor, getPackageInitials } from "./packageColors";

interface PackageDialogProps {
  open: boolean;
  onClose: () => void;
  deckId: number;
  pkg: DeckPackage | null;
  deckCards: CardDeckCard[];
  onChanged: () => void;
}

export default function PackageDialog({
  open,
  onClose,
  deckId,
  pkg,
  deckCards,
  onChanged,
}: PackageDialogProps) {
  const [editName, setEditName] = useState(pkg?.name ?? "");
  const [editDescription, setEditDescription] = useState(pkg?.description ?? "");
  const [editTarget, setEditTarget] = useState(pkg?.target?.toString() ?? "");
  const [saving, setSaving] = useState(false);
  const [addSearch, setAddSearch] = useState("");

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    const target = editTarget.trim() ? Number(editTarget) : undefined;
    if (pkg) {
      await updatePackage(
        pkg.id,
        editName.trim(),
        editDescription.trim(),
        target,
      );
    } else {
      await createPackage(
        deckId,
        editName.trim(),
        editDescription.trim(),
        target,
      );
    }
    setSaving(false);
    onChanged();
    onClose();
  };

  const handleDelete = async () => {
    if (!pkg) return;
    await deletePackage(pkg.id);
    onChanged();
    onClose();
  };

  const handleAddCard = async (cardId: number) => {
    if (!pkg) return;
    await addCardToPackage(pkg.id, cardId);
    onChanged();
  };

  const handleRemoveCard = async (cardId: number) => {
    if (!pkg) return;
    await removeCardFromPackage(pkg.id, cardId);
    onChanged();
  };

  const color = pkg ? getPackageColor(pkg.id) : getPackageColor(0);
  const cardsInPackage = deckCards.filter((c) =>
    pkg?.cardIds.includes(c.card.id),
  );
  const cardsNotInPackage = deckCards.filter(
    (c) =>
      !pkg?.cardIds.includes(c.card.id) &&
      c.card.name.toLowerCase().includes(addSearch.toLowerCase()),
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1.5}>
          {pkg && (
            <Avatar
              sx={{ width: 28, height: 28, fontSize: 11, bgcolor: color }}
            >
              {getPackageInitials(pkg.name)}
            </Avatar>
          )}
          {pkg ? pkg.name : "New package"}
        </Box>
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus={!pkg}
          label="Name"
          fullWidth
          size="small"
          margin="normal"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !pkg && handleSave()}
        />
        <TextField
          label="Description"
          fullWidth
          size="small"
          margin="normal"
          multiline
          rows={3}
          value={editDescription}
          onChange={(e) => setEditDescription(e.target.value)}
          placeholder="Explain the role or synergy this package covers…"
        />
        <TextField
          label="Target (optional)"
          fullWidth
          size="small"
          margin="normal"
          type="number"
          value={editTarget}
          onChange={(e) => setEditTarget(e.target.value)}
          slotProps={{ htmlInput: { min: 1 } }}
          placeholder="Desired number of cards"
        />

        {pkg && (
          <>
            <Divider sx={{ mt: 2, mb: 1.5 }} />
            <Typography variant="subtitle2" gutterBottom>
              Cards in this package ({cardsInPackage.length}
              {pkg.target != null ? ` / ${pkg.target}` : ""})
            </Typography>
            {cardsInPackage.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                No cards yet — add from below.
              </Typography>
            ) : (
              <List dense disablePadding sx={{ mb: 1 }}>
                {cardsInPackage.map(({ card }) => (
                  <ListItem
                    key={card.id}
                    disableGutters
                    secondaryAction={
                      <Tooltip title="Remove from package">
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveCard(card.id)}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemText
                      primary={card.name}
                      secondary={card.card_type}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            <Divider sx={{ mb: 1.5 }} />
            <Typography variant="subtitle2" gutterBottom>
              Add cards
            </Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by name…"
              value={addSearch}
              onChange={(e) => setAddSearch(e.target.value)}
              sx={{ mb: 1 }}
            />
            <List
              dense
              disablePadding
              sx={{ maxHeight: 200, overflow: "auto" }}
            >
              {cardsNotInPackage.length === 0 ? (
                <ListItem disableGutters>
                  <ListItemText
                    primary={
                      addSearch
                        ? "No matching cards"
                        : "All deck cards are in this package"
                    }
                    primaryTypographyProps={{
                      variant: "body2",
                      color: "textSecondary",
                    }}
                  />
                </ListItem>
              ) : (
                cardsNotInPackage.map(({ card }) => (
                  <ListItem
                    key={card.id}
                    disableGutters
                    secondaryAction={
                      <Tooltip title="Add to package">
                        <IconButton
                          size="small"
                          onClick={() => handleAddCard(card.id)}
                        >
                          <Add fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    }
                  >
                    <ListItemText
                      primary={card.name}
                      secondary={card.card_type}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                ))
              )}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {pkg && (
          <Button color="error" onClick={handleDelete} sx={{ mr: "auto" }}>
            Delete package
          </Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!editName.trim() || saving}
        >
          {pkg ? "Save" : "Create"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
