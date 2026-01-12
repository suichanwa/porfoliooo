import { useMemo, useState } from "react";
import PlanetariumCanvas from "./PlanetariumCanvas";
import PlanetariumScene from "./PlanetariumScene";
import { PLANETS } from "./data/planets";
import type { PlanetId } from "./data/types";
import InfoPanel from "./ui/InfoPanel";
import useDeviceInfo from "../hooks/useDeviceInfo";
import useIsClient from "../hooks/useIsClient";

export default function PlanetariumPage() {
  const [showOrbits, setShowOrbits] = useState(false);
  const [showLabels, setShowLabels] = useState(false);
  const [selectedId, setSelectedId] = useState<PlanetId | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const isClient = useIsClient();
  const deviceInfo = useDeviceInfo(isClient);
  const canvasDpr = deviceInfo.isLowEnd ? 1 : 1.5;

  const selectedPlanet = useMemo(
    () => (selectedId ? PLANETS.find((planet) => planet.id === selectedId) ?? null : null),
    [selectedId]
  );

  return (
    <div className="relative min-h-screen">
      <PlanetariumCanvas
        dpr={canvasDpr}
        onPointerMissed={() => {
          setSelectedId(null);
        }}
      >
        <PlanetariumScene
          showOrbits={showOrbits}
          showLabels={showLabels}
          selectedId={selectedId}
          resetSignal={resetSignal}
          onSelect={(id) => setSelectedId(id)}
          isLowEnd={deviceInfo.isLowEnd}
          prefersReducedMotion={deviceInfo.prefersReducedMotion}
        />
      </PlanetariumCanvas>
      <div className="pointer-events-none absolute right-4 top-24 z-20">
        <div className="pointer-events-auto flex flex-col gap-3 rounded-2xl border border-white/10 bg-base-100/10 px-4 py-3 text-xs text-white/80 shadow-lg backdrop-blur-sm">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={showOrbits}
              onChange={(event) => setShowOrbits(event.target.checked)}
            />
            <span className="tracking-wide">Orbit paths</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={showLabels}
              onChange={(event) => setShowLabels(event.target.checked)}
            />
            <span className="tracking-wide">Planet labels</span>
          </label>
        </div>
      </div>
      <div className="pointer-events-none absolute bottom-6 left-4 z-20 max-w-xs">
        <div className="pointer-events-auto">
          <InfoPanel
            planet={selectedPlanet}
            onReset={() => {
              setSelectedId(null);
              setResetSignal((prev) => prev + 1);
            }}
          />
        </div>
      </div>
    </div>
  );
}
