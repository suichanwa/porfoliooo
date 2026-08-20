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
        className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:border-white/30 hover:text-white"
      >
        Focus
      </button>
      <div
        className={`rounded-2xl border border-white/10 bg-base-100/10 p-3 text-xs text-white/80 shadow-lg backdrop-blur-sm transition-all duration-300 ${
          pickerOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
        }`}
        style={{ pointerEvents: pickerOpen ? "auto" : "none" }}
      >
        <input
          type="text"
          placeholder="Search planets"
          value={pickerQuery}
          onChange={(event) => setPickerQuery(event.target.value)}
          className="input input-sm w-full border-white/10 bg-black/30 text-white placeholder:text-white/40"
        />
        <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
          {filteredPlanets.map((planet) => (
            <button
              key={planet.id}
              type="button"
              onClick={() => selectPlanet(planet.id, "picker")}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${
                selectedId === planet.id
                  ? "bg-primary-accent/20 text-primary-accent"
                  : "hover:bg-white/5"
              }`}
            >
              <span>{planet.name}</span>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                {planet.kind}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={resetOverview}
          className="mt-3 w-full rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-white/70 transition hover:border-white/30 hover:text-white"
        >
          Overview
        </button>
      </div>
    </div>
  );
}
