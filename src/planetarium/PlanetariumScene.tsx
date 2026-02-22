import { useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh, Object3D, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import UniverseBackground from "./UniverseBackground";
import CameraRig from "./CameraRig";
import Sun from "./bodies/Sun";
import OrbitingPlanet from "./orbits/OrbitingPlanet";
import OrbitPath from "./orbits/OrbitPath";
import { PLANETS } from "./data/planets";
import type { BodyId } from "./data/types";
import {
  createBodyRefStore,
  ORBITING_PLANETS,
  PLANET_BY_ID
} from "./data/planetRegistry";
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
  selectedId: BodyId | null;
  resetSignal: number;
  onSelect: (id: BodyId | null) => void;
  isLowEnd?: boolean;
  prefersReducedMotion?: boolean;
  onFocusChange?: (focused: boolean) => void;
  distanceScaleMode: DistanceScaleMode;
  distanceScaleParams: DistanceScaleParams;
  gravitySettings: GravitySettings;
  debugGravity?: boolean;
  showPerf?: boolean;
  orbitSpeed?: number;
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
  showPerf = true,
  orbitSpeed = 10
}: PlanetariumSceneProps) {
  const startEpochDays = useMemo(() => {
    const epoch = Date.UTC(2000, 0, 1, 12, 0, 0);
    return (Date.now() - epoch) / 86400000;
  }, []);
  const { timeRef } = useSimulationTime(orbitSpeed, startEpochDays);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const planetRefs = useRef<Record<BodyId, Object3D | null>>(
    createBodyRefStore<Object3D | null>(null)
  );
  const sunRef = useRef<Mesh | null>(null);
  const orbitSegments = isLowEnd ? 120 : 180;
  const gridDivisions = isLowEnd ? 120 : 200;
  const lensingScale = isLowEnd || prefersReducedMotion ? 0.6 : 0.8;
  const lensingSoftening = gravitySettings.softening * 0.03;
  const perfSampleRef = useRef({ elapsed: 0, frames: 0, logged: false });
  const handleSunSelect = useCallback(() => onSelect("sun"), [onSelect]);
  const handleZoomOut = useCallback(() => onSelect(null), [onSelect]);
  const handlePlanetRef = useCallback((id: BodyId, object: Object3D | null) => {
    planetRefs.current[id] = object;
  }, []);
  const gravityBodies = useMemo(
    () =>
      PLANETS.map((planet) => ({
        id: planet.id,
        massKg: planet.massKg,
        radiusKm: planet.render.radiusKm,
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
    planetData: PLANET_BY_ID,
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
      <ambientLight intensity={0.04} />
      <hemisphereLight intensity={0.06} color="#1a2336" groundColor="#000000" />
      <pointLight
        position={[0, 0, 0]}
        intensity={1.4}
        distance={140}
        decay={2}
        color="#f9d27b"
      />
      <Sun
        meshRef={sunRef}
        onClick={handleSunSelect}
      />
      {showOrbits &&
        ORBITING_PLANETS.map((planet) =>
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
      {ORBITING_PLANETS.map((planet) => (
        <OrbitingPlanet
          key={planet.id}
          data={planet}
          timeRef={timeRef}
          atmosphere={planet.id === "earth"}
          showLabels={showLabels}
          onSelect={onSelect}
          onObjectRef={handlePlanetRef}
          scaleMode={distanceScaleMode}
          scaleParams={distanceScaleParams}
        />
      ))}
      <CameraRig
        controlsRef={controlsRef}
        isInspecting={Boolean(selectedId)}
        onZoomOut={handleZoomOut}
      />
    </>
  );
}
