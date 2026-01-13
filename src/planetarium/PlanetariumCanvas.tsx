import { useEffect, type ReactNode } from "react";
import { Canvas, type ThreeEvent, useThree } from "@react-three/fiber";
import * as THREE from "three";

function RendererTuning() {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.2;
  }, [gl]);

  return null;
}

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
        height: "100%"
      }}
    >
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 20], fov: 45, near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={onPointerMissed}
      >
        <color attach="background" args={["#05070d"]} />
        <RendererTuning />
        {children}
      </Canvas>
    </div>
  );
}
