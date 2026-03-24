import StarryCanvas from "../Starry/StarryCanvas";
import useDeviceInfo from "../../hooks/useDeviceInfo";
import useIsClient from "../../hooks/useIsClient";

export default function PlanetariumBackground() {
  const isClient = useIsClient();
  const deviceInfo = useDeviceInfo(isClient);

  if (!isClient) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        background:
          "radial-gradient(circle at 20% 20%, rgba(45, 90, 120, 0.35), transparent 50%)," +
          "radial-gradient(circle at 80% 30%, rgba(90, 50, 120, 0.25), transparent 55%)," +
          "linear-gradient(135deg, #08121f 0%, #0b1a2b 40%, #0a0f1a 100%)"
      }}
    >
      <StarryCanvas
        showConstellations={true}
        deviceInfo={deviceInfo}
        isClient={isClient}
      />
    </div>
  );
}
