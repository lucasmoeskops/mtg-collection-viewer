
'use client';

import { useState } from "react";
import { Button, FormControl, FormLabel, Stack, TextField } from "@mui/material";
import Link from "next/link";

function EnterAccountNameAndRedirectComponent() {

  const [currentAccountName, setCurrentAccountName] = useState<string>("");

  return <Stack direction="row" spacing={2} alignItems="center">
    <FormControl sx={{ m: 3 }}>
      <FormLabel>Account name</FormLabel>
      <TextField label="Query" variant="outlined" value={currentAccountName} onChange={(e) => setCurrentAccountName(e.target.value)} />
    </FormControl>
    <Link href={`/${currentAccountName}`}><Button variant="contained" disabled={currentAccountName.length === 0}>Go</Button></Link>
  </Stack>;
}


export default function IntroComponent() {
  return (
    <div>
      <main>
        <EnterAccountNameAndRedirectComponent />
      </main>
    </div>
  );
}
