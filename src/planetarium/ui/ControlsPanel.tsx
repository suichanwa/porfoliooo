import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import useMediaQuery from "../hooks/useMediaQuery";
import type { DistanceScaleMode } from "../utils/distanceScale";
import { useSettings } from "../context/SettingsContext";
import { usePlanetSelection } from "../context/SelectionContext";
import PlanetPicker from "./PlanetPicker";
import {
  trackPlanetariumDistanceScaleChanged,
  trackPlanetariumToggleChanged,
  trackPlanetariumViewModeChanged
} from "../../utils/firebaseAnalytics";

interface ControlsPanelProps {
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

const DEFAULT_POSITION = { x: 16, y: 96 };

export default function ControlsPanel({
  className = "",
  isOpen,
  onToggle
}: ControlsPanelProps = {}) {
  const { settings, updateSetting, toggleSetting } = useSettings();
  const { isInfoVisible } = usePlanetSelection();

  const isMobile = useMediaQuery("(max-width: 639px)");
  const [internalOpen, setInternalOpen] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth >= 640;
  });

  const controlsOpen = isOpen !== undefined ? isOpen : internalOpen;
  const toggleControls = onToggle ?? (() => setInternalOpen((prev) => !prev));

  const [hovered, setHovered] = useState(false);
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

  const handleDistanceScaleModeChange = (mode: DistanceScaleMode) => {
    updateSetting("distanceScaleMode", mode);
    void trackPlanetariumDistanceScaleChanged({ mode });
  };

  const handleSpacingChange = (value: number) => {
    updateSetting("distanceScaleSpacing", value);
    if (settings.viewMode !== "custom") {
      updateSetting("viewMode", "custom");
      void trackPlanetariumViewModeChanged({ mode: "custom" });
    }
  };

  const handleSetOverview = () => {
    updateSetting("viewMode", "overview");
    updateSetting("distanceScaleSpacing", 40);
    void trackPlanetariumViewModeChanged({ mode: "overview" });
  };

  const handleSetExplore = () => {
    updateSetting("viewMode", "explore");
    updateSetting("distanceScaleSpacing", 75);
    void trackPlanetariumViewModeChanged({ mode: "explore" });
  };

  const handleToggleOrbits = (checked: boolean) => {
    updateSetting("showOrbits", checked);
    void trackPlanetariumToggleChanged({
      control: "show_orbits",
      enabled: checked
    });
  };

  const handleToggleLabels = (checked: boolean) => {
    updateSetting("showLabels", checked);
    void trackPlanetariumToggleChanged({
      control: "show_labels",
      enabled: checked
    });
  };

  const handleToggleGrid = (checked: boolean) => {
    updateSetting("showGrid", checked);
    void trackPlanetariumToggleChanged({
      control: "show_grid",
      enabled: checked
    });
  };

  const handleTogglePerf = (checked: boolean) => {
    updateSetting("showPerf", checked);
    void trackPlanetariumToggleChanged({
      control: "show_perf",
      enabled: checked
    });
  };

  return (
    <div
      ref={panelRef}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={`pointer-events-auto fixed z-20 max-h-[calc(100vh-2rem)] transition-opacity duration-300 ${
        isInfoVisible
          ? "opacity-0 pointer-events-none sm:pointer-events-auto"
          : hovered || isMobile
            ? "opacity-100"
            : "opacity-40 hover:opacity-100"
      } ${className}`}
      style={{
        transform: isMobile ? "none" : `translate3d(${position.x}px, ${position.y}px, 0)`,
        left: isMobile ? 12 : undefined,
        top: isMobile ? 16 : undefined,
        bottom: isMobile ? "auto" : undefined,
        right: isMobile ? "auto" : undefined,
        width: isMobile ? "min(calc(100vw - 24px), 20rem)" : "min(92vw, 20rem)"
      }}
    >
      <div className="flex min-h-0 max-h-full flex-col gap-4 overflow-hidden rounded-2xl border border-slate-700/60 bg-[linear-gradient(165deg,rgba(var(--primary-bg-rgb),0.94),rgba(20,28,40,0.85))] px-3.5 py-3.5 text-[11px] text-slate-100 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:px-4 sm:text-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onPointerDown={handleDragStart}
              className="flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.45)] px-2.5 py-1 text-[10px] uppercase tracking-[0.15em] text-slate-300 transition hover:border-primary-accent/40 hover:text-white cursor-grab active:cursor-grabbing select-none"
              aria-label="Drag controls panel"
            >
              <span className="text-[10px] tracking-[0.1em]">:::</span>
              Drag
            </button>
            <span className="text-[10px] uppercase tracking-[0.25em] text-primary-accent font-bold">
              Controls
            </span>
          </div>
          <button
            type="button"
            onClick={toggleControls}
            className="rounded-full border border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.45)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-200 transition hover:border-primary-accent/40 hover:text-white active:scale-95"
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
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-bold">
                Distance scale
              </span>
              <select
                className="select select-sm border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.55)] text-slate-100 focus:border-primary-accent focus:outline-none rounded-xl"
                value={settings.distanceScaleMode}
                onChange={(event) =>
                  handleDistanceScaleModeChange(event.target.value as DistanceScaleMode)
                }
              >
                <option value="power">Power</option>
                <option value="log">Log</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-bold">
                Spacing
              </span>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.distanceScaleSpacing}
                onChange={(event) => handleSpacingChange(Number(event.target.value))}
                className="range range-xs range-primary"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-bold">
                Orbit speed
              </span>
              <input
                type="range"
                min={0}
                max={20}
                step={0.5}
                value={settings.orbitSpeed}
                onChange={(event) => updateSetting("orbitSpeed", Number(event.target.value))}
                className="range range-xs range-primary"
              />
            </label>
            <div className="text-[10px] uppercase tracking-[0.15em] text-slate-300 font-medium">
              Scale: <span className="text-white font-bold">{settings.distanceScaleMode}</span> (
              <span className="text-white font-bold">{Math.round(settings.distanceScaleSpacing)}</span>)
            </div>
            <div className="text-[10px] uppercase tracking-[0.15em] text-slate-300 font-medium">
              Speed: <span className="text-white font-bold">{settings.orbitSpeed.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
              <button
                type="button"
                onClick={handleSetOverview}
                className={`rounded-full border px-3 py-1 transition-all duration-200 ${
                  settings.viewMode === "overview"
                    ? "border-primary-accent bg-primary-accent/25 text-white shadow-[0_0_8px_rgba(94,159,255,0.3)]"
                    : "border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.45)] text-slate-200 hover:border-primary-accent/40 hover:text-white"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={handleSetExplore}
                className={`rounded-full border px-3 py-1 transition-all duration-200 ${
                  settings.viewMode === "explore"
                    ? "border-primary-accent bg-primary-accent/25 text-white shadow-[0_0_8px_rgba(94,159,255,0.3)]"
                    : "border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.45)] text-slate-200 hover:border-primary-accent/40 hover:text-white"
                }`}
              >
                Explore
              </button>
            </div>
          </div>
          <div className="h-px bg-slate-700/50" />
          <label className="flex items-center justify-between cursor-pointer py-0.5">
            <span className="tracking-wide text-slate-200 text-xs font-medium">Orbit Paths</span>
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={settings.showOrbits}
              onChange={(event) => handleToggleOrbits(event.target.checked)}
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer py-0.5">
            <span className="tracking-wide text-slate-200 text-xs font-medium">Planet Labels</span>
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={settings.showLabels}
              onChange={(event) => handleToggleLabels(event.target.checked)}
            />
          </label>
          <button
            type="button"
            onClick={() => toggleSetting("useMilkyWayBackground")}
            className="rounded-full border border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.45)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-200 transition hover:border-secondary-accent/40 hover:text-white"
          >
            Toggle Milky Way Galaxy
          </button>
          <div className="h-px bg-slate-700/50" />
          <div className="text-[10px] uppercase tracking-[0.2em] text-secondary-accent font-bold">
            Gravity Visuals
          </div>
          <label className="flex items-center justify-between cursor-pointer py-0.5">
            <span className="tracking-wide text-slate-200 text-xs font-medium">Spacetime Grid</span>
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-secondary"
              checked={settings.showGrid}
              onChange={(event) => handleToggleGrid(event.target.checked)}
            />
          </label>
          <div className="h-px bg-slate-700/50" />
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-bold">
            Diagnostics
          </div>
          <label className="flex items-center justify-between cursor-pointer py-0.5">
            <span className="tracking-wide text-slate-200 text-xs font-medium">Perf Graph</span>
            <input
              type="checkbox"
              className="toggle toggle-sm toggle-primary"
              checked={settings.showPerf}
              onChange={(event) => handleTogglePerf(event.target.checked)}
            />
          </label>
          <div className="h-px bg-slate-700/50" />
          <PlanetPicker />
        </div>
      </div>
    </div>
  );
}
