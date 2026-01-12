import type { PlanetData } from "../data/types";
import type { PlanetInfo } from "../data/planetInfo";

interface PlanetInfoPanelProps {
  planet: PlanetData | null;
  info: PlanetInfo | null;
  isVisible: boolean;
  onClose: () => void;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(value));

export default function PlanetInfoPanel({
  planet,
  info,
  isVisible,
  onClose
}: PlanetInfoPanelProps) {
  return (
    <div
      className={`pointer-events-auto w-full max-w-sm rounded-2xl border border-white/10 bg-base-100/10 p-5 text-sm text-white/80 shadow-xl backdrop-blur-sm transition-all duration-500 ease-out ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
      }`}
      style={{ pointerEvents: isVisible ? "auto" : "none" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/50">
            Planet details
          </div>
          <div className="mt-1 text-xl font-semibold text-primary-accent">
            {planet?.name ?? "Select a planet"}
          </div>
          <p className="mt-2 text-xs text-white/60">
            {info?.summary ?? "Click a planet to learn more."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:border-white/30 hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
        <div className="rounded-xl border border-white/5 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Distance
          </div>
          <div className="mt-1 text-sm font-semibold text-white/80">
            {planet?.orbit ? `${planet.orbit.semiMajorAxisAU.toFixed(2)} AU` : "-"}
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Radius
          </div>
          <div className="mt-1 text-sm font-semibold text-white/80">
            {planet ? `${formatNumber(planet.radiusKm)} km` : "-"}
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Period
          </div>
          <div className="mt-1 text-sm font-semibold text-white/80">
            {planet?.orbit ? `${Math.round(planet.orbit.orbitalPeriodDays)} days` : "-"}
          </div>
        </div>
        <div className="rounded-xl border border-white/5 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Tilt
          </div>
          <div className="mt-1 text-sm font-semibold text-white/80">
            {planet ? `${planet.axialTiltDeg.toFixed(1)} deg` : "-"}
          </div>
        </div>
      </div>

      {info && (
        <div className="mt-4">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Highlights
          </div>
          <ul className="mt-2 space-y-2 text-xs text-white/70">
            {info.facts.map((fact) => (
              <li key={fact} className="border-l border-white/10 pl-3">
                {fact}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
