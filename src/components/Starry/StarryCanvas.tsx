import useStarfieldCanvas from "../../hooks/useStarfieldCanvas";
import type { DeviceInfo } from "../../hooks/useDeviceInfo";

interface StarryCanvasProps {
  showConstellations: boolean;
  deviceInfo: DeviceInfo;
  isClient: boolean;
}

export default function StarryCanvas({
  showConstellations,
  deviceInfo,
  isClient
}: StarryCanvasProps) {
  const canvasRef = useStarfieldCanvas({ showConstellations, deviceInfo, isClient });

  return (
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
  );
}
