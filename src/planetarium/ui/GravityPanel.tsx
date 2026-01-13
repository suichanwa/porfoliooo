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
    <div className="pointer-events-auto w-full max-w-[18rem] rounded-2xl border border-white/10 bg-base-100/10 px-3 py-3 text-[11px] text-white/80 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/50">
          Gravity
        </span>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:border-white/30 hover:text-white"
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
        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] uppercase tracking-[0.2em] text-white/50">
          {Object.entries(PRESETS).map(([label, preset]) => (
            <button
              key={label}
              type="button"
              className="rounded-full border border-white/10 px-2 py-1 transition hover:border-white/40 hover:text-white"
              onClick={() => onChange(preset)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            Grid strength
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
            className="range range-xs"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
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
            className="range range-xs"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
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
            className="range range-xs"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
            Max influence
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={toSlider(
              settings.maxInfluence,
              sliderRanges.maxInfluence.min,
              sliderRanges.maxInfluence.max
            )}
            onChange={(event) =>
              onChange({
                ...settings,
                maxInfluence: fromSlider(
                  Number(event.target.value),
                  sliderRanges.maxInfluence.min,
                  sliderRanges.maxInfluence.max
                )
              })
            }
            className="range range-xs"
          />
        </label>
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
          Grid {settings.gridStrength.toFixed(2)} / Lens{" "}
          {settings.lensingStrength.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
