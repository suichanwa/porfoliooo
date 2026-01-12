import type { ReactNode } from "react";
import { Canvas, type ThreeEvent } from "@react-three/fiber";

interface PlanetariumCanvasProps {
  children?: ReactNode;
  onPointerMissed?: (event: ThreeEvent<PointerEvent>) => void;
  dpr?: number | [number, number];
}

export default function PlanetariumCanvas({
  children,
  onPointerMissed,
  dpr = [1, 1.5]
}: PlanetariumCanvasProps) {
  return (
    <div
      className="planetarium-canvas"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0
      }}
    >
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 20], fov: 45, near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={onPointerMissed}
      >
        <color attach="background" args={["#05070d"]} />
        {children}
      </Canvas>
    </div>
  );
}
