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
import type { GravitySettings } from "../gravity/gravityField";
import { GRAVITY_PRESETS } from "./GravityPanel";
import { useSettings } from "../context/SettingsContext";
import { usePlanetSelection } from "../context/SelectionContext";

interface PlanetariumNavbarProps {
  speed: number;
  isPaused: boolean;
  onSlower: () => void;
  onFaster: () => void;
  onTogglePause: () => void;
  onNow: () => void;
  simDateMs: number | null;
  onToggleControls?: () => void;
  gravitySettings?: GravitySettings;
  onGravityChange?: (next: GravitySettings) => void;
}

const SPEED_CYCLE = [1, 5, 30, 90, 0];

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
  onToggleControls,
  gravitySettings,
  onGravityChange
}: PlanetariumNavbarProps) {
  const { settings, toggleSetting, updateSetting } = useSettings();
  const { selectedId, selectPlanet, resetOverview } = usePlanetSelection();

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

  const handleCycleSpeed = () => {
    const currentIndex = SPEED_CYCLE.indexOf(settings.orbitSpeed);
    const nextSpeed =
      currentIndex >= 0
        ? SPEED_CYCLE[(currentIndex + 1) % SPEED_CYCLE.length]
        : 1;
    updateSetting("orbitSpeed", nextSpeed);
  };

  const navButtonBase =
    "group flex items-center gap-1.5 rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.22)] text-slate-300/90 hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.42)] hover:text-white transition-all duration-200 active:scale-95 text-[11px] font-semibold uppercase tracking-[0.08em] shadow-sm";

  const navButtonActive =
    "border-primary-accent/65 bg-primary-accent/20 text-white shadow-[0_0_12px_rgba(99,102,241,0.45)]";

  return (
    <div
      ref={navRef}
      className="pointer-events-none fixed bottom-2 sm:bottom-6 left-1/2 z-40 -translate-x-1/2 flex flex-col items-center w-[calc(100vw-1.25rem)] sm:w-auto max-w-4xl pb-[env(safe-area-inset-bottom)]"
    >
      {/* 1. POPUP DRAWER: Celestial Bodies Quick Strip */}
      {activeMenu === "planets" && (
        <div className="pointer-events-auto mb-2 w-full sm:w-auto max-w-full rounded-2xl border border-slate-700/60 bg-[linear-gradient(165deg,rgba(15,23,42,0.92),rgba(20,28,40,0.85))] p-2.5 sm:p-3 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between gap-3 border-b border-slate-700/40 pb-2 mb-2 px-1">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-primary-accent">
              <Globe className="h-3.5 w-3.5 text-primary-accent" />
              Celestial Bodies
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
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-1 max-w-[88vw] sm:max-w-xl scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Quick Overview button in celestial list */}
            <button
              type="button"
              onClick={handleOverviewClick}
              className="flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-secondary-accent/40 bg-secondary-accent/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-secondary-accent hover:bg-secondary-accent/25 transition active:scale-95"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Overview</span>
            </button>

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
                      : "bg-white/[0.04] border border-slate-700/55 text-slate-300 hover:bg-white/[0.08] hover:border-primary-accent/40 hover:text-white"
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
        <div className="pointer-events-auto mb-2 w-full max-w-xs sm:w-72 rounded-2xl border border-slate-700/60 bg-[linear-gradient(165deg,rgba(15,23,42,0.92),rgba(20,28,40,0.85))] p-3 shadow-2xl backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
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
                  : "bg-white/[0.04] border border-slate-700/55 text-slate-300 hover:bg-white/[0.08] hover:border-slate-500/80 hover:text-white"
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
                  : "bg-white/[0.04] border border-slate-700/55 text-slate-300 hover:bg-white/[0.08] hover:border-slate-500/80 hover:text-white"
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
                  : "bg-white/[0.04] border border-slate-700/55 text-slate-300 hover:bg-white/[0.08] hover:border-slate-500/80 hover:text-white"
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
                  : "bg-white/[0.04] border border-slate-700/55 text-slate-300 hover:bg-white/[0.08] hover:border-slate-500/80 hover:text-white"
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

            {onGravityChange && (
              <div className="mt-2 pt-2 border-t border-slate-700/40 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>Spacetime Gravity</span>
                  {gravitySettings && (
                    <span className="text-secondary-accent">
                      {gravitySettings.gridStrength.toFixed(1)}x
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {Object.entries(GRAVITY_PRESETS).map(([label, preset]) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => onGravityChange(preset)}
                      className="rounded-lg bg-white/[0.04] hover:bg-white/[0.09] py-1 text-[9px] font-bold uppercase tracking-wider text-slate-300 hover:text-white border border-slate-700/50 hover:border-secondary-accent/40 active:scale-95 transition"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3A. MOBILE PHONE DOCK (Ergonomic upright thumb navigation)    */}
      {/* ============================================================ */}
      <nav
        aria-label="Planetarium mobile navigation"
        className="pointer-events-auto flex sm:hidden items-center justify-between gap-1 w-full rounded-2xl border border-slate-700/60 bg-[linear-gradient(165deg,rgba(15,23,42,0.88),rgba(20,28,40,0.8))] px-2 py-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.7),0_0_20px_rgba(99,102,241,0.25)] backdrop-blur-2xl"
      >
        {/* Return Home */}
        <a
          href="/"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-white/[0.04] text-slate-300 hover:text-white active:scale-95 transition"
          title="Return Home"
          aria-label="Return to portfolio home"
        >
          <Home className="h-4 w-4" />
        </a>

        {/* Celestial Bodies Drawer Toggle */}
        <button
          type="button"
          onClick={() =>
            setActiveMenu((curr) => (curr === "planets" ? null : "planets"))
          }
          className={`flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold tracking-wide transition active:scale-95 ${
            activeMenu === "planets" || selectedId
              ? "border-primary-accent/70 bg-primary-accent/25 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]"
              : "border-slate-700/60 bg-white/[0.04] text-slate-300"
          }`}
          title="Browse Celestial Bodies"
        >
          <Globe className="h-4 w-4 text-primary-accent" />
          <span className="capitalize max-w-[4.5rem] truncate">
            {selectedId ?? "Planets"}
          </span>
        </button>

        {/* Play/Pause + Speed Cycle Badge */}
        <div className="flex h-10 items-center rounded-xl border border-slate-700/60 bg-white/[0.04] p-0.5">
          <button
            type="button"
            onClick={onTogglePause}
            className={`flex h-9 w-9 items-center justify-center rounded-lg transition active:scale-95 ${
              isPaused
                ? "bg-slate-700/60 text-slate-300"
                : "bg-primary-accent/30 border border-primary-accent/50 text-white shadow-[0_0_8px_rgba(99,102,241,0.4)]"
            }`}
            aria-label={isPaused ? "Resume simulation" : "Pause simulation"}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? (
              <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
            ) : (
              <Pause className="h-3.5 w-3.5 fill-current" />
            )}
          </button>
          <button
            type="button"
            onClick={handleCycleSpeed}
            className="px-2 py-1 text-[10px] font-bold text-slate-300 hover:text-white tabular-nums tracking-wider transition"
            title="Cycle simulation speed"
          >
            {speedStr}
          </button>
        </div>

        {/* Reset Overview */}
        <button
          type="button"
          onClick={handleOverviewClick}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-white/[0.04] text-slate-300 hover:text-white active:scale-95 transition"
          title="Reset to Solar System Overview"
          aria-label="Reset to solar system overview"
        >
          <RotateCcw className="h-4 w-4 text-secondary-accent" />
        </button>

        {/* Visual Layers Drawer Toggle */}
        <button
          type="button"
          onClick={() =>
            setActiveMenu((curr) => (curr === "layers" ? null : "layers"))
          }
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border transition active:scale-95 ${
            activeMenu === "layers"
              ? "border-secondary-accent/70 bg-secondary-accent/25 text-white shadow-[0_0_10px_rgba(199,146,234,0.4)]"
              : "border-slate-700/60 bg-white/[0.04] text-slate-300 hover:text-white"
          }`}
          title="Toggle Visual Overlays"
          aria-label="Toggle visual overlays"
        >
          <Layers className="h-4 w-4 text-secondary-accent" />
        </button>

        {/* Controls / Settings */}
        {onToggleControls && (
          <button
            type="button"
            onClick={onToggleControls}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-white/[0.04] text-slate-300 hover:text-white active:scale-95 transition"
            title="Simulation Settings"
            aria-label="Simulation settings"
          >
            <Sliders className="h-4 w-4 text-primary-accent" />
          </button>
        )}
      </nav>

      {/* ============================================================ */}
      {/* 3B. DESKTOP / TABLET LOWER NAVBAR DOCK                        */}
      {/* ============================================================ */}
      <nav
        aria-label="Planetarium desktop navigation"
        className="pointer-events-auto hidden sm:flex items-center justify-between gap-1.5 sm:gap-2 rounded-full border border-slate-700/50 bg-[linear-gradient(165deg,rgba(var(--primary-bg-rgb),0.42),rgba(20,28,40,0.28))] px-3.5 py-2 shadow-[0_10px_24px_-10px_rgba(99,102,241,0.45)] backdrop-blur-xl max-w-full overflow-x-auto"
      >
        {/* Return Home */}
        <a
          href="/"
          className={`${navButtonBase} px-3 py-1.5`}
          title="Return to Portfolio Homepage"
        >
          <Home className="h-3.5 w-3.5 text-slate-300" />
          <span>Home</span>
        </a>

        <div className="h-4 w-px bg-slate-700/50" />

        {/* Celestial Body Navigator Button */}
        <button
          type="button"
          onClick={() =>
            setActiveMenu((curr) => (curr === "planets" ? null : "planets"))
          }
          className={`${navButtonBase} px-3 py-1.5 ${
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
          className={`${navButtonBase} px-2.5 py-1.5`}
          title="Reset View to Solar System Overview"
        >
          <RotateCcw className="h-3.5 w-3.5 text-secondary-accent" />
          <span className="hidden md:inline">Overview</span>
        </button>

        <div className="h-4 w-px bg-slate-700/50" />

        {/* Integrated Time Simulation Controls */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onSlower}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.22)] text-slate-300 transition hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.42)] hover:text-white active:scale-95"
            aria-label="Slow down simulation"
            title="Slow down"
          >
            <Rewind className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onTogglePause}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-accent/60 bg-primary-accent/25 text-white transition hover:border-primary-accent hover:bg-primary-accent/35 active:scale-95 shadow-[0_0_12px_rgba(99,102,241,0.45)]"
            aria-label={isPaused ? "Resume simulation" : "Pause simulation"}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? (
              <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
            ) : (
              <Pause className="h-3.5 w-3.5 fill-current" />
            )}
          </button>

          <button
            type="button"
            onClick={onFaster}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.22)] text-slate-300 transition hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.42)] hover:text-white active:scale-95"
            aria-label="Speed up simulation"
            title="Speed up"
          >
            <FastForward className="h-3.5 w-3.5" />
          </button>

          {/* Date & Speed Display */}
          <div className="mx-1.5 flex min-w-[7.5rem] flex-col overflow-hidden leading-none text-left">
            <span className="text-[11px] font-bold text-white tabular-nums tracking-tight">
              {dateParts ? dateParts.map((p) => p.value).join("") : "--"}
            </span>
            <span className="text-[9px] uppercase tracking-[0.15em] text-slate-400 mt-0.5">
              {speedStr}
            </span>
          </div>

          <button
            type="button"
            onClick={onNow}
            className="rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.22)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200 transition hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.42)] hover:text-white active:scale-95"
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
          className={`${navButtonBase} px-2.5 py-1.5 ${
            activeMenu === "layers" ? navButtonActive : ""
          }`}
          title="Toggle Visual Overlays"
        >
          <Layers className="h-3.5 w-3.5 text-secondary-accent" />
          <span>Layers</span>
        </button>

        {/* Toggle Full Settings / Controls */}
        {onToggleControls && (
          <button
            type="button"
            onClick={onToggleControls}
            className={`${navButtonBase} px-2.5 py-1.5`}
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
