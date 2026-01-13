import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Object3D, Vector3 } from "three";
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
import SpacetimeGrid from "./gravity/SpacetimeGrid";
import BackgroundPass from "./gravity/BackgroundPass";
import {
  DEFAULT_MASS_SCALE_PARAMS,
  type GravitySettings,
  getMassScaleForVisuals
} from "./gravity/gravityField";
import PerfOverlay from "./ui/PerfOverlay";

interface PlanetariumSceneProps {
  showOrbits: boolean;
  showLabels: boolean;
  showGrid: boolean;
  showLensing: boolean;
  selectedId: PlanetId | null;
  resetSignal: number;
  onSelect: (id: PlanetId | null) => void;
  isLowEnd?: boolean;
  prefersReducedMotion?: boolean;
  onFocusChange?: (focused: boolean) => void;
  distanceScaleMode: DistanceScaleMode;
  distanceScaleParams: DistanceScaleParams;
  gravitySettings: GravitySettings;
  debugGravity?: boolean;
  showPerf?: boolean;
}

export default function PlanetariumScene({
  showOrbits,
  showLabels,
  showGrid,
  showLensing,
  selectedId,
  resetSignal,
  onSelect,
  isLowEnd = false,
  prefersReducedMotion = false,
  onFocusChange,
  distanceScaleMode,
  distanceScaleParams,
  gravitySettings,
  debugGravity = false,
  showPerf = true
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
  const gridDivisions = isLowEnd ? 120 : 200;
  const lensingScale = isLowEnd || prefersReducedMotion ? 0.6 : 0.8;
  const lensingSoftening = gravitySettings.softening * 0.03;
  const perfSampleRef = useRef({ elapsed: 0, frames: 0, logged: false });
  const gravityBodies = useMemo(
    () =>
      PLANETS.map((planet) => ({
        id: planet.id,
        massKg: planet.massKg,
        radiusKm: planet.radiusKm,
        visualMass: getMassScaleForVisuals(
          planet.massKg,
          DEFAULT_MASS_SCALE_PARAMS
        ),
        position: new Vector3()
      })),
    []
  );

  useEffect(() => {
    planetRefs.current.sun = sunRef.current;
  }, []);

  useEffect(() => {
    perfSampleRef.current = { elapsed: 0, frames: 0, logged: false };
  }, [showPerf]);

  useFrame(() => {
    if (!showGrid && !showLensing) return;
    gravityBodies.forEach((body) => {
      const object = planetRefs.current[body.id];
      if (object) {
        object.getWorldPosition(body.position);
      }
    });
  });

  useFrame((_, delta) => {
    if (!showPerf || perfSampleRef.current.logged) return;
    perfSampleRef.current.elapsed += delta;
    perfSampleRef.current.frames += 1;
    if (perfSampleRef.current.elapsed >= 3) {
      const fps = perfSampleRef.current.frames / perfSampleRef.current.elapsed;
      console.info(`[Planetarium] baseline fps: ${fps.toFixed(1)}`);
      perfSampleRef.current.logged = true;
    }
  });

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
      {showLensing ? (
        <BackgroundPass
          bodies={gravityBodies}
          strength={gravitySettings.lensingStrength}
          softening={lensingSoftening}
          maxInfluence={gravitySettings.maxInfluence}
          resolutionScale={lensingScale}
          debug={debugGravity}
        >
          <UniverseBackground
            isLowEnd={isLowEnd}
            prefersReducedMotion={prefersReducedMotion}
          />
        </BackgroundPass>
      ) : (
        <UniverseBackground
          isLowEnd={isLowEnd}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}
      <PerfOverlay enabled={showPerf} />
      {showGrid && (
        <SpacetimeGrid
          bodies={gravityBodies}
          divisions={gridDivisions}
          strength={gravitySettings.gridStrength}
          softening={gravitySettings.softening}
          maxInfluence={gravitySettings.maxInfluence}
          debug={debugGravity}
        />
      )}
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
      <CameraRig controlsRef={controlsRef} isInspecting={Boolean(selectedId)} />
    </>
  );
}
