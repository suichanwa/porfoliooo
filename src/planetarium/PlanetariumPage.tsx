import { useEffect, useMemo, useState } from "react";
import PlanetariumCanvas from "./PlanetariumCanvas";
import PlanetariumScene from "./PlanetariumScene";
import type { PlanetId } from "./data/types";
import useDeviceInfo from "../hooks/useDeviceInfo";
import useIsClient from "../hooks/useIsClient";
import { PLANETS } from "./data/planets";
import { PLANET_INFO } from "./data/planetInfo";
import PlanetInfoPanel from "./ui/PlanetInfoPanel";
import PlanetPicker from "./ui/PlanetPicker";
import {
  DEFAULT_DISTANCE_SCALE_MODE,
  computeDistanceScaleParams,
  computeRenderOrbitRadius,
  type DistanceScaleMode
} from "./utils/distanceScale";

export default function PlanetariumPage() {
  const [showOrbits, setShowOrbits] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [selectedId, setSelectedId] = useState<PlanetId | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
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
      <div className="pointer-events-none absolute left-4 top-24 z-20 flex w-full max-w-xs justify-start">
        <div className="pointer-events-auto flex flex-col gap-4 rounded-2xl border border-white/10 bg-base-100/10 px-4 py-3 text-xs text-white/80 shadow-lg backdrop-blur-sm">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                Distance scale
              </span>
              <select
                className="select select-sm border-white/10 bg-base-100/10 text-white"
                value={distanceScaleMode}
                onChange={(event) =>
                  setDistanceScaleMode(event.target.value as DistanceScaleMode)
                }
              >
                <option value="power">Power</option>
                <option value="log">Log</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                Spacing
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={distanceScaleSpacing}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  setViewMode("custom");
                  setSpacingTarget(value);
                  setDistanceScaleSpacing(value);
                }}
                className="range range-xs"
              />
            </label>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              {distanceScaleMode} - {Math.round(distanceScaleSpacing)}
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/50">
              <button
                type="button"
                onClick={() => {
                  setViewMode("overview");
                  setSpacingTarget(overviewSpacing);
                }}
                className={`rounded-full border px-3 py-1 transition ${
                  viewMode === "overview"
                    ? "border-primary-accent text-primary-accent"
                    : "border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode("explore");
                  setSpacingTarget(exploreSpacing);
                }}
                className={`rounded-full border px-3 py-1 transition ${
                  viewMode === "explore"
                    ? "border-primary-accent text-primary-accent"
                    : "border-white/10 text-white/60 hover:border-white/30"
                }`}
              >
                Explore
              </button>
            </div>
          </div>
          <div className="h-px bg-white/10" />
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={showOrbits}
              onChange={(event) => setShowOrbits(event.target.checked)}
            />
            <span className="tracking-wide">Orbit paths</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={showLabels}
              onChange={(event) => setShowLabels(event.target.checked)}
            />
            <span className="tracking-wide">Planet labels</span>
          </label>
          <div className="h-px bg-white/10" />
          <PlanetPicker
            planets={filteredPlanets}
            query={pickerQuery}
            selectedId={selectedId}
            isOpen={pickerOpen}
            onQueryChange={setPickerQuery}
            onToggle={() => setPickerOpen((prev) => !prev)}
            onSelect={(id) => {
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
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-6 left-4 z-20 text-[10px] uppercase tracking-[0.2em] text-white/40">
        {distanceScaleMode} scale - 1 AU ~ {computeRenderOrbitRadius(1, distanceScaleMode, distanceScaleParams).toFixed(2)} units
      </div>
    </div>
  );
}



