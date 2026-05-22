"use client";

import { AccountContext } from "@/context/AccountContextProvider";
import { saveCardChanges } from "@/db/card-ownership";
import { addImportedCardsToDeck, getDeckList } from "@/db/decks";
import MagicCardLike from "@/interfaces/MagicCardLike";
import { CardDeckPreview } from "@/types/CardDeckPreview";
import { CardChange } from "@/types/CardChange";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { ReactNode, useContext, useEffect, useState } from "react";

type ImportMode = "at-least" | "append";

type ParsedLine = {
  lineNumber: number;
  amount: number;
  title: string;
  setId: string;
  collectorNumber: string;
  isFoil: boolean;
};

type InvalidLine = {
  lineNumber: number;
  raw: string;
};

type DuplicateWarning = {
  title: string;
  droppedLineNumber: number;
  keptLineNumber: number;
};

type PreviewRow = {
  title: string;
  setId: string;
  collectorNumber: string;
  isFoil: boolean;
  importAmount: number;
  currentAmount: number;
  newAmount: number;
};

type SkippedCard = {
  title: string;
  setId: string;
  collectorNumber: string;
  isFoil: boolean;
};

type ImportResult = {
  ownershipCount: number;
  skippedCards: SkippedCard[];
  deckAdded: number | null;
  deckFailed: boolean;
  failed: boolean;
};

const DEFAULT_TEMPLATE_REGEX =
  /^(\d+)\s+(.+?)\s+\(([A-Za-z0-9]+)\)\s+(\S+?)(\s+\*F\*)?\s*$/;
const MAX_IMPORT = 200;

function parseLines(lines: string[]): {
  parsed: ParsedLine[];
  invalid: InvalidLine[];
} {
  const parsed: ParsedLine[] = [];
  const invalid: InvalidLine[] = [];

  lines.forEach((raw, index) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    const lineNumber = index + 1;
    const match = trimmed.match(DEFAULT_TEMPLATE_REGEX);

    if (!match) {
      invalid.push({ lineNumber, raw: trimmed });
      return;
    }

    const [, amountStr, title, setId, collectorNumber, foilMarker] = match;
    parsed.push({
      lineNumber,
      amount: parseInt(amountStr, 10),
      title,
      setId: setId.toUpperCase(),
      collectorNumber,
      isFoil: !!foilMarker,
    });
  });

  return { parsed, invalid };
}

function deduplicateLines(parsed: ParsedLine[]): {
  deduped: ParsedLine[];
  duplicates: DuplicateWarning[];
} {
  const seen = new Map<string, ParsedLine>();
  const duplicates: DuplicateWarning[] = [];

  for (const line of parsed) {
    const key = `${line.setId}-${line.collectorNumber}-${line.isFoil}`;
    const existing = seen.get(key);
    if (existing) {
      duplicates.push({
        title: line.title,
        droppedLineNumber: existing.lineNumber,
        keptLineNumber: line.lineNumber,
      });
    }
    seen.set(key, line);
  }

  return { deduped: Array.from(seen.values()), duplicates };
}

function resolveNewAmount(
  importAmount: number,
  currentAmount: number,
  mode: ImportMode,
): number {
  if (mode === "append") return currentAmount + importAmount;
  return Math.max(currentAmount, importAmount);
}

function getCurrentAmount(
  cards: MagicCardLike[],
  setId: string,
  collectorNumber: string,
  isFoil: boolean,
): number {
  const card = cards.find(
    (c) =>
      c.series.toUpperCase() === setId &&
      c.cardnumber === collectorNumber &&
      c.is_foil === isFoil,
  );
  return card?.amount_owned ?? 0;
}

export default function ImportTab(): ReactNode {
  const {
    cards,
    accountId,
    accountName,
    accountKey,
    isLoading,
    invalidateCardData,
    setCardDataNeeded,
  } = useContext(AccountContext);
  const [inputText, setInputText] = useState("");
  const [mode, setMode] = useState<ImportMode>("at-least");
  const [decks, setDecks] = useState<CardDeckPreview[]>([]);
  const [decksLoading, setDecksLoading] = useState(false);
  const [selectedDeckId, setSelectedDeckId] = useState<number | "none">("none");
  const [deckRole, setDeckRole] = useState<"mainboard" | "sideboard">(
    "mainboard",
  );
  const [preview, setPreview] = useState<{
    rows: PreviewRow[];
    invalid: InvalidLine[];
    duplicates: DuplicateWarning[];
    overLimit: boolean;
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [addingToDeck, setAddingToDeck] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  useEffect(() => {
    setCardDataNeeded(true);
  }, [setCardDataNeeded]);

  useEffect(() => {
    if (accountId === -1) return;
    setDecksLoading(true);
    getDeckList(accountId)
      .then(setDecks)
      .finally(() => setDecksLoading(false));
  }, [accountId]);

  function handlePreview() {
    const lines = inputText.split("\n");
    const { parsed, invalid } = parseLines(lines);
    const { deduped, duplicates } = deduplicateLines(parsed);
    const overLimit = deduped.length > MAX_IMPORT;

    const rows: PreviewRow[] = deduped.slice(0, MAX_IMPORT).map((p) => {
      const currentAmount = getCurrentAmount(
        cards,
        p.setId,
        p.collectorNumber,
        p.isFoil,
      );
      return {
        title: p.title,
        setId: p.setId,
        collectorNumber: p.collectorNumber,
        isFoil: p.isFoil,
        importAmount: p.amount,
        currentAmount,
        newAmount: resolveNewAmount(p.amount, currentAmount, mode),
      };
    });

    setPreview({ rows, invalid, duplicates, overLimit });
    setImportResult(null);
  }

  async function handleImport() {
    if (!preview) return;
    setImporting(true);

    const changes: CardChange[] = preview.rows
      .filter((row) => row.newAmount !== row.currentAmount)
      .map((row) => ({
        setId: row.setId,
        collectorNumber: row.collectorNumber,
        isFoil: row.isFoil,
        newAmount: row.newAmount,
      }));

    let deckAdded: number | null = null;
    let deckFailed = false;

    try {
      const { successful, failed: allFailed } = await saveCardChanges(
        accountName,
        accountKey,
        changes,
      );
      const totalSaved = successful.length;

      const skippedCards: SkippedCard[] = allFailed.map((f) => {
        const row = preview.rows.find(
          (r) =>
            r.setId === f.setId &&
            r.collectorNumber === f.collectorNumber &&
            r.isFoil === f.isFoil,
        );
        return { title: row?.title ?? `${f.setId} ${f.collectorNumber}`, ...f };
      });

      if (selectedDeckId !== "none") {
        setAddingToDeck(true);
        const skippedKeys = new Set(
          allFailed.map((f) => `${f.setId}-${f.collectorNumber}-${f.isFoil}`),
        );
        const deckCards = preview.rows
          .filter(
            (row) =>
              !skippedKeys.has(
                `${row.setId}-${row.collectorNumber}-${row.isFoil}`,
              ),
          )
          .map((row) => ({
            setId: row.setId,
            collectorNumber: row.collectorNumber,
            isFoil: row.isFoil,
          }));
        try {
          deckAdded = await addImportedCardsToDeck(
            accountName,
            accountKey,
            selectedDeckId,
            deckRole,
            deckCards,
          );
        } catch {
          deckFailed = true;
        }
      }

      invalidateCardData();
      setCardDataNeeded(true);
      setImportResult({
        ownershipCount: totalSaved,
        skippedCards,
        deckAdded,
        deckFailed,
        failed: false,
      });
      setPreview(null);
      setInputText("");
    } catch {
      setImportResult({
        ownershipCount: 0,
        skippedCards: [],
        deckAdded: null,
        deckFailed: false,
        failed: true,
      });
    } finally {
      setImporting(false);
      setAddingToDeck(false);
    }
  }

  const changedRows =
    preview?.rows.filter((r) => r.newAmount !== r.currentAmount) ?? [];
  const deckIsSelected = selectedDeckId !== "none";
  const selectedDeckName = decks.find((d) => d.id === selectedDeckId)?.name;
  const importButtonDisabled =
    importing || (changedRows.length === 0 && !deckIsSelected);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Import Cards
      </Typography>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 1,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <FormControl size="small">
          <InputLabel>Template</InputLabel>
          <Select value="default" label="Template" sx={{ minWidth: 160 }}>
            <MenuItem value="default">Default</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small">
          <InputLabel>Import mode</InputLabel>
          <Select
            value={mode}
            label="Import mode"
            onChange={(e) => {
              setMode(e.target.value as ImportMode);
              setPreview(null);
              setImportResult(null);
            }}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="at-least">At least</MenuItem>
            <MenuItem value="append">Append</MenuItem>
          </Select>
        </FormControl>
        {isLoading && <CircularProgress size={20} />}
      </Box>

      <Box
        sx={{
          display: "flex",
          gap: 2,
          mb: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <FormControl size="small">
          <InputLabel>Add to deck</InputLabel>
          <Select
            value={selectedDeckId}
            label="Add to deck"
            onChange={(e) =>
              setSelectedDeckId(e.target.value as number | "none")
            }
            sx={{ minWidth: 200 }}
            endAdornment={
              decksLoading ? (
                <CircularProgress size={16} sx={{ mr: 2 }} />
              ) : undefined
            }
          >
            <MenuItem value="none">None</MenuItem>
            {decks.map((deck) => (
              <MenuItem key={deck.id} value={deck.id}>
                {deck.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" disabled={!deckIsSelected}>
          <InputLabel>Role</InputLabel>
          <Select
            value={deckRole}
            label="Role"
            onChange={(e) =>
              setDeckRole(e.target.value as "mainboard" | "sideboard")
            }
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="mainboard">Mainboard</MenuItem>
            <MenuItem value="sideboard">Sideboard</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TextField
        multiline
        minRows={10}
        fullWidth
        value={inputText}
        onChange={(e) => {
          setInputText(e.target.value);
          setPreview(null);
          setImportResult(null);
        }}
        placeholder={
          "1 Archmage of Runes (FDN) 30\n1 Contingency Plan (EMN) 52 *F*"
        }
        slotProps={{
          htmlInput: { style: { fontFamily: "monospace", fontSize: 13 } },
        }}
        sx={{ mb: 1 }}
      />

      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={handlePreview}
          disabled={!inputText.trim()}
        >
          Preview
        </Button>
      </Box>

      {preview && (
        <Box>
          {preview.overLimit && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Your list contains more than {MAX_IMPORT} cards. Please split it
              into smaller batches and import them separately.
            </Alert>
          )}

          {preview.invalid.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {preview.invalid.length} line(s) could not be parsed and will be
              skipped:
              <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                {preview.invalid.map((inv) => (
                  <li key={inv.lineNumber}>
                    Line {inv.lineNumber}: <code>{inv.raw}</code>
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          {preview.duplicates.length > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {preview.duplicates.length} duplicate(s) found — keeping the last
              occurrence of each:
              <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                {preview.duplicates.map((dup) => (
                  <li key={dup.keptLineNumber}>
                    <strong>{dup.title}</strong>: line {dup.droppedLineNumber}{" "}
                    replaced by line {dup.keptLineNumber}
                  </li>
                ))}
              </ul>
            </Alert>
          )}

          {!preview.overLimit && preview.rows.length > 0 && (
            <>
              <Table size="small" sx={{ mb: 2 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Card</TableCell>
                    <TableCell>Set</TableCell>
                    <TableCell>#</TableCell>
                    <TableCell>Foil</TableCell>
                    <TableCell align="right">Current</TableCell>
                    <TableCell align="right">Import</TableCell>
                    <TableCell align="right">New</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.rows.map((row, i) => (
                    <TableRow
                      key={i}
                      sx={{
                        opacity: row.newAmount === row.currentAmount ? 0.4 : 1,
                      }}
                    >
                      <TableCell>{row.title}</TableCell>
                      <TableCell>{row.setId}</TableCell>
                      <TableCell>{row.collectorNumber}</TableCell>
                      <TableCell>{row.isFoil ? "✦" : ""}</TableCell>
                      <TableCell align="right">{row.currentAmount}</TableCell>
                      <TableCell align="right">{row.importAmount}</TableCell>
                      <TableCell align="right">
                        <strong>{row.newAmount}</strong>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {importing ? (
                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    Importing {changedRows.length} card
                    {changedRows.length !== 1 ? "s" : ""}…
                  </Typography>
                  <LinearProgress
                    variant="indeterminate"
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              ) : addingToDeck ? (
                <Box sx={{ mb: 1 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 0.5 }}
                  >
                    Adding {preview.rows.length} cards to {selectedDeckName}…
                  </Typography>
                  <LinearProgress
                    variant="indeterminate"
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              ) : (
                <Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleImport}
                    disabled={importButtonDisabled}
                  >
                    {changedRows.length > 0
                      ? `Import ${changedRows.length} change(s)${deckIsSelected ? ` and add to ${selectedDeckName}` : ""}`
                      : `Add ${preview.rows.length} cards${deckIsSelected ? ` to ${selectedDeckName}` : ""}`}
                  </Button>

                  {!importing &&
                    changedRows.length === 0 &&
                    !deckIsSelected && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      No changes — all cards already meet the import
                      condition.
                    </Typography>
                  )}
                </Box>
              )}
            </>
          )}

          {!preview.overLimit &&
            preview.rows.length === 0 &&
            !preview.invalid.length && (
            <Alert severity="info">No valid cards to import.</Alert>
          )}
        </Box>
      )}

      {importResult && (
        <Box sx={{ mt: 2 }}>
          <Alert
            severity={
              importResult.failed
                ? "error"
                : importResult.deckFailed
                  ? "warning"
                  : "success"
            }
          >
            {importResult.failed
              ? `Import stopped after ${importResult.ownershipCount} card(s) due to an error. Please try again.`
              : importResult.deckFailed
                ? `Imported ${importResult.ownershipCount} card(s), but could not add cards to the deck.`
                : importResult.deckAdded !== null
                  ? `Successfully imported ${importResult.ownershipCount} card(s) and added ${importResult.deckAdded} to "${selectedDeckName}".`
                  : `Successfully imported ${importResult.ownershipCount} card(s).`}
          </Alert>
          {importResult.skippedCards.length > 0 && (
            <Alert severity="warning" sx={{ mt: 1 }}>
              {importResult.skippedCards.length} card(s) were skipped because
              they could not be found in Scryfall:
              <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                {importResult.skippedCards.map((c) => (
                  <li key={`${c.setId}-${c.collectorNumber}-${c.isFoil}`}>
                    <strong>{c.title}</strong> ({c.setId} {c.collectorNumber}
                    {c.isFoil ? ", foil" : ""})
                  </li>
                ))}
              </ul>
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}
