import { kmToAu } from "../utils/units";
import { usePlanetSelection } from "../context/SelectionContext";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(value));

const formatMass = (massKg?: number) => {
  if (!massKg) return "-";
  const expStr = massKg.toExponential(3);
  const [mantissa, exp] = expStr.split(/e\+?/i);
  const cleanExp = exp ? parseInt(exp, 10) : "";
  return (
    <span>
      {mantissa} &times; 10<sup>{cleanExp}</sup> kg
    </span>
  );
};

export default function PlanetInfoPanel() {
  const {
    selectedPlanet: planet,
    selectedInfo: info,
    isInfoVisible,
    infoHidden,
    setInfoHidden,
    closeInfo
  } = usePlanetSelection();

  return (
    <div className="pointer-events-none absolute left-4 right-4 bottom-24 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-40 flex w-full max-w-none justify-center sm:bottom-auto sm:left-auto sm:right-4 sm:top-24 sm:max-w-sm sm:justify-end">
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className={`pointer-events-auto w-full max-w-none rounded-2xl border border-slate-700/50 bg-[linear-gradient(165deg,rgba(var(--primary-bg-rgb),0.85),rgba(20,28,40,0.72))] p-4 text-[13px] text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_24px_rgba(99,102,241,0.15)] backdrop-blur-2xl transition-all duration-500 ease-out sm:max-w-sm sm:p-5 sm:text-sm max-h-[calc(100vh-12rem)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
          isInfoVisible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0 pointer-events-none hidden"
        }`}
        style={{ pointerEvents: isInfoVisible ? "auto" : "none" }}
        aria-hidden={!isInfoVisible}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary-accent">
              Planet details
            </div>
            <div className="mt-1 text-xl font-bold text-white tracking-wide">
              {planet?.name ?? "Select a planet"}
            </div>
            {info?.summary && (
              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                {info.summary}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto sm:flex-col sm:items-end">
            <button
              type="button"
              onClick={() => setInfoHidden(true)}
              className="rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.22)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-300 transition-all duration-200 hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.42)] hover:text-white active:scale-95"
            >
              Hide
            </button>
            <button
              type="button"
              onClick={closeInfo}
              className="rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.22)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-300 transition-all duration-200 hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.42)] hover:text-white active:scale-95"
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:gap-3">
          <div className="rounded-xl border border-slate-700/45 bg-[rgba(var(--primary-bg-rgb),0.25)] p-3 backdrop-blur-md transition-all duration-200 hover:border-primary-accent/35 hover:bg-[rgba(var(--primary-bg-rgb),0.4)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              {planet?.parentId && planet.parentId !== "sun" ? "Orbit Radius" : "Distance"}
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              {planet?.orbit
                ? planet.parentId && planet.parentId !== "sun"
                  ? `${formatNumber(planet.orbit.semiMajorAxisKm)} km`
                  : `${kmToAu(planet.orbit.semiMajorAxisKm).toFixed(2)} AU`
                : "-"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-700/45 bg-[rgba(var(--primary-bg-rgb),0.25)] p-3 backdrop-blur-md transition-all duration-200 hover:border-primary-accent/35 hover:bg-[rgba(var(--primary-bg-rgb),0.4)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Radius
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              {planet ? `${formatNumber(planet.render.radiusKm)} km` : "-"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-700/45 bg-[rgba(var(--primary-bg-rgb),0.25)] p-3 backdrop-blur-md transition-all duration-200 hover:border-primary-accent/35 hover:bg-[rgba(var(--primary-bg-rgb),0.4)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Period
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              {planet?.orbit ? `${Math.round(planet.orbit.orbitalPeriodDays)} days` : "-"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-700/45 bg-[rgba(var(--primary-bg-rgb),0.25)] p-3 backdrop-blur-md transition-all duration-200 hover:border-primary-accent/35 hover:bg-[rgba(var(--primary-bg-rgb),0.4)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Tilt
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              {planet ? `${planet.rotation.axialTiltDeg.toFixed(1)} deg` : "-"}
            </div>
          </div>
          <div className="col-span-2 rounded-xl border border-slate-700/45 bg-[rgba(var(--primary-bg-rgb),0.25)] p-3 backdrop-blur-md transition-all duration-200 hover:border-primary-accent/35 hover:bg-[rgba(var(--primary-bg-rgb),0.4)]">
            <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
              Mass
            </div>
            <div className="mt-1 text-sm font-semibold text-white">
              {formatMass(planet?.massKg)}
            </div>
          </div>
        </div>

        {info && (
          <div className="mt-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-accent">
              Highlights
            </div>
            <ul className="mt-2 space-y-2 text-xs text-slate-300">
              {info.facts.map((fact) => (
                <li key={fact} className="border-l-2 border-primary-accent/50 pl-3 leading-relaxed">
                  {fact}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {planet && infoHidden && (
        <div className="pointer-events-auto ml-auto">
          <button
            type="button"
            onClick={() => setInfoHidden(false)}
            className="rounded-full border border-slate-700/55 bg-[linear-gradient(165deg,rgba(var(--primary-bg-rgb),0.42),rgba(20,28,40,0.28))] px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200 shadow-xl backdrop-blur-xl opacity-75 hover:opacity-100 transition-all duration-300 hover:border-primary-accent/50 hover:text-white active:scale-95"
          >
            Show details
          </button>
        </div>
      )}
    </div>
  );
}
