import useStarfieldCanvas from "../../hooks/useStarfieldCanvas";
import type { DeviceInfo } from "../../hooks/useDeviceInfo";
import type { CelestialLens, MeteorFrequency } from "./types/starry";
import ShootingStars from "./ShootingStars";

interface StarryCanvasProps {
  showConstellations: boolean;
  cursorTether?: boolean;
  celestialLens?: CelestialLens;
  meteorFrequency?: MeteorFrequency;
  deviceInfo: DeviceInfo;
  isClient: boolean;
}

export default function StarryCanvas({
  showConstellations,
  cursorTether = false,
  celestialLens = "void",
  meteorFrequency = "normal",
  deviceInfo,
  isClient
}: StarryCanvasProps) {
  const canvasRef = useStarfieldCanvas({
    showConstellations,
    cursorTether,
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
        meteorFrequency={meteorFrequency}
      />
    </div>
  );
}
