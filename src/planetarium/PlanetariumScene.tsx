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
import type { DistanceScaleMode, DistanceScaleParams } from "./utils/distanceScale";

interface PlanetariumSceneProps {
  showOrbits: boolean;
  showLabels: boolean;
  selectedId: PlanetId | null;
  resetSignal: number;
  onSelect: (id: PlanetId | null) => void;
  isLowEnd?: boolean;
  prefersReducedMotion?: boolean;
  onFocusChange?: (focused: boolean) => void;
  distanceScaleMode: DistanceScaleMode;
  distanceScaleParams: DistanceScaleParams;
}

export default function PlanetariumScene({
  showOrbits,
  showLabels,
  selectedId,
  resetSignal,
  onSelect,
  isLowEnd = false,
  prefersReducedMotion = false,
  onFocusChange,
  distanceScaleMode,
  distanceScaleParams
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
    planetData: planetDataMap,
    onFocusChange
  });

  return (
    <>
      <UniverseBackground
        isLowEnd={isLowEnd}
        prefersReducedMotion={prefersReducedMotion}
      />
      <ambientLight intensity={0.08} />
      <hemisphereLight intensity={0.1} color="#1a2336" groundColor="#000000" />
      <pointLight
        position={[0, 0, 0]}
        intensity={2.5}
        distance={0}
        decay={2}
        color="#f9d27b"
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
              scaleMode={distanceScaleMode}
              scaleParams={distanceScaleParams}
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
          scaleMode={distanceScaleMode}
          scaleParams={distanceScaleParams}
        />
      ))}
      <CameraRig controlsRef={controlsRef} />
    </>
  );
}
