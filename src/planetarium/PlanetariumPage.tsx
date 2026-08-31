import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PlanetariumCanvas from "./PlanetariumCanvas";
import PlanetariumScene from "./PlanetariumScene";
import useDeviceInfo from "../hooks/useDeviceInfo";
import useIsClient from "../hooks/useIsClient";
import { PLANETS } from "./data/planets";
import PlanetInfoPanel from "./ui/PlanetInfoPanel";
import ControlsPanel from "./ui/ControlsPanel";
import GravityPanel from "./ui/GravityPanel";
import TimeControls from "./ui/TimeControls";
import { preloadPlanetTextures } from "./hooks/usePlanetTexture";
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
    isInfoVisible,
    resetSignal,
    selectPlanet,
    clearSelection,
    setIsFocused
  } = usePlanetSelection();

  const [gravitySettings, setGravitySettings] = useState<GravitySettings>(
    DEFAULT_GRAVITY_SETTINGS
  );
  const [simDateMs, setSimDateMs] = useState<number | null>(null);
  const [timeResetSignal, setTimeResetSignal] = useState(0);
  const prevSpeedRef = useRef(1);
  const [debugGravity, setDebugGravity] = useState(false);
  const hasTrackedVisit = useRef(false);
  const isClient = useIsClient();
  const deviceInfo = useDeviceInfo(isClient);
  const canvasDpr = deviceInfo.isLowEnd ? 1 : 1.5;

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

  const handleNow = useCallback(() => {
    setTimeResetSignal((signal) => signal + 1);
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
    preloadPlanetTextures(PLANETS.map((planet) => planet.render.textureUrl));
  }, [isClient]);

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
    <div className="relative min-h-screen">
      <PlanetariumCanvas dpr={canvasDpr} onPointerMissed={clearSelection}>
        <PlanetariumScene
          showOrbits={settings.showOrbits}
          showLabels={settings.showLabels}
          showGrid={settings.showGrid}
          showLensing={false}
          selectedId={selectedId}
          isInfoVisible={isInfoVisible}
          resetSignal={resetSignal}
          onSelect={handleSceneSelect}
          isLowEnd={deviceInfo.isLowEnd}
          prefersReducedMotion={deviceInfo.prefersReducedMotion}
          onFocusChange={setIsFocused}
          distanceScaleMode={settings.distanceScaleMode}
          distanceScaleParams={distanceScaleParams}
          gravitySettings={gravitySettings}
          debugGravity={debugGravity}
          showPerf={settings.showPerf}
          orbitSpeed={settings.orbitSpeed}
          timeResetSignal={timeResetSignal}
          onSimDateChange={setSimDateMs}
          useMilkyWayBackground={settings.useMilkyWayBackground}
        />
      </PlanetariumCanvas>

      <PlanetInfoPanel />

      <ControlsPanel />

      <TimeControls
        speed={settings.orbitSpeed}
        isPaused={settings.orbitSpeed === 0}
        onSlower={handleSlower}
        onFaster={handleFaster}
        onTogglePause={handleTogglePause}
        onNow={handleNow}
        simDateMs={simDateMs}
      />

      <div className="pointer-events-none absolute bottom-6 right-4 z-20 flex w-full max-w-xs justify-end">
        <GravityPanel
          settings={gravitySettings}
          onChange={setGravitySettings}
        />
      </div>

      <div className="pointer-events-none absolute bottom-6 left-4 z-20 flex flex-col gap-1 text-[10px] uppercase tracking-[0.2em] text-white/40">
        <div>
          {settings.distanceScaleMode} scale - 1 AU ~{" "}
          {computeRenderOrbitRadius(
            1,
            settings.distanceScaleMode,
            distanceScaleParams
          ).toFixed(2)}{" "}
          units
        </div>
        <div>
          Quality: DPR {canvasDpr.toFixed(2)} - Post Off
        </div>
      </div>

      {debugGravity && (
        <div className="pointer-events-none absolute bottom-16 left-4 z-20 text-[10px] uppercase tracking-[0.2em] text-white/50">
          Gravity debug
        </div>
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
