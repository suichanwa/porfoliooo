import { useMemo, useRef, type Ref } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  NoColorSpace,
  SphereGeometry,
  SRGBColorSpace,
  Vector3
} from "three";
import type { BodyData, GlowPreset, MaterialPreset, RimGlowPreset } from "../data/types";
import { useTextureAsset } from "../hooks/usePlanetTexture";
import { scalePlanetRadius } from "../utils/scale";
import RingSystem from "../../components/Planetarium/rings/RingSystem";

interface BodyMeshProps {
  data: BodyData;
  position: Vector3;
  atmosphere?: boolean;
  timeScale?: number;
  rimGlow?: boolean | RimGlowPreset;
  groupRef?: Ref<Group>;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}

const DEFAULT_MATERIAL: MaterialPreset = { roughness: 0.85, metalness: 0 };
const DEFAULT_GLOW: GlowPreset = { color: "#f3d4a6", intensity: 0.12 };
const DWARF_GLOW: GlowPreset = { color: "#f3d4a6", intensity: 0.08 };
const STAR_GLOW: GlowPreset = { color: "#f5c96b", intensity: 1.2 };

export default function BodyMesh({
  data,
  position,
  atmosphere = false,
  timeScale = 40,
  rimGlow,
  groupRef,
  onPointerOver,
  onPointerOut,
  onClick
}: BodyMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const radius = useMemo(
    () => scalePlanetRadius(data.render.radiusKm, data.kind === "moon"),
    [data.render.radiusKm, data.kind]
  );
  const tilt = MathUtils.degToRad(data.rotation.axialTiltDeg);

  const baseMap = useTextureAsset(data.render.textureUrl, {
    fallbackColor: data.render.colorFallback,
    colorSpace: SRGBColorSpace
  });
  const normalMap = useTextureAsset(data.render.normalUrl, {
    colorSpace: NoColorSpace
  });
  const bumpMap = useTextureAsset(data.render.bumpUrl, {
    colorSpace: NoColorSpace
  });

  const materialPreset = data.render.materialPreset ?? DEFAULT_MATERIAL;
  const fallbackGlow =
    data.kind === "dwarf" ? DWARF_GLOW : data.kind === "star" ? STAR_GLOW : DEFAULT_GLOW;
  const glowPreset = data.render.glowPreset ?? fallbackGlow;
  const rimPreset =
    rimGlow === false
      ? null
      : typeof rimGlow === "object"
        ? rimGlow
        : rimGlow === true
          ? {}
          : glowPreset.rim ?? null;

  const geometry = useMemo(() => new SphereGeometry(radius, 48, 32), [radius]);
  const ringPresets = useMemo(() => {
    if (!data.rings) return null;
    return Array.isArray(data.rings) ? data.rings : [data.rings];
  }, [data.rings]);

  const isEarth = data.id === "earth";
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        map: baseMap ?? null,
        normalMap: normalMap ?? null,
        bumpMap: bumpMap ?? null,
        roughness: isEarth ? 0.5 : materialPreset.roughness,
        metalness: isEarth ? 0.05 : materialPreset.metalness,
        // Remove emissive yellow overglow on Earth so textures render rich and realistic
        emissive: isEarth ? new Color("#000000") : new Color(glowPreset.color),
        emissiveIntensity: isEarth ? 0 : 0.025
      }),
    [baseMap, bumpMap, glowPreset.color, isEarth, materialPreset, normalMap]
  );

  const atmosphereMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uColor: { value: new Color("#38bdf8") }
        },
        vertexShader: `
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          varying vec3 vNormal;
          varying vec3 vPosition;
          void main() {
            vec3 viewDir = normalize(-vPosition);
            float fresnel = pow(1.0 - max(0.0, dot(vNormal, viewDir)), 3.2);
            gl_FragColor = vec4(uColor, fresnel * 0.45);
          }
        `,
        blending: AdditiveBlending,
        side: BackSide,
        transparent: true,
        depthWrite: false
      }),
    []
  );

  const rimMaterial = useMemo(() => {
    if (!rimPreset) return null;
    return new MeshBasicMaterial({
      color: rimPreset.color ?? glowPreset.color,
      transparent: true,
      opacity: rimPreset.opacity ?? 0.08,
      blending: AdditiveBlending,
      side: BackSide,
      depthWrite: false
    });
  }, [glowPreset.color, rimPreset]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const rotationRate =
      (2 * Math.PI) / (data.rotation.rotationPeriodHours * 3600);
    meshRef.current.rotation.y += delta * rotationRate * timeScale;
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, 0, tilt]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
        }}
      />
      {atmosphere && (
        <mesh
          geometry={geometry}
          material={atmosphereMaterial}
          scale={1.035}
          raycast={() => null}
        />
      )}
      {rimMaterial && (
        <mesh
          geometry={geometry}
          material={rimMaterial}
          scale={rimPreset?.scale ?? 1.04}
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
