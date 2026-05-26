"use client";

import { AccountContext } from "@/context/AccountContextProvider";
import {
  addCardToDeck,
  getDeck,
  removeCardFromDeck,
  setBasicLandCount,
  updateDeck,
} from "@/db/decks";
import MagicCardLike from "@/interfaces/MagicCardLike";
import { LAND_TYPES, computeDeckCardCount } from "@/procedures/deck-card-count";
import { CardDeck } from "@/types/CardDeckData";
import {
  ArrowBack,
  ArrowDownward,
  ArrowUpward,
  Casino,
  Check,
  Close,
  Delete,
  Edit,
  Star,
  Warning,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Chip,
  Dialog,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import DeckStats, { STAT_TYPE_KEYS } from "./DeckStats";
import DeckPackages from "./DeckPackages";
import HandDialog, { HandCard } from "./HandDialog";
import { CardPackageButton } from "./CardPackageButton";
import { getPackageColor, getPackageInitials } from "./packageColors";
import { DeckPackage } from "@/types/CardDeckData";

function isValidCommander(cardType: string): boolean {
  const t = cardType.toLowerCase();
  return (
    t.includes("legendary") &&
    (t.includes("creature") ||
      t.includes("spacecraft") ||
      t.includes("vehicle"))
  );
}

function isBasicLand(cardType: string): boolean {
  return cardType.toLowerCase().includes("basic land");
}


const COLOR_ORDER: Record<string, number> = { W: 0, U: 1, B: 2, R: 3, G: 4 };

function colorPriority(colors: string[]): number {
  if (colors.length === 0) return 6;
  if (colors.length > 1) return 5;
  return COLOR_ORDER[colors[0]] ?? 6;
}

function typePriority(cardType: string): number {
  const t = cardType.toLowerCase();
  if (t.includes("planeswalker")) return 0;
  if (t.includes("creature")) return 1;
  if (t.includes("sorcery")) return 2;
  if (t.includes("instant")) return 3;
  if (t.includes("enchantment")) return 4;
  return 5;
}

function getCardTypeBucket(cardType: string): string {
  const t = cardType.toLowerCase();
  if (t.includes("planeswalker")) return "Planeswalkers";
  if (t.includes("creature")) return "Creatures";
  if (t.includes("sorcery")) return "Sorceries";
  if (t.includes("instant")) return "Instants";
  if (t.includes("enchantment")) return "Enchantments";
  if (t.includes("land")) return "Lands";
  return "Other";
}

function sortCards(
  a: { card: MagicCardLike },
  b: { card: MagicCardLike },
): number {
  const color = colorPriority(a.card.colors) - colorPriority(b.card.colors);
  if (color !== 0) return color;
  const type = typePriority(a.card.card_type) - typePriority(b.card.card_type);
  if (type !== 0) return type;
  const mana = a.card.manacost_amount - b.card.manacost_amount;
  if (mana !== 0) return mana;
  return a.card.name.localeCompare(b.card.name);
}

export default function DeckDetail({ deckId }: { deckId: number }) {
  const {
    accountId,
    cards: ownedCards,
    getSubpageUrl,
  } = useContext(AccountContext);
  const [deck, setDeck] = useState<CardDeck | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingMeta, setEditingMeta] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [previewCard, setPreviewCard] = useState<{
    name: string;
    image_url: string;
  } | null>(null);
  const [basicLandCounts, setBasicLandCounts] = useState<
    Record<string, number>
  >({});
  const [handCards, setHandCards] = useState<HandCard[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reloadDeck = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    getDeck(accountId, deckId).then((result) => {
      if (!cancelled) {
        setDeck(result);
        setBasicLandCounts(result?.basicLands ?? {});
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [accountId, deckId, reloadKey]);

  const commander = deck?.cards.find((c) => c.role === "commander");

  const mainboardCards = useMemo(
    () =>
      (deck?.cards ?? [])
        .filter((c) => !isBasicLand(c.card.card_type) && (c.role === "mainboard" || c.role === "commander"))
        .sort(sortCards),
    [deck],
  );

  const sideboardCards = useMemo(
    () =>
      (deck?.cards ?? [])
        .filter((c) => !isBasicLand(c.card.card_type) && c.role === "sideboard")
        .sort(sortCards),
    [deck],
  );

  const commanderLandTypes = useMemo(() => {
    if (!commander) return [];
    const colors = commander.card.colors;
    if (colors.length === 0) return ["Wastes"];
    return colors.map((c) => LAND_TYPES[c]).filter(Boolean);
  }, [commander]);

  const basicLandsTotal = commanderLandTypes.reduce((sum, lt) => sum + (basicLandCounts[lt] ?? 0), 0);
  const cardCount = computeDeckCardCount(mainboardCards.length, basicLandCounts, commander?.card.colors ?? []);
  const deckPriceCents = mainboardCards.reduce((sum, { card }) => sum + card.price_estimate, 0);

  const deckStats = useMemo(() => {
    const typeCounts = Object.fromEntries(
      STAT_TYPE_KEYS.map((k) => [k, 0]),
    ) as Record<string, number>;
    typeCounts["Lands"] = basicLandsTotal;
    const manaCurve: Record<number, number> = {};
    const symbolCounts: Record<string, number> = {};

    for (const { card } of mainboardCards) {
      typeCounts[getCardTypeBucket(card.card_type)] += 1;

      if (card.manacost) {
        const cmc = card.manacost_amount >= 9999999 ? 0 : card.manacost_amount;
        const key = Math.min(cmc, 7);
        manaCurve[key] = (manaCurve[key] ?? 0) + 1;
      }

      for (const sym of card.manacost?.match(/\{[^}]+\}/g) ?? []) {
        const inner = sym.slice(1, -1);
        if (/^\d+$/.test(inner)) {
          symbolCounts["Generic"] =
            (symbolCounts["Generic"] ?? 0) + parseInt(inner, 10);
        } else {
          symbolCounts[inner] = (symbolCounts[inner] ?? 0) + 1;
        }
      }
    }

    const maxCurveCount = Math.max(...Object.values(manaCurve), 1);
    return { typeCounts, manaCurve, maxCurveCount, symbolCounts };
  }, [mainboardCards, basicLandsTotal]);

  const violations = useMemo(() => {
    const map = new Map<number, string>();
    if (!deck) return map;
    const commanderColors = commander ? new Set(commander.card.colors) : null;
    for (const c of deck.cards) {
      if (c.role === "commander") continue;
      if (c.card.is_token) {
        map.set(c.card.id, "Token — cannot be added to a deck");
      } else if (
        commanderColors &&
        commanderColors.size > 0 &&
        c.card.colors.length > 0 &&
        c.card.colors.some((color) => !commanderColors.has(color))
      ) {
        map.set(c.card.id, "Outside commander's color identity");
      }
    }
    return map;
  }, [deck, commander]);

  const deckCardIds = useMemo(
    () => new Set((deck?.cards ?? []).map((c) => c.card.id)),
    [deck],
  );

  const cardPackageMap = useMemo(() => {
    const map = new Map<number, DeckPackage[]>();
    for (const pkg of deck?.packages ?? []) {
      for (const cardId of pkg.cardIds) {
        if (!map.has(cardId)) map.set(cardId, []);
        map.get(cardId)!.push(pkg);
      }
    }
    return map;
  }, [deck]);

  const filteredOwned = useMemo(() => {
    const q = search.toLowerCase();
    return ownedCards.filter(
      (card) =>
        !isBasicLand(card.card_type) &&
        !deckCardIds.has(card.id) &&
        card.name.toLowerCase().includes(q),
    );
  }, [ownedCards, deckCardIds, search]);

  const handleAddCard = async (
    cardId: number,
    role: "commander" | "mainboard",
  ) => {
    await addCardToDeck(deckId, cardId, role);
    reloadDeck();
  };

  const handleRemove = async (cardId: number) => {
    await removeCardFromDeck(deckId, cardId);
    reloadDeck();
  };

  const handleMoveToSideboard = async (cardId: number) => {
    await addCardToDeck(deckId, cardId, "sideboard");
    reloadDeck();
  };

  const handleMoveToMainboard = async (cardId: number) => {
    await addCardToDeck(deckId, cardId, "mainboard");
    reloadDeck();
  };

  const handleSetBasicLandCount = async (
    landType: string,
    quantity: number,
  ) => {
    const clamped = Math.max(0, quantity);
    setBasicLandCounts((prev) => ({ ...prev, [landType]: clamped }));
    await setBasicLandCount(deckId, landType, clamped);
  };

  const drawHand = () => {
    const pool: HandCard[] = [
      ...mainboardCards
        .filter((c) => c.role !== "commander")
        .map((c) => ({ type: "card" as const, card: c.card })),
      ...Object.entries(basicLandCounts)
        .filter(([landType]) => commanderLandTypes.includes(landType))
        .flatMap(([landType, count]) =>
          Array.from({ length: count }, () => ({
            type: "land" as const,
            landType,
          })),
        ),
    ];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setHandCards(pool.slice(0, 7));
  };

  const startEditing = () => {
    if (!deck) return;
    setEditName(deck.name);
    setEditDescription(deck.description);
    setEditingMeta(true);
  };

  const handleSaveMeta = async () => {
    if (!deck || !editName.trim()) return;
    setSaving(true);
    await updateDeck(
      accountId,
      deckId,
      editName.trim(),
      editDescription.trim(),
    );
    setSaving(false);
    setEditingMeta(false);
    reloadDeck();
  };

  if (loading) {
    return <Typography>Loading…</Typography>;
  }

  if (!deck) {
    return <Typography>Deck not found.</Typography>;
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={1} mb={2} flexWrap="wrap">
        <IconButton component={Link} href={getSubpageUrl("decks")}>
          <ArrowBack />
        </IconButton>
        {editingMeta ? (
          <Box display="flex" flexDirection="column" gap={1} flex={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <TextField
                size="small"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                label="Name"
              />
              <IconButton
                onClick={handleSaveMeta}
                disabled={saving || !editName.trim()}
                color="primary"
              >
                <Check />
              </IconButton>
              <IconButton onClick={() => setEditingMeta(false)}>
                <Close />
              </IconButton>
            </Box>
            <TextField
              size="small"
              fullWidth
              multiline
              rows={4}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              label="Description / Strategy notes"
            />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={0.5} flex={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h5">{deck.name}</Typography>
              <IconButton size="small" onClick={startEditing}>
                <Edit fontSize="small" />
              </IconButton>
            </Box>
            {deck.description && (
              <Typography
                color="textSecondary"
                variant="body2"
                sx={{ whiteSpace: "pre-wrap" }}
              >
                {deck.description}
              </Typography>
            )}
          </Box>
        )}
      </Box>

      {/* Validation chips */}
      <Box display="flex" gap={1} flexWrap="wrap" alignItems="center" mb={3}>
        <Chip
          label={`${cardCount} / 100 cards`}
          color={cardCount === 100 ? "success" : "default"}
        />
        <Chip
          label={`€${Math.floor(deckPriceCents / 100)}.${String(deckPriceCents % 100).padStart(2, "0")}`}
        />
        <Chip
          label={
            commander ? `Commander: ${commander.card.name}` : "No commander set"
          }
          color={commander ? "success" : "warning"}
          icon={commander ? <Check /> : <Warning />}
        />
        {violations.size > 0 && (
          <Tooltip
            title={deck.cards
              .filter((c) => violations.has(c.card.id))
              .map((c) => `${c.card.name}: ${violations.get(c.card.id)}`)
              .join(", ")}
          >
            <Chip
              label={`${violations.size} violation${violations.size !== 1 ? "s" : ""}`}
              color="warning"
              icon={<Warning />}
            />
          </Tooltip>
        )}
        <Tooltip title="Draw opening hand">
          <IconButton size="small" onClick={drawHand} sx={{ ml: "auto" }}>
            <Casino fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Commander highlight */}
      {commander && (
        <Box mb={3} display="flex" alignItems="center" gap={2}>
          {commander.card.image_url && (
            <Box
              component="img"
              src={commander.card.image_url}
              alt={commander.card.name}
              onClick={() => setPreviewCard(commander.card)}
              sx={{
                height: 120,
                borderRadius: 1,
                boxShadow: 3,
                cursor: "pointer",
              }}
            />
          )}
          <Box>
            <Typography variant="overline" color="textSecondary">
              Commander
            </Typography>
            <Typography variant="h6">{commander.card.name}</Typography>
            <Typography variant="body2" color="textSecondary">
              {commander.card.card_type}
            </Typography>
            <Typography variant="body2">
              Colors:{" "}
              {commander.card.colors.length > 0
                ? commander.card.colors.join(", ")
                : "Colorless"}
            </Typography>
          </Box>
        </Box>
      )}

      <DeckStats stats={deckStats} />

      {/* Main two-column layout */}
      <Box display="flex" gap={3} alignItems="flex-start" flexWrap="wrap">
        {/* Deck card list */}
        <Box flex={2} minWidth={280}>
          <Typography variant="subtitle1" gutterBottom>
            Cards in deck
          </Typography>
          <Paper variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Card</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Mana</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {mainboardCards.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="textSecondary" variant="body2">
                        No cards yet — add from your collection on the right.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
                {mainboardCards.map(({ card, role }) => (
                  <TableRow
                    key={card.id}
                    hover
                    sx={
                      violations.has(card.id)
                        ? { bgcolor: "rgba(244,67,54,0.07)" }
                        : undefined
                    }
                  >
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {card.image_url && (
                          <Box
                            component="img"
                            src={card.image_url}
                            alt={card.name}
                            onClick={() => setPreviewCard(card)}
                            sx={{
                              height: 36,
                              borderRadius: 0.5,
                              flexShrink: 0,
                              cursor: "pointer",
                            }}
                          />
                        )}
                        <Typography variant="body2">{card.name}</Typography>
                        {violations.has(card.id) && (
                          <Tooltip title={violations.get(card.id)}>
                            <Warning
                              fontSize="small"
                              sx={{ color: "warning.main", flexShrink: 0 }}
                            />
                          </Tooltip>
                        )}
                        {(cardPackageMap.get(card.id) ?? []).map((pkg) => (
                          <Tooltip key={pkg.id} title={pkg.name}>
                            <Avatar
                              sx={{
                                width: 22,
                                height: 22,
                                fontSize: 10,
                                bgcolor: getPackageColor(pkg.id),
                                flexShrink: 0,
                              }}
                            >
                              {getPackageInitials(pkg.name)}
                            </Avatar>
                          </Tooltip>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {card.card_type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="textSecondary">
                        {card.manacost}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={role}
                        size="small"
                        color={role === "commander" ? "primary" : "default"}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex">
                        <CardPackageButton
                          card={card}
                          packages={deck.packages}
                          onChanged={reloadDeck}
                        />
                        {role !== "commander" &&
                          isValidCommander(card.card_type) && (
                          <Tooltip title="Set as commander">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleAddCard(card.id, "commander")
                              }
                            >
                              <Star fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {role !== "commander" && (
                          <Tooltip title="Move to sideboard">
                            <IconButton
                              size="small"
                              onClick={() => handleMoveToSideboard(card.id)}
                            >
                              <ArrowDownward fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Remove from deck">
                          <IconButton
                            size="small"
                            onClick={() => handleRemove(card.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          {/* Basic lands panel */}
          {commanderLandTypes.length > 0 && (
            <Box mt={3}>
              <Typography variant="subtitle1" gutterBottom>
                Basic lands
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  display: "inline-flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                {commanderLandTypes.map((landType) => (
                  <Box
                    key={landType}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Typography variant="body2" sx={{ minWidth: 72 }}>
                      {landType}
                    </Typography>
                    <TextField
                      type="number"
                      size="small"
                      value={basicLandCounts[landType] ?? 0}
                      onChange={(e) =>
                        setBasicLandCounts((prev) => ({
                          ...prev,
                          [landType]: Math.max(0, Number(e.target.value)),
                        }))
                      }
                      onBlur={(e) =>
                        handleSetBasicLandCount(
                          landType,
                          Number(e.target.value),
                        )
                      }
                      slotProps={{
                        htmlInput: {
                          min: 0,
                          max: 99,
                          step: 1,
                          style: { width: 52, textAlign: "center" },
                        },
                      }}
                    />
                  </Box>
                ))}
              </Paper>
            </Box>
          )}

          {/* Sideboard */}
          <Box mt={3}>
            <Typography variant="subtitle1" gutterBottom>
              Sideboard
              {sideboardCards.length > 0 ? ` (${sideboardCards.length})` : ""}
            </Typography>
            <Paper variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Card</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Mana</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sideboardCards.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="textSecondary" variant="body2">
                          No sideboard cards — move cards here from the deck
                          above.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                  {sideboardCards.map(({ card }) => (
                    <TableRow key={card.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {card.image_url && (
                            <Box
                              component="img"
                              src={card.image_url}
                              alt={card.name}
                              onClick={() => setPreviewCard(card)}
                              sx={{
                                height: 36,
                                borderRadius: 0.5,
                                flexShrink: 0,
                                cursor: "pointer",
                              }}
                            />
                          )}
                          <Typography variant="body2">{card.name}</Typography>
                          {(cardPackageMap.get(card.id) ?? []).map((pkg) => (
                            <Tooltip key={pkg.id} title={pkg.name}>
                              <Avatar
                                sx={{
                                  width: 22,
                                  height: 22,
                                  fontSize: 10,
                                  bgcolor: getPackageColor(pkg.id),
                                  flexShrink: 0,
                                }}
                              >
                                {getPackageInitials(pkg.name)}
                              </Avatar>
                            </Tooltip>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {card.card_type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {card.manacost}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box display="flex">
                          <CardPackageButton
                            card={card}
                            packages={deck.packages}
                            onChanged={reloadDeck}
                          />
                          <Tooltip title="Move to mainboard">
                            <IconButton
                              size="small"
                              onClick={() => handleMoveToMainboard(card.id)}
                            >
                              <ArrowUpward fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remove from deck">
                            <IconButton
                              size="small"
                              onClick={() => handleRemove(card.id)}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        </Box>

        {/* Add cards panel */}
        <Box flex={1} minWidth={220}>
          <Typography variant="subtitle1" gutterBottom>
            Add from collection
          </Typography>
          <TextField
            size="small"
            fullWidth
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 1 }}
          />
          <Paper variant="outlined" sx={{ maxHeight: 480, overflow: "auto" }}>
            <List dense disablePadding>
              {filteredOwned.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary={
                      search
                        ? "No matching cards"
                        : "All owned cards are already in this deck"
                    }
                    primaryTypographyProps={{
                      color: "textSecondary",
                      variant: "body2",
                    }}
                  />
                </ListItem>
              )}
              {filteredOwned.slice(0, 150).map((card) => (
                <ListItem
                  key={card.id}
                  disablePadding
                  secondaryAction={
                    isValidCommander(card.card_type) ? (
                      <Tooltip title="Add as commander">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleAddCard(card.id, "commander")}
                          >
                            <Star fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    ) : undefined
                  }
                >
                  <ListItemButton
                    onClick={() => handleAddCard(card.id, "mainboard")}
                  >
                    <ListItemText
                      primary={card.name}
                      secondary={card.card_type}
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {filteredOwned.length > 150 && (
                <ListItem>
                  <ListItemText
                    primary={`${filteredOwned.length - 150} more — refine your search`}
                    primaryTypographyProps={{
                      color: "textSecondary",
                      variant: "caption",
                    }}
                  />
                </ListItem>
              )}
            </List>
          </Paper>
        </Box>
      </Box>

      <DeckPackages
        deckId={deckId}
        packages={deck.packages}
        deckCards={mainboardCards}
        onChanged={reloadDeck}
      />

      <HandDialog
        handCards={handCards}
        onClose={() => setHandCards(null)}
        onDrawAgain={drawHand}
        onCardClick={setPreviewCard}
      />

      <Dialog
        open={!!previewCard}
        onClose={() => setPreviewCard(null)}
        maxWidth="xs"
      >
        {previewCard && (
          <Box
            component="img"
            src={previewCard.image_url}
            alt={previewCard.name}
            sx={{ width: "100%", display: "block" }}
          />
        )}
      </Dialog>
    </Box>
  );
}
