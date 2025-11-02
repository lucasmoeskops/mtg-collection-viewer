
import { ViewModeView } from "@/components/ViewModeView/ViewModeView";
import { ViewModes } from "@/types/ViewModes";
import { Box } from "@mui/material";


export default async function Home() {
  return <Box m={2}>
    <ViewModeView viewModeId={ViewModes.COLLECTION} />
  </Box>;
}
