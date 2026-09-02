import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent
} from "react";
import {
  Activity,
  GripHorizontal,
  Grid,
  Orbit,
  Sliders,
  Sparkles,
  Tag,
  X
} from "lucide-react";
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

interface CustomToggleProps {
  label: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  accent?: "primary" | "secondary";
}

function CustomToggle({
  label,
  icon,
  checked,
  onChange,
  accent = "primary"
}: CustomToggleProps) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className="group flex items-center justify-between py-1.5 px-2 rounded-xl cursor-pointer select-none transition-all duration-150 hover:bg-white/[0.05]"
      role="switch"
      aria-checked={checked}
    >
      <div className="flex items-center gap-2 text-slate-300 group-hover:text-white transition-colors">
        {icon}
        <span className="text-[11px] font-medium tracking-wide">{label}</span>
      </div>
      <div
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border transition-colors duration-200 ease-in-out ${
          checked
            ? accent === "secondary"
              ? "bg-secondary-accent/30 border-secondary-accent/70"
              : "bg-primary-accent/30 border-primary-accent/70"
            : "bg-slate-800/90 border-slate-700/60"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full shadow-md transition duration-200 ease-in-out mt-[2px] ml-[2px] ${
            checked
              ? accent === "secondary"
                ? "translate-x-4 bg-secondary-accent shadow-[0_0_8px_rgba(199,146,234,0.9)]"
                : "translate-x-4 bg-primary-accent shadow-[0_0_8px_rgba(94,159,255,0.9)]"
              : "translate-x-0 bg-slate-400"
          }`}
        />
      </div>
    </div>
  );
}

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
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className={`fixed z-30 transition-all duration-300 ${
        !controlsOpen
          ? "pointer-events-none opacity-0"
          : hovered || isMobile
            ? "pointer-events-auto opacity-100"
            : "pointer-events-auto opacity-85 hover:opacity-100"
      } ${className}`}
      style={{
        transform: isMobile ? "none" : `translate3d(${position.x}px, ${position.y}px, 0)`,
        left: isMobile ? 12 : undefined,
        top: isMobile ? 16 : undefined,
        bottom: isMobile ? "auto" : undefined,
        right: isMobile ? "auto" : undefined,
        width: isMobile ? "min(calc(100vw - 24px), 21rem)" : "min(92vw, 21rem)"
      }}
    >
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-700/50 bg-[linear-gradient(165deg,rgba(var(--primary-bg-rgb),0.85),rgba(20,28,40,0.72))] text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_24px_rgba(99,102,241,0.15)] backdrop-blur-2xl">
        {/* Header / Title Bar */}
        <div className="flex items-center justify-between border-b border-slate-700/40 px-3.5 py-2.5">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary-accent" />
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">
              Simulation Controls
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onPointerDown={handleDragStart}
              className="flex items-center gap-1 rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.3)] px-2 py-1 text-[10px] uppercase tracking-wider text-slate-300 transition hover:border-primary-accent/40 hover:text-white cursor-grab active:cursor-grabbing select-none"
              title="Drag to reposition"
              aria-label="Drag controls panel"
            >
              <GripHorizontal className="h-3 w-3" />
              <span className="hidden sm:inline">Move</span>
            </button>

            <button
              type="button"
              onClick={toggleControls}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.3)] text-slate-300 transition hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.6)] hover:text-white active:scale-95"
              title={controlsOpen ? "Collapse controls" : "Expand controls"}
              aria-expanded={controlsOpen}
            >
              {controlsOpen ? <X className="h-3.5 w-3.5" /> : <Sliders className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Panel Body */}
        <div
          className={`flex flex-col gap-3 p-3.5 transition-all duration-300 overflow-y-auto max-h-[calc(100vh-10rem)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            controlsOpen ? "block opacity-100" : "hidden opacity-0"
          }`}
        >
          {/* Section 1: Distance Scale & View Mode */}
          <div className="flex flex-col gap-2 rounded-xl border border-slate-700/40 bg-[rgba(var(--primary-bg-rgb),0.25)] p-2.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-primary-accent">
              <span>Distance Scale</span>
              <span className="text-slate-400 font-normal capitalize">
                {settings.distanceScaleMode}
              </span>
            </div>

            {/* Segmented Mode Selector */}
            <div className="grid grid-cols-3 gap-1 rounded-xl border border-slate-700/50 bg-[rgba(var(--primary-bg-rgb),0.4)] p-1">
              {(["power", "log", "hybrid"] as const).map((mode) => {
                const isActive = settings.distanceScaleMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleDistanceScaleModeChange(mode)}
                    className={`rounded-lg py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                      isActive
                        ? "bg-primary-accent/25 border border-primary-accent/70 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                        : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/[0.04]"
                    }`}
                  >
                    {mode}
                  </button>
                );
              })}
            </div>

            {/* Spacing Range Slider */}
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider">
                <span className="text-slate-400">Spacing</span>
                <span className="text-primary-accent tabular-nums font-bold">
                  {Math.round(settings.distanceScaleSpacing)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.distanceScaleSpacing}
                onChange={(event) => handleSpacingChange(Number(event.target.value))}
                className="w-full h-1.5 bg-slate-800/90 rounded-lg appearance-none cursor-pointer accent-primary-accent focus:outline-none"
              />
            </div>

            {/* View Mode Presets */}
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-700/50 bg-[rgba(var(--primary-bg-rgb),0.4)] p-1 mt-1">
              <button
                type="button"
                onClick={handleSetOverview}
                className={`rounded-lg py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  settings.viewMode === "overview"
                    ? "bg-primary-accent/25 border border-primary-accent/70 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                    : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/[0.04]"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={handleSetExplore}
                className={`rounded-lg py-1 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                  settings.viewMode === "explore"
                    ? "bg-primary-accent/25 border border-primary-accent/70 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                    : "text-slate-400 hover:text-slate-200 border border-transparent hover:bg-white/[0.04]"
                }`}
              >
                Explore
              </button>
            </div>
          </div>

          {/* Section 2: Orbit Speed Slider */}
          <div className="flex flex-col gap-2 rounded-xl border border-slate-700/40 bg-[rgba(var(--primary-bg-rgb),0.25)] p-2.5">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-primary-accent">
              <span>Simulation Speed</span>
              <span className="text-white tabular-nums font-bold">
                {settings.orbitSpeed.toFixed(1)}x
              </span>
            </div>

            <input
              type="range"
              min={0}
              max={20}
              step={0.5}
              value={settings.orbitSpeed}
              onChange={(event) => updateSetting("orbitSpeed", Number(event.target.value))}
              className="w-full h-1.5 bg-slate-800/90 rounded-lg appearance-none cursor-pointer accent-primary-accent focus:outline-none"
            />

            <div className="flex items-center justify-between gap-1 mt-0.5">
              {[0, 1, 5, 10, 20].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => updateSetting("orbitSpeed", spd)}
                  className={`flex-1 rounded-lg py-0.5 text-[9px] font-semibold transition ${
                    settings.orbitSpeed === spd
                      ? "bg-primary-accent/30 text-white font-bold border border-primary-accent/60"
                      : "text-slate-400 hover:text-slate-200 bg-white/[0.03] hover:bg-white/[0.08]"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Visual Overlays (Sleek Toggles) */}
          <div className="flex flex-col gap-1 rounded-xl border border-slate-700/40 bg-[rgba(var(--primary-bg-rgb),0.25)] p-2">
            <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-accent">
              Visual Overlays
            </div>

            <CustomToggle
              label="Orbit Paths"
              icon={<Orbit className="h-3.5 w-3.5 text-primary-accent" />}
              checked={settings.showOrbits}
              onChange={handleToggleOrbits}
              accent="primary"
            />

            <CustomToggle
              label="Planet Labels"
              icon={<Tag className="h-3.5 w-3.5 text-primary-accent" />}
              checked={settings.showLabels}
              onChange={handleToggleLabels}
              accent="primary"
            />

            <CustomToggle
              label="Milky Way Galaxy"
              icon={<Sparkles className="h-3.5 w-3.5 text-secondary-accent" />}
              checked={settings.useMilkyWayBackground}
              onChange={() => toggleSetting("useMilkyWayBackground")}
              accent="secondary"
            />

            <CustomToggle
              label="Spacetime Grid"
              icon={<Grid className="h-3.5 w-3.5 text-secondary-accent" />}
              checked={settings.showGrid}
              onChange={handleToggleGrid}
              accent="secondary"
            />
          </div>

          {/* Section 4: Diagnostics */}
          <div className="flex flex-col gap-1 rounded-xl border border-slate-700/40 bg-[rgba(var(--primary-bg-rgb),0.25)] p-2">
            <div className="px-2 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-primary-accent">
              Diagnostics
            </div>

            <CustomToggle
              label="Performance Graph"
              icon={<Activity className="h-3.5 w-3.5 text-primary-accent" />}
              checked={settings.showPerf}
              onChange={handleTogglePerf}
              accent="primary"
            />
          </div>

          {/* Celestial Picker */}
          <div className="mt-0.5">
            <PlanetPicker />
          </div>
        </div>
      </div>
    </div>
  );
}

