"use client";

import { getDeckHistory } from "@/db/decks";
import { DeckHistoryEntry } from "@/types/DeckHistoryEntry";
import { NavigateBefore, NavigateNext } from "@mui/icons-material";
import { Box, IconButton, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

const PAGE_SIZE = 20;

function formatRole(role: string): string {
  switch (role) {
    case "mainboard": return "mainboard";
    case "sideboard": return "sideboard";
    case "commander": return "commander";
    case "garbage_bin": return "garbage bin";
    default: return role;
  }
}

function formatAction(entry: DeckHistoryEntry): string {
  const name = entry.cardName ?? "Unknown card";
  const { fromRole, toRole } = entry;
  if (toRole === "commander") return `Set ${name} as commander`;
  if (fromRole === null && toRole !== null) return `Added ${name} to ${formatRole(toRole)}`;
  if (fromRole !== null && toRole === null) return `Removed ${name} from ${formatRole(fromRole)}`;
  if (fromRole !== null && toRole !== null) return `Moved ${name} from ${formatRole(fromRole)} to ${formatRole(toRole)}`;
  return `Action on ${name}`;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString();
}

export default function DeckHistory({ deckId, refreshKey }: { deckId: number; refreshKey: number }) {
  const [entries, setEntries] = useState<DeckHistoryEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const seenRefreshKey = useRef(refreshKey);

  useEffect(() => {
    let cancelled = false;
    const isNewRefresh = seenRefreshKey.current !== refreshKey;
    const fetchPage = isNewRefresh ? 0 : page;
    seenRefreshKey.current = refreshKey;

    getDeckHistory(deckId, fetchPage, PAGE_SIZE).then((result) => {
      if (!cancelled) {
        setEntries(result.entries);
        setTotal(result.total);
        setLoading(false);
        if (isNewRefresh) setPage(0);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [deckId, page, refreshKey]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <Box mt={4}>
      <Typography variant="subtitle1" gutterBottom>
        History{total > 0 ? ` (${total})` : ""}
      </Typography>
      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Action</TableCell>
              <TableCell align="right">Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  <Typography color="textSecondary" variant="body2">Loading…</Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading && entries.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  <Typography color="textSecondary" variant="body2">No history yet.</Typography>
                </TableCell>
              </TableRow>
            )}
            {!loading && entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <Typography variant="body2">{formatAction(entry)}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="caption" color="textSecondary" sx={{ whiteSpace: "nowrap" }}>
                    {formatTimestamp(entry.createdAt)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <Box display="flex" justifyContent="flex-end" alignItems="center" p={1} gap={1}>
            <Typography variant="caption" color="textSecondary">
              Page {page + 1} of {totalPages}
            </Typography>
            <IconButton size="small" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              <NavigateBefore fontSize="small" />
            </IconButton>
            <IconButton size="small" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
              <NavigateNext fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
