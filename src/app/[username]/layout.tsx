import Background from "@/components/Background/Background";
import { MainComponent } from "@/components/MainComponent/MainComponent";

export default function Layout({ children }: { children: React.ReactNode }) {
  
  return (
    <Background fullBackground={true}>
        <MainComponent>
        {children}
        </MainComponent>
    </Background>
  );
}
