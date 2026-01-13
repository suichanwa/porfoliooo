import { useEffect, useMemo, useState } from "react";
import PlanetariumCanvas from "./PlanetariumCanvas";
import PlanetariumScene from "./PlanetariumScene";
import type { PlanetId } from "./data/types";
import useDeviceInfo from "../hooks/useDeviceInfo";
import useIsClient from "../hooks/useIsClient";
import { PLANETS } from "./data/planets";
import { PLANET_INFO } from "./data/planetInfo";
import PlanetInfoPanel from "./ui/PlanetInfoPanel";
import ControlsPanel from "./ui/ControlsPanel";
import GravityPanel from "./ui/GravityPanel";
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

export default function PlanetariumPage() {
  const [showOrbits, setShowOrbits] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showLensing, setShowLensing] = useState(false);
  const [gravitySettings, setGravitySettings] = useState<GravitySettings>(
    DEFAULT_GRAVITY_SETTINGS
  );
  const [selectedId, setSelectedId] = useState<PlanetId | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [showPerf, setShowPerf] = useState(true);
  const [controlsOpen, setControlsOpen] = useState(true);
  const [distanceScaleMode, setDistanceScaleMode] = useState<DistanceScaleMode>(
    DEFAULT_DISTANCE_SCALE_MODE
  );
  const overviewSpacing = 40;
  const exploreSpacing = 75;
  const [viewMode, setViewMode] = useState<"overview" | "explore" | "custom">(
    "overview"
  );
  const [distanceScaleSpacing, setDistanceScaleSpacing] = useState(overviewSpacing);
  const [spacingTarget, setSpacingTarget] = useState(overviewSpacing);
  const [debugGravity, setDebugGravity] = useState(false);
  const isClient = useIsClient();
  const deviceInfo = useDeviceInfo(isClient);
  const canvasDpr = deviceInfo.isLowEnd ? 1 : 1.5;

  const distanceScaleParams = useMemo(
    () => computeDistanceScaleParams(distanceScaleMode, distanceScaleSpacing),
    [distanceScaleMode, distanceScaleSpacing]
  );
  const selectedPlanet = useMemo(
    () => (selectedId ? PLANETS.find((planet) => planet.id === selectedId) ?? null : null),
    [selectedId]
  );
  const selectedInfo = useMemo(
    () => (selectedId ? PLANET_INFO[selectedId] : null),
    [selectedId]
  );
  const filteredPlanets = useMemo(() => {
    const query = pickerQuery.trim().toLowerCase();
    if (!query) return PLANETS;
    return PLANETS.filter((planet) => planet.name.toLowerCase().includes(query));
  }, [pickerQuery]);

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
        onPointerMissed={() => {
          setSelectedId(null);
          setIsFocused(false);
        }}
      >
      <PlanetariumScene
        showOrbits={showOrbits}
        showLabels={showLabels}
        showGrid={showGrid}
        showLensing={showLensing}
        selectedId={selectedId}
          resetSignal={resetSignal}
          onSelect={(id) => {
            setSelectedId(id);
            setIsFocused(false);
          }}
          isLowEnd={deviceInfo.isLowEnd}
          prefersReducedMotion={deviceInfo.prefersReducedMotion}
        onFocusChange={setIsFocused}
        distanceScaleMode={distanceScaleMode}
        distanceScaleParams={distanceScaleParams}
        gravitySettings={gravitySettings}
        debugGravity={debugGravity}
        showPerf
      />
      </PlanetariumCanvas>
      <div className="pointer-events-none absolute right-4 top-24 z-20 flex w-full max-w-sm justify-end">
        <PlanetInfoPanel
          planet={selectedPlanet}
          info={selectedInfo}
          isVisible={Boolean(selectedPlanet && isFocused)}
          onClose={() => {
            setSelectedId(null);
            setIsFocused(false);
            setResetSignal((prev) => prev + 1);
          }}
        />
      </div>
      <ControlsPanel
        distanceScaleMode={distanceScaleMode}
        onDistanceScaleModeChange={setDistanceScaleMode}
        distanceScaleSpacing={distanceScaleSpacing}
        onSpacingChange={(value) => {
          setViewMode("custom");
          setSpacingTarget(value);
          setDistanceScaleSpacing(value);
        }}
        viewMode={viewMode}
        onSetOverview={() => {
          setViewMode("overview");
          setSpacingTarget(overviewSpacing);
        }}
        onSetExplore={() => {
          setViewMode("explore");
          setSpacingTarget(exploreSpacing);
        }}
        showOrbits={showOrbits}
        onShowOrbitsChange={setShowOrbits}
        showLabels={showLabels}
        onShowLabelsChange={setShowLabels}
        showGrid={showGrid}
        onShowGridChange={setShowGrid}
        showLensing={showLensing}
        onShowLensingChange={setShowLensing}
        planets={filteredPlanets}
        pickerQuery={pickerQuery}
        onPickerQueryChange={setPickerQuery}
        pickerOpen={pickerOpen}
        onPickerToggle={() => setPickerOpen((prev) => !prev)}
        selectedId={selectedId}
        onSelectPlanet={(id) => {
          setSelectedId(id);
          setIsFocused(false);
          setPickerOpen(false);
        }}
        onOverview={() => {
          setSelectedId(null);
          setIsFocused(false);
          setResetSignal((prev) => prev + 1);
          setPickerOpen(false);
        }}
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



