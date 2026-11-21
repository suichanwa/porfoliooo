import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Eye } from "lucide-react";
import PlanetariumCanvas from "./PlanetariumCanvas";
import PlanetariumScene from "./PlanetariumScene";
import useDeviceInfo from "../hooks/useDeviceInfo";
import useIsClient from "../hooks/useIsClient";
import PlanetInfoPanel from "./ui/PlanetInfoPanel";
import ControlsPanel from "./ui/ControlsPanel";
import PlanetariumNavbar from "./ui/PlanetariumNavbar";
import PerfOverlay from "./ui/PerfOverlay";
import {
  computeDistanceScaleParams,
  computeRenderOrbitRadius
} from "./utils/distanceScale";
import {
  DEFAULT_GRAVITY_SETTINGS,
  type GravitySettings
} from "./gravity/gravityField";
import { trackPlanetariumVisited } from "../utils/firebaseAnalytics";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { SelectionProvider, usePlanetSelection } from "./context/SelectionContext";
import { createSimDateStore } from "./hooks/useSimDateStore";

// Simulation speed presets (days per real second) for the time controls.
const SPEED_LADDER = [0.25, 1, 2, 5, 10, 30, 90, 365, 1825];
const SIGNED_SPEED_LADDER = [
  ...[...SPEED_LADDER].reverse().map((value) => -value),
  ...SPEED_LADDER
];

function PlanetariumView() {
  const { settings, updateSetting } = useSettings();
  const {
    selectedId,
    activeSystemId,
    isInfoVisible,
    resetSignal,
    zoomOutSignal,
    selectPlanet,
    clearSelection,
    setIsFocused
  } = usePlanetSelection();

  const [controlsOpen, setControlsOpen] = useState(false);
  const [uiHidden, setUiHidden] = useState(false);
  const [gravitySettings, setGravitySettings] = useState<GravitySettings>(
    DEFAULT_GRAVITY_SETTINGS
  );
  const simDateStore = useMemo(() => createSimDateStore(Date.now()), []);
  const handleSimDateChange = useCallback(
    (epochMs: number) => {
      simDateStore.set(epochMs);
    },
    [simDateStore]
  );
  const handleToggleControls = useCallback(() => {
    setControlsOpen((prev) => !prev);
  }, []);
  const handleHideUi = useCallback(() => {
    setControlsOpen(false);
    setUiHidden(true);
  }, []);
  const handleShowUi = useCallback(() => {
    setUiHidden(false);
  }, []);
  const prevSpeedRef = useRef(1);
  const [debugGravity, setDebugGravity] = useState(false);
  const hasTrackedVisit = useRef(false);
  const isClient = useIsClient();
  const deviceInfo = useDeviceInfo(isClient);
  const canvasDpr: [number, number] = useMemo(() => {
    if (typeof window === "undefined") return [1, 1.5];
    const nativeDpr = window.devicePixelRatio || 1;
    if (deviceInfo.isLowEnd) return [0.75, 1.0];
    if (deviceInfo.isIntegratedGpu) {
      // Cap integrated GPUs (e.g. Intel Iris on Retina) to 1.25x (~61% fewer pixels than 2.0x)
      return [1.0, Math.min(nativeDpr, 1.25)];
    }
    const maxDpr = Math.min(nativeDpr, 1.75);
    return [1.0, Math.max(1.25, maxDpr)];
  }, [deviceInfo.isIntegratedGpu, deviceInfo.isLowEnd]);

  const distanceScaleParams = useMemo(
    () =>
      computeDistanceScaleParams(
        settings.distanceScaleMode,
        settings.distanceScaleSpacing
      ),
    [settings.distanceScaleMode, settings.distanceScaleSpacing]
  );

  const handleSceneSelect = useCallback(
    (id: string | null) => {
      selectPlanet(id as any, "canvas");
    },
    [selectPlanet]
  );

  const handlePointerMissed = useCallback(
    (event: MouseEvent) => {
      // Only deselect on primary left click, not right-click canvas panning
      if (event.button === 0) {
        clearSelection();
      }
    },
    [clearSelection]
  );

  const handleFaster = useCallback(() => {
    const higher = SIGNED_SPEED_LADDER.find(
      (value) => value > settings.orbitSpeed + 1e-6
    );
    if (higher !== undefined) {
      updateSetting("orbitSpeed", higher);
    }
  }, [settings.orbitSpeed, updateSetting]);

  const handleSlower = useCallback(() => {
    const lower = [...SIGNED_SPEED_LADDER]
      .reverse()
      .find((value) => value < settings.orbitSpeed - 1e-6);
    if (lower !== undefined) {
      updateSetting("orbitSpeed", lower);
    }
  }, [settings.orbitSpeed, updateSetting]);

  const handleTogglePause = useCallback(() => {
    if (settings.orbitSpeed !== 0) {
      prevSpeedRef.current = settings.orbitSpeed;
      updateSetting("orbitSpeed", 0);
    } else {
      updateSetting("orbitSpeed", prevSpeedRef.current || 1);
    }
  }, [settings.orbitSpeed, updateSetting]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (event.key === "h" || event.key === "H") {
        setUiHidden((prev) => {
          if (!prev) setControlsOpen(false);
          return !prev;
        });
      } else if (event.key === "Escape") {
        setUiHidden(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    if (!isClient) return;
    const params = new URLSearchParams(window.location.search);
    setDebugGravity(params.get("debugGravity") === "1");
    if (params.has("perf")) {
      updateSetting("showPerf", params.get("perf") === "1");
    }
  }, [isClient, updateSetting]);

  useEffect(() => {
    if (!isClient || hasTrackedVisit.current) {
      return;
    }

    hasTrackedVisit.current = true;
    void trackPlanetariumVisited({
      isMobile: deviceInfo.isMobile,
      isLowEnd: deviceInfo.isLowEnd,
      prefersReducedMotion: deviceInfo.prefersReducedMotion
    });
  }, [
    deviceInfo.isLowEnd,
    deviceInfo.isMobile,
    deviceInfo.prefersReducedMotion,
    isClient
  ]);

  return (
    <div className="relative h-[calc(100dvh-65px)] overflow-hidden">
      <PlanetariumCanvas
        dpr={canvasDpr}
        antialias={!deviceInfo.isLowEnd}
        onPointerMissed={handlePointerMissed}
      >
        <PlanetariumScene
          showOrbits={settings.showOrbits}
          showLabels={settings.showLabels && !uiHidden}
          showGrid={settings.showGrid}
          selectedId={selectedId}
          activeSystemId={activeSystemId}
          isInfoVisible={isInfoVisible}
          resetSignal={resetSignal}
          zoomOutSignal={zoomOutSignal}
          onSelect={handleSceneSelect}
          isLowEnd={deviceInfo.isLowEnd}
          isIntegratedGpu={deviceInfo.isIntegratedGpu}
          prefersReducedMotion={deviceInfo.prefersReducedMotion}
          onFocusChange={setIsFocused}
          distanceScaleMode={settings.distanceScaleMode}
          distanceScaleParams={distanceScaleParams}
          gravitySettings={gravitySettings}
          debugGravity={debugGravity}
          showPerf={settings.showPerf}
          orbitSpeed={settings.orbitSpeed}
          onSimDateChange={handleSimDateChange}
          useMilkyWayBackground={settings.useMilkyWayBackground}
        />
      </PlanetariumCanvas>

      {!uiHidden ? (
        <>
          <PlanetInfoPanel />

          <ControlsPanel
            isOpen={controlsOpen}
            onToggle={handleToggleControls}
            gravitySettings={gravitySettings}
            onGravityChange={setGravitySettings}
          />

          <PerfOverlay enabled={settings.showPerf} />

          <PlanetariumNavbar
            speed={settings.orbitSpeed}
            isPaused={settings.orbitSpeed === 0}
            onSlower={handleSlower}
            onFaster={handleFaster}
            onTogglePause={handleTogglePause}
            simDateStore={simDateStore}
            onToggleControls={handleToggleControls}
            isControlsOpen={controlsOpen}
            onHideUi={handleHideUi}
            gravitySettings={gravitySettings}
            onGravityChange={setGravitySettings}
          />

          <div className="pointer-events-none fixed bottom-4 left-4 z-20 hidden xl:flex flex-col gap-0.5 text-[10px] uppercase tracking-[0.16em] text-white/40 max-w-[14rem]">
            <div className="truncate">
              {settings.distanceScaleMode} scale - 1 AU ~{" "}
              {computeRenderOrbitRadius(
                1,
                settings.distanceScaleMode,
                distanceScaleParams
              ).toFixed(2)}{" "}
              units
            </div>
            <div className="hidden xl:block truncate">
              Quality: DPR {Array.isArray(canvasDpr) ? canvasDpr[1].toFixed(2) : Number(canvasDpr).toFixed(2)} - Post Off
            </div>
          </div>

          {debugGravity && (
            <div className="pointer-events-none fixed bottom-16 left-4 z-20 text-[10px] uppercase tracking-[0.2em] text-white/50">
              Gravity debug
            </div>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={handleShowUi}
          onPointerDown={(e) => e.stopPropagation()}
          className="fixed bottom-4 right-4 z-[45] flex items-center gap-1.5 rounded-full border border-slate-700/50 bg-slate-950/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300 opacity-35 backdrop-blur-md shadow-lg transition-all duration-200 hover:border-primary-accent/60 hover:bg-slate-900/85 hover:text-white hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent/70 active:scale-95"
          title="Show Interface (H)"
          aria-label="Show interface"
        >
          <Eye className="h-3.5 w-3.5 text-primary-accent" />
          <span className="hidden sm:inline">Show UI</span>
        </button>
      )}
    </div>
  );
}

export default function PlanetariumPage() {
  return (
    <SettingsProvider>
      <SelectionProvider>
        <PlanetariumView />
      </SelectionProvider>
    </SettingsProvider>
  );
}
