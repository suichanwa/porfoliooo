import { useState, useRef, useEffect } from "react";
import {
  Globe,
  Home,
  Layers,
  Play,
  Pause,
  FastForward,
  Rewind,
  RotateCcw,
  Sliders,
  Sparkles,
  Orbit,
  Tag,
  Grid,
  X
} from "lucide-react";
import { PLANETS } from "../data/planets";
import type { BodyId } from "../data/types";
import { useSettings } from "../context/SettingsContext";
import { usePlanetSelection } from "../context/SelectionContext";
import useMediaQuery from "../hooks/useMediaQuery";

interface PlanetariumNavbarProps {
  speed: number;
  isPaused: boolean;
  onSlower: () => void;
  onFaster: () => void;
  onTogglePause: () => void;
  onNow: () => void;
  simDateMs: number | null;
  onToggleControls?: () => void;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "2-digit"
});

const formatSpeed = (speed: number) => {
  const abs = Math.abs(speed);
  if (abs === 0) return "paused";
  if (abs >= 365) return `${(speed / 365).toFixed(abs >= 3650 ? 0 : 1)} yr/s`;
  if (abs >= 1) return `${speed % 1 === 0 ? speed : speed.toFixed(1)} d/s`;
  return `${(speed * 24).toFixed(1)} h/s`;
};

export default function PlanetariumNavbar({
  speed,
  isPaused,
  onSlower,
  onFaster,
  onTogglePause,
  onNow,
  simDateMs,
  onToggleControls
}: PlanetariumNavbarProps) {
  const { settings, toggleSetting } = useSettings();
  const { selectedId, selectPlanet, resetOverview } = usePlanetSelection();
  const isMobile = useMediaQuery("(max-width: 768px)");

  const [activeMenu, setActiveMenu] = useState<"planets" | "layers" | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const dateParts =
    simDateMs !== null ? dateFormatter.formatToParts(new Date(simDateMs)) : null;
  const speedStr = formatSpeed(speed);

  // Close menus when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    window.addEventListener("pointerdown", handleOutsideClick);
    return () => window.removeEventListener("pointerdown", handleOutsideClick);
  }, []);

  const handlePlanetSelect = (id: BodyId) => {
    selectPlanet(id, "picker");
    setActiveMenu(null);
  };

  const handleOverviewClick = () => {
    resetOverview();
    setActiveMenu(null);
  };

  const navButtonBase =
    "group flex items-center gap-1.5 rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.22)] text-slate-300/90 hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.42)] hover:text-white transition-all duration-200 active:scale-95 text-[11px] font-semibold uppercase tracking-[0.08em] shadow-sm";

  const navButtonActive =
    "border-primary-accent/65 bg-primary-accent/20 text-white shadow-[0_0_12px_rgba(99,102,241,0.45)]";

  return (
    <div
      ref={navRef}
      className="pointer-events-none fixed bottom-3 sm:bottom-6 left-1/2 z-40 -translate-x-1/2 flex flex-col items-center w-[calc(100vw-1.5rem)] sm:w-auto max-w-4xl"
    >
      {/* 1. POPUP DRAWER: Celestial Bodies Quick Strip */}
      {activeMenu === "planets" && (
        <div className="pointer-events-auto mb-2.5 w-full sm:w-auto max-w-full rounded-2xl border border-slate-700/50 bg-[linear-gradient(165deg,rgba(var(--primary-bg-rgb),0.75),rgba(20,28,40,0.60))] p-3 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between gap-3 border-b border-slate-700/40 pb-2 mb-2 px-1">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-primary-accent">
              <Globe className="h-3.5 w-3.5 text-primary-accent" />
              Celestial Navigation
            </span>
            <button
              type="button"
              onClick={() => setActiveMenu(null)}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              aria-label="Close celestial drawer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 max-w-[85vw] sm:max-w-xl scrollbar-thin scrollbar-thumb-slate-700">
            {PLANETS.map((planet) => {
              const isSelected = selectedId === planet.id;
              return (
                <button
                  key={planet.id}
                  type="button"
                  onClick={() => handlePlanetSelect(planet.id)}
                  className={`flex flex-shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition-all duration-200 ${
                    isSelected
                      ? "bg-primary-accent/25 border border-primary-accent/70 text-white shadow-[0_0_12px_rgba(99,102,241,0.45)] scale-105"
                      : "bg-[rgba(var(--primary-bg-rgb),0.25)] border border-slate-700/55 text-slate-300 hover:bg-[rgba(var(--primary-bg-rgb),0.45)] hover:border-primary-accent/40 hover:text-white"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full flex-shrink-0 shadow-sm"
                    style={{
                      backgroundColor: planet.render.colorFallback ?? "#5e9fff"
                    }}
                  />
                  <span>{planet.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. POPUP DRAWER: Quick Layer Toggles */}
      {activeMenu === "layers" && (
        <div className="pointer-events-auto mb-2.5 w-72 rounded-2xl border border-slate-700/50 bg-[linear-gradient(165deg,rgba(var(--primary-bg-rgb),0.75),rgba(20,28,40,0.60))] p-3 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between border-b border-slate-700/40 pb-2 mb-2 px-1">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-secondary-accent">
              <Layers className="h-3.5 w-3.5 text-secondary-accent" />
              Visual Layers
            </span>
            <button
              type="button"
              onClick={() => setActiveMenu(null)}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              aria-label="Close layers drawer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => toggleSetting("showGrid")}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] transition ${
                settings.showGrid
                  ? "bg-secondary-accent/25 border border-secondary-accent/70 text-white shadow-[0_0_12px_rgba(199,146,234,0.4)]"
                  : "bg-[rgba(var(--primary-bg-rgb),0.25)] border border-slate-700/55 text-slate-300 hover:bg-[rgba(var(--primary-bg-rgb),0.45)] hover:border-slate-500/80 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Grid className="h-3.5 w-3.5 text-secondary-accent" />
                Spacetime Grid
              </span>
              <span className="text-[10px] font-bold tracking-wider opacity-85">
                {settings.showGrid ? "ON" : "OFF"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleSetting("showOrbits")}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] transition ${
                settings.showOrbits
                  ? "bg-primary-accent/25 border border-primary-accent/70 text-white shadow-[0_0_12px_rgba(99,102,241,0.45)]"
                  : "bg-[rgba(var(--primary-bg-rgb),0.25)] border border-slate-700/55 text-slate-300 hover:bg-[rgba(var(--primary-bg-rgb),0.45)] hover:border-slate-500/80 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Orbit className="h-3.5 w-3.5 text-primary-accent" />
                Orbit Paths
              </span>
              <span className="text-[10px] font-bold tracking-wider opacity-85">
                {settings.showOrbits ? "ON" : "OFF"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleSetting("showLabels")}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] transition ${
                settings.showLabels
                  ? "bg-primary-accent/25 border border-primary-accent/70 text-white shadow-[0_0_12px_rgba(99,102,241,0.45)]"
                  : "bg-[rgba(var(--primary-bg-rgb),0.25)] border border-slate-700/55 text-slate-300 hover:bg-[rgba(var(--primary-bg-rgb),0.45)] hover:border-slate-500/80 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-primary-accent" />
                Planet Labels
              </span>
              <span className="text-[10px] font-bold tracking-wider opacity-85">
                {settings.showLabels ? "ON" : "OFF"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => toggleSetting("useMilkyWayBackground")}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] transition ${
                settings.useMilkyWayBackground
                  ? "bg-secondary-accent/25 border border-secondary-accent/70 text-white shadow-[0_0_12px_rgba(199,146,234,0.4)]"
                  : "bg-[rgba(var(--primary-bg-rgb),0.25)] border border-slate-700/55 text-slate-300 hover:bg-[rgba(var(--primary-bg-rgb),0.45)] hover:border-slate-500/80 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-secondary-accent" />
                Milky Way Galaxy
              </span>
              <span className="text-[10px] font-bold tracking-wider opacity-85">
                {settings.useMilkyWayBackground ? "ON" : "OFF"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN LOWER NAVBAR DOCK */}
      <nav
        aria-label="Planetarium navigation and controls"
        className="pointer-events-auto flex items-center justify-between gap-1 sm:gap-2 rounded-2xl sm:rounded-full border border-slate-700/50 bg-[linear-gradient(165deg,rgba(var(--primary-bg-rgb),0.42),rgba(20,28,40,0.28))] px-2.5 sm:px-3.5 py-1.5 sm:py-2 shadow-[0_10px_24px_-10px_rgba(99,102,241,0.45)] backdrop-blur-xl max-w-full overflow-x-auto"
      >
        {/* Return Home */}
        <a
          href="/"
          className={`${navButtonBase} px-2.5 sm:px-3 py-1.5`}
          title="Return to Portfolio Homepage"
        >
          <Home className="h-3.5 w-3.5 text-slate-300" />
          <span className="hidden sm:inline">Home</span>
        </a>

        <div className="h-4 w-px bg-slate-700/50" />

        {/* Celestial Body Navigator Button */}
        <button
          type="button"
          onClick={() =>
            setActiveMenu((curr) => (curr === "planets" ? null : "planets"))
          }
          className={`${navButtonBase} px-2.5 sm:px-3 py-1.5 ${
            activeMenu === "planets" || selectedId ? navButtonActive : ""
          }`}
          title="Browse Celestial Bodies"
        >
          <Globe className="h-3.5 w-3.5 text-primary-accent" />
          <span>{selectedId ? selectedId.toUpperCase() : "Planets"}</span>
        </button>

        {/* Solar System Reset Button */}
        <button
          type="button"
          onClick={handleOverviewClick}
          className={`${navButtonBase} px-2 sm:px-2.5 py-1.5`}
          title="Reset View to Solar System Overview"
        >
          <RotateCcw className="h-3.5 w-3.5 text-secondary-accent" />
          <span className="hidden md:inline">Overview</span>
        </button>

        <div className="h-4 w-px bg-slate-700/50" />

        {/* Integrated Time Simulation Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={onSlower}
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.22)] text-slate-300 transition hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.42)] hover:text-white active:scale-95"
            aria-label="Slow down simulation"
            title="Slow down"
          >
            <Rewind className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onTogglePause}
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-primary-accent/60 bg-primary-accent/25 text-white transition hover:border-primary-accent hover:bg-primary-accent/35 active:scale-95 shadow-[0_0_12px_rgba(99,102,241,0.45)]"
            aria-label={isPaused ? "Resume simulation" : "Pause simulation"}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? (
              <Play className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Pause className="h-3.5 w-3.5 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={onFaster}
            className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.22)] text-slate-300 transition hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.42)] hover:text-white active:scale-95"
            aria-label="Speed up simulation"
            title="Speed up"
          >
            <FastForward className="h-3.5 w-3.5" />
          </button>

          {/* Date & Speed Display */}
          <div className="mx-1.5 flex min-w-[5.5rem] sm:min-w-[7.5rem] flex-col overflow-hidden leading-none text-left">
            <span className="text-[10px] sm:text-[11px] font-bold text-white tabular-nums tracking-tight">
              {dateParts ? dateParts.map((p) => p.value).join("") : "--"}
            </span>
            <span className="text-[9px] uppercase tracking-[0.15em] text-slate-400 mt-0.5">
              {speedStr}
            </span>
          </div>

          <button
            type="button"
            onClick={onNow}
            className="rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.22)] px-2 sm:px-2.5 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-200 transition hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.42)] hover:text-white active:scale-95"
            title="Jump to current real-world date"
          >
            Now
          </button>
        </div>

        <div className="h-4 w-px bg-slate-700/50" />

        {/* Visual Layers Button */}
        <button
          type="button"
          onClick={() =>
            setActiveMenu((curr) => (curr === "layers" ? null : "layers"))
          }
          className={`${navButtonBase} px-2 sm:px-2.5 py-1.5 ${
            activeMenu === "layers" ? navButtonActive : ""
          }`}
          title="Toggle Visual Overlays"
        >
          <Layers className="h-3.5 w-3.5 text-secondary-accent" />
          <span className="hidden sm:inline">Layers</span>
        </button>

        {/* Toggle Full Settings / Controls */}
        {onToggleControls && (
          <button
            type="button"
            onClick={onToggleControls}
            className={`${navButtonBase} px-2 sm:px-2.5 py-1.5`}
            title="Configure Controls"
          >
            <Sliders className="h-3.5 w-3.5 text-primary-accent" />
            <span className="hidden lg:inline">Settings</span>
          </button>
        )}
      </nav>
    </div>
  );
}
