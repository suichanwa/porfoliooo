import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { MathUtils, Mesh, NoColorSpace, Object3D, SRGBColorSpace, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import UniverseBackground from "./UniverseBackground";
import CameraRig from "./CameraRig";
import Sun from "./bodies/Sun";
import MoonGlints from "./bodies/MoonGlints";
import OrbitingPlanet from "./orbits/OrbitingPlanet";
import OrbitPath from "./orbits/OrbitPath";
import PlutoBarycenterVisuals from "./orbits/PlutoBarycenterVisuals";
import { PLANETS } from "./data/planets";
import { MOONS } from "./data/moons";
import type { BodyId } from "./data/types";
import {
  registerTextureRenderer,
  runTwoStageTexturePreload
} from "./hooks/usePlanetTexture";
import {
  ALL_BODIES,
  createBodyRefStore,
  ORBITING_PLANETS,
  PLANET_BY_ID
} from "./data/planetRegistry";
import { useSimulationTime } from "./hooks/useSimulationTime";
import { useFocusTarget } from "./hooks/useFocusTarget";
import type { DistanceScaleMode, DistanceScaleParams } from "./utils/distanceScale";
import SpacetimeGrid from "./gravity/SpacetimeGrid";
import {
  DEFAULT_MASS_SCALE_PARAMS,
  type GravitySettings,
  getMassScaleForVisuals
} from "./gravity/gravityField";
import { scalePlanetRadius } from "./utils/scale";

interface PlanetariumSceneProps {
  showOrbits: boolean;
  showLabels: boolean;
  showGrid: boolean;
  selectedId: BodyId | null;
  activeSystemId?: BodyId | null;
  isInfoVisible?: boolean;
  resetSignal: number;
  zoomOutSignal?: number;
  onSelect: (id: BodyId | null) => void;
  isLowEnd?: boolean;
  isIntegratedGpu?: boolean;
  prefersReducedMotion?: boolean;
  onFocusChange?: (focused: boolean) => void;
  distanceScaleMode: DistanceScaleMode;
  distanceScaleParams: DistanceScaleParams;
  gravitySettings: GravitySettings;
  debugGravity?: boolean;
  showPerf?: boolean;
  orbitSpeed?: number;
  onSimDateChange?: (epochMs: number) => void;
  useMilkyWayBackground?: boolean;
}

const J2000_EPOCH_MS = Date.UTC(2000, 0, 1, 12, 0, 0);
const nowEpochDays = () => (Date.now() - J2000_EPOCH_MS) / 86400000;

function PlanetariumScene({
  showOrbits,
  showLabels,
  showGrid,
  selectedId,
  activeSystemId,
  isInfoVisible = false,
  resetSignal,
  zoomOutSignal = 0,
  onSelect,
  isLowEnd = false,
  isIntegratedGpu = false,
  prefersReducedMotion = false,
  onFocusChange,
  distanceScaleMode,
  distanceScaleParams,
  gravitySettings,
  debugGravity = false,
  showPerf = true,
  orbitSpeed = 10,
  onSimDateChange,
  useMilkyWayBackground = false
}: PlanetariumSceneProps) {
  const { gl } = useThree();
  const startEpochDays = useMemo(() => nowEpochDays(), []);
  const { timeRef } = useSimulationTime(orbitSpeed, startEpochDays);
  const simDateAccumRef = useRef(0);
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const planetRefs = useRef<Record<BodyId, Object3D | null>>(
    createBodyRefStore<Object3D | null>(null)
  );
  const sunRef = useRef<Mesh | null>(null);
  const moonSystemVisRef = useRef<Record<string, number>>({
    earth: 0,
    jupiter: 0,
    saturn: 0,
    uranus: 0,
    neptune: 0,
    pluto: 0
  });
  const orbitSegments = isLowEnd || isIntegratedGpu ? 140 : 200;
  const gridDivisions = isLowEnd || isIntegratedGpu ? 96 : 140;
  const perfSampleRef = useRef({ elapsed: 0, frames: 0, logged: false });
  const handleSunSelect = useCallback(() => onSelect("sun"), [onSelect]);
  const handleZoomOut = useCallback(() => onSelect(null), [onSelect]);
  const handlePlanetRef = useCallback((id: BodyId, object: Object3D | null) => {
    planetRefs.current[id] = object;
  }, []);
  const gravityBodies = useMemo(
    () =>
      ALL_BODIES.map((planet) => ({
        id: planet.id,
        massKg: planet.massKg,
        radiusKm: planet.render.radiusKm,
        renderRadius:
          planet.id === "sun"
            ? 2.6
            : scalePlanetRadius(planet.render.radiusKm, planet.kind === "moon"),
        bendingDimensions: planet.render.bendingDimensions,
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

  // Two-stage texture pipeline:
  // Stage 1: Immediately load & GPU-upload all primary visible planets + Sun + Charon.
  // Stage 2: Once primary planets are ready, slowly stream & GPU-upload hidden moons
  //          one at a time in the background (Uranus & Neptune first) so they are already
  //          warm in VRAM within ~4-5s before the user clicks any planet.
  useEffect(() => {
    registerTextureRenderer(gl);

    const primaryBodies = [
      ...PLANETS,
      ...MOONS.filter((moon) => moon.id === "charon")
    ];
    const primaryAssets = primaryBodies.flatMap((body) => [
      { url: body.render.textureUrl, colorSpace: SRGBColorSpace },
      { url: body.render.normalUrl, colorSpace: NoColorSpace },
      { url: body.render.bumpUrl, colorSpace: NoColorSpace }
    ]);

    const secondaryOrder: Record<string, number> = {
      uranus: 0,
      neptune: 1,
      saturn: 2,
      earth: 3,
      jupiter: 4
    };
    const deferredMoons = MOONS.filter((moon) => moon.id !== "charon").sort(
      (a, b) =>
        (secondaryOrder[a.parentId ?? ""] ?? 99) -
        (secondaryOrder[b.parentId ?? ""] ?? 99)
    );
    const secondaryAssets = deferredMoons.flatMap((moon) => [
      { url: moon.render.textureUrl, colorSpace: SRGBColorSpace },
      { url: moon.render.normalUrl, colorSpace: NoColorSpace },
      { url: moon.render.bumpUrl, colorSpace: NoColorSpace }
    ]);

    const cancelPreload = runTwoStageTexturePreload(primaryAssets, secondaryAssets, {
      settleDelayMs: 200,
      stepDelayMs: 150
    });

    return () => {
      cancelPreload();
      registerTextureRenderer(null);
    };
  }, [gl]);

  useEffect(() => {
    perfSampleRef.current = { elapsed: 0, frames: 0, logged: false };
  }, [showPerf]);

  // Snap simulation time to the real-world current date on mount.
  useEffect(() => {
    timeRef.current = nowEpochDays();
    onSimDateChange?.(J2000_EPOCH_MS + timeRef.current * 86400000);
  }, [onSimDateChange, timeRef]);

  // Report the simulated date to the UI ~1x/sec (avoids per-frame re-renders).
  useFrame((_, delta) => {
    if (!onSimDateChange) return;
    simDateAccumRef.current += delta;
    if (simDateAccumRef.current >= 1) {
      simDateAccumRef.current = 0;
      onSimDateChange(J2000_EPOCH_MS + timeRef.current * 86400000);
    }
  });

  // Smooth moon system visibility damping (strictly triggered on planet selection)
  useFrame((_, delta) => {
    const parentIds = [
      "earth",
      "jupiter",
      "saturn",
      "uranus",
      "neptune",
      "pluto"
    ] as const;
    for (const parentId of parentIds) {
      const targetVis = activeSystemId === parentId ? 1.0 : 0.0;
      const currentVis = moonSystemVisRef.current[parentId] ?? 0;
      moonSystemVisRef.current[parentId] = MathUtils.damp(currentVis, targetVis, 7.5, delta);
    }
  });

  useFrame(() => {
    if (!showGrid) return;
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
    zoomOutSignal,
    controlsRef,
    planetRefs,
    planetData: PLANET_BY_ID,
    onFocusChange,
    timeRef,
    scaleMode: distanceScaleMode,
    scaleParams: distanceScaleParams
  });

  return (
    <>
      <UniverseBackground
        isLowEnd={isLowEnd}
        isIntegratedGpu={isIntegratedGpu}
        prefersReducedMotion={prefersReducedMotion}
        useMilkyWay={useMilkyWayBackground}
      />
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
      <ambientLight intensity={0.55} color="#c8d8f0" />
      <hemisphereLight intensity={0.22} color="#8ab4f8" groundColor="#1e293b" />
      <pointLight
        position={[0, 0, 0]}
        intensity={3.6}
        distance={0}
        decay={0}
        color="#fff5e1"
      />
      <Sun
        meshRef={sunRef}
        onClick={handleSunSelect}
      />
      {showOrbits && (
        <>
          {ORBITING_PLANETS.map((planet) =>
            planet.orbit ? (
              <OrbitPath
                key={`${planet.id}-orbit`}
                planet={planet}
                orbit={planet.orbit}
                timeRef={timeRef}
                segments={orbitSegments}
                scaleMode={distanceScaleMode}
                scaleParams={distanceScaleParams}
                planetRefs={planetRefs}
                isSelected={selectedId === planet.id}
                activeSystemId={activeSystemId}
                moonSystemVisRef={moonSystemVisRef}
              />
            ) : null
          )}
          <PlutoBarycenterVisuals
            timeRef={timeRef}
            scaleMode={distanceScaleMode}
            scaleParams={distanceScaleParams}
            activeSystemId={activeSystemId}
            moonSystemVisRef={moonSystemVisRef}
            isSelected={selectedId === "pluto" || selectedId === "charon"}
            segments={orbitSegments}
          />
        </>
      )}
      {ORBITING_PLANETS.map((planet) => (
        <OrbitingPlanet
          key={planet.id}
          data={planet}
          timeRef={timeRef}
          atmosphere={true}
          showLabels={showLabels}
          isSelected={selectedId === planet.id}
          isInfoVisible={isInfoVisible}
          onSelect={onSelect}
          onObjectRef={handlePlanetRef}
          planetRefs={planetRefs}
          scaleMode={distanceScaleMode}
          scaleParams={distanceScaleParams}
          activeSystemId={activeSystemId}
          moonSystemVisRef={moonSystemVisRef}
        />
      ))}
      <MoonGlints
        planetRefs={planetRefs}
        moonSystemVisRef={moonSystemVisRef}
        selectedId={selectedId}
        onSelect={onSelect}
        prefersReducedMotion={prefersReducedMotion}
      />
      <CameraRig
        controlsRef={controlsRef}
        planetRefs={planetRefs}
        isInspecting={Boolean(selectedId)}
        onZoomOut={handleZoomOut}
      />
    </>
  );
}

export default memo(PlanetariumScene);
