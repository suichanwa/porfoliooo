import useStarfieldCanvas from "../../hooks/useStarfieldCanvas";
import type { DeviceInfo } from "../../hooks/useDeviceInfo";
import type { CelestialLens } from "./types/starry";
import ShootingStars from "./ShootingStars";

interface StarryCanvasProps {
  showConstellations: boolean;
  celestialLens?: CelestialLens;
  deviceInfo: DeviceInfo;
  isClient: boolean;
}

export default function StarryCanvas({
  showConstellations,
  celestialLens = "void",
  deviceInfo,
  isClient
}: StarryCanvasProps) {
  const canvasRef = useStarfieldCanvas({
    showConstellations,
    celestialLens,
    deviceInfo,
    isClient
  });

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "block"
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "block"
        }}
      />
      <ShootingStars
        deviceInfo={deviceInfo}
        isClient={isClient}
      />
    </div>
  );
}
