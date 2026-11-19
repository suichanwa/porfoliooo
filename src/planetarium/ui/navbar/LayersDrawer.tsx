import { Grid, Layers, Orbit, Sparkles, Tag, X } from "lucide-react";
import type { GravitySettings } from "../../gravity/gravityField";
import type { PlanetariumSettings } from "../../context/SettingsContext";
import { GRAVITY_PRESETS } from "../GravityPanel";

interface LayersDrawerProps {
  settings: PlanetariumSettings;
  gravitySettings?: GravitySettings;
  focusRing: string;
  onToggleSetting: (key: keyof PlanetariumSettings) => void;
  onGravityChange?: (next: GravitySettings) => void;
  onClose: () => void;
}

export default function LayersDrawer({
  settings,
  gravitySettings,
  focusRing,
  onToggleSetting,
  onGravityChange,
  onClose
}: LayersDrawerProps) {
  return (
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
          onClick={onClose}
          className={`text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition ${focusRing}`}
          aria-label="Close layers drawer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => onToggleSetting("showGrid")}
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
          onClick={() => onToggleSetting("showOrbits")}
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
          onClick={() => onToggleSetting("showLabels")}
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
          onClick={() => onToggleSetting("useMilkyWayBackground")}
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
                    gravitySettings.softening - preset.softening
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
  );
}
