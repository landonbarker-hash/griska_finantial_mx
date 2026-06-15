import React, { useEffect } from "react";

interface DashboardIframeProps {
  onLogout: () => void;
}

export const DashboardIframe: React.FC<DashboardIframeProps> = ({ onLogout }) => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data === "logout") {
        console.log("Logged out from embedded dashboard");
        onLogout();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [onLogout]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-black">
      <iframe
        src="/dashboard/index.html"
        title="Griska Financial Dashboard"
        className="w-full h-full border-0 m-0 p-0"
        style={{ width: "100%", height: "100%", border: 0 }}
      />
    </div>
  );
};
