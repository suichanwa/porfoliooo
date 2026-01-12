import type { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";

interface PlanetariumCanvasProps {
  children?: ReactNode;
}

export default function PlanetariumCanvas({ children }: PlanetariumCanvasProps) {
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
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 20], fov: 45, near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#05070d"]} />
        {children}
      </Canvas>
    </div>
  );
}
