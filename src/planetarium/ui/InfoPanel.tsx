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
    <div className="rounded-2xl border border-white/10 bg-base-100/10 p-4 text-xs text-white/80 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">
            Focus
          </div>
          <div className="text-base font-semibold text-primary-accent">
            {planet?.name ?? "Select a planet"}
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:border-white/30 hover:text-white"
        >
          Reset
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-xl border border-white/5 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Distance
          </div>
          <div className="mt-1 text-sm font-semibold text-white/80">
            {distanceAU ? `${distanceAU.toFixed(2)} AU` : "-"}
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Radius
          </div>
          <div className="mt-1 text-sm font-semibold text-white/80">
            {planet ? `${formatNumber(planet.render.radiusKm)} km` : "-"}
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Period
          </div>
          <div className="mt-1 text-sm font-semibold text-white/80">
            {periodDays ? `${Math.round(periodDays)} days` : "-"}
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Tilt
          </div>
          <div className="mt-1 text-sm font-semibold text-white/80">
            {planet ? `${planet.rotation.axialTiltDeg.toFixed(1)} deg` : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
