import { useEffect, useMemo, useRef, type Ref, type RefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  NoColorSpace,
  Object3D,
  SphereGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3
} from "three";
import type {
  BodyData,
  BodyId,
  GlowPreset,
  MaterialPreset,
  RimGlowPreset
} from "../data/types";
import { PLANET_BY_ID } from "../data/planetRegistry";
import {
  getFlatNormalTexture,
  getNeutralBumpTexture,
  useTextureAsset
} from "../hooks/usePlanetTexture";
import { scalePlanetRadius } from "../utils/scale";
import RingSystem from "../rings/RingSystem";
import {
  getBodyPoleQuaternion,
  getPlutoCharonOrbitalPhase
} from "../orbits/orbitMath";
import {
  applySolarShineShader,
  createSolarShineUniforms
} from "../shaders/solarShineShader";
import { createEarthCloudsMaterial } from "../shaders/earthCloudsShader";
import { createTitanHazeMaterial } from "../shaders/titanHazeShader";
import { createPlanetaryRimMaterial } from "../shaders/planetaryRimShader";

interface BodyMeshProps {
  data: BodyData;
  position: Vector3;
  atmosphere?: boolean;
  timeScale?: number;
  rimGlow?: boolean | RimGlowPreset;
  groupRef?: Ref<Group>;
  planetRefs?: RefObject<Record<BodyId, Object3D | null>>;
  simTimeRef?: RefObject<number>;
  loadTextures?: boolean;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}

const DEFAULT_MATERIAL: MaterialPreset = { roughness: 0.85, metalness: 0 };
const DEFAULT_GLOW: GlowPreset = { color: "#f3d4a6", intensity: 0.12 };
const DWARF_GLOW: GlowPreset = { color: "#f3d4a6", intensity: 0.08 };
const STAR_GLOW: GlowPreset = { color: "#f5c96b", intensity: 1.2 };
const TWO_PI = Math.PI * 2;
// Soft visual spin cap (rad/s, ~1 rotation per 2.85s max) so fast-forwarding at
// 30–1825 d/s stays smooth and readable without strobing.
const MAX_VISUAL_SPIN_RAD_PER_SEC = 2.2;

// Shared unit-radius SphereGeometry pools (scaled per body by radius) so we allocate
// only 2 GPU vertex buffers across all planets, moons, clouds, and atmosphere shells.
let sharedPlanetSphere: SphereGeometry | null = null;
let sharedMoonShellSphere: SphereGeometry | null = null;

function getSharedPlanetSphere(): SphereGeometry {
  if (!sharedPlanetSphere) {
    sharedPlanetSphere = new SphereGeometry(1, 44, 32);
  }
  return sharedPlanetSphere;
}

function getSharedMoonShellSphere(): SphereGeometry {
  if (!sharedMoonShellSphere) {
    sharedMoonShellSphere = new SphereGeometry(1, 32, 24);
  }
  return sharedMoonShellSphere;
}

export default function BodyMesh({
  data,
  position,
  timeScale = 40,
  rimGlow,
  groupRef,
  planetRefs,
  simTimeRef,
  loadTextures = true,
  onPointerOver,
  onPointerOut,
  onClick
}: BodyMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const cloudsMeshRef = useRef<Mesh>(null);
  const shadowFactorRef = useRef(1.0);
  const prevSimTimeRef = useRef<number | null>(null);
  const cloudTimeRef = useRef(0);
  const parentPosRef = useMemo(() => new Vector3(), []);
  const moonPosRef = useMemo(() => new Vector3(), []);
  const dirRef = useMemo(() => new Vector3(), []);
  const moonOffsetRef = useMemo(() => new Vector3(), []);
  const projRef = useMemo(() => new Vector3(), []);

  const isMoon = data.kind === "moon";
  const parentRadiusKm =
    isMoon && data.parentId
      ? PLANET_BY_ID[data.parentId]?.render.radiusKm
      : undefined;
  const radius = useMemo(
    () => scalePlanetRadius(data.render.radiusKm, isMoon, parentRadiusKm),
    [data.render.radiusKm, isMoon, parentRadiusKm]
  );
  const poleQuaternion = useMemo(() => getBodyPoleQuaternion(data), [data]);
  const invPoleQuaternion = useMemo(
    () => poleQuaternion.clone().invert(),
    [poleQuaternion]
  );
  const spinSign = data.rotation.retrogradeSpin ? -1 : 1;

  const baseMap = useTextureAsset(data.render.textureUrl, {
    fallbackColor: data.render.colorFallback,
    colorSpace: SRGBColorSpace,
    enabled: loadTextures
  });
  const normalMap = useTextureAsset(data.render.normalUrl, {
    fallbackTexture: data.render.normalUrl ? getFlatNormalTexture() : null,
    colorSpace: NoColorSpace,
    enabled: loadTextures
  });
  const bumpMap = useTextureAsset(data.render.bumpUrl, {
    fallbackTexture: data.render.bumpUrl ? getNeutralBumpTexture() : null,
    colorSpace: NoColorSpace,
    enabled: loadTextures
  });

  const materialPreset = data.render.materialPreset ?? DEFAULT_MATERIAL;
  const fallbackGlow =
    data.kind === "dwarf"
      ? DWARF_GLOW
      : data.kind === "star"
        ? STAR_GLOW
        : DEFAULT_GLOW;
  const glowPreset = data.render.glowPreset ?? fallbackGlow;
  const rimPreset =
    rimGlow === false
      ? null
      : typeof rimGlow === "object"
        ? rimGlow
        : rimGlow === true
          ? {}
          : glowPreset.rim ?? null;

  const bodyGeometry = useMemo(
    () => (isMoon ? getSharedMoonShellSphere() : getSharedPlanetSphere()),
    [isMoon]
  );
  const shellGeometry = useMemo(() => getSharedMoonShellSphere(), []);
  const ringPresets = useMemo(() => {
    if (!data.rings) return null;
    return Array.isArray(data.rings) ? data.rings : [data.rings];
  }, [data.rings]);

  const isEarth = data.id === "earth";
  const isTitan = data.id === "titan";

  const cloudsMaterial = useMemo(
    () => (isEarth ? createEarthCloudsMaterial() : null),
    [isEarth]
  );
  const titanHazeMaterial = useMemo(
    () => (isTitan ? createTitanHazeMaterial() : null),
    [isTitan]
  );
  const rimMaterial = useMemo(
    () =>
      rimPreset
        ? createPlanetaryRimMaterial(rimPreset, glowPreset.color, isTitan)
        : null,
    [glowPreset.color, isTitan, rimPreset]
  );

  const solarUniforms = useMemo(() => createSolarShineUniforms(data), [data]);
  const hasNormalMap = Boolean(data.render.normalUrl);
  const hasBumpMap = Boolean(data.render.bumpUrl);

  const material = useMemo(() => {
    const normalStrength = materialPreset.normalScale ?? 0.55;
    const mat = new MeshStandardMaterial({
      map: baseMap ?? null,
      normalMap: hasNormalMap ? (normalMap ?? getFlatNormalTexture()) : null,
      normalScale: new Vector2(normalStrength, normalStrength),
      bumpMap: hasBumpMap ? (bumpMap ?? getNeutralBumpTexture()) : null,
      bumpScale: 0.02,
      roughness: materialPreset.roughness,
      metalness: materialPreset.metalness,
      emissive: isEarth ? new Color("#000000") : new Color(glowPreset.color),
      emissiveIntensity: isEarth ? 0 : 0.005
    });
    applySolarShineShader(mat, solarUniforms);
    return mat;
    // Intentionally exclude baseMap/normalMap/bumpMap so swapping placeholder -> loaded
    // textures never destroys the material or recompiles custom PBR GLSL shaders on click.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    glowPreset.color,
    hasBumpMap,
    hasNormalMap,
    isEarth,
    materialPreset,
    solarUniforms
  ]);

  useEffect(() => {
    const prevHasMap = Boolean(material.map);
    const prevHasNormal = Boolean(material.normalMap);
    const prevHasBump = Boolean(material.bumpMap);

    const nextMap = baseMap ?? null;
    const nextNormal = hasNormalMap ? (normalMap ?? getFlatNormalTexture()) : null;
    const nextBump = hasBumpMap ? (bumpMap ?? getNeutralBumpTexture()) : null;

    material.map = nextMap;
    material.normalMap = nextNormal;
    material.bumpMap = nextBump;

    // Only trigger shader recompile if a texture slot toggled between null and non-null
    if (
      prevHasMap !== Boolean(nextMap) ||
      prevHasNormal !== Boolean(nextNormal) ||
      prevHasBump !== Boolean(nextBump)
    ) {
      material.needsUpdate = true;
    }
  }, [material, baseMap, normalMap, bumpMap, hasNormalMap, hasBumpMap]);

  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => cloudsMaterial?.dispose(), [cloudsMaterial]);
  useEffect(() => () => titanHazeMaterial?.dispose(), [titanHazeMaterial]);
  useEffect(() => () => rimMaterial?.dispose(), [rimMaterial]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const rotationHours = data.rotation.rotationPeriodHours;
    let deltaAngle = 0;

    if ((data.id === "pluto" || data.id === "charon") && simTimeRef) {
      const phase = getPlutoCharonOrbitalPhase(simTimeRef.current);
      meshRef.current.rotation.y =
        data.id === "pluto" ? -phase : -phase - Math.PI;
      prevSimTimeRef.current = simTimeRef.current;
    } else if (
      data.rotation.tidallyLocked &&
      isMoon &&
      data.parentId &&
      planetRefs?.current?.[data.parentId]
    ) {
      // True synchronous tidal locking: keep the moon's sub-parent prime meridian (local +X,
      // texture u = 0.5, e.g. Earth's Moon near side) continuously facing its parent planet.
      const parentObj = planetRefs.current[data.parentId];
      if (parentObj && meshRef.current.parent?.visible !== false) {
        parentObj.getWorldPosition(parentPosRef);
        meshRef.current.getWorldPosition(moonPosRef);
        dirRef.copy(parentPosRef).sub(moonPosRef);
        if (dirRef.lengthSq() > 1e-10) {
          dirRef.applyQuaternion(invPoleQuaternion);
          meshRef.current.rotation.y = Math.atan2(-dirRef.z, dirRef.x);
        }
      }
      if (simTimeRef) {
        prevSimTimeRef.current = simTimeRef.current;
      }
    } else if (simTimeRef && rotationHours !== 0) {
      const simDays = simTimeRef.current;
      const rotationDays = rotationHours / 24;

      if (prevSimTimeRef.current === null) {
        // Seed initial spin phase deterministically from simulation time
        meshRef.current.rotation.y =
          spinSign * (((simDays / rotationDays) * TWO_PI) % TWO_PI);
        prevSimTimeRef.current = simDays;
      } else {
        const dtDays = simDays - prevSimTimeRef.current;
        prevSimTimeRef.current = simDays;

        // Detect a discrete custom date jump (> 50 simulated days in a single frame)
        // and snap cleanly to the new deterministic phase instead of a spin burst.
        if (Math.abs(dtDays) > 50) {
          meshRef.current.rotation.y =
            spinSign * (((simDays / rotationDays) * TWO_PI) % TWO_PI);
        } else if (dtDays !== 0 && delta > 0) {
          const safeDelta = Math.min(delta, 0.05);
          const rawOmega = (spinSign * (dtDays / rotationDays) * TWO_PI) / safeDelta;
          const visualOmega =
            MAX_VISUAL_SPIN_RAD_PER_SEC *
            Math.tanh(rawOmega / MAX_VISUAL_SPIN_RAD_PER_SEC);
          deltaAngle = visualOmega * safeDelta;
          meshRef.current.rotation.y += deltaAngle;
        }
      }
    } else if (rotationHours !== 0) {
      const rotationRate = TWO_PI / (rotationHours * 3600);
      deltaAngle = spinSign * delta * rotationRate * timeScale;
      meshRef.current.rotation.y += deltaAngle;
    }

    if (cloudsMeshRef.current && deltaAngle !== 0) {
      cloudsMeshRef.current.rotation.y += deltaAngle * 1.15;
    }
    if (cloudsMaterial?.uniforms && deltaAngle !== 0) {
      cloudTimeRef.current += deltaAngle * 0.45;
      cloudsMaterial.uniforms.uTime.value = cloudTimeRef.current;
    }

    // Dynamic Earth Shadow (Lunar Eclipse) when Moon moves behind Earth relative to Sun
    if (data.id === "moon" && planetRefs?.current?.earth) {
      const earthObj = planetRefs.current.earth;
      earthObj.getWorldPosition(parentPosRef);
      meshRef.current.getWorldPosition(moonPosRef);

      dirRef.copy(parentPosRef).normalize();
      moonOffsetRef.copy(moonPosRef).sub(parentPosRef);

      const distAlongShadow = moonOffsetRef.dot(dirRef);
      let targetShadow = 1.0;

      if (distAlongShadow > 0) {
        projRef.copy(dirRef).multiplyScalar(distAlongShadow);
        const perpDist = moonOffsetRef.sub(projRef).length();
        const umbraRadius = 0.55;
        if (perpDist < umbraRadius) {
          const t = Math.max(0, perpDist / umbraRadius);
          targetShadow = MathUtils.lerp(0.06, 1.0, Math.pow(t, 1.8));
        }
      }

      shadowFactorRef.current = MathUtils.lerp(
        shadowFactorRef.current,
        targetShadow,
        Math.min(1.0, delta * 8.0)
      );

      material.color.setHSL(0, 0, shadowFactorRef.current);
    }
  });

  return (
    <group ref={groupRef} position={position} quaternion={poleQuaternion}>
      <mesh
        ref={meshRef}
        geometry={bodyGeometry}
        material={material}
        scale={radius}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
        }}
      />
      {isEarth && cloudsMaterial && (
        <mesh
          ref={cloudsMeshRef}
          geometry={shellGeometry}
          material={cloudsMaterial}
          scale={radius * 1.008}
          raycast={() => null}
        />
      )}
      {isTitan && titanHazeMaterial && (
        <mesh
          geometry={shellGeometry}
          material={titanHazeMaterial}
          scale={radius * 1.008}
          raycast={() => null}
        />
      )}
      {rimMaterial && (
        <mesh
          geometry={shellGeometry}
          material={rimMaterial}
          scale={radius * (rimPreset?.scale ?? 1.04)}
          raycast={() => null}
        />
      )}
      {ringPresets && ringPresets.length > 0 && (
        <RingSystem
          planetRadiusKm={data.render.radiusKm}
          renderRadius={radius}
          rings={ringPresets}
        />
      )}
    </group>
  );
}
