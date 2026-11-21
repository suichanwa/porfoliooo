import { Clock, FastForward, Pause, Play, Rewind, X } from "lucide-react";
import type { SimDateStore } from "../../hooks/useSimDateStore";
import SimDateReadout from "./SimDateReadout";

const QUICK_SPEED_PRESETS = [
  { label: "Pause", value: 0 },
  { label: "1 d/s", value: 1 },
  { label: "10 d/s", value: 10 },
  { label: "30 d/s", value: 30 },
  { label: "1 yr/s", value: 365 }
] as const;

interface TimeDrawerProps {
  speed: number;
  speedStr: string;
  isPaused: boolean;
  simDateStore: SimDateStore;
  focusRing: string;
  onSlower: () => void;
  onFaster: () => void;
  onTogglePause: () => void;
  onSelectSpeed: (value: number) => void;
  onClose: () => void;
}

export default function TimeDrawer({
  speed,
  speedStr,
  isPaused,
  simDateStore,
  focusRing,
  onSlower,
  onFaster,
  onTogglePause,
  onSelectSpeed,
  onClose
}: TimeDrawerProps) {
  return (
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
          <SimDateReadout
            store={simDateStore}
            className="text-[11px] font-semibold text-white tabular-nums"
          />
          <button
            type="button"
            onClick={onClose}
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
      </div>

      {/* Speed Presets */}
      <div className="grid grid-cols-5 gap-1">
        {QUICK_SPEED_PRESETS.map((preset) => {
          const isPresetActive = Math.abs(speed - preset.value) < 1e-6;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onSelectSpeed(preset.value)}
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
  );
}
