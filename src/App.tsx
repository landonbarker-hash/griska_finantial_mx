import { useState } from "react";
import HeroDemo from "@/components/ui/demo";
import { DashboardIframe } from "@/components/dashboard/dashboard-iframe";

function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  return (
    <>
      {showDashboard ? (
        <DashboardIframe onLogout={() => setShowDashboard(false)} />
      ) : (
        <HeroDemo onEnterDashboard={() => setShowDashboard(true)} />
      )}
    </>
  );
}

export default App;
