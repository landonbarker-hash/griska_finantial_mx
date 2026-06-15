import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

export const CanvasRevealEffect = ({
  colors = [[20, 184, 166]],
  containerClassName,
  showGradient = true,
}: {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
  reverse?: boolean;
}) => {
  const color = colors[0] || [20, 184, 166];
  const hexColor = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

  return (
    <div className={`h-full w-full relative ${containerClassName || ""}`}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        className="absolute inset-0 h-full w-full z-0"
      >
        <ambientLight intensity={0.5} />
        <GridPlexusParticles color={hexColor} />
      </Canvas>
      {showGradient && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_20%,_#000000_90%)] pointer-events-none z-10" />
      )}
    </div>
  );
};

const GridPlexusParticles = ({ color }: { color: string }) => {
  const cols = 55;
  const rows = 35;
  const count = cols * rows;
  const spacing = 0.52;

  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  // Initialize fixed grid positions
  const [initialPositions, randOffsets] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const offsets = new Float32Array(count);
    
    const startX = -((cols - 1) * spacing) / 2;
    const startY = -((rows - 1) * spacing) / 2;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        pos[i * 3] = startX + c * spacing;
        pos[i * 3 + 1] = startY + r * spacing;
        pos[i * 3 + 2] = 0; // z position starts flat

        offsets[i] = Math.random() * Math.PI * 2; // random phase for animations
      }
    }
    return [pos, offsets];
  }, [cols, rows, spacing]);

  // Points geometry mapping position buffer attribute
  const pointsGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(initialPositions.slice(), 3));
    return geo;
  }, [initialPositions]);

  // Max possible line segments (each node connects to right, down, and two diagonals)
  const maxConnections = count * 4;
  const linesGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(maxConnections * 2 * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [maxConnections]);

  useFrame(({ clock }) => {
    if (!pointsRef.current || !linesRef.current) return;

    const time = clock.getElapsedTime();
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const linePositions = linesRef.current.geometry.attributes.position.array as Float32Array;

    // 1. Update grid positions with a subtle wave drift
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const idx = i * 3;
        const offset = randOffsets[i];

        // Apply a slow 3D sine wave to make the grid breathe
        const waveX = Math.sin(time * 0.4 + c * 0.1 + r * 0.05 + offset) * 0.04;
        const waveY = Math.cos(time * 0.4 + r * 0.1 + c * 0.05 + offset) * 0.04;
        const waveZ = Math.sin(time * 0.6 + c * 0.15 + r * 0.15) * 0.35;

        const startX = -((cols - 1) * spacing) / 2 + c * spacing;
        const startY = -((rows - 1) * spacing) / 2 + r * spacing;

        positions[idx] = startX + waveX;
        positions[idx + 1] = startY + waveY;
        positions[idx + 2] = waveZ;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;

    // 2. Build line connections between grid neighbors dynamically
    let lineIdx = 0;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const x1 = positions[i * 3];
        const y1 = positions[i * 3 + 1];
        const z1 = positions[i * 3 + 2];

        // Helper to add line
        const addLine = (targetCol: number, targetRow: number) => {
          if (targetCol >= cols || targetRow >= rows || targetCol < 0) return;
          const j = targetRow * cols + targetCol;
          
          // Animate line connections based on time and coordinates
          const noise = Math.sin(time * 1.5 + (c + targetCol) * 0.4 + (r + targetRow) * 0.4 + randOffsets[i]);
          if (noise < 0.25) return; // Only connect some lines dynamically

          const x2 = positions[j * 3];
          const y2 = positions[j * 3 + 1];
          const z2 = positions[j * 3 + 2];

          const lIdx = lineIdx * 6;
          linePositions[lIdx] = x1;
          linePositions[lIdx + 1] = y1;
          linePositions[lIdx + 2] = z1;

          linePositions[lIdx + 3] = x2;
          linePositions[lIdx + 4] = y2;
          linePositions[lIdx + 5] = z2;
          lineIdx++;
        };

        // Connect to right neighbor
        addLine(c + 1, r);
        // Connect to bottom neighbor
        addLine(c, r + 1);
        // Connect to bottom-right diagonal
        addLine(c + 1, r + 1);
        // Connect to bottom-left diagonal
        addLine(c - 1, r + 1);
      }
    }

    linesRef.current.geometry.attributes.position.needsUpdate = true;
    linesRef.current.geometry.setDrawRange(0, lineIdx * 2);
  });

  return (
    <group>
      {/* Render Grid Dots */}
      <points ref={pointsRef} geometry={pointsGeometry}>
        <pointsMaterial
          color={color}
          size={0.16}
          sizeAttenuation={true}
          transparent={true}
          opacity={0.65}
        />
      </points>

      {/* Render Connecting Grid Lines */}
      <lineSegments ref={linesRef} geometry={linesGeometry}>
        <lineBasicMaterial
          color={color}
          transparent={true}
          opacity={0.18}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
};
