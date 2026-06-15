import React, { useState, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "@/lib/utils";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

// Mock Link to replace next/link in Vite environment
const Link = ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
  <a href={href} className={className}>
    {children}
  </a>
);

// 1. UNIFIED THREE.JS BACKGROUND COMPONENT (renders dense round dots and connected lines)
export const CanvasRevealEffect = ({
  animationSpeed = 3,
  dotSize = 0.14,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => {
  return (
    <div 
      className="absolute inset-0 z-0 overflow-hidden w-full h-full"
      style={{
        background: "radial-gradient(circle at center, #072e2a 0%, #021110 50%, #000000 100%)"
      }}
    >
      <Canvas 
        camera={{ position: [0, 0, 8], fov: 60 }} 
        className="w-full h-full"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 0 }}
      >
        <ambientLight intensity={0.5} />
        <UnifiedGridPlexus speed={animationSpeed} dotSize={dotSize} />
      </Canvas>
    </div>
  );
};

const UnifiedGridPlexus = ({ speed, dotSize }: { speed: number; dotSize: number }) => {
  const cols = 65;
  const rows = 40;
  const count = cols * rows;
  const spacing = 0.35;

  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Generate dynamic circular texture to ensure dots are perfectly round and glowing (not blocky squares)
  const dotTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      // Draw a soft glowing circular point
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
      gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.85)");
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  // Set up random seed data and coordinates
  const [initialPositions, randOffsets, cyanFlags] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const offsets = new Float32Array(count);
    const cyan = new Uint8Array(count);

    const startX = -((cols - 1) * spacing) / 2;
    const startY = -((rows - 1) * spacing) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        pos[i * 3] = startX + c * spacing;
        pos[i * 3 + 1] = startY + r * spacing;
        pos[i * 3 + 2] = 0;

        offsets[i] = Math.random() * Math.PI * 2;
        cyan[i] = Math.random() > 0.96 ? 1 : 0; // 4% of grid points are teal/cyan
      }
    }
    return [pos, offsets, cyan];
  }, [cols, rows, spacing]);

  // Points buffer geometry
  const pointsGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(initialPositions.slice(), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return geo;
  }, [initialPositions, count]);

  // Lines buffer geometry (maximum potential neighbors connections)
  const maxConnections = count * 4;
  const linesGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(maxConnections * 2 * 3), 3));
    geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(maxConnections * 2 * 3), 3));
    return geo;
  }, [maxConnections]);

  useFrame(({ clock }) => {
    if (!pointsRef.current || !linesRef.current) return;

    const time = clock.getElapsedTime() * (speed * 0.18);
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const colors = pointsRef.current.geometry.attributes.color.array as Float32Array;
    const linePositions = linesRef.current.geometry.attributes.position.array as Float32Array;
    const lineColors = linesRef.current.geometry.attributes.color.array as Float32Array;

    const startX = -((cols - 1) * spacing) / 2;
    const startY = -((rows - 1) * spacing) / 2;

    // 1. Update grid positions and vertex colors (brightness columns and vignette fade)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const idx = i * 3;

        // Calculate columns wave pattern (vertical bands of brightness)
        const vBand = Math.sin(c * 0.15 + time * 2.2) * 0.28 + 0.72;
        const hBand = Math.sin(r * 0.08 - time * 0.8) * 0.12 + 0.88;

        // Soft twinkling
        const twinkle = Math.sin(time * 3.5 + randOffsets[i]) * 0.18 + 0.82;

        // Vignette effect (radial fade from center of the screen)
        const dx = c - cols / 2;
        const dy = r - rows / 2;
        const distToCenter = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.sqrt((cols / 2) * (cols / 2) + (rows / 2) * (rows / 2));
        const radialFade = Math.max(0, 1.0 - distToCenter / (maxDist * 0.95));
        const vignette = Math.pow(radialFade, 1.8);

        // Mix grey/white base with cyan accent flag
        const isCyan = cyanFlags[i] === 1;
        
        // Let center-glow colorize white dots slightly cyan
        const centerTealStrength = Math.max(0, 1.0 - distToCenter / (cols * 0.25)) * 0.4;
        
        let rColor = isCyan ? 20 / 255 : (200 + centerTealStrength * 20) / 255;
        let gColor = isCyan ? 240 / 255 : (210 + centerTealStrength * 30) / 255;
        let bColor = isCyan ? 220 / 255 : (215 + centerTealStrength * 10) / 255;

        // Final brightness factor
        const brightness = vBand * hBand * twinkle * vignette * 1.15;

        colors[idx] = Math.min(1.0, rColor * brightness);
        colors[idx + 1] = Math.min(1.0, gColor * brightness);
        colors[idx + 2] = Math.min(1.0, bColor * brightness);

        // Subtle organic float displacement
        const waveX = Math.sin(time * 1.5 + r * 0.12 + randOffsets[i]) * 0.022;
        const waveY = Math.cos(time * 1.5 + c * 0.12 + randOffsets[i]) * 0.022;

        positions[idx] = startX + c * spacing + waveX;
        positions[idx + 1] = startY + r * spacing + waveY;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;

    // 2. Build connecting plexus lines segments dynamically
    let lineIdx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const x1 = positions[i * 3];
        const y1 = positions[i * 3 + 1];
        const z1 = positions[i * 3 + 2];

        // Read node color/brightness
        const rVal1 = colors[i * 3];

        const addLine = (targetCol: number, targetRow: number) => {
          if (targetCol >= cols || targetRow >= rows || targetCol < 0) return;
          const j = targetRow * cols + targetCol;

          // Connect dynamically if nodes pass a wave condition (keeps plexus changing organically)
          const connectionChance = Math.sin(time * 2.8 + (c + targetCol) * 0.35 + (r + targetRow) * 0.35 + randOffsets[i]);
          if (connectionChance < 0.28) return;

          const x2 = positions[j * 3];
          const y2 = positions[j * 3 + 1];
          const z2 = positions[j * 3 + 2];

          const rVal2 = colors[j * 3];
          const avgBrightness = (rVal1 + rVal2) * 0.55;

          if (avgBrightness < 0.15) return; // skip drawing lines in dark vignette areas

          const lIdx = lineIdx * 6;
          linePositions[lIdx] = x1;
          linePositions[lIdx + 1] = y1;
          linePositions[lIdx + 2] = z1;
          linePositions[lIdx + 3] = x2;
          linePositions[lIdx + 4] = y2;
          linePositions[lIdx + 5] = z2;

          // Connect lines with glowing cyan color, boosted by average brightness
          const lineBrightness = Math.max(0.3, avgBrightness) * 1.5;
          lineColors[lIdx] = 20 / 255 * lineBrightness;
          lineColors[lIdx + 1] = 230 / 255 * lineBrightness;
          lineColors[lIdx + 2] = 210 / 255 * lineBrightness;

          lineColors[lIdx + 3] = 20 / 255 * lineBrightness;
          lineColors[lIdx + 4] = 230 / 255 * lineBrightness;
          lineColors[lIdx + 5] = 210 / 255 * lineBrightness;

          lineIdx++;
        };

        // Neighbor checks
        addLine(c + 1, r);
        addLine(c, r + 1);
        addLine(c + 1, r + 1);
        addLine(c - 1, r + 1);
      }
    }

    linesRef.current.geometry.attributes.position.needsUpdate = true;
    linesRef.current.geometry.attributes.color.needsUpdate = true;
    linesRef.current.geometry.setDrawRange(0, lineIdx * 2);
  });

  return (
    <group>
      {/* Grid circular dots (perfectly round using CanvasTexture) */}
      <points ref={pointsRef} geometry={pointsGeometry}>
        <pointsMaterial
          size={dotSize}
          sizeAttenuation={true}
          vertexColors={true}
          map={dotTexture}
          transparent={true}
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Grid connecting plexus lines */}
      <lineSegments ref={linesRef} geometry={linesGeometry}>
        <lineBasicMaterial
          vertexColors={true}
          transparent={true}
          opacity={0.45}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
};

// 2. OFFICIAL GRISKA CHEVRON LOGO & NAVBAR
const GriskaLogo = ({ className = "h-11" }: { className?: string }) => (
  <div className={cn("flex items-center gap-3.5 select-none", className)}>
    {/* SVG Arrow */}
    <svg viewBox="0 0 24 24" className="w-11 h-11" fill="none">
      {/* Upper leg: Light Blue */}
      <path d="M 2 12 L 14 0 L 22 0 L 10 12 Z" fill="#8ec0f4" />
      {/* Lower-left leg: Medium Blue */}
      <path d="M 2 12 L 6 12 L 18 24 L 14 24 Z" fill="#2b82c9" />
      {/* Lower-right leg: Dark Blue */}
      <path d="M 6 12 L 10 12 L 22 24 L 18 24 Z" fill="#0f62ac" />
    </svg>
    {/* lowercase bold white 'griska' with trademark symbol */}
    <span className="text-3xl font-extrabold tracking-tight text-white font-sans lowercase flex items-start">
      griska<span className="text-[12px] font-normal align-super ml-0.5 mt-0.5">®</span>
    </span>
  </div>
);

const MiniNavbar = () => {
  return (
    <header className="relative z-30 w-full max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
      <GriskaLogo className="h-8" />
      <nav className="flex items-center gap-6 md:gap-8 text-xs font-semibold tracking-wider font-sans">
        <a href="#services" className="text-zinc-500 hover:text-zinc-200 transition-colors duration-200">Services</a>
        <a href="#network" className="text-zinc-500 hover:text-zinc-200 transition-colors duration-200">Network</a>
        <a href="#solutions" className="text-zinc-500 hover:text-zinc-200 transition-colors duration-200">Solutions</a>
        <a href="#contact" className="text-zinc-500 hover:text-zinc-200 transition-colors duration-200">Contact</a>
      </nav>
    </header>
  );
};

// 3. MAIN SIGN-IN PAGE COMPONENT
export const SignInPage = ({ onSuccess, className }: { onSuccess?: () => void; className?: string }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [btnHovered, setBtnHovered] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    
    setIsSubmitting(true);
    setError("");
    
    setTimeout(() => {
      setIsSubmitting(false);
      if (onSuccess) onSuccess();
    }, 850);
  };

  return (
    <div className={cn("flex w-full flex-col h-screen bg-black relative overflow-hidden select-none", className)}>
      
      {/* Background layering (Three.js Unified grid + overlay) */}
      <div className="absolute inset-0 z-0">
        <CanvasRevealEffect animationSpeed={3} dotSize={0.14} />
      </div>

      <MiniNavbar />

      <div className="relative z-30 flex-1 flex flex-col items-center justify-center px-4">
        
        {/* Glassmorphic Login Card (highly translucent 35% opacity to let center teal glow shine through blurred) */}
        <div className="w-full max-w-[430px] rounded-[24px] border border-white/12 bg-[#090d0b]/35 p-10 backdrop-blur-3xl shadow-2xl relative">
          
          <div className="flex flex-col items-center text-center space-y-6">
            
            {/* Logo and Brand Title */}
            <div className="flex flex-col items-center space-y-2">
              <GriskaLogo className="h-9" />
              <h2 className="text-[11px] font-bold uppercase tracking-[0.25em] text-zinc-300 pt-1">
                LOGISTICS & SUPPLY CHAIN
              </h2>
              <p className="text-[11px] text-zinc-400 font-medium font-semibold tracking-wide">
                Sign in to your Griska dashboard.
              </p>
            </div>

            {error && (
              <div className="w-full text-xs text-red-400 bg-red-500/10 border border-red-500/20 py-2.5 px-4 rounded-xl text-left">
                {error}
              </div>
            )}

            {/* Login Inputs */}
            <form onSubmit={handleSubmit} className="w-full space-y-5 text-left font-medium">
              
              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs text-zinc-400 pl-1 font-semibold">
                  Email or Username
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="john.doe@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/60 text-white placeholder-zinc-700 border border-[#14b8a6]/20 focus:border-[#14b8a6]/70 rounded-[10px] py-3.5 pl-11 pr-4 text-xs focus:outline-none transition-all focus:ring-1 focus:ring-teal-500/20 font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs text-zinc-400 font-semibold">
                    Password
                  </label>
                </div>
                
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-4 h-4 text-zinc-500" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/60 text-white placeholder-zinc-700 border border-[#14b8a6]/20 focus:border-[#14b8a6]/70 rounded-[10px] py-3.5 pl-11 pr-12 text-xs focus:outline-none transition-all focus:ring-1 focus:ring-teal-500/20 font-semibold"
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

                <div className="text-right pt-1">
                  <a href="#forgot" className="text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors font-semibold">
                    Forgot Password?
                  </a>
                </div>
              </div>

              {/* SIGN IN Gradient Button with animated inline glowing shadow */}
              <button
                type="submit"
                disabled={isSubmitting}
                onMouseEnter={() => setBtnHovered(true)}
                onMouseLeave={() => setBtnHovered(false)}
                className="w-full relative group mt-4 overflow-hidden rounded-[10px] bg-gradient-to-r from-teal-400 to-cyan-400 py-3.5 text-xs font-bold text-zinc-950 hover:opacity-95 transition-all cursor-pointer tracking-widest"
                style={{
                  boxShadow: btnHovered 
                    ? "0 0 35px rgba(20, 184, 166, 0.85), 0 0 70px rgba(20, 184, 166, 0.4)" 
                    : "0 0 20px rgba(20, 184, 166, 0.45), 0 0 40px rgba(20, 184, 166, 0.22)",
                  transition: "all 0.3s ease"
                }}
              >
                {/* Hover animation soft overlay */}
                <div className="absolute inset-0 rounded-[10px] bg-teal-300/30 opacity-0 group-hover:opacity-100 blur transition-all duration-300" />
                <span className="relative font-bold">
                  {isSubmitting ? "SIGNING IN..." : "SIGN IN"}
                </span>
              </button>

            </form>

            {/* Create One */}
            <div className="text-xs text-zinc-500 font-semibold">
              Don't have an account?{" "}
              <Link href="#signup" className="text-teal-400 hover:text-teal-300 transition-colors font-bold">
                Create one.
              </Link>
            </div>

          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="relative z-30 w-full max-w-7xl mx-auto px-8 py-6 text-center text-[10px] text-zinc-600 border-t border-zinc-950/80">
        © 2024 GRISKA Global Logistics. All rights reserved. | Privacy Policy | Terms of Service
      </footer>

    </div>
  );
};
