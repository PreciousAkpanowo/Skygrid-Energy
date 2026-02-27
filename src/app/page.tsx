import { Header } from "@/components/header";
import { SolarNeighborTradingHome } from "@/components/solar-neighbor-trading-home";
import { SkyGridFooter } from "@/components/skygrid-footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <SolarNeighborTradingHome />
      <SkyGridFooter />
    </main>
  );
}