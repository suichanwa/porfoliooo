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
  ShaderMaterial,
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
  planetRefs?: React.MutableRefObject<Record<BodyId, Object3D | null>>;
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
  planetRefs,
  onPointerOver,
  onPointerOut,
  onClick
}: BodyMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const shadowFactorRef = useRef(1.0);
  const earthPosRef = useMemo(() => new Vector3(), []);
  const moonPosRef = useMemo(() => new Vector3(), []);
  const dirRef = useMemo(() => new Vector3(), []);
  const moonOffsetRef = useMemo(() => new Vector3(), []);
  const projRef = useMemo(() => new Vector3(), []);

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
  const cloudsMeshRef = useRef<Mesh>(null);

  const cloudsMaterial = useMemo(() => {
    if (!isEarth) return null;
    return new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCloudColor: { value: new Color("#ffffff") }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vUv = uv;
          vNormal = normalize(mat3(modelMatrix) * normal);
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uCloudColor;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPos;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                     mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
        }
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          vec2 shift = vec2(100.0);
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
          for (int i = 0; i < 4; ++i) {
            v += a * noise(p);
            p = rot * p * 2.0 + shift;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 uv = vUv * vec2(9.0, 4.5);
          float n = fbm(uv + vec2(uTime * 0.002, 0.0));
          float cloudDensity = smoothstep(0.40, 0.70, n);

          // Sunlight calculation (Sun is at 0,0,0)
          vec3 sunDir = normalize(-vWorldPos);
          float sunDot = max(0.0, dot(vNormal, sunDir));
          float litCloud = smoothstep(-0.05, 0.25, sunDot);

          vec3 color = uCloudColor * (litCloud * 0.95 + 0.05);
          gl_FragColor = vec4(color, cloudDensity * 0.42 * litCloud);
        }
      `,
      transparent: true,
      depthWrite: false
    });
  }, [isEarth]);

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        map: baseMap ?? null,
        normalMap: normalMap ?? null,
        bumpMap: bumpMap ?? null,
        roughness: materialPreset.roughness,
        metalness: materialPreset.metalness,
        emissive: isEarth ? new Color("#000000") : new Color(glowPreset.color),
        emissiveIntensity: isEarth ? 0 : 0.025
      }),
    [baseMap, bumpMap, glowPreset.color, isEarth, materialPreset, normalMap]
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

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const rotationRate =
      (2 * Math.PI) / (data.rotation.rotationPeriodHours * 3600);
    meshRef.current.rotation.y += delta * rotationRate * timeScale;

    // Slowly drift clouds independently over Earth
    if (cloudsMeshRef.current) {
      cloudsMeshRef.current.rotation.y += delta * rotationRate * timeScale * 1.15;
    }
    if (cloudsMaterial && cloudsMaterial.uniforms) {
      cloudsMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    }

    // Dynamic Earth Shadow (Lunar Eclipse) when Moon moves behind Earth relative to Sun
    if (data.id === "moon" && planetRefs?.current?.earth) {
      const earthObj = planetRefs.current.earth;
      earthObj.getWorldPosition(earthPosRef);
      meshRef.current.getWorldPosition(moonPosRef);

      // Direction vector from Sun (0,0,0) to Earth
      dirRef.copy(earthPosRef).normalize();
      moonOffsetRef.copy(moonPosRef).sub(earthPosRef);

      const distAlongShadow = moonOffsetRef.dot(dirRef);
      let targetShadow = 1.0;

      if (distAlongShadow > 0) {
        // Moon is behind Earth (night side)
        projRef.copy(dirRef).multiplyScalar(distAlongShadow);
        const perpDist = moonOffsetRef.sub(projRef).length();

        // Umbra shadow cone radius at Moon distance
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

      if (material && "color" in material) {
        const mat = material as MeshStandardMaterial;
        mat.color.setHSL(0, 0, shadowFactorRef.current);
      }
    }
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
      {isEarth && cloudsMaterial && (
        <mesh
          ref={cloudsMeshRef}
          geometry={geometry}
          material={cloudsMaterial}
          scale={1.008}
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
