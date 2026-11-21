import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronUp,
  EyeOff,
  FastForward,
  Globe,
  Home,
  Layers,
  Pause,
  Play,
  Rewind,
  RotateCcw,
  Sliders
} from "lucide-react";
import { MOONS } from "../data/moons";
import { PLANET_BY_ID } from "../data/planetRegistry";
import type { BodyId } from "../data/types";
import type { GravitySettings } from "../gravity/gravityField";
import { useSettings } from "../context/SettingsContext";
import { usePlanetSelection } from "../context/SelectionContext";
import CelestialDrawer from "./navbar/CelestialDrawer";
import TimeDrawer from "./navbar/TimeDrawer";
import LayersDrawer from "./navbar/LayersDrawer";
import SimDateReadout from "./navbar/SimDateReadout";
import type { SimDateStore } from "../hooks/useSimDateStore";

interface PlanetariumNavbarProps {
  speed: number;
  isPaused: boolean;
  onSlower: () => void;
  onFaster: () => void;
  onTogglePause: () => void;
  simDateStore: SimDateStore;
  onToggleControls?: () => void;
  isControlsOpen?: boolean;
  onHideUi?: () => void;
  gravitySettings?: GravitySettings;
  onGravityChange?: (next: GravitySettings) => void;
}

type ActiveMenu = "planets" | "layers" | "time" | null;

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
  simDateStore,
  onToggleControls,
  isControlsOpen = false,
  onHideUi,
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

  const handleHideUiClick = () => {
    setActiveMenu(null);
    onHideUi?.();
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
        <CelestialDrawer
          selectedId={selectedId}
          activeSystemId={activeSystemId}
          systemParent={systemParent}
          systemMoons={systemMoons}
          focusRing={focusRing}
          onSelectBody={handlePlanetSelect}
          onOverview={handleOverviewClick}
          onClose={() => setActiveMenu(null)}
        />
      )}

      {/* 2. POPUP DRAWER: Time Controls & Speed Presets */}
      {activeMenu === "time" && (
        <TimeDrawer
          speed={speed}
          speedStr={speedStr}
          isPaused={isPaused}
          simDateStore={simDateStore}
          focusRing={focusRing}
          onSlower={onSlower}
          onFaster={onFaster}
          onTogglePause={onTogglePause}
          onSelectSpeed={(value) => updateSetting("orbitSpeed", value)}
          onClose={() => setActiveMenu(null)}
        />
      )}

      {/* 3. POPUP DRAWER: Visual Layers & Gravity */}
      {activeMenu === "layers" && (
        <LayersDrawer
          settings={settings}
          gravitySettings={gravitySettings}
          focusRing={focusRing}
          onToggleSetting={toggleSetting}
          onGravityChange={onGravityChange}
          onClose={() => setActiveMenu(null)}
        />
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

        {/* Hide Interface */}
        {onHideUi && (
          <button
            type="button"
            onClick={handleHideUiClick}
            className={`flex h-9 w-9 min-[410px]:h-10 min-[410px]:w-10 flex-shrink-0 items-center justify-center rounded-xl border border-slate-700/60 bg-white/[0.04] text-slate-300 hover:text-white active:scale-95 transition ${focusRing}`}
            title="Hide Interface (H)"
            aria-label="Hide interface"
          >
            <EyeOff className="h-4 w-4 text-slate-300" />
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
            <SimDateReadout
              store={simDateStore}
              className="text-[11px] font-bold text-white tabular-nums tracking-tight whitespace-nowrap"
            />
            <span className="text-[9px] uppercase tracking-[0.15em] text-slate-400 mt-0.5 whitespace-nowrap">
              {speedStr}
            </span>
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

        {/* Hide Interface */}
        {onHideUi && (
          <button
            type="button"
            onClick={handleHideUiClick}
            className={`${navButtonBase} px-2.5 py-1.5`}
            title="Hide Interface (H)"
            aria-label="Hide interface"
          >
            <EyeOff className="h-3.5 w-3.5 text-slate-300" />
            <span className="hidden xl:inline">Hide UI</span>
          </button>
        )}
      </nav>
    </div>
  );
}
