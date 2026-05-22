"use client";

import { CardDeckCard, DeckPackage } from "@/types/CardDeckData";
import { Add } from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import PackageDialog from "./PackageDialog";
import { getPackageColor } from "./packageColors";

interface DeckPackagesProps {
  deckId: number;
  packages: DeckPackage[];
  deckCards: CardDeckCard[];
  onChanged: () => void;
}

export default function DeckPackages({
  deckId,
  packages,
  deckCards,
  onChanged,
}: DeckPackagesProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(
    null,
  );

  const selectedPackage =
    packages.find((p) => p.id === selectedPackageId) ?? null;

  const mainboardCardIds = useMemo(
    () => new Set(deckCards.map((c) => c.card.id)),
    [deckCards],
  );

  const openCreate = () => {
    setSelectedPackageId(null);
    setDialogOpen(true);
    setDialogKey((k) => k + 1);
  };

  const openEdit = (pkg: DeckPackage) => {
    setSelectedPackageId(pkg.id);
    setDialogOpen(true);
    setDialogKey((k) => k + 1);
  };

  const closeDialog = () => {
    setDialogOpen(false);
  };

  return (
    <Box mt={4}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="subtitle1">Packages</Typography>
        <Button startIcon={<Add />} size="small" onClick={openCreate}>
          New package
        </Button>
      </Box>

      {packages.length === 0 ? (
        <Typography color="textSecondary" variant="body2">
          No packages yet. Create a package to track how well your deck covers a
          specific role or synergy.
        </Typography>
      ) : (
        <Box display="flex" flexWrap="wrap" gap={2}>
          {packages.map((pkg) => {
            const color = getPackageColor(pkg.id);
            const count = pkg.cardIds.filter((id) =>
              mainboardCardIds.has(id),
            ).length;
            const hasTarget = pkg.target != null;
            const fulfilled = hasTarget && count >= pkg.target!;

            return (
              <Card
                key={pkg.id}
                variant="outlined"
                sx={{
                  width: {
                    xs: "100%",
                    sm: "calc(50% - 8px)",
                    md: "calc(33.33% - 11px)",
                  },
                  borderLeft: `4px solid ${color}`,
                }}
              >
                <CardActionArea
                  onClick={() => openEdit(pkg)}
                  sx={{ height: "100%", alignItems: "flex-start" }}
                >
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      gap={1}
                      mb={0.5}
                    >
                      <Typography variant="subtitle2" fontWeight="bold">
                        {pkg.name}
                      </Typography>
                      <Chip
                        label={
                          hasTarget ? `${count} / ${pkg.target}` : String(count)
                        }
                        size="small"
                        color={
                          hasTarget
                            ? fulfilled
                              ? "success"
                              : "warning"
                            : "default"
                        }
                        sx={{ flexShrink: 0 }}
                      />
                    </Box>
                    {pkg.description ? (
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {pkg.description}
                      </Typography>
                    ) : (
                      <Typography
                        variant="body2"
                        color="text.disabled"
                        fontStyle="italic"
                      >
                        No description
                      </Typography>
                    )}
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}
        </Box>
      )}

      <PackageDialog
        key={dialogKey}
        open={dialogOpen}
        onClose={closeDialog}
        deckId={deckId}
        pkg={selectedPackage}
        deckCards={deckCards}
        onChanged={() => {
          onChanged();
        }}
      />
    </Box>
  );
}
