import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import type { PlanetData, PlanetId } from "../data/types";
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
  planets: PlanetData[];
  pickerQuery: string;
  onPickerQueryChange: (value: string) => void;
  pickerOpen: boolean;
  onPickerToggle: () => void;
  selectedId: PlanetId | null;
  onSelectPlanet: (id: PlanetId) => void;
  onOverview: () => void;
}

const DEFAULT_POSITION = { x: 16, y: 96 };

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
  planets,
  pickerQuery,
  onPickerQueryChange,
  pickerOpen,
  onPickerToggle,
  selectedId,
  onSelectPlanet,
  onOverview
}: ControlsPanelProps) {
  const [controlsOpen, setControlsOpen] = useState(true);
  const [position, setPosition] = useState(DEFAULT_POSITION);
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
    if (isPositionedRef.current || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    const isMobile = window.innerWidth < 640;
    const initialX = isMobile ? 8 : DEFAULT_POSITION.x;
    const initialY = isMobile
      ? window.innerHeight - rect.height - 96
      : DEFAULT_POSITION.y;
    setPosition(clampPosition(initialX, initialY));
    isPositionedRef.current = true;
  }, [clampPosition]);

  useEffect(() => {
    const handleResize = () => {
      setPosition((current) => clampPosition(current.x, current.y));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPosition]);

  useEffect(() => {
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
  }, [clampPosition]);

  const handleDragStart = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
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
    [clampPosition, position]
  );

  return (
    <div
      ref={panelRef}
      className="pointer-events-auto fixed z-20"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        width: "min(92vw, 20rem)"
      }}
    >
      <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-base-100/10 px-3 py-3 text-[11px] text-white/80 shadow-lg backdrop-blur-sm sm:px-4 sm:text-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onPointerDown={handleDragStart}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60 transition hover:border-white/30 hover:text-white cursor-grab active:cursor-grabbing select-none"
              aria-label="Drag controls panel"
            >
              <span className="text-[10px] tracking-[0.1em]">:::</span>
              Drag
            </button>
            <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">
              Controls
            </span>
          </div>
          <button
            type="button"
            onClick={() => setControlsOpen((prev) => !prev)}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:border-white/30 hover:text-white"
            aria-expanded={controlsOpen}
          >
            {controlsOpen ? "Hide" : "Show"}
          </button>
        </div>
        <div
          className={`flex flex-col gap-4 overflow-hidden transition-all duration-300 ${
            controlsOpen ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                Distance scale
              </span>
              <select
                className="select select-sm border-white/10 bg-base-100/10 text-white"
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
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                Spacing
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={distanceScaleSpacing}
                onChange={(event) => onSpacingChange(Number(event.target.value))}
                className="range range-xs"
              />
            </label>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              {distanceScaleMode} - {Math.round(distanceScaleSpacing)}
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/50">
              <button
                type="button"
                onClick={onSetOverview}
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
                onClick={onSetExplore}
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
              onChange={(event) => onShowOrbitsChange(event.target.checked)}
            />
            <span className="tracking-wide">Orbit paths</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={showLabels}
              onChange={(event) => onShowLabelsChange(event.target.checked)}
            />
            <span className="tracking-wide">Planet labels</span>
          </label>
          <div className="h-px bg-white/10" />
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Gravity visuals
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={showGrid}
              onChange={(event) => onShowGridChange(event.target.checked)}
            />
            <span className="tracking-wide">Spacetime grid</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={showLensing}
              onChange={(event) => onShowLensingChange(event.target.checked)}
            />
            <span className="tracking-wide">Gravitational lensing</span>
          </label>
          <div className="h-px bg-white/10" />
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Performance
          </div>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={showPerf}
              onChange={(event) => onShowPerfChange(event.target.checked)}
            />
            <span className="tracking-wide">Perf graph</span>
          </label>
          <div className="h-px bg-white/10" />
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
