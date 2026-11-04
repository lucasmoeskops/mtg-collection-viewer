import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import Link from "next/link";
import { ReactNode } from "react";

// Keep in sync with docs/API.md

function Code({ children }: { children: ReactNode }) {
  return (
    <Box
      component="code"
      sx={{ fontFamily: "monospace", fontSize: "0.9em", bgcolor: "action.hover", px: 0.5, borderRadius: 0.5 }}
    >
      {children}
    </Box>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <Box
      component="pre"
      sx={{
        fontFamily: "monospace",
        fontSize: "0.85rem",
        bgcolor: "action.hover",
        p: 1.5,
        borderRadius: 1,
        overflowX: "auto",
        my: 1.5,
      }}
    >
      {children}
    </Box>
  );
}

function SpecTable({ head, rows }: { head: string[]; rows: [ReactNode, ReactNode][] }) {
  return (
    <Box sx={{ overflowX: "auto", my: 1.5 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {head.map((label) => (
              <TableCell key={label} sx={{ fontWeight: "bold" }}>
                {label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(([name, meaning], index) => (
            <TableRow key={index}>
              <TableCell sx={{ verticalAlign: "top", whiteSpace: "nowrap" }}>{name}</TableCell>
              <TableCell>{meaning}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return (
    <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
      {children}
    </Typography>
  );
}

export default async function ApiPage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = decodeURIComponent(username);

  return (
    <Box sx={{ m: 2, maxWidth: 900 }}>
      <Typography variant="h4" gutterBottom>
        API
      </Typography>
      <Typography variant="body1" gutterBottom>
        A small, read-only JSON API for using your collection data in your own scripts, spreadsheets or dashboards. It
        currently serves the value of your collection over time: for the whole collection, or for the cards of one set.
      </Typography>

      <Heading>Authentication</Heading>
      <Typography variant="body1" gutterBottom>
        Every request needs your API key. Accounts don&apos;t have one by default: ask the administrator. Send it in the{" "}
        <Code>Authorization</Code> header:
      </Typography>
      <CodeBlock>{"Authorization: Bearer <your api key>"}</CodeBlock>
      <Typography variant="body1" gutterBottom>
        The key only works for your own account. It is separate from your login key, so sharing it with a script or
        service doesn&apos;t give access to the app. If it leaks, ask for a new one.
      </Typography>

      <Heading>Endpoints</Heading>
      <Typography variant="h6" gutterBottom>
        <Code>GET /api/{user}/collection-value</Code>
      </Typography>
      <Typography variant="body1" gutterBottom>
        The value of your whole collection at every weekly price update.
      </Typography>
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        <Code>GET /api/{user}/collection-value/&lt;set&gt;</Code>
      </Typography>
      <Typography variant="body1" gutterBottom>
        The value of your cards from one set at every weekly price update. <Code>&lt;set&gt;</Code> is a{" "}
        <Link href="https://scryfall.com/sets" target="_blank">
          Scryfall set code
        </Link>{" "}
        such as <Code>mh3</Code> or <Code>dsk</Code> (upper or lower case). Price updates at which you owned no cards of
        the set are included with a value of 0.
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        Query parameters
      </Typography>
      <Typography variant="body1">Both endpoints accept an optional time period:</Typography>
      <SpecTable
        head={["Parameter", "Meaning"]}
        rows={[
          [
            <Code key="from">from</Code>,
            <>
              Only price updates at or after this moment. A date (<Code>2026-01-01</Code>) or a timestamp (
              <Code>2026-01-01T12:00:00Z</Code>).
            </>,
          ],
          [
            <Code key="to">to</Code>,
            <>Only price updates at or before this moment. A date without a time includes that whole day (UTC).</>,
          ],
        ]}
      />

      <Heading>Response</Heading>
      <CodeBlock>
        {`{
  "username": "${user}",
  "set": "mh3",
  "currency": "EUR",
  "from": "2026-01-01T00:00:00.000Z",
  "to": null,
  "values": [
    {
      "timestamp": "2026-06-28T22:00:00.000Z",
      "valueCents": 2000,
      "cardCount": 4,
      "pricedCount": 4,
      "estimated": false
    }
  ]
}`}
      </CodeBlock>
      <SpecTable
        head={["Field", "Meaning"]}
        rows={[
          [<Code key="set">set</Code>, "Only on the per-set endpoint, in lower case."],
          [
            <Code key="currency">currency</Code>,
            "Always EUR. Dollar prices are converted with the exchange rate of that price update.",
          ],
          [<Code key="bounds">from, to</Code>, "The time period that was applied, or null when not given."],
          [<Code key="values">values</Code>, "One entry per price update, oldest first."],
          [<Code key="timestamp">timestamp</Code>, "The moment the prices of this update represent."],
          [
            <Code key="valueCents">valueCents</Code>,
            "Total value in euro cents: per card the latest known price at that moment, times the amount you owned.",
          ],
          [<Code key="cardCount">cardCount</Code>, "Number of cards counted, including duplicates."],
          [
            <Code key="pricedCount">pricedCount</Code>,
            "How many of those had a known price. Cards without a price count as 0.",
          ],
          [
            <Code key="estimated">estimated</Code>,
            <>
              <Code>false</Code>: recorded right at the price update, with your collection as it was then.{" "}
              <Code>true</Code>: calculated later with your collection as it was at that later moment, so cards bought
              or sold since then are included or missing. These are the dashed parts of the graph in merchant mode.
            </>,
          ],
        ]}
      />

      <Heading>Errors</Heading>
      <Typography variant="body1">
        Errors come with a JSON body like <Code>{'{ "error": "Unknown set: zzz" }'}</Code>.
      </Typography>
      <SpecTable
        head={["Status", "When"]}
        rows={[
          ["400", "from or to is not a valid date, from is after to, or the set code is malformed."],
          ["401", "The header is missing, the key is wrong, or the key belongs to another account."],
          ["404", "The set code is not known in the card catalogue."],
        ]}
      />

      <Heading>Example</Heading>
      <CodeBlock>
        {`curl -H "Authorization: Bearer $GRIMORIUM_API_KEY" \\
  "https://<this site>/api/${user}/collection-value/mh3?from=2026-01-01&to=2026-06-30"`}
      </CodeBlock>
      <Typography variant="body1" gutterBottom>
        Prices are updated weekly, so the values are weekly too. The first request may take a little longer while
        missing historical values are calculated; after that they are stored.
      </Typography>
    </Box>
  );
}
