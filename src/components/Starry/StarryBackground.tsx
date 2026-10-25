import { useState, useCallback, useEffect } from "react";
import StarryCanvas from "./StarryCanvas";
import StarryControlButton from "./StarryControlButton";
import StarryControlPanel from "./StarryControlPanel";
import {
  DEFAULT_OBSERVATORY_CONFIG,
  type ObservatoryConfig
} from "./types/starry";
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
  const [config, setConfig] = useState<ObservatoryConfig>(DEFAULT_OBSERVATORY_CONFIG);
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

  // Safe SSR hydration from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("porfoliooo_observatory_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        setConfig((prev) => ({
          ...prev,
          ...parsed
        }));
      }
    } catch {}
  }, []);

  const updateConfig = useCallback(
    (patch: Partial<ObservatoryConfig> | ((prev: ObservatoryConfig) => ObservatoryConfig)) => {
      setConfig((prev) => {
        const next = typeof patch === "function" ? patch(prev) : { ...prev, ...patch };
        try {
          localStorage.setItem("porfoliooo_observatory_config", JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    []
  );

  useEffect(() => {
    const handleNavChange = () => {
      if (document.body.classList.contains("menu-open-active")) {
        setIsPanelOpen(false);
      }
    };
    const observer = new MutationObserver(handleNavChange);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

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
        config={config}
        onUpdateConfig={updateConfig}
        hideGUI={hideGUI}
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
        {/* Celestial Lens: Deep-Space Sculpted Nebula Ribbons */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-[-10%] transition-opacity duration-1000 ${
            config.celestialLens === "nebula" ? "opacity-100" : "opacity-0"
          }`}
          style={{
            transform: "rotate(-18deg)",
            transformOrigin: "center center",
            background: `
              radial-gradient(ellipse 45% 28% at 78% 38%, rgba(94, 159, 255, 0.16) 0%, rgba(37, 99, 235, 0.07) 45%, transparent 75%),
              radial-gradient(ellipse 50% 30% at 65% 78%, rgba(199, 146, 234, 0.13) 0%, rgba(126, 34, 206, 0.06) 50%, transparent 75%),
              radial-gradient(ellipse 38% 22% at 18% 18%, rgba(94, 159, 255, 0.09) 0%, rgba(199, 146, 234, 0.04) 50%, transparent 70%)
            `,
            filter: "blur(40px)",
            mixBlendMode: "screen",
            willChange: "opacity"
          }}
        />

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
            showConstellations={config.showConstellations}
            celestialLens={config.celestialLens}
            deviceInfo={deviceInfo}
            isClient={isClient}
          />
        </div>
      </div>
    </>
  );
}
