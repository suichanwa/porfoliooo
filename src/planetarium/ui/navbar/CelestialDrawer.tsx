import { Globe, RotateCcw, X } from "lucide-react";
import { PLANETS } from "../../data/planets";
import type { BodyData, BodyId } from "../../data/types";

interface CelestialDrawerProps {
  selectedId: BodyId | null;
  activeSystemId: BodyId | null;
  systemParent: BodyData | null;
  systemMoons: BodyData[];
  focusRing: string;
  onSelectBody: (id: BodyId) => void;
  onOverview: () => void;
  onClose: () => void;
}

export default function CelestialDrawer({
  selectedId,
  activeSystemId,
  systemParent,
  systemMoons,
  focusRing,
  onSelectBody,
  onOverview,
  onClose
}: CelestialDrawerProps) {
  return (
    <div
      role="dialog"
      aria-label="Celestial bodies navigation"
      className="pointer-events-auto mb-2 w-full sm:w-auto max-w-full rounded-2xl border border-slate-700/60 bg-[linear-gradient(165deg,rgba(15,23,42,0.95),rgba(20,28,40,0.9))] p-2.5 sm:p-3 shadow-[0_18px_42px_rgba(0,0,0,0.75)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-700/40 pb-2 mb-2 px-1">
        <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-primary-accent">
          <Globe className="h-3.5 w-3.5 text-primary-accent" />
          Celestial Bodies
        </span>
        <button
          type="button"
          onClick={onClose}
          className={`text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition ${focusRing}`}
          aria-label="Close celestial drawer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Primary Planets Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto overscroll-x-contain py-1 px-0.5 max-w-full sm:max-w-[min(86vw,40rem)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <button
          type="button"
          onClick={onOverview}
          className={`flex min-h-[34px] flex-shrink-0 items-center gap-1.5 rounded-xl border border-secondary-accent/40 bg-secondary-accent/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-secondary-accent hover:bg-secondary-accent/25 transition active:scale-95 ${focusRing}`}
        >
          <RotateCcw className="h-3 w-3" />
          <span>Overview</span>
        </button>

        {PLANETS.map((planet) => {
          const isSelected = selectedId === planet.id;
          const isParentOfSelected =
            !isSelected && activeSystemId === planet.id;
          return (
            <button
              key={planet.id}
              type="button"
              onClick={() => onSelectBody(planet.id)}
              className={`flex min-h-[34px] flex-shrink-0 items-center gap-2 rounded-xl px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em] transition-all duration-200 active:scale-95 ${focusRing} ${
                isSelected
                  ? "bg-primary-accent/25 border border-primary-accent/70 text-white shadow-[0_0_12px_rgba(99,102,241,0.45)]"
                  : isParentOfSelected
                    ? "bg-primary-accent/10 border border-primary-accent/40 text-slate-100 hover:bg-primary-accent/20"
                    : "bg-white/[0.04] border border-slate-700/55 text-slate-300 hover:bg-white/[0.08] hover:border-primary-accent/40 hover:text-white"
              }`}
            >
              <span
                className="h-2 w-2 rounded-full flex-shrink-0 shadow-sm"
                style={{
                  backgroundColor: planet.render.colorFallback ?? "#5e9fff"
                }}
              />
              <span>{planet.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active System Moons Sub-Strip */}
      {systemMoons.length > 0 && systemParent && (
        <div className="mt-2 pt-2 border-t border-slate-700/40">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {systemParent.id === "pluto"
                ? "Pluto–Charon System"
                : `Moons of ${systemParent.name}`}
            </span>
            <span className="text-[9px] uppercase tracking-wider text-slate-500">
              {systemMoons.length} {systemMoons.length === 1 ? "moon" : "moons"}
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto overscroll-x-contain py-0.5 px-0.5 max-w-full sm:max-w-[min(86vw,40rem)] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {systemMoons.map((moon) => {
              const isMoonSelected = selectedId === moon.id;
              return (
                <button
                  key={moon.id}
                  type="button"
                  onClick={() => onSelectBody(moon.id)}
                  className={`flex min-h-[32px] flex-shrink-0 items-center gap-1.5 rounded-xl px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] transition-all duration-200 active:scale-95 ${focusRing} ${
                    isMoonSelected
                      ? "bg-secondary-accent/25 border border-secondary-accent/70 text-white shadow-[0_0_12px_rgba(199,146,234,0.4)]"
                      : "bg-white/[0.04] border border-slate-700/55 text-slate-300 hover:bg-white/[0.08] hover:border-secondary-accent/45 hover:text-white"
                  }`}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: moon.render.colorFallback ?? "#c792ea"
                    }}
                  />
                  <span>{moon.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
