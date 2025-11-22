import Background from "@/components/Background/Background";
import { MainComponent } from "@/components/MainComponent/MainComponent";
import SetContextProvider from "@/context/SetContextProvider";

export default function Layout({ children }: { children: React.ReactNode }) {
  
  return (
    <SetContextProvider>
      <Background fullBackground={true}>
          <MainComponent>
            {children}
          </MainComponent>
      </Background>
    </SetContextProvider>
  );
}
