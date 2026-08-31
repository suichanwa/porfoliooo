import { usePlanetSelection } from "../context/SelectionContext";

export default function PlanetPicker() {
  const {
    filteredPlanets,
    pickerQuery,
    setPickerQuery,
    selectedId,
    pickerOpen,
    togglePicker,
    selectPlanet,
    resetOverview
  } = usePlanetSelection();

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={togglePicker}
        className="rounded-full border border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.45)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-200 transition hover:border-primary-accent/40 hover:text-white"
      >
        Focus celestial body
      </button>
      <div
        className={`rounded-2xl border border-slate-700/60 bg-[linear-gradient(165deg,rgba(var(--primary-bg-rgb),0.94),rgba(20,28,40,0.85))] p-3 text-xs text-slate-200 shadow-xl backdrop-blur-xl transition-all duration-300 ${
          pickerOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
        style={{ pointerEvents: pickerOpen ? "auto" : "none" }}
      >
        <input
          type="text"
          placeholder="Search celestial bodies..."
          value={pickerQuery}
          onChange={(event) => setPickerQuery(event.target.value)}
          className="input input-sm w-full border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.55)] text-white placeholder:text-slate-500 focus:border-primary-accent focus:outline-none rounded-xl"
        />
        <div className="mt-2.5 max-h-48 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
          {filteredPlanets.map((planet) => (
            <button
              key={planet.id}
              type="button"
              onClick={() => selectPlanet(planet.id, "picker")}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-xs font-medium transition ${
                selectedId === planet.id
                  ? "bg-primary-accent/20 border border-primary-accent/50 text-white shadow-[0_0_8px_rgba(94,159,255,0.3)]"
                  : "hover:bg-white/5 text-slate-300 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: planet.render.colorFallback ?? "#5e9fff"
                  }}
                />
                <span>{planet.name}</span>
              </div>
              <span className="text-[9px] uppercase tracking-[0.15em] text-slate-400 font-semibold">
                {planet.kind}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={resetOverview}
          className="mt-2.5 w-full rounded-full border border-slate-700/60 bg-[rgba(var(--primary-bg-rgb),0.45)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-200 transition hover:border-secondary-accent/40 hover:text-white"
        >
          Reset Overview
        </button>
      </div>
    </div>
  );
}
