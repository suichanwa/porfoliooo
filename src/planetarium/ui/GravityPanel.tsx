import { useMemo, useState } from "react";
import type { GravitySettings } from "../gravity/gravityField";

interface GravityPanelProps {
  settings: GravitySettings;
  onChange: (next: GravitySettings) => void;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const toSlider = (value: number, min: number, max: number) =>
  ((clamp(value, min, max) - min) / (max - min)) * 100;

const fromSlider = (value: number, min: number, max: number) =>
  min + (max - min) * (value / 100);

const PRESETS: Record<string, GravitySettings> = {
  Subtle: {
    gridStrength: 0.35,
    lensingStrength: 0.15,
    softening: 6,
    maxInfluence: 1.6
  },
  Cinematic: {
    gridStrength: 0.75,
    lensingStrength: 0.32,
    softening: 4,
    maxInfluence: 2.6
  },
  Debug: {
    gridStrength: 1.2,
    lensingStrength: 0.45,
    softening: 2.8,
    maxInfluence: 4
  }
};

export default function GravityPanel({ settings, onChange }: GravityPanelProps) {
  const [open, setOpen] = useState(false);
  const sliderRanges = useMemo(
    () => ({
      gridStrength: { min: 0, max: 1.5 },
      lensingStrength: { min: 0, max: 0.6 },
      softening: { min: 1.5, max: 10 },
      maxInfluence: { min: 0.6, max: 4 }
    }),
    []
  );

  return (
    <div className="pointer-events-auto w-full max-w-[18rem] rounded-2xl border border-slate-700/60 bg-[linear-gradient(165deg,rgba(var(--primary-bg-rgb),0.94),rgba(20,28,40,0.85))] px-3.5 py-3 text-[11px] text-slate-200 shadow-[0_15px_35px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-secondary-accent">
          Spacetime Gravity
        </span>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-full border border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.45)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-300 transition hover:border-secondary-accent/40 hover:text-white"
          aria-expanded={open}
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>
      <div
        className={`flex flex-col gap-3 overflow-hidden transition-all duration-300 ${
          open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-300">
          {Object.entries(PRESETS).map(([label, preset]) => (
            <button
              key={label}
              type="button"
              className="rounded-full border border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.45)] px-2 py-1 transition hover:border-primary-accent/40 hover:text-white active:scale-95"
              onClick={() => onChange(preset)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Grid curvature
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={toSlider(
              settings.gridStrength,
              sliderRanges.gridStrength.min,
              sliderRanges.gridStrength.max
            )}
            onChange={(event) =>
              onChange({
                ...settings,
                gridStrength: fromSlider(
                  Number(event.target.value),
                  sliderRanges.gridStrength.min,
                  sliderRanges.gridStrength.max
                )
              })
            }
            className="range range-xs range-secondary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Lensing strength
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={toSlider(
              settings.lensingStrength,
              sliderRanges.lensingStrength.min,
              sliderRanges.lensingStrength.max
            )}
            onChange={(event) =>
              onChange({
                ...settings,
                lensingStrength: fromSlider(
                  Number(event.target.value),
                  sliderRanges.lensingStrength.min,
                  sliderRanges.lensingStrength.max
                )
              })
            }
            className="range range-xs range-secondary"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
            Softening radius
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={toSlider(
              settings.softening,
              sliderRanges.softening.min,
              sliderRanges.softening.max
            )}
            onChange={(event) =>
              onChange({
                ...settings,
                softening: fromSlider(
                  Number(event.target.value),
                  sliderRanges.softening.min,
                  sliderRanges.softening.max
                )
              })
            }
            className="range range-xs range-secondary"
          />
        </label>
        <div className="text-[10px] uppercase tracking-[0.15em] text-slate-400 font-medium">
          Grid: <span className="text-white">{settings.gridStrength.toFixed(2)}</span> / Lens:{" "}
          <span className="text-white">{settings.lensingStrength.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
