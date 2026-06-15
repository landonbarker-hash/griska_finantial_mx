import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { CanvasRevealEffect } from "@/components/ui/canvas-reveal";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

interface SignInPageProps {
  onSuccess: () => void;
  className?: string;
}

// Custom SVG Logistics Network Logo — must be declared at module scope
const LogisticsLogo = () => (
  <svg 
    className="w-8 h-8 text-teal-400" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    {/* Node connections */}
    <path d="M4 20 L9 15 M9 15 L16 15 M16 15 L20 11 M9 15 L15 7 M15 7 L20 7 M4 9 L11 9 M11 9 L15 15 M15 15 L18 20" />
    {/* Nodes (Circles) */}
    <circle cx="4" cy="20" r="1.5" className="fill-teal-400 stroke-teal-400" />
    <circle cx="20" cy="11" r="1.5" className="fill-teal-400 stroke-teal-400" />
    <circle cx="20" cy="7" r="1.5" className="fill-teal-400 stroke-teal-400" />
    <circle cx="4" cy="9" r="1.5" className="fill-teal-400 stroke-teal-400" />
    <circle cx="18" cy="20" r="1.5" className="fill-teal-400 stroke-teal-400" />
    <circle cx="9" cy="15" r="1" className="fill-white stroke-white" />
    <circle cx="15" cy="7" r="1" className="fill-white stroke-white" />
    <circle cx="11" cy="9" r="1" className="fill-white stroke-white" />
    <circle cx="15" cy="15" r="1" className="fill-white stroke-white" />
  </svg>
);

export const SignInPage = ({ onSuccess, className }: SignInPageProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Por favor completa todos los campos.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    // Simulate API authorization
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess();
    }, 800);
  };


  return (
    <div className={cn("flex w-full flex-col min-h-screen bg-black relative overflow-hidden font-sans", className)}>
      
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0">
          <CanvasRevealEffect
            animationSpeed={3}
            containerClassName="bg-black"
            colors={[
              [20, 184, 166], // Teal
              [115, 115, 115], // Grey
            ]}
            dotSize={4}
            reverse={false}
          />
        </div>
        
        {/* Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.75)_0%,_rgba(0,0,0,1)_100%)]" />
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-black to-transparent" />
      </div>

      {/* Header Layer */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        {/* Logo Left */}
        <div className="flex items-center gap-2">
          <span className="font-display tracking-widest text-2xl font-bold text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.3)]">
            GRISKA
          </span>
        </div>

        {/* Links Right */}
        <nav className="flex items-center gap-6 md:gap-8 text-xs md:text-sm font-medium">
          <a href="#services" className="text-zinc-400 hover:text-zinc-200 transition-colors">Services</a>
          <a href="#network" className="text-zinc-400 hover:text-zinc-200 transition-colors">Network</a>
          <a href="#solutions" className="text-zinc-400 hover:text-zinc-200 transition-colors">Solutions</a>
          <a href="#contact" className="text-zinc-400 hover:text-zinc-200 transition-colors">Contact</a>
        </nav>
      </header>

      {/* Main Content Layer */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        
        {/* Glassmorphic Login Card */}
        <div className="w-full max-w-[430px] rounded-[24px] border border-white/10 bg-zinc-950/40 p-10 backdrop-blur-xl shadow-2xl relative">
          
          {/* Card Content */}
          <div className="flex flex-col items-center text-center space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col items-center space-y-2">
              <div className="flex items-center gap-2">
                <LogisticsLogo />
                <span className="text-2xl font-bold tracking-wider text-white font-sans">
                  GRISKA
                </span>
              </div>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-300 font-sans pt-1">
                LOGISTICS & SUPPLY CHAIN
              </h2>
              <p className="text-xs text-zinc-400 font-medium">
                Sign in to your Griska dashboard.
              </p>
            </div>

            {/* Error display */}
            {error && (
              <div className="w-full text-xs text-red-400 bg-red-500/10 border border-red-500/20 py-2.5 px-4 rounded-xl text-left">
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-4 text-left">
              
              {/* Username Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider pl-1">
                  Email or Username
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="john.doe@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/60 text-white placeholder-zinc-700 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-xs focus:outline-none focus:border-teal-500/50 transition-all focus:ring-1 focus:ring-teal-500/20"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Password
                  </label>
                </div>
                
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/60 text-white placeholder-zinc-700 border border-white/10 rounded-xl py-3.5 pl-11 pr-12 text-xs focus:outline-none focus:border-teal-500/50 transition-all focus:ring-1 focus:ring-teal-500/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="text-right pt-0.5">
                  <a href="#forgot" className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors">
                    Forgot Password?
                  </a>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full relative group mt-4 overflow-hidden rounded-xl bg-gradient-to-r from-teal-400 to-emerald-400 py-3.5 text-xs font-bold text-black hover:opacity-95 transition-all shadow-lg shadow-teal-500/20 cursor-pointer"
              >
                {/* Button soft glow behind */}
                <div className="absolute inset-0 rounded-xl bg-teal-300/30 opacity-0 group-hover:opacity-100 blur transition-all duration-300" />
                <span className="relative">
                  {isSubmitting ? "SIGNING IN..." : "SIGN IN"}
                </span>
              </button>

            </form>

            {/* Bottom Account Text */}
            <div className="text-[11px] text-zinc-500">
              Don't have an account?{" "}
              <a href="#signup" className="text-teal-400 hover:text-teal-300 transition-colors font-medium">
                Create one.
              </a>
            </div>

          </div>
        </div>

      </div>

      {/* Footer Layer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 text-center text-[10px] text-zinc-600 border-t border-zinc-950">
        © 2024 GRISKA Global Logistics. All rights reserved. | Privacy Policy | Terms of Service
      </footer>

    </div>
  );
};
