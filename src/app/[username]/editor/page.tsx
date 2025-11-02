import Editor from "@/components/Editor/Editor";
import CardEditorContextProvider from "@/context/CardEditorContextProvider";
import { Box } from "@mui/material";


export default async function Home() {
  return (
    <Box m={2}>
      <CardEditorContextProvider>
        <Editor />
      </CardEditorContextProvider>
    </Box>
  );
}
