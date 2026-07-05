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
  timeResetSignal?: number;
  onSimDateChange?: (epochMs: number) => void;
  useMilkyWayBackground?: boolean;
}

const J2000_EPOCH_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const nowEpochDays = () => (Date.now() - J2000_EPOCH_MS) / 86400000;

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
  orbitSpeed = 10,
  timeResetSignal = 0,
  onSimDateChange,
  useMilkyWayBackground = false
}: PlanetariumSceneProps) {
  const startEpochDays = useMemo(() => nowEpochDays(), []);
  const { timeRef } = useSimulationTime(orbitSpeed, startEpochDays);
  const simDateAccumRef = useRef(0);
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

  // "Now" button: snap simulation time back to the real current date.
  useEffect(() => {
    if (timeResetSignal === 0) return;
    timeRef.current = nowEpochDays();
    if (onSimDateChange) {
      onSimDateChange(J2000_EPOCH_MS + timeRef.current * 86400000);
    }
  }, [timeResetSignal, onSimDateChange, timeRef]);

  // Report the simulated date to the UI ~4x/sec (avoids per-frame re-renders).
  useFrame((_, delta) => {
    if (!onSimDateChange) return;
    simDateAccumRef.current += delta;
    if (simDateAccumRef.current >= 1) {
      simDateAccumRef.current = 0;
      onSimDateChange(J2000_EPOCH_MS + timeRef.current * 86400000);
    }
  });

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
            useMilkyWay={useMilkyWayBackground}
          />
        </BackgroundPass>
      ) : (
        <UniverseBackground
          isLowEnd={isLowEnd}
          prefersReducedMotion={prefersReducedMotion}
          useMilkyWay={useMilkyWayBackground}
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
      {/* Faint fill so the night side is not pure black, but stays dark
          enough to keep a visible terminator. */}
      <ambientLight intensity={0.12} />
      <hemisphereLight intensity={0.05} color="#1a2336" groundColor="#02040a" />
      {/* The Sun is the only real light source. Linear decay (decay=1) so
          inner planets read brighter than outer ones; true inverse-square
          (decay=2) leaves Neptune pitch black at our compressed distances.
          Intensity calibrated so Earth-range planets match the old flat look.
          Note: falloff follows render-space distance, so brightness shifts
          slightly with the spacing slider — acceptable, still reads as
          "farther = dimmer". */}
      <pointLight
        position={[0, 0, 0]}
        intensity={34}
        distance={0}
        decay={1}
        color="#fff4e0"
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
