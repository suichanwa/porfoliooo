import { useState, useCallback } from "react";
import StarryCanvas from "./StarryCanvas";
import StarryControlButton from "./StarryControlButton";
import StarryControlPanel from "./StarryControlPanel";
import StarryNebulae from "./StarryNebulae";
import useDeviceInfo from "../../hooks/useDeviceInfo";
import useIsClient from "../../hooks/useIsClient";
import useNeptuneBackground from "../../hooks/useNeptuneBackground";
import useNeptuneTransition from "../../hooks/useNeptuneTransition";

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
  const [enableNebulae, setEnableNebulae] = useState(true);

  const isClient = useIsClient();
  const deviceInfo = useDeviceInfo(isClient);
  const neptuneTransitionProgress = useNeptuneTransition({
    enabled: enableNeptuneTransition,
    sectionId: neptuneSectionId,
    isClient
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
        enableNebulae={enableNebulae}
        hideGUI={hideGUI}
        onToggleConstellations={() => setShowConstellations(!showConstellations)}
        onToggleNebulae={() => setEnableNebulae(!enableNebulae)}
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
        <StarryNebulae enabled={enableNebulae} isLowEnd={deviceInfo.isLowEnd} />
        <StarryCanvas
          showConstellations={showConstellations}
          deviceInfo={deviceInfo}
          isClient={isClient}
        />
      </div>
    </>
  );
}
