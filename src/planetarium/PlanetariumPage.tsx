import { useCallback, useEffect, useMemo, useState } from "react";
import PlanetariumCanvas from "./PlanetariumCanvas";
import PlanetariumScene from "./PlanetariumScene";
import type { BodyId } from "./data/types";
import useDeviceInfo from "../hooks/useDeviceInfo";
import useIsClient from "../hooks/useIsClient";
import { PLANETS } from "./data/planets";
import { PLANET_BY_ID } from "./data/planetRegistry";
import { PLANET_INFO } from "./data/planetInfo";
import PlanetInfoPanel from "./ui/PlanetInfoPanel";
import ControlsPanel from "./ui/ControlsPanel";
import GravityPanel from "./ui/GravityPanel";
import { preloadPlanetTextures } from "./hooks/usePlanetTexture";
import {
  DEFAULT_DISTANCE_SCALE_MODE,
  computeDistanceScaleParams,
  computeRenderOrbitRadius,
  type DistanceScaleMode
} from "./utils/distanceScale";
import {
  DEFAULT_GRAVITY_SETTINGS,
  type GravitySettings
} from "./gravity/gravityField";

const OVERVIEW_SPACING = 40;
const EXPLORE_SPACING = 75;

export default function PlanetariumPage() {
  const [showOrbits, setShowOrbits] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const showLensing = false;
  const [gravitySettings, setGravitySettings] = useState<GravitySettings>(
    DEFAULT_GRAVITY_SETTINGS
  );
  const [selectedId, setSelectedId] = useState<BodyId | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [infoHidden, setInfoHidden] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [showPerf, setShowPerf] = useState(false);
  const [orbitSpeed, setOrbitSpeed] = useState(10);
  const [distanceScaleMode, setDistanceScaleMode] = useState<DistanceScaleMode>(
    DEFAULT_DISTANCE_SCALE_MODE
  );
  const [viewMode, setViewMode] = useState<"overview" | "explore" | "custom">(
    "overview"
  );
  const [distanceScaleSpacing, setDistanceScaleSpacing] = useState(OVERVIEW_SPACING);
  const [spacingTarget, setSpacingTarget] = useState(OVERVIEW_SPACING);
  const [debugGravity, setDebugGravity] = useState(false);
  const isClient = useIsClient();
  const deviceInfo = useDeviceInfo(isClient);
  const canvasDpr = deviceInfo.isLowEnd ? 1 : 1.5;

  const distanceScaleParams = useMemo(
    () => computeDistanceScaleParams(distanceScaleMode, distanceScaleSpacing),
    [distanceScaleMode, distanceScaleSpacing]
  );
  const selectedPlanet = selectedId ? PLANET_BY_ID[selectedId] ?? null : null;
  const selectedInfo = useMemo(
    () => (selectedId ? PLANET_INFO[selectedId] : null),
    [selectedId]
  );
  const isInfoVisible = Boolean(selectedPlanet && isFocused && !infoHidden);
  const shouldHideControls = isInfoVisible;
  const filteredPlanets = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase();
    if (!query) return PLANETS;
    return PLANETS.filter((planet) => planet.name.toLowerCase().includes(query));
  }, [pickerQuery]);
  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setIsFocused(false);
    setInfoHidden(false);
  }, []);
  const handleSceneSelect = useCallback((id: BodyId | null) => {
    setSelectedId(id);
    setIsFocused(false);
    setInfoHidden(false);
  }, []);
  const handlePointerMissed = useCallback(() => {
    setSelectedId(null);
    setIsFocused(false);
  }, []);
  const handleInfoClose = useCallback(() => {
    clearSelection();
    setResetSignal((prev) => prev + 1);
  }, [clearSelection]);
  const handleSelectPlanet = useCallback((id: BodyId) => {
    setSelectedId(id);
    setIsFocused(false);
    setInfoHidden(false);
    setPickerOpen(false);
  }, []);
  const handleOverview = useCallback(() => {
    clearSelection();
    setResetSignal((prev) => prev + 1);
    setPickerOpen(false);
  }, [clearSelection]);
  const handleSpacingChange = useCallback((value: number) => {
    setViewMode("custom");
    setSpacingTarget(value);
    setDistanceScaleSpacing(value);
  }, []);
  const handleSetOverview = useCallback(() => {
    setViewMode("overview");
    setSpacingTarget(OVERVIEW_SPACING);
  }, []);
  const handleSetExplore = useCallback(() => {
    setViewMode("explore");
    setSpacingTarget(EXPLORE_SPACING);
  }, []);
  const handlePickerToggle = useCallback(() => {
    setPickerOpen((prev) => !prev);
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
    setInfoHidden(false);
  }, [selectedId]);

  useEffect(() => {
    let frame = 0;
    const animate = () => {
      setDistanceScaleSpacing((current) => {
        const next = current + (spacingTarget - current) * 0.18;
        if (Math.abs(spacingTarget - next) < 0.1) {
          return spacingTarget;
        }
        frame = window.requestAnimationFrame(animate);
        return next;
      });
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [spacingTarget]);

  useEffect(() => {
    if (!isClient) return;
    preloadPlanetTextures(PLANETS.map((planet) => planet.render.textureUrl));
  }, [isClient]);

  useEffect(() => {
    if (!isClient) return;
    const params = new URLSearchParams(window.location.search);
    setDebugGravity(params.get("debugGravity") === "1");
    if (params.has("perf")) {
      setShowPerf(params.get("perf") === "1");
    }
  }, [isClient]);

  return (
    <div className="relative min-h-screen">
      <PlanetariumCanvas
        dpr={canvasDpr}
        onPointerMissed={handlePointerMissed}
      >
      <PlanetariumScene
        showOrbits={showOrbits}
        showLabels={showLabels}
        showGrid={showGrid}
        showLensing={showLensing}
        selectedId={selectedId}
        resetSignal={resetSignal}
        onSelect={handleSceneSelect}
        isLowEnd={deviceInfo.isLowEnd}
        prefersReducedMotion={deviceInfo.prefersReducedMotion}
        onFocusChange={setIsFocused}
        distanceScaleMode={distanceScaleMode}
        distanceScaleParams={distanceScaleParams}
        gravitySettings={gravitySettings}
        debugGravity={debugGravity}
        showPerf={showPerf}
        orbitSpeed={orbitSpeed}
      />
      </PlanetariumCanvas>
      <div className="pointer-events-none absolute left-4 right-4 bottom-24 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-20 flex w-full max-w-none justify-center sm:bottom-auto sm:left-auto sm:right-4 sm:top-24 sm:max-w-sm sm:justify-end">
        <PlanetInfoPanel
          planet={selectedPlanet}
          info={selectedInfo}
          isVisible={isInfoVisible}
          onHide={() => setInfoHidden(true)}
          onClose={handleInfoClose}
        />
        {selectedPlanet && isFocused && infoHidden && (
          <div className="pointer-events-auto ml-auto">
            <button
              type="button"
              onClick={() => setInfoHidden(false)}
              className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-white/70 shadow-lg backdrop-blur-sm transition hover:border-white/30 hover:text-white"
            >
              Show details
            </button>
          </div>
        )}
      </div>
      <ControlsPanel
        distanceScaleMode={distanceScaleMode}
        onDistanceScaleModeChange={setDistanceScaleMode}
        distanceScaleSpacing={distanceScaleSpacing}
        onSpacingChange={handleSpacingChange}
        viewMode={viewMode}
        onSetOverview={handleSetOverview}
        onSetExplore={handleSetExplore}
        showOrbits={showOrbits}
        onShowOrbitsChange={setShowOrbits}
        showLabels={showLabels}
        onShowLabelsChange={setShowLabels}
        showGrid={showGrid}
        onShowGridChange={setShowGrid}
        showLensing={showLensing}
        onShowLensingChange={() => {}}
        showPerf={showPerf}
        onShowPerfChange={setShowPerf}
        orbitSpeed={orbitSpeed}
        onOrbitSpeedChange={setOrbitSpeed}
        planets={filteredPlanets}
        pickerQuery={pickerQuery}
        onPickerQueryChange={setPickerQuery}
        pickerOpen={pickerOpen}
        onPickerToggle={handlePickerToggle}
        selectedId={selectedId}
        onSelectPlanet={handleSelectPlanet}
        onOverview={handleOverview}
        isHidden={shouldHideControls}
      />
      <div className="pointer-events-none absolute bottom-6 right-4 z-20 flex w-full max-w-xs justify-end">
        <GravityPanel settings={gravitySettings} onChange={setGravitySettings} />
      </div>
      <div className="pointer-events-none absolute bottom-6 left-4 z-20 flex flex-col gap-1 text-[10px] uppercase tracking-[0.2em] text-white/40">
        <div>
          {distanceScaleMode} scale - 1 AU ~{" "}
          {computeRenderOrbitRadius(1, distanceScaleMode, distanceScaleParams).toFixed(2)} units
        </div>
        <div>
          Quality: DPR {canvasDpr.toFixed(2)} - Post {showLensing ? "On" : "Off"}
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
