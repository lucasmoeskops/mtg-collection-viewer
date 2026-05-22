"use client";

import { addCardToPackage, removeCardFromPackage } from "@/db/packages";
import MagicCardLike from "@/interfaces/MagicCardLike";
import { DeckPackage } from "@/types/CardDeckData";
import { Check, Style } from "@mui/icons-material";
import {
  Avatar,
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Tooltip,
  Typography,
} from "@mui/material";
import { MouseEvent, useState } from "react";
import { getPackageColor, getPackageInitials } from "./packageColors";

interface CardPackageButtonProps {
  card: MagicCardLike;
  packages: DeckPackage[];
  onChanged: () => void;
}

export function CardPackageButton({
  card,
  packages,
  onChanged,
}: CardPackageButtonProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

  const handleToggle = async (pkg: DeckPackage) => {
    if (pkg.cardIds.includes(card.id)) {
      await removeCardFromPackage(pkg.id, card.id);
    } else {
      await addCardToPackage(pkg.id, card.id);
    }
    onChanged();
  };

  return (
    <>
      <Tooltip title="Assign to packages">
        <IconButton
          size="small"
          onClick={(e: MouseEvent<HTMLButtonElement>) =>
            setAnchorEl(e.currentTarget)
          }
        >
          <Style fontSize="small" />
        </IconButton>
      </Tooltip>
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ p: 1.5, minWidth: 220 }}>
          <Typography
            variant="caption"
            color="textSecondary"
            display="block"
            mb={0.5}
          >
            Packages
          </Typography>
          {packages.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ py: 0.5 }}>
              No packages yet — create one below.
            </Typography>
          ) : (
            <List dense disablePadding>
              {packages.map((pkg) => {
                const inPackage = pkg.cardIds.includes(card.id);
                return (
                  <ListItemButton
                    key={pkg.id}
                    onClick={() => handleToggle(pkg)}
                    dense
                    sx={{ borderRadius: 1, px: 0.5 }}
                  >
                    <Avatar
                      sx={{
                        width: 20,
                        height: 20,
                        fontSize: 9,
                        bgcolor: getPackageColor(pkg.id),
                        mr: 1,
                        flexShrink: 0,
                      }}
                    >
                      {getPackageInitials(pkg.name)}
                    </Avatar>
                    <ListItemText
                      primary={pkg.name}
                      primaryTypographyProps={{ variant: "body2" }}
                    />
                    {inPackage && (
                      <Check
                        fontSize="small"
                        color="primary"
                        sx={{ ml: 1, flexShrink: 0 }}
                      />
                    )}
                  </ListItemButton>
                );
              })}
            </List>
          )}
        </Box>
      </Popover>
    </>
  );
}
