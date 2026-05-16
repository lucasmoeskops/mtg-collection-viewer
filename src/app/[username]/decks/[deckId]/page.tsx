import DeckDetail from "@/components/Decks/DeckDetail";
import { Box } from "@mui/material";

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;
  return (
    <Box m={2}>
      <DeckDetail deckId={Number(deckId)} />
    </Box>
  );
}
