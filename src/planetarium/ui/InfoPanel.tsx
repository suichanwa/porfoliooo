import type { BodyData } from "../data/types";
import { kmToAu } from "../utils/units";

interface InfoPanelProps {
  planet: BodyData | null;
  onReset: () => void;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(value));

export default function InfoPanel({ planet, onReset }: InfoPanelProps) {
  const distanceAU = planet?.orbit ? kmToAu(planet.orbit.semiMajorAxisKm) : null;
  const periodDays = planet?.orbit?.orbitalPeriodDays;

  return (
    <div className="rounded-2xl border border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.4)] backdrop-blur-md p-4 text-xs text-slate-100 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-primary-accent font-semibold">
            Focus
          </div>
          <div className="text-base font-bold text-white mt-1">
            {planet?.name ?? "Select a planet"}
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-slate-700/80 bg-[rgba(var(--primary-bg-rgb),0.5)] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-100 transition-all duration-200 hover:border-slate-500/90 hover:bg-[rgba(var(--primary-bg-rgb),0.7)] hover:text-white shadow-sm"
        >
          Reset
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-xl border border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.3)] backdrop-blur-sm p-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-semibold">
            Distance
          </div>
          <div className="mt-1 text-sm font-bold text-white">
            {distanceAU ? `${distanceAU.toFixed(2)} AU` : "-"}
          </div>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.3)] backdrop-blur-sm p-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-semibold">
            Radius
          </div>
          <div className="mt-1 text-sm font-bold text-white">
            {planet ? `${formatNumber(planet.render.radiusKm)} km` : "-"}
          </div>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.3)] backdrop-blur-sm p-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-semibold">
            Period
          </div>
          <div className="mt-1 text-sm font-bold text-white">
            {periodDays ? `${Math.round(periodDays)} days` : "-"}
          </div>
        </div>
        <div className="rounded-xl border border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.3)] backdrop-blur-sm p-3 shadow-sm">
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-semibold">
            Tilt
          </div>
          <div className="mt-1 text-sm font-bold text-white">
            {planet ? `${planet.rotation.axialTiltDeg.toFixed(1)}°` : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
