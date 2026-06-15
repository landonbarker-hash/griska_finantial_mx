import Hero from "@/components/ui/animated-shader-hero";

interface HeroDemoProps {
  onEnterDashboard?: () => void;
}

// Demo Component showing how to use the Hero
const HeroDemo: React.FC<HeroDemoProps> = ({ onEnterDashboard }) => {
  const handlePrimaryClick = () => {
    if (onEnterDashboard) {
      onEnterDashboard();
    } else {
      console.log('Ingresar al portal');
    }
  };

  return (
    <Hero
      trustBadge={{
        text: "Streamlining global supply chain finance with unified intelligence."
      }}
      headline={{
        line1: "Financial Portal",
        line2: "Global by Griska"
      }}
      financialMetrics={[
        { label: "Freight", sublabel: "Cost Intelligence" },
        { label: "Customs", sublabel: "Bill Analytics" },
        { label: "EBITDA", sublabel: "Margin Scoring" },
        { label: "Cash", sublabel: "Flow Applications" }
      ]}
      subtitle={
        <span className="text-zinc-400">
          Real-time financial intelligence for logistics operations —{" "}
          <span className="text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">Freight Auditing</span>,{" "}
          <span className="text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">customs conciliation</span>,{" "}
          <span className="text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">risk management</span>, and{" "}
          <span className="text-cyan-300 font-bold drop-shadow-[0_0_8px_rgba(34,211,238,0.2)]">working capital optimization</span> in one unified platform.
        </span>
      }
      buttons={{
        primary: {
          text: "Financial Dashboard",
          onClick: handlePrimaryClick
        }
      }}
    />
  );
};

export default HeroDemo;
