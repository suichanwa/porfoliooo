import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import type { BodyData, BodyId } from "../data/types";
import type { DistanceScaleMode } from "../utils/distanceScale";
import PlanetPicker from "./PlanetPicker";

interface ControlsPanelProps {
  distanceScaleMode: DistanceScaleMode;
  onDistanceScaleModeChange: (mode: DistanceScaleMode) => void;
  distanceScaleSpacing: number;
  onSpacingChange: (value: number) => void;
  viewMode: "overview" | "explore" | "custom";
  onSetOverview: () => void;
  onSetExplore: () => void;
  showOrbits: boolean;
  onShowOrbitsChange: (value: boolean) => void;
  showLabels: boolean;
  onShowLabelsChange: (value: boolean) => void;
  showGrid: boolean;
  onShowGridChange: (value: boolean) => void;
  showLensing: boolean;
  onShowLensingChange: (value: boolean) => void;
  showPerf: boolean;
  onShowPerfChange: (value: boolean) => void;
  orbitSpeed: number;
  onOrbitSpeedChange: (value: number) => void;
  planets: BodyData[];
  pickerQuery: string;
  onPickerQueryChange: (value: string) => void;
  pickerOpen: boolean;
  onPickerToggle: () => void;
  selectedId: BodyId | null;
  onSelectPlanet: (id: BodyId) => void;
  onOverview: () => void;
  isHidden?: boolean;
}

const DEFAULT_POSITION = { x: 16, y: 96 };

const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
};

export default function ControlsPanel({
  distanceScaleMode,
  onDistanceScaleModeChange,
  distanceScaleSpacing,
  onSpacingChange,
  viewMode,
  onSetOverview,
  onSetExplore,
  showOrbits,
  onShowOrbitsChange,
  showLabels,
  onShowLabelsChange,
  showGrid,
  onShowGridChange,
  showLensing,
  onShowLensingChange,
  showPerf,
  onShowPerfChange,
  orbitSpeed,
  onOrbitSpeedChange,
  planets,
  pickerQuery,
  onPickerQueryChange,
  pickerOpen,
  onPickerToggle,
  selectedId,
  onSelectPlanet,
  onOverview,
  isHidden = false
}: ControlsPanelProps) {
  const [controlsOpen, setControlsOpen] = useState(true);
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const isMobile = useMediaQuery("(max-width: 639px)");
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isPositionedRef = useRef(false);
  const dragStateRef = useRef({
    active: false,
    pointerId: -1,
    originX: 0,
    originY: 0,
    startX: 0,
    startY: 0
  });

  const clampPosition = useCallback((x: number, y: number) => {
    const margin = 8;
    const rect = panelRef.current?.getBoundingClientRect();
    const width = rect?.width ?? 320;
    const height = rect?.height ?? 380;
    const maxX = Math.max(margin, window.innerWidth - width - margin);
    const maxY = Math.max(margin, window.innerHeight - height - margin);
    return {
      x: Math.min(maxX, Math.max(margin, x)),
      y: Math.min(maxY, Math.max(margin, y))
    };
  }, []);

  useEffect(() => {
    if (isMobile || isPositionedRef.current || !panelRef.current) return;
    setPosition(clampPosition(DEFAULT_POSITION.x, DEFAULT_POSITION.y));
    isPositionedRef.current = true;
  }, [clampPosition, isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const handleResize = () => {
      setPosition((current) => clampPosition(current.x, current.y));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPosition, isMobile]);

  useEffect(() => {
    if (isMobile) return;
    const handlePointerMove = (event: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state.active || state.pointerId !== event.pointerId) return;
      const nextX = state.startX + (event.clientX - state.originX);
      const nextY = state.startY + (event.clientY - state.originY);
      setPosition(clampPosition(nextX, nextY));
    };

    const stopDrag = (event: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state.active || state.pointerId !== event.pointerId) return;
      dragStateRef.current.active = false;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDrag);
    window.addEventListener("pointercancel", stopDrag);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDrag);
      window.removeEventListener("pointercancel", stopDrag);
    };
  }, [clampPosition, isMobile]);

  const handleDragStart = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (isMobile) return;
      if (event.button !== 0 && event.pointerType === "mouse") return;
      event.preventDefault();
      const next = clampPosition(position.x, position.y);
      dragStateRef.current = {
        active: true,
        pointerId: event.pointerId,
        originX: event.clientX,
        originY: event.clientY,
        startX: next.x,
        startY: next.y
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [clampPosition, isMobile, position]
  );

  return (
    <div
      ref={panelRef}
      className={`pointer-events-auto fixed z-20 max-h-[calc(100vh-2rem)] transition-opacity duration-300 ${
        isHidden
          ? "opacity-0 pointer-events-none sm:opacity-100 sm:pointer-events-auto"
          : "opacity-100"
      }`}
      style={{
        transform: isMobile ? "none" : `translate3d(${position.x}px, ${position.y}px, 0)`,
        left: isMobile ? 8 : undefined,
        bottom: isMobile ? 96 : undefined,
        right: isMobile ? "auto" : undefined,
        top: isMobile ? "auto" : undefined,
        width: "min(92vw, 20rem)"
      }}
    >
      <div className="flex min-h-0 max-h-full flex-col gap-4 overflow-hidden rounded-2xl border border-slate-700/60 bg-[rgba(15,23,42,0.85)] backdrop-blur-md px-3 py-3 text-[11px] text-slate-100 shadow-lg sm:px-4 sm:text-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onPointerDown={handleDragStart}
              className="flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-800/50 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-300 transition-all duration-200 hover:border-slate-500/90 hover:bg-slate-700/60 hover:text-white cursor-grab active:cursor-grabbing select-none"
              aria-label="Drag controls panel"
            >
              <span className="text-[10px] tracking-[0.1em]">:::</span>
              Drag
            </button>
            <span className="text-[10px] uppercase tracking-[0.3em] text-primary-accent font-semibold">
              Controls
            </span>
          </div>
          <button
            type="button"
            onClick={() => setControlsOpen((prev) => !prev)}
            className="rounded-full border border-slate-700/80 bg-slate-800/50 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-100 transition-all duration-200 hover:border-slate-500/90 hover:bg-slate-700/60 hover:text-white"
            aria-expanded={controlsOpen}
          >
            {controlsOpen ? "Hide" : "Show"}
          </button>
        </div>
        <div
          className={`flex min-h-0 flex-col gap-4 pr-1 transition-all duration-300 ${
            controlsOpen
              ? "max-h-[calc(100vh-12rem)] opacity-100 overflow-y-auto"
              : "max-h-0 opacity-0 overflow-y-hidden"
          }`}
          style={{ scrollbarGutter: "stable" }}
        >
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-semibold">
                Distance scale
              </span>
              <select
                className="select select-sm border-slate-700/80 bg-slate-800/60 text-slate-100 focus:border-primary-accent focus:outline-none"
                value={distanceScaleMode}
                onChange={(event) =>
                  onDistanceScaleModeChange(event.target.value as DistanceScaleMode)
                }
              >
                <option value="power">Power</option>
                <option value="log">Log</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-semibold">
                Spacing
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={distanceScaleSpacing}
                onChange={(event) => onSpacingChange(Number(event.target.value))}
                className="range range-xs range-primary"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-semibold">
                Orbit speed
              </span>
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={orbitSpeed}
                onChange={(event) => onOrbitSpeedChange(Number(event.target.value))}
                className="range range-xs range-primary"
              />
            </label>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300/90">
              {distanceScaleMode} - <span className="text-white font-medium">{Math.round(distanceScaleSpacing)}</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300/90">
              Speed <span className="text-white font-medium">{orbitSpeed.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em]">
              <button
                type="button"
                onClick={onSetOverview}
                className={`rounded-full border px-3 py-1 transition-all duration-200 ${
                  viewMode === "overview"
                    ? "border-primary-accent bg-primary-accent/20 text-primary-accent font-semibold"
                    : "border-slate-700/80 bg-slate-800/40 text-slate-100 hover:border-slate-500/90 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={onSetExplore}
                className={`rounded-full border px-3 py-1 transition-all duration-200 ${
                  viewMode === "explore"
                    ? "border-primary-accent bg-primary-accent/20 text-primary-accent font-semibold"
                    : "border-slate-700/80 bg-slate-800/40 text-slate-100 hover:border-slate-500/90 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                Explore
              </button>
            </div>
          </div>
          <div className="h-px bg-slate-700/60" />
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={showOrbits}
              onChange={(event) => onShowOrbitsChange(event.target.checked)}
            />
            <span className="tracking-wide text-slate-100">Orbit paths</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={showLabels}
              onChange={(event) => onShowLabelsChange(event.target.checked)}
            />
            <span className="tracking-wide text-slate-100">Planet labels</span>
          </label>
          <div className="h-px bg-slate-700/60" />
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-semibold">
            Gravity visuals
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={showGrid}
              onChange={(event) => onShowGridChange(event.target.checked)}
            />
            <span className="tracking-wide text-slate-100">Spacetime grid</span>
          </label>
          <label className="flex items-center gap-3 opacity-50">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={showLensing}
              onChange={(event) => onShowLensingChange(event.target.checked)}
              disabled
              aria-disabled="true"
              title="Temporarily disabled"
            />
            <span className="tracking-wide text-slate-300">
              Gravitational lensing (disabled)
            </span>
          </label>
          <div className="h-px bg-slate-700/60" />
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-semibold">
            Performance
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={showPerf}
              onChange={(event) => onShowPerfChange(event.target.checked)}
            />
            <span className="tracking-wide text-slate-100">Perf graph</span>
          </label>
          <div className="h-px bg-slate-700/60" />
          <PlanetPicker
            planets={planets}
            query={pickerQuery}
            selectedId={selectedId}
            isOpen={pickerOpen}
            onQueryChange={onPickerQueryChange}
            onToggle={onPickerToggle}
            onSelect={onSelectPlanet}
            onOverview={onOverview}
          />
        </div>
      </div>
    </div>
  );
}
