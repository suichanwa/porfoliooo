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
import type { BodyData, BodyId, GlowPreset, MaterialPreset, RimGlowPreset } from "../data/types";
import { PLANET_BY_ID } from "../data/planetRegistry";
import { useTextureAsset } from "../hooks/usePlanetTexture";
import { scalePlanetRadius } from "../utils/scale";
import RingSystem from "../../components/Planetarium/rings/RingSystem";
import { getPlutoCharonOrbitalPhase } from "../orbits/orbitMath";

interface BodyMeshProps {
  data: BodyData;
  position: Vector3;
  atmosphere?: boolean;
  timeScale?: number;
  rimGlow?: boolean | RimGlowPreset;
  groupRef?: Ref<Group>;
  planetRefs?: React.MutableRefObject<Record<BodyId, Object3D | null>>;
  simTimeRef?: React.MutableRefObject<number>;
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
  simTimeRef,
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

  const isMoon = data.kind === "moon";
  const parentRadiusKm = isMoon && data.parentId ? PLANET_BY_ID[data.parentId]?.render.radiusKm : undefined;
  const radius = useMemo(
    () => scalePlanetRadius(data.render.radiusKm, isMoon, parentRadiusKm),
    [data.render.radiusKm, isMoon, parentRadiusKm]
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

  const geometry = useMemo(() => new SphereGeometry(radius, 64, 48), [radius]);
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
        varying vec3 vObjPos;
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vObjPos = position;
          vNormal = normalize(mat3(modelMatrix) * normal);
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uCloudColor;
        varying vec3 vObjPos;
        varying vec3 vNormal;
        varying vec3 vWorldPos;

        float hash3(vec3 p) {
          p = fract(p * 0.3183099 + 0.1);
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise3(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), f.x),
                         mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
                         mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y), f.z);
        }

        float fbm3(vec3 p) {
          float v = 0.0;
          float a = 0.5;
          mat3 rot = mat3(
             0.00,  0.80,  0.60,
            -0.80,  0.36, -0.48,
            -0.60, -0.48,  0.64
          );
          for (int i = 0; i < 4; ++i) {
            v += a * noise3(p);
            p = rot * p * 2.02 + vec3(1.2, 4.3, 2.1);
            a *= 0.5;
          }
          return v;
        }

        void main() {
          // 3D Cartesian spherical coordinates: completely seamless with zero polar pinching
          vec3 p = normalize(vObjPos) * 4.2;
          
          float cosT = cos(uTime * 0.03);
          float sinT = sin(uTime * 0.03);
          p.xz = mat2(cosT, -sinT, sinT, cosT) * p.xz;

          float n = fbm3(p);
          float cloudDensity = smoothstep(0.38, 0.70, n);

          // Sunlight calculation (Sun is at 0,0,0)
          vec3 sunDir = normalize(-vWorldPos);
          float sunDot = dot(vNormal, sunDir);
          float litCloud = smoothstep(-0.20, 0.35, sunDot);

          // Polar fade so Arctic & Antarctic ice caps from 8K daymap remain crisp and clear
          float polarLat = abs(normalize(vObjPos).y);
          float polarFade = smoothstep(0.92, 0.72, polarLat);

          vec3 color = uCloudColor * (litCloud * 0.95 + 0.05);
          gl_FragColor = vec4(color, cloudDensity * 0.40 * litCloud * polarFade);
        }
      `,
      transparent: true,
      depthWrite: false
    });
  }, [isEarth]);

  const boost = materialPreset.illuminationBoost ?? 0;

  const isAirless =
    data.kind === "dwarf" ||
    data.id === "mercury" ||
    data.id === "moon" ||
    data.id === "callisto" ||
    data.id === "ganymede" ||
    data.id === "europa" ||
    data.id === "enceladus";

  const signatureRimColor = useMemo(() => {
    if (rimPreset?.color) return new Color(rimPreset.color);
    if (glowPreset.color) return new Color(glowPreset.color);
    return new Color("#60a5fa");
  }, [rimPreset, glowPreset.color]);

  const signatureNightRimColor = useMemo(() => {
    if (rimPreset?.color) return new Color(rimPreset.color);
    if (isAirless) return new Color("#60a5fa");
    if (glowPreset.color) return new Color(glowPreset.color);
    return new Color("#60a5fa");
  }, [rimPreset, isAirless, glowPreset.color]);

  const material = useMemo(() => {
    const mat = new MeshStandardMaterial({
      map: baseMap ?? null,
      normalMap: normalMap ?? null,
      bumpMap: bumpMap ?? null,
      roughness: materialPreset.roughness,
      metalness: materialPreset.metalness,
      emissive: isEarth ? new Color("#000000") : new Color(glowPreset.color),
      emissiveIntensity: isEarth ? 0 : 0.005
    });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uIlluminationBoost = { value: boost };
      shader.uniforms.uRimColor = { value: signatureRimColor };
      shader.uniforms.uNightRimColor = { value: signatureNightRimColor };

      shader.vertexShader = `
        varying vec3 vCustomWorldPos;
        varying vec3 vCustomWorldNormal;
        ${shader.vertexShader}
      `.replace(
        "#include <worldpos_vertex>",
        `#include <worldpos_vertex>
        vCustomWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vCustomWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
        `
      );

      shader.fragmentShader = `
        varying vec3 vCustomWorldPos;
        varying vec3 vCustomWorldNormal;
        uniform float uIlluminationBoost;
        uniform vec3 uRimColor;
        uniform vec3 uNightRimColor;
        ${shader.fragmentShader}
      `
        .replace(
          "float dotNL = saturate( dot( geometryNormal, directLight.direction ) );",
          `
          // Realistic astronomical terminator falloff with balanced penumbra
          float rawDotNL = dot( geometryNormal, directLight.direction );
          float wrap = 0.06;
          float softTerminator = smoothstep(-0.08, 0.28, rawDotNL);
          float dotNL = pow(softTerminator, 1.05) * saturate((rawDotNL + wrap) / (1.0 + wrap));
          `
        )
        .replace(
          "#include <lights_fragment_end>",
          `#include <lights_fragment_end>
          // 1. Day-side direct sunlight (naturally balanced, not overblown):
          reflectedLight.directDiffuse *= (1.0 + uIlluminationBoost * 1.2);
          reflectedLight.directSpecular *= (1.0 + uIlluminationBoost * 0.8);

          // 2. Solar incidence (Sun is at 0, 0, 0) and camera edge Fresnel
          vec3 dirToSun = normalize(-vCustomWorldPos);
          vec3 worldNorm = normalize(vCustomWorldNormal);
          float NdotL = dot(worldNorm, dirToSun);
          float rim = pow(1.0 - max(dot(geometryNormal, geometryViewDir), 0.0), 3.0);

          // Day-side atmospheric scattering rim on sunlit hemisphere
          float dayMask = smoothstep(-0.05, 0.35, NdotL);
          vec3 dayRimGlow = uRimColor * (rim * dayMask * 0.45);

          // Night-side starlight silhouette rim (guaranteed 20%-28% minimum rim glow on shadowed hemisphere)
          float nightMask = smoothstep(0.25, -0.45, NdotL);
          float nightRimFactor = rim * 0.25 * nightMask;
          vec3 nightRimGlow = uNightRimColor * nightRimFactor;

          // Soft twilight terminator band right at NdotL ≈ 0
          float terminatorBand = smoothstep(-0.12, 0.02, NdotL) * (1.0 - smoothstep(0.02, 0.15, NdotL));
          vec3 twilightTint = mix(uRimColor, vec3(1.0, 0.58, 0.28), 0.55) * (terminatorBand * 0.20);

          // Subtle night-side ambient starlight illumination (leaving 8-10% surface texture legibility on dark side)
          float nightAmbient = 0.022 + uIlluminationBoost * 0.02;
          reflectedLight.indirectDiffuse += diffuseColor.rgb * nightAmbient;

          // Composite rim backlights and twilight glow into indirect illumination
          reflectedLight.indirectDiffuse += (dayRimGlow + nightRimGlow + twilightTint) * diffuseColor.rgb * 1.4 + (dayRimGlow + nightRimGlow) * 0.35;
          `
        );
    };

    return mat;
  }, [baseMap, bumpMap, glowPreset.color, isEarth, materialPreset, normalMap, boost, signatureRimColor, signatureNightRimColor]);

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

    if ((data.id === "pluto" || data.id === "charon") && simTimeRef) {
      // Mutual tidal locking: both Pluto and Charon keep the exact same hemisphere
      // facing each other across the barycenter without spinning independently.
      const phase = getPlutoCharonOrbitalPhase(simTimeRef.current);
      meshRef.current.rotation.y = data.id === "pluto" ? -phase : -phase - Math.PI;
    } else {
      meshRef.current.rotation.y += delta * rotationRate * timeScale;
    }

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
