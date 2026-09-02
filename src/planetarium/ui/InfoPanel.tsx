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
    <div className="rounded-2xl border border-white/15 bg-[linear-gradient(135deg,rgba(15,23,42,0.62),rgba(6,10,20,0.72))] backdrop-blur-2xl backdrop-saturate-150 p-4 text-xs text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_0_0_rgba(255,255,255,0.18)]">
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
          className="rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-slate-100 transition-all duration-200 hover:border-white/30 hover:bg-white/[0.16] hover:text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-md active:scale-95"
        >
          Reset
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors hover:bg-white/[0.07] hover:border-white/20">
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-semibold">
            Distance
          </div>
          <div className="mt-1 text-sm font-bold text-white">
            {distanceAU ? `${distanceAU.toFixed(2)} AU` : "-"}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors hover:bg-white/[0.07] hover:border-white/20">
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-semibold">
            Radius
          </div>
          <div className="mt-1 text-sm font-bold text-white">
            {planet ? `${formatNumber(planet.render.radiusKm)} km` : "-"}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors hover:bg-white/[0.07] hover:border-white/20">
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary-accent font-semibold">
            Period
          </div>
          <div className="mt-1 text-sm font-bold text-white">
            {periodDays ? `${Math.round(periodDays)} days` : "-"}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-colors hover:bg-white/[0.07] hover:border-white/20">
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
