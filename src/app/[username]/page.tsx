
import { MainComponent } from "@/components/MainComponent/MainComponent";


export default async function Home({ params}: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return (
    <MainComponent username={username} />
  );
}
