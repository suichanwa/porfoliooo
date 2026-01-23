import type { BodyData } from "../data/types";
import { kmToAu } from "../utils/units";
import type { PlanetInfo } from "../data/planetInfo";

interface PlanetInfoPanelProps {
  planet: BodyData | null;
  info: PlanetInfo | null;
  isVisible: boolean;
  onClose: () => void;
  onHide?: () => void;
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(value));

export default function PlanetInfoPanel({
  planet,
  info,
  isVisible,
  onClose,
  onHide
}: PlanetInfoPanelProps) {
  return (
    <div
      className={`pointer-events-auto w-full max-w-none rounded-2xl border border-white/10 bg-base-100/10 p-4 text-[13px] text-white/80 shadow-xl backdrop-blur-sm transition-all duration-500 ease-out sm:max-w-sm sm:p-5 sm:text-sm max-h-[60vh] overflow-y-auto sm:max-h-none sm:overflow-visible ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
      }`}
      style={{ pointerEvents: isVisible ? "auto" : "none" }}
      aria-hidden={!isVisible}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
        <div className="flex items-center gap-2 self-end sm:self-auto sm:flex-col sm:items-end">
          {onHide && (
            <button
              type="button"
              onClick={onHide}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:border-white/30 hover:text-white"
            >
              Hide
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:border-white/30 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:gap-3">
        <div className="rounded-xl border border-white/5 bg-black/20 p-3">
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/40">
            Distance
          </div>
          <div className="mt-1 text-sm font-semibold text-white/80">
            {planet?.orbit ? `${kmToAu(planet.orbit.semiMajorAxisKm).toFixed(2)} AU` : "-"}
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
            {planet?.orbit ? `${Math.round(planet.orbit.orbitalPeriodDays)} days` : "-"}
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
