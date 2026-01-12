import { useEffect, useMemo, useRef } from "react";
import { Mesh, Object3D } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import UniverseBackground from "./UniverseBackground";
import CameraRig from "./CameraRig";
import Sun from "./bodies/Sun";
import OrbitingPlanet from "./orbits/OrbitingPlanet";
import OrbitPath from "./orbits/OrbitPath";
import { PLANETS } from "./data/planets";
import type { PlanetId } from "./data/types";
import { useSimulationTime } from "./hooks/useSimulationTime";
import { useFocusTarget } from "./hooks/useFocusTarget";

interface PlanetariumSceneProps {
  showOrbits: boolean;
  showLabels: boolean;
  selectedId: PlanetId | null;
  resetSignal: number;
  onSelect: (id: PlanetId | null) => void;
  isLowEnd?: boolean;
  prefersReducedMotion?: boolean;
}

export default function PlanetariumScene({
  showOrbits,
  showLabels,
  selectedId,
  resetSignal,
  onSelect,
  isLowEnd = false,
  prefersReducedMotion = false
}: PlanetariumSceneProps) {
  const { timeRef } = useSimulationTime(10);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const planetRefs = useRef<Record<PlanetId, Object3D | null>>({
    sun: null,
    mercury: null,
    venus: null,
    earth: null,
    mars: null,
    jupiter: null,
    saturn: null,
    uranus: null,
    neptune: null,
    ceres: null,
    pluto: null
  });
  const sunRef = useRef<Mesh | null>(null);
  const planetDataMap = useMemo(() => {
    const entries = PLANETS.map((planet) => [planet.id, planet]);
    return Object.fromEntries(entries) as Record<PlanetId, (typeof PLANETS)[number]>;
  }, []);
  const orbitingPlanets = PLANETS.filter((planet) => planet.id !== "sun");
  const orbitSegments = isLowEnd ? 120 : 180;

  useEffect(() => {
    planetRefs.current.sun = sunRef.current;
  }, []);

  useFocusTarget({
    selectedId,
    resetSignal,
    controlsRef,
    planetRefs,
    planetData: planetDataMap
  });

  return (
    <>
      <UniverseBackground
        isLowEnd={isLowEnd}
        prefersReducedMotion={prefersReducedMotion}
      />
      <ambientLight intensity={0.15} />
      <pointLight
        position={[0, 0, 0]}
        intensity={1.8}
        distance={160}
        decay={2}
        color="#f9d27b"
      />
      <directionalLight
        position={[12, 6, 18]}
        intensity={0.15}
        color="#9fb8ff"
      />
      <Sun
        meshRef={sunRef}
        onClick={() => {
          onSelect("sun");
        }}
      />
      {showOrbits &&
        orbitingPlanets.map((planet) =>
          planet.orbit ? (
            <OrbitPath
              key={`${planet.id}-orbit`}
              orbit={planet.orbit}
              segments={orbitSegments}
            />
          ) : null
        )}
      {orbitingPlanets.map((planet) => (
        <OrbitingPlanet
          key={planet.id}
          data={planet}
          timeRef={timeRef}
          atmosphere={planet.id === "earth"}
          showLabels={showLabels}
          onSelect={onSelect}
          onObjectRef={(id, object) => {
            planetRefs.current[id] = object;
          }}
        />
      ))}
      <CameraRig controlsRef={controlsRef} />
    </>
  );
}
