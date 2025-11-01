
import Background from "@/components/Background/Background";
import { MainComponent } from "@/components/MainComponent/MainComponent";


export default async function Home({ params}: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return (
    <Background fullBackground={true}>
      <MainComponent username={username} />
    </Background>
  );
}
