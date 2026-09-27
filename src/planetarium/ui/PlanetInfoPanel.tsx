import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Minimize2, X } from "lucide-react";
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

  // Mobile sheet expand/collapse state (default compact peek on phones)
  const [isExpanded, setIsExpanded] = useState(false);

  // Reset to glance/peek mode whenever a different planet is selected
  useEffect(() => {
    setIsExpanded(false);
  }, [planet?.id]);

  if (!planet) return null;

  const distanceText = planet.orbit
    ? planet.parentId && planet.parentId !== "sun"
      ? `${formatNumber(planet.orbit.semiMajorAxisKm)} km`
      : `${kmToAu(planet.orbit.semiMajorAxisKm).toFixed(2)} AU`
    : "-";

  const isMoon = Boolean(planet.parentId && planet.parentId !== "sun");

  return (
    <>
      {/* ============================================================ */}
      {/* 1. MOBILE PHONE UI: Sleek Glance Card / Expandable Peek Sheet */}
      {/* ============================================================ */}
      <div className="sm:hidden">
        {isInfoVisible && (
          <div className="pointer-events-none fixed left-3 right-3 bottom-[4.75rem] bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex justify-center max-w-md mx-auto">
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto w-full rounded-2xl border border-slate-700/60 bg-[linear-gradient(165deg,rgba(15,23,42,0.92),rgba(20,28,40,0.86))] p-3 text-[12px] text-slate-200 shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(99,102,241,0.2)] backdrop-blur-2xl transition-all duration-300 ease-out"
            >
              {/* Drag / Tap Handle Pill */}
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="w-full flex items-center justify-center pt-0.5 pb-2 -mt-1 cursor-pointer focus:outline-none"
                aria-label={isExpanded ? "Collapse info sheet" : "Expand info sheet"}
              >
                <div className="h-1 w-10 rounded-full bg-slate-500/50 hover:bg-primary-accent/80 transition-colors" />
              </button>

              {/* Header Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0 shadow-[0_0_8px_currentColor]"
                    style={{
                      backgroundColor: planet.render.colorFallback ?? "#5e9fff",
                      color: planet.render.colorFallback ?? "#5e9fff"
                    }}
                  />
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="text-base font-bold text-white tracking-wide truncate">
                      {planet.name}
                    </span>
                    <span className="rounded-full bg-primary-accent/20 border border-primary-accent/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary-accent">
                      {isMoon ? "Moon" : "Planet"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="flex items-center gap-1 rounded-full border border-slate-700/60 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/[0.1] active:scale-95 transition"
                    title={isExpanded ? "Show compact view" : "Show full details"}
                  >
                    <span>{isExpanded ? "Less" : "Details"}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronUp className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInfoHidden(true)}
                    className="rounded-full border border-slate-700/60 bg-white/[0.05] p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.1] active:scale-95 transition"
                    title="Minimize card"
                    aria-label="Minimize card"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={closeInfo}
                    className="rounded-full border border-slate-700/60 bg-white/[0.05] p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.1] active:scale-95 transition"
                    title="Deselect and reset view"
                    aria-label="Deselect and reset view"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Compact Quick Stats (Visible in both peek and expanded) */}
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                <div className="rounded-xl border border-slate-700/40 bg-white/[0.03] px-2 py-1.5 text-center">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    {isMoon ? "Orbit" : "Distance"}
                  </div>
                  <div className="text-xs font-bold text-white tabular-nums truncate">
                    {distanceText}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/40 bg-white/[0.03] px-2 py-1.5 text-center">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    Radius
                  </div>
                  <div className="text-xs font-bold text-white tabular-nums truncate">
                    {formatNumber(planet.render.radiusKm)} km
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700/40 bg-white/[0.03] px-2 py-1.5 text-center">
                  <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                    Period
                  </div>
                  <div className="text-xs font-bold text-white tabular-nums truncate">
                    {planet.orbit ? `${Math.round(planet.orbit.orbitalPeriodDays)}d` : "-"}
                  </div>
                </div>
              </div>

              {/* Collapsed Peek Summary Teaser */}
              {!isExpanded && info?.summary && (
                <p className="mt-1.5 line-clamp-1 text-[11px] text-slate-400 leading-snug">
                  {info.summary}
                </p>
              )}

              {/* Expanded Content (Scrollable, takes up max ~45vh, leaves upper 55% open for 3D planet) */}
              {isExpanded && (
                <div className="mt-3 flex flex-col gap-3 max-h-[44vh] overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-t border-slate-700/40 pt-2.5 animate-in fade-in duration-200">
                  {info?.summary && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {info.summary}
                    </p>
                  )}

                  {/* Additional Stats: Tilt and Mass */}
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-xl border border-slate-700/40 bg-white/[0.03] p-2.5">
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                        Axial Tilt
                      </div>
                      <div className="mt-0.5 text-xs font-bold text-white">
                        {planet.rotation.axialTiltDeg.toFixed(1)}&deg;
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-700/40 bg-white/[0.03] p-2.5">
                      <div className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                        Mass
                      </div>
                      <div className="mt-0.5 text-xs font-bold text-white">
                        {formatMass(planet.massKg)}
                      </div>
                    </div>
                  </div>

                  {/* Highlights Bullet List */}
                  {info && info.facts.length > 0 && (
                    <div className="flex flex-col gap-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-accent">
                        Key Highlights
                      </div>
                      <ul className="space-y-1.5 text-[11px] text-slate-300">
                        {info.facts.map((fact) => (
                          <li
                            key={fact}
                            className="border-l-2 border-primary-accent/60 pl-2.5 leading-relaxed"
                          >
                            {fact}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="mt-1 w-full rounded-xl border border-slate-700/50 bg-white/[0.05] py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/[0.1] active:scale-98 transition"
                  >
                    Collapse to glance card
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating Pill when card is minimized on phone */}
        {infoHidden && (
          <div className="pointer-events-auto fixed bottom-[4.75rem] bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-3 z-40">
            <button
              type="button"
              onClick={() => setInfoHidden(false)}
              className="flex items-center gap-2 rounded-full border border-primary-accent/60 bg-[linear-gradient(165deg,rgba(15,23,42,0.9),rgba(20,28,40,0.8))] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xl backdrop-blur-xl active:scale-95 transition"
            >
              <span
                className="h-2.5 w-2.5 rounded-full shadow-sm"
                style={{ backgroundColor: planet.render.colorFallback ?? "#5e9fff" }}
              />
              <span>{planet.name}</span>
              <span className="rounded-full bg-primary-accent/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary-accent">
                Details
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. DESKTOP / TABLET UI: Side Info Panel                       */}
      {/* ============================================================ */}
      <div className="hidden sm:flex pointer-events-none absolute right-4 top-24 z-40 w-full max-w-sm justify-end">
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={`pointer-events-auto w-full max-w-sm rounded-2xl border border-slate-700/50 bg-[linear-gradient(165deg,rgba(var(--primary-bg-rgb),0.85),rgba(20,28,40,0.72))] p-5 text-sm text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_24px_rgba(99,102,241,0.15)] backdrop-blur-2xl transition-all duration-500 ease-out max-h-[calc(100vh-10rem)] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            isInfoVisible
              ? "translate-x-0 opacity-100"
              : "translate-x-6 opacity-0 pointer-events-none hidden"
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
                {planet.name}
              </div>
              {info?.summary && (
                <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                  {info.summary}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 sm:flex-col sm:items-end">
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

          <div className="mt-4 grid grid-cols-2 gap-3 text-[11px]">
            <div className="rounded-xl border border-slate-700/45 bg-[rgba(var(--primary-bg-rgb),0.25)] p-3 backdrop-blur-md transition-all duration-200 hover:border-primary-accent/35 hover:bg-[rgba(var(--primary-bg-rgb),0.4)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                {isMoon ? "Orbit Radius" : "Distance"}
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {distanceText}
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/45 bg-[rgba(var(--primary-bg-rgb),0.25)] p-3 backdrop-blur-md transition-all duration-200 hover:border-primary-accent/35 hover:bg-[rgba(var(--primary-bg-rgb),0.4)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Radius
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {formatNumber(planet.render.radiusKm)} km
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/45 bg-[rgba(var(--primary-bg-rgb),0.25)] p-3 backdrop-blur-md transition-all duration-200 hover:border-primary-accent/35 hover:bg-[rgba(var(--primary-bg-rgb),0.4)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Period
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {planet.orbit ? `${Math.round(planet.orbit.orbitalPeriodDays)} days` : "-"}
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/45 bg-[rgba(var(--primary-bg-rgb),0.25)] p-3 backdrop-blur-md transition-all duration-200 hover:border-primary-accent/35 hover:bg-[rgba(var(--primary-bg-rgb),0.4)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Tilt
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {planet.rotation.axialTiltDeg.toFixed(1)}&deg;
              </div>
            </div>
            <div className="col-span-2 rounded-xl border border-slate-700/45 bg-[rgba(var(--primary-bg-rgb),0.25)] p-3 backdrop-blur-md transition-all duration-200 hover:border-primary-accent/35 hover:bg-[rgba(var(--primary-bg-rgb),0.4)]">
              <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Mass
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                {formatMass(planet.massKg)}
              </div>
            </div>
          </div>

          {info && info.facts.length > 0 && (
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

        {infoHidden && (
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
    </>
  );
}
