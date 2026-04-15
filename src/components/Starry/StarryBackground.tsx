import { useState, useCallback } from "react";
import StarryCanvas from "./StarryCanvas";
import StarryControlButton from "./StarryControlButton";
import StarryControlPanel from "./StarryControlPanel";
import useDeviceInfo from "../../hooks/useDeviceInfo";
import useIsClient from "../../hooks/useIsClient";
import useNeptuneBackground from "../../hooks/useNeptuneBackground";
import useNeptuneTransition from "../../hooks/useNeptuneTransition";
import useScrollParallax from "../../hooks/useScrollParallax";

interface StarryBackgroundProps {
  onHideGUI?: (hidden: boolean) => void;
  enableNeptuneTransition?: boolean;
  neptuneSectionId?: string;
}

export default function StarryBackground({
  onHideGUI,
  enableNeptuneTransition = false,
  neptuneSectionId = "neptune-widget"
}: StarryBackgroundProps) {
  const [showConstellations, setShowConstellations] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [hideGUI, setHideGUI] = useState(false);

  const isClient = useIsClient();
  const deviceInfo = useDeviceInfo(isClient);
  const neptuneTransitionProgress = useNeptuneTransition({
    enabled: enableNeptuneTransition,
    sectionId: neptuneSectionId,
    isClient
  });
  const canvasParallaxOffset = useScrollParallax({
    isClient,
    disabled: deviceInfo.prefersReducedMotion,
    strength: deviceInfo.isMobile ? 0.045 : 0.07,
    maxOffset: deviceInfo.isMobile ? 18 : 32
  });
  const dynamicBackground = useNeptuneBackground(neptuneTransitionProgress);

  const handleHideGUI = useCallback(() => {
    const newHideState = !hideGUI;
    setHideGUI(newHideState);
    if (newHideState) setIsPanelOpen(false);
    onHideGUI?.(newHideState);
  }, [hideGUI, onHideGUI]);

  if (!isClient) return null;

  return (
    <>
      <StarryControlButton
        hideGUI={hideGUI}
        isPanelOpen={isPanelOpen}
        onClick={() => setIsPanelOpen(!isPanelOpen)}
      />

      <StarryControlPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        showConstellations={showConstellations}
        hideGUI={hideGUI}
        onToggleConstellations={() => setShowConstellations(!showConstellations)}
        onToggleHideGUI={handleHideGUI}
      />

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
          background: dynamicBackground,
          transition: "background 0.3s ease-out"
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "-4%",
            transform: `translate3d(0, ${canvasParallaxOffset}px, 0) scale(1.06)`,
            transformOrigin: "center top",
            transition: deviceInfo.prefersReducedMotion
              ? "none"
              : "transform 220ms ease-out",
            willChange: "transform"
          }}
        >
          <StarryCanvas
            showConstellations={showConstellations}
            deviceInfo={deviceInfo}
            isClient={isClient}
          />
        </div>
      </div>
    </>
  );
}
