import { Box, List, ListItem, Typography } from "@mui/material";
import Link from "next/link";


export default async function Home() {
  return (
    <Box m={2}>
      <Typography variant="h4" gutterBottom>
        Colofon
      </Typography>
      <Typography variant="body1" gutterBottom>
        This application was designed and developed by <Link href="https://github.com/lucasmoeskops" target="blank">Lucas Moeskops</Link>.<br />
        Hosted on <Link href="https://vercel.com/" target="blank">Vercel</Link> and uses <Link href="https://scryfall.com/docs/api" target="blank">Scryfall API</Link> and <Link href="https://supabase.com/" target="blank">Supabase</Link> as backend services.
      </Typography>
      <Typography variant="body1" gutterBottom>
        Version 2025.11.12
      </Typography>
      <Typography variant="h5" gutterBottom sx={{ marginTop: '20px' }}>
        Change Log
      </Typography>
      <Typography variant="body2" gutterBottom>
        <strong>2025.11.12</strong>:
      </Typography>
      <List>
        <ListItem>
          Added support to search by query to the collection editor.
        </ListItem>
        <ListItem>
          Fix calculation error for total cards in merchant mode. (Thanks to Renske)
        </ListItem>
        <ListItem>
          Fix issue where cards of the previous user would remain visible after logging out and logging in as a different user.
        </ListItem>
      </List>
      <Typography variant="body2" gutterBottom>
        <strong>2025.11.7</strong>:
      </Typography>
      <List>
        <ListItem>Better support for mobile.</ListItem>
        <ListItem>Make background more stable in case of slow API&apos;s, and provide a default initial image.</ListItem>
      </List>
      <Typography variant="body2" gutterBottom>
        <strong>2025.11.5</strong>:
      </Typography>
      <List>
        <ListItem>Background stays the same once you login. Changes every 15 seconds on the intro screen.</ListItem>
        <ListItem>Add search option in editor set list.</ListItem>
        <ListItem>Remove artificial delay in AccountContextProvider.</ListItem>
      </List>
      <Typography variant="body2" gutterBottom>
        <strong>2025.11.2</strong>:
      </Typography>
      <List>
        <ListItem>Integrated the Collection Editor into this project.</ListItem>
        <ListItem>Added a login option with password to enable editing functions.</ListItem>
        <ListItem>Reworked menu to allow different views than card views.</ListItem>
        <ListItem>Added a home, settings and colofon page.</ListItem>
      </List>
      <Typography variant="body2" gutterBottom>
        <strong>2025.11.1</strong>:
      </Typography>
      <List>
        <ListItem>Every screen now has a background image.</ListItem>
        <ListItem>Current applied filters are written as readable string in the overview.</ListItem>
        <ListItem>Filter context is cleared when switching between different view modes.</ListItem>
        <ListItem>Fixed an issue that filter context was not saved when refreshing the page.</ListItem>
        <ListItem>Improved the error screen flashing issues.</ListItem>
      </List>
      <Typography variant="body2" gutterBottom>
        <strong>2025.10.28</strong>:
      </Typography>
      <List>
        <ListItem>Improved the login screen with a nice random card artwork background image.</ListItem>
        <ListItem>Fixed a bug that a graph icon is not shown on a card if the current price change is exactly 0.</ListItem>
      </List>
      <Typography variant="body2" gutterBottom>
        <strong>2025.10.25</strong>:
      </Typography>
      <List>
        <ListItem>Added an icon next to cards in the merchant mode that shows a pop-up with their price history since july 2025.</ListItem>
      </List>
      <Typography variant="body2" gutterBottom>
        <strong>2025.10.09</strong>:
      </Typography>
      <List>
        <ListItem>Newly added cards will show up directly instead of after a new release.</ListItem>
      </List>
      <Typography variant="body2" gutterBottom>
        <strong>2025.08.30</strong>:
      </Typography>
      <List>
        <ListItem>Added a loader component.</ListItem>
      </List>
      <Typography variant="body2" gutterBottom>
        <strong>2025.08.08</strong>:
      </Typography>
      <List>
        <ListItem>Implemented support for multiple accounts.</ListItem>
      </List>
    </Box>
  );
}
