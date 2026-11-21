import { memo, useEffect, useState, type ReactNode } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";

function RendererTuning() {
  const { gl } = useThree();

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
  }, [gl]);

  return null;
}

interface PlanetariumCanvasProps {
  children?: ReactNode;
  onPointerMissed?: (event: MouseEvent) => void;
  dpr?: number | [number, number];
  antialias?: boolean;
}

function PlanetariumCanvas({
  children,
  onPointerMissed,
  dpr = [1, 1.5],
  antialias = true
}: PlanetariumCanvasProps) {
  const [frameloop, setFrameloop] = useState<"always" | "never">("always");

  useEffect(() => {
    const handleVisibilityChange = () => {
      setFrameloop(document.hidden ? "never" : "always");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <div
      className="planetarium-canvas"
      onContextMenu={(e) => e.preventDefault()}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%"
      }}
    >
      <Canvas
        frameloop={frameloop}
        dpr={dpr}
        camera={{ position: [0, 0, 20], fov: 45, near: 0.1, far: 3500 }}
        gl={{
          antialias,
          alpha: false,
          stencil: false,
          powerPreference: "high-performance"
        }}
        onPointerMissed={onPointerMissed}
      >
        <color attach="background" args={["#05070d"]} />
        <RendererTuning />
        {children}
      </Canvas>
    </div>
  );
}

export default memo(PlanetariumCanvas);
