import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronUp,
  Clock,
  FastForward,
  Globe,
  Grid,
  Home,
  Layers,
  Orbit,
  Pause,
  Play,
  Rewind,
  RotateCcw,
  Sliders,
  Sparkles,
  Tag,
  X
} from "lucide-react";
import { PLANETS } from "../data/planets";
import { MOONS } from "../data/moons";
import { PLANET_BY_ID } from "../data/planetRegistry";
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
  isControlsOpen?: boolean;
  gravitySettings?: GravitySettings;
  onGravityChange?: (next: GravitySettings) => void;
}

type ActiveMenu = "planets" | "layers" | "time" | null;

const QUICK_SPEED_PRESETS = [
  { label: "Pause", value: 0 },
  { label: "1 d/s", value: 1 },
  { label: "10 d/s", value: 10 },
  { label: "30 d/s", value: 30 },
  { label: "1 yr/s", value: 365 }
] as const;

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "2-digit"
});

const formatSpeed = (speed: number, compact = false) => {
  const abs = Math.abs(speed);
  if (abs === 0) return compact ? "0x" : "paused";
  if (abs >= 365) {
    const yrs = (speed / 365).toFixed(abs >= 3650 ? 0 : 1);
    return compact ? `${yrs}y` : `${yrs} yr/s`;
  }
  if (abs >= 1) {
    const days = speed % 1 === 0 ? `${speed}` : speed.toFixed(1);
    return compact ? `${days}d` : `${days} d/s`;
  }
  const hrs = (speed * 24).toFixed(0);
  return compact ? `${hrs}h` : `${(speed * 24).toFixed(1)} h/s`;
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
  isControlsOpen = false,
  gravitySettings,
  onGravityChange
}: PlanetariumNavbarProps) {
  const { settings, toggleSetting, updateSetting } = useSettings();
  const {
    selectedId,
    selectedPlanet,
    activeSystemId,
    selectPlanet,
    resetOverview
  } = usePlanetSelection();

  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const formattedDate = useMemo(() => {
    if (simDateMs === null) return "--";
    return dateFormatter
      .formatToParts(new Date(simDateMs))
      .map((part) => part.value)
      .join("");
  }, [simDateMs]);

  const speedStr = formatSpeed(speed);
  const compactSpeedStr = formatSpeed(speed, true);

  const systemMoons = useMemo(() => {
    if (!activeSystemId) return [];
    return MOONS.filter((moon) => moon.parentId === activeSystemId);
  }, [activeSystemId]);

  const systemParent = activeSystemId ? PLANET_BY_ID[activeSystemId] ?? null : null;
  const activeBodyColor = selectedPlanet?.render.colorFallback ?? "#5e9fff";
  const hasActiveVisualLayers =
    settings.showGrid || settings.showLabels || settings.useMilkyWayBackground;

  // Close open drawers on outside pointer down or Escape key
  useEffect(() => {
    if (!activeMenu) return;

    const handleOutsideClick = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveMenu(null);
      }
    };

    window.addEventListener("pointerdown", handleOutsideClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handleOutsideClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeMenu]);

  const toggleMenu = (menu: Exclude<ActiveMenu, null>) => {
    setActiveMenu((curr) => (curr === menu ? null : menu));
  };

  const handlePlanetSelect = (id: BodyId) => {
    selectPlanet(id, "picker");
    setActiveMenu(null);
  };

  const handleOverviewClick = () => {
    resetOverview();
    setActiveMenu(null);
  };

  const handleControlsClick = () => {
    setActiveMenu(null);
    onToggleControls?.();
  };

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent/70 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950";

  const navButtonBase = `group flex flex-shrink-0 items-center gap-1.5 rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.24)] text-slate-300/90 hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.44)] hover:text-white transition-all duration-200 active:scale-95 text-[11px] font-semibold uppercase tracking-[0.08em] shadow-sm ${focusRing}`;

  const navButtonActive =
    "border-primary-accent/65 bg-primary-accent/20 text-white shadow-[0_0_12px_rgba(99,102,241,0.45)]";

  const navButtonSecondaryActive =
    "border-secondary-accent/65 bg-secondary-accent/20 text-white shadow-[0_0_12px_rgba(199,146,234,0.4)]";

  return (
    <div
      ref={navRef}
      onPointerDown={(e) => e.stopPropagation()}
      className="pointer-events-none fixed bottom-2.5 sm:bottom-4 left-1/2 z-[45] -translate-x-1/2 flex flex-col items-center w-[calc(100vw-1rem)] max-w-[27rem] sm:w-auto sm:max-w-[calc(100vw-1.5rem)] pb-[env(safe-area-inset-bottom)]"
    >
      {/* 1. POPUP DRAWER: Celestial Bodies & Active System Moons */}
      {activeMenu === "planets" && (
        <div
          role="dialog"
          aria-label="Celestial bodies navigation"
          className="pointer-events-auto mb-2 w-full sm:w-auto max-w-full rounded-2xl border border-slate-700/60 bg-[linear-gradient(165deg,rgba(15,23,42,0.95),rgba(20,28,40,0.9))] p-2.5 sm:p-3 shadow-[0_18px_42px_rgba(0,0,0,0.75)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-700/40 pb-2 mb-2 px-1">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-primary-accent">
              <Globe className="h-3.5 w-3.5 text-primary-accent" />
              Celestial Bodies
            </span>
            <button
              type="button"
              onClick={() => setActiveMenu(null)}
              className={`text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition ${focusRing}`}
              aria-label="Close celestial drawer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Primary Planets Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto overscroll-x-contain py-1 px-0.5 max-w-full sm:max-w-[min(86vw,40rem)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={handleOverviewClick}
              className={`flex min-h-[34px] flex-shrink-0 items-center gap-1.5 rounded-xl border border-secondary-accent/40 bg-secondary-accent/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-secondary-accent hover:bg-secondary-accent/25 transition active:scale-95 ${focusRing}`}
            >
              <RotateCcw className="h-3 w-3" />
              <span>Overview</span>
            </button>

            {PLANETS.map((planet) => {
              const isSelected = selectedId === planet.id;
              const isParentOfSelected =
                !isSelected && activeSystemId === planet.id;
              return (
                <button
                  key={planet.id}
                  type="button"
                  onClick={() => handlePlanetSelect(planet.id)}
                  className={`flex min-h-[34px] flex-shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition-all duration-200 active:scale-95 ${focusRing} ${
                    isSelected
                      ? "bg-primary-accent/25 border border-primary-accent/70 text-white shadow-[0_0_12px_rgba(99,102,241,0.45)]"
                      : isParentOfSelected
                        ? "bg-primary-accent/10 border border-primary-accent/40 text-slate-100 hover:bg-primary-accent/20"
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

          {/* Active System Moons Sub-Strip */}
          {systemMoons.length > 0 && systemParent && (
            <div className="mt-2 pt-2 border-t border-slate-700/40">
              <div className="flex items-center justify-between px-1 mb-1.5">
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {systemParent.id === "pluto"
                    ? "Pluto–Charon System"
                    : `Moons of ${systemParent.name}`}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500">
                  {systemMoons.length}{" "}
                  {systemMoons.length === 1 ? "moon" : "moons"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto overscroll-x-contain py-0.5 px-0.5 max-w-full sm:max-w-[min(86vw,40rem)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {systemMoons.map((moon) => {
                  const isMoonSelected = selectedId === moon.id;
                  return (
                    <button
                      key={moon.id}
                      type="button"
                      onClick={() => handlePlanetSelect(moon.id)}
                      className={`flex min-h-[32px] flex-shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] transition-all duration-200 active:scale-95 ${focusRing} ${
                        isMoonSelected
                          ? "bg-secondary-accent/25 border border-secondary-accent/70 text-white shadow-[0_0_12px_rgba(199,146,234,0.4)]"
                          : "bg-white/[0.04] border border-slate-700/55 text-slate-300 hover:bg-white/[0.08] hover:border-secondary-accent/45 hover:text-white"
                      }`}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: moon.render.colorFallback ?? "#c792ea"
                        }}
                      />
                      <span>{moon.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. POPUP DRAWER: Time Controls & Speed Presets */}
      {activeMenu === "time" && (
        <div
          role="dialog"
          aria-label="Time simulation controls"
          className="pointer-events-auto mb-2 w-full max-w-sm sm:w-80 rounded-2xl border border-slate-700/60 bg-[linear-gradient(165deg,rgba(15,23,42,0.95),rgba(20,28,40,0.9))] p-3 shadow-[0_18px_42px_rgba(0,0,0,0.75)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/40 pb-2 mb-2.5 px-1">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-primary-accent">
              <Clock className="h-3.5 w-3.5 text-primary-accent" />
              Time Control
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-white tabular-nums">
                {formattedDate}
              </span>
              <button
                type="button"
                onClick={() => setActiveMenu(null)}
                className={`text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition ${focusRing}`}
                aria-label="Close time controls"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Primary Transport Controls */}
          <div className="flex items-center justify-between gap-1.5 mb-2.5">
            <button
              type="button"
              onClick={onSlower}
              className={`flex h-9 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-white/[0.04] text-slate-200 hover:bg-white/[0.1] hover:text-white active:scale-95 transition ${focusRing}`}
              aria-label="Slow down simulation"
              title="Slow down"
            >
              <Rewind className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onTogglePause}
              className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 text-[11px] font-bold uppercase tracking-wider transition active:scale-95 ${focusRing} ${
                isPaused
                  ? "border-slate-600/70 bg-slate-800/70 text-slate-200 hover:text-white"
                  : "border-primary-accent/70 bg-primary-accent/25 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)]"
              }`}
            >
              {isPaused ? (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="h-3.5 w-3.5 fill-current" />
                  <span className="tabular-nums">{speedStr}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onFaster}
              className={`flex h-9 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-white/[0.04] text-slate-200 hover:bg-white/[0.1] hover:text-white active:scale-95 transition ${focusRing}`}
              aria-label="Speed up simulation"
              title="Speed up"
            >
              <FastForward className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={onNow}
              className={`flex h-9 px-3 flex-shrink-0 items-center justify-center rounded-xl border border-secondary-accent/45 bg-secondary-accent/15 text-[10px] font-bold uppercase tracking-wider text-secondary-accent hover:bg-secondary-accent/25 hover:text-white active:scale-95 transition ${focusRing}`}
              title="Jump to current real-world date"
            >
              Now
            </button>
          </div>

          {/* Speed Presets */}
          <div className="grid grid-cols-5 gap-1">
            {QUICK_SPEED_PRESETS.map((preset) => {
              const isPresetActive = Math.abs(speed - preset.value) < 1e-6;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => updateSetting("orbitSpeed", preset.value)}
                  className={`rounded-lg py-1.5 text-[10px] font-bold tracking-wide transition active:scale-95 ${focusRing} ${
                    isPresetActive
                      ? "bg-primary-accent/25 border border-primary-accent/70 text-white shadow-[0_0_10px_rgba(99,102,241,0.35)]"
                      : "bg-white/[0.04] border border-slate-700/50 text-slate-300 hover:bg-white/[0.09] hover:text-white"
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. POPUP DRAWER: Visual Layers & Gravity */}
      {activeMenu === "layers" && (
        <div
          role="dialog"
          aria-label="Visual layers and gravity presets"
          className="pointer-events-auto mb-2 w-full max-w-xs sm:w-72 rounded-2xl border border-slate-700/60 bg-[linear-gradient(165deg,rgba(15,23,42,0.95),rgba(20,28,40,0.9))] p-3 shadow-[0_18px_42px_rgba(0,0,0,0.75)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center justify-between border-b border-slate-700/40 pb-2 mb-2 px-1">
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-secondary-accent">
              <Layers className="h-3.5 w-3.5 text-secondary-accent" />
              Visual Layers
            </span>
            <button
              type="button"
              onClick={() => setActiveMenu(null)}
              className={`text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition ${focusRing}`}
              aria-label="Close layers drawer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => toggleSetting("showGrid")}
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] transition ${focusRing} ${
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
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] transition ${focusRing} ${
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
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] transition ${focusRing} ${
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
              className={`flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.06em] transition ${focusRing} ${
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
              <div className="mt-1.5 pt-2 border-t border-slate-700/40 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">
                  <span>Spacetime Gravity</span>
                  {gravitySettings && (
                    <span className="text-secondary-accent tabular-nums">
                      {gravitySettings.gridStrength.toFixed(1)}x
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {Object.entries(GRAVITY_PRESETS).map(([label, preset]) => {
                    const isPresetActive =
                      gravitySettings !== undefined &&
                      Math.abs(
                        gravitySettings.gridStrength - preset.gridStrength
                      ) < 0.05 &&
                      Math.abs(
                        gravitySettings.wellDepthScale - preset.wellDepthScale
                      ) < 0.05;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => onGravityChange(preset)}
                        className={`rounded-lg py-1.5 text-[9.5px] font-bold uppercase tracking-wider active:scale-95 transition ${focusRing} ${
                          isPresetActive
                            ? "bg-secondary-accent/25 border border-secondary-accent/70 text-white shadow-[0_0_10px_rgba(199,146,234,0.35)]"
                            : "bg-white/[0.04] hover:bg-white/[0.09] text-slate-300 hover:text-white border border-slate-700/50 hover:border-secondary-accent/40"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4A. MOBILE PHONE DOCK (< 640px, fluid zero-overflow layout)   */}
      {/* ============================================================ */}
      <nav
        aria-label="Planetarium mobile navigation"
        className="pointer-events-auto flex sm:hidden items-center gap-1 min-[410px]:gap-1.5 w-full rounded-2xl border border-slate-700/60 bg-[linear-gradient(165deg,rgba(15,23,42,0.9),rgba(20,28,40,0.84))] px-1.5 min-[410px]:px-2 py-1.5 shadow-[0_12px_32px_rgba(0,0,0,0.7),0_0_20px_rgba(99,102,241,0.22)] backdrop-blur-md"
      >
        {/* Return Home */}
        <a
          href="/"
          className={`flex h-9 w-9 min-[410px]:h-10 min-[410px]:w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-white/[0.04] text-slate-300 hover:text-white active:scale-95 transition ${focusRing}`}
          title="Return Home"
          aria-label="Return to portfolio home"
        >
          <Home className="h-4 w-4" />
        </a>

        {/* Fluid Celestial Bodies Picker Pill */}
        <button
          type="button"
          onClick={() => toggleMenu("planets")}
          aria-expanded={activeMenu === "planets"}
          aria-haspopup="dialog"
          className={`flex h-9 min-[410px]:h-10 flex-1 min-w-0 items-center justify-between gap-1.5 rounded-xl border px-2.5 text-[11.5px] font-semibold tracking-wide transition active:scale-[0.98] ${focusRing} ${
            activeMenu === "planets" || selectedId
              ? "border-primary-accent/70 bg-primary-accent/22 text-white shadow-[0_0_10px_rgba(99,102,241,0.38)]"
              : "border-slate-700/60 bg-white/[0.04] text-slate-200 hover:text-white"
          }`}
          title="Browse Celestial Bodies"
        >
          <span className="flex items-center gap-1.5 min-w-0">
            {selectedPlanet ? (
              <span
                className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-[0_0_8px_currentColor]"
                style={{
                  backgroundColor: activeBodyColor,
                  color: activeBodyColor
                }}
              />
            ) : (
              <Globe className="h-3.5 w-3.5 flex-shrink-0 text-primary-accent" />
            )}
            <span className="truncate">
              {selectedPlanet?.name ?? "Planets"}
            </span>
          </span>
          <ChevronUp
            className={`hidden min-[360px]:block h-3.5 w-3.5 flex-shrink-0 text-slate-400 transition-transform duration-200 ${
              activeMenu === "planets" ? "rotate-180 text-white" : ""
            }`}
          />
        </button>

        {/* Compact Time Pill: Play/Pause + Speed Popover Trigger */}
        <div className="flex h-9 min-[410px]:h-10 flex-shrink-0 items-center rounded-xl border border-slate-700/60 bg-white/[0.04] p-0.5">
          <button
            type="button"
            onClick={onTogglePause}
            className={`flex h-8 w-8 min-[410px]:h-9 min-[410px]:w-9 items-center justify-center rounded-lg transition active:scale-95 ${focusRing} ${
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
            onClick={() => toggleMenu("time")}
            aria-expanded={activeMenu === "time"}
            aria-haspopup="dialog"
            className={`flex h-8 min-[410px]:h-9 min-w-[2rem] items-center justify-center rounded-lg px-1.5 text-[10px] font-bold tabular-nums tracking-wider transition ${focusRing} ${
              activeMenu === "time"
                ? "bg-primary-accent/25 text-white"
                : "text-slate-300 hover:text-white"
            }`}
            title="Open time & speed controls"
            aria-label={`Time controls, current speed ${speedStr}`}
          >
            {compactSpeedStr}
          </button>
        </div>

        {/* Reset Overview (dedicated dock button on wider phones; always available in Planets drawer) */}
        <button
          type="button"
          onClick={handleOverviewClick}
          className={`hidden min-[410px]:flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-white/[0.04] text-slate-300 hover:text-white active:scale-95 transition ${focusRing}`}
          title="Reset to Solar System Overview"
          aria-label="Reset to solar system overview"
        >
          <RotateCcw className="h-4 w-4 text-secondary-accent" />
        </button>

        {/* Visual Layers Drawer Toggle */}
        <button
          type="button"
          onClick={() => toggleMenu("layers")}
          aria-expanded={activeMenu === "layers"}
          aria-haspopup="dialog"
          className={`relative flex h-9 w-9 min-[410px]:h-10 min-[410px]:w-10 flex-shrink-0 items-center justify-center rounded-xl border transition active:scale-95 ${focusRing} ${
            activeMenu === "layers"
              ? "border-secondary-accent/70 bg-secondary-accent/25 text-white shadow-[0_0_10px_rgba(199,146,234,0.4)]"
              : "border-slate-700/60 bg-white/[0.04] text-slate-300 hover:text-white"
          }`}
          title="Toggle Visual Overlays"
          aria-label="Toggle visual overlays"
        >
          <Layers className="h-4 w-4 text-secondary-accent" />
          {hasActiveVisualLayers && activeMenu !== "layers" && (
            <span
              aria-hidden="true"
              className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-secondary-accent shadow-[0_0_6px_rgba(199,146,234,0.9)]"
            />
          )}
        </button>

        {/* Controls / Settings */}
        {onToggleControls && (
          <button
            type="button"
            onClick={handleControlsClick}
            aria-expanded={isControlsOpen}
            className={`flex h-9 w-9 min-[410px]:h-10 min-[410px]:w-10 flex-shrink-0 items-center justify-center rounded-xl border transition active:scale-95 ${focusRing} ${
              isControlsOpen
                ? "border-primary-accent/70 bg-primary-accent/25 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                : "border-slate-700/60 bg-white/[0.04] text-slate-300 hover:text-white"
            }`}
            title="Simulation Settings"
            aria-label="Simulation settings"
          >
            <Sliders className="h-4 w-4 text-primary-accent" />
          </button>
        )}
      </nav>

      {/* ============================================================ */}
      {/* 4B. TABLET & DESKTOP LOWER NAVBAR DOCK (>= 640px)             */}
      {/* ============================================================ */}
      <nav
        aria-label="Planetarium desktop navigation"
        className="pointer-events-auto hidden sm:flex items-center gap-1 md:gap-1.5 rounded-full border border-slate-700/50 bg-[linear-gradient(165deg,rgba(15,23,42,0.78),rgba(20,28,40,0.68))] px-2 md:px-2.5 py-1.5 shadow-[0_10px_28px_-8px_rgba(0,0,0,0.65),0_8px_22px_-10px_rgba(99,102,241,0.45)] backdrop-blur-md max-w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* Return Home */}
        <a
          href="/"
          className={`${navButtonBase} px-2.5 py-1.5`}
          title="Return to Portfolio Homepage"
          aria-label="Return to portfolio homepage"
        >
          <Home className="h-3.5 w-3.5 text-slate-300" />
          <span className="hidden xl:inline">Home</span>
        </a>

        <div className="h-4 w-px flex-shrink-0 bg-slate-700/50" />

        {/* Celestial Body Navigator Button */}
        <button
          type="button"
          onClick={() => toggleMenu("planets")}
          aria-expanded={activeMenu === "planets"}
          aria-haspopup="dialog"
          className={`${navButtonBase} px-2.5 py-1.5 max-w-[10.5rem] ${
            activeMenu === "planets" || selectedId ? navButtonActive : ""
          }`}
          title="Browse Celestial Bodies"
        >
          {selectedPlanet ? (
            <span
              className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-[0_0_8px_currentColor]"
              style={{
                backgroundColor: activeBodyColor,
                color: activeBodyColor
              }}
            />
          ) : (
            <Globe className="h-3.5 w-3.5 flex-shrink-0 text-primary-accent" />
          )}
          <span className="truncate">
            {selectedPlanet?.name ?? "Planets"}
          </span>
        </button>

        {/* Solar System Reset Button */}
        <button
          type="button"
          onClick={handleOverviewClick}
          className={`${navButtonBase} px-2.5 py-1.5`}
          title="Reset View to Solar System Overview"
          aria-label="Reset view to solar system overview"
        >
          <RotateCcw className="h-3.5 w-3.5 text-secondary-accent" />
          <span className="hidden lg:inline">Overview</span>
        </button>

        <div className="h-4 w-px flex-shrink-0 bg-slate-700/50" />

        {/* Integrated Time Simulation Controls */}
        <div className="flex flex-shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onSlower}
            className={`flex h-7 w-7 items-center justify-center rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.24)] text-slate-300 transition hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.44)] hover:text-white active:scale-95 ${focusRing}`}
            aria-label="Slow down simulation"
            title="Slow down"
          >
            <Rewind className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onTogglePause}
            className={`flex h-7 w-7 items-center justify-center rounded-full border border-primary-accent/60 bg-primary-accent/25 text-white transition hover:border-primary-accent hover:bg-primary-accent/35 active:scale-95 shadow-[0_0_12px_rgba(99,102,241,0.45)] ${focusRing}`}
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
            className={`flex h-7 w-7 items-center justify-center rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.24)] text-slate-300 transition hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.44)] hover:text-white active:scale-95 ${focusRing}`}
            aria-label="Speed up simulation"
            title="Speed up"
          >
            <FastForward className="h-3.5 w-3.5" />
          </button>

          {/* Clickable Date & Speed Readout (opens quick presets popover) */}
          <button
            type="button"
            onClick={() => toggleMenu("time")}
            aria-expanded={activeMenu === "time"}
            aria-haspopup="dialog"
            className={`mx-0.5 flex min-w-[5.75rem] md:min-w-[6.25rem] flex-col overflow-hidden rounded-lg px-1.5 py-0.5 leading-none text-left transition ${focusRing} ${
              activeMenu === "time"
                ? "bg-primary-accent/20"
                : "hover:bg-white/[0.06]"
            }`}
            title="Open speed presets"
          >
            <span className="text-[11px] font-bold text-white tabular-nums tracking-tight whitespace-nowrap">
              {formattedDate}
            </span>
            <span className="text-[9px] uppercase tracking-[0.15em] text-slate-400 mt-0.5 whitespace-nowrap">
              {speedStr}
            </span>
          </button>

          <button
            type="button"
            onClick={onNow}
            className={`rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.24)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-200 transition hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.44)] hover:text-white active:scale-95 ${focusRing}`}
            title="Jump to current real-world date"
          >
            Now
          </button>
        </div>

        <div className="h-4 w-px flex-shrink-0 bg-slate-700/50" />

        {/* Visual Layers Button */}
        <button
          type="button"
          onClick={() => toggleMenu("layers")}
          aria-expanded={activeMenu === "layers"}
          aria-haspopup="dialog"
          className={`relative ${navButtonBase} px-2.5 py-1.5 ${
            activeMenu === "layers" ? navButtonSecondaryActive : ""
          }`}
          title="Toggle Visual Overlays"
          aria-label="Toggle visual overlays"
        >
          <Layers className="h-3.5 w-3.5 text-secondary-accent" />
          <span className="hidden lg:inline">Layers</span>
          {hasActiveVisualLayers && activeMenu !== "layers" && (
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-secondary-accent shadow-[0_0_6px_rgba(199,146,234,0.9)]"
            />
          )}
        </button>

        {/* Toggle Full Settings / Controls */}
        {onToggleControls && (
          <button
            type="button"
            onClick={handleControlsClick}
            aria-expanded={isControlsOpen}
            className={`${navButtonBase} px-2.5 py-1.5 ${
              isControlsOpen ? navButtonActive : ""
            }`}
            title="Configure Controls"
            aria-label="Configure simulation controls"
          >
            <Sliders className="h-3.5 w-3.5 text-primary-accent" />
            <span className="hidden lg:inline">Settings</span>
          </button>
        )}
      </nav>
    </div>
  );
}
