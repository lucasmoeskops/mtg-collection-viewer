"use client";

import { CardDeckPreview } from "@/types/CardDeckPreview";
import { Delete } from "@mui/icons-material";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useState } from "react";

interface DeckCardProps {
  deck: CardDeckPreview;
  onDelete: (deckId: number) => void;
  getSubpageUrl: (subpage: string) => string;
}

export default function DeckCard({
  deck,
  onDelete,
  getSubpageUrl,
}: DeckCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(deck.id);
    } else {
      setConfirmDelete(true);
    }
  };

  return (
    <Card sx={{ position: "relative", height: "100%" }}>
      <CardActionArea component={Link} href={getSubpageUrl(`decks/${deck.id}`)}>
        {deck.commander_image_url && (
          <CardMedia
            component="img"
            height="140"
            image={deck.commander_image_url}
            alt={deck.commander_name}
            sx={{ objectFit: "cover", objectPosition: "20% 15%" }}
          />
        )}
        <CardContent>
          <Typography variant="h6" noWrap>
            {deck.name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {deck.commander_name
              ? `Commander: ${deck.commander_name}`
              : "No commander set"}
          </Typography>
          {deck.description && (
            <Typography
              variant="body2"
              color="textSecondary"
              noWrap
              sx={{ mt: 0.5 }}
            >
              {deck.description}
            </Typography>
          )}
          <Chip
            label={`${deck.card_count} / 100 cards`}
            color={deck.card_count === 100 ? "success" : "default"}
            size="small"
            sx={{ mt: 1 }}
          />
        </CardContent>
      </CardActionArea>
      <Box sx={{ position: "absolute", top: 4, right: 4 }}>
        <Tooltip
          title={
            confirmDelete ? "Click again to confirm deletion" : "Delete deck"
          }
        >
          <IconButton
            size="small"
            color={confirmDelete ? "error" : "default"}
            onClick={handleDelete}
            onBlur={() => setConfirmDelete(false)}
          >
            <Delete fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Card>
  );
}
