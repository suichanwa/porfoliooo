import { useEffect, useMemo, useRef, type Ref } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  NoColorSpace,
  Object3D,
  Quaternion,
  ShaderMaterial,
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
import { EARTH_NIGHT_TEXTURE, VENUS_ATMOSPHERE_TEXTURE } from "../data/textures";
import { useTextureAsset } from "../hooks/usePlanetTexture";
import { scalePlanetRadius } from "../utils/scale";
import RingSystem from "../../components/Planetarium/rings/RingSystem";
import { getPlutoCharonOrbitalPhase } from "../orbits/orbitMath";
import { GLSL_NOISE_3D } from "../shaders/noiseGlsl";
import {
  getBodyShadingConfig,
  updateBodyLightingUniforms,
  type LightingMode
} from "../lighting/solarLighting";
import {
  applySolarSurfaceShader,
  createDefaultSolarUniforms
} from "../shaders/planetSurfaceShader";

interface BodyMeshProps {
  data: BodyData;
  position: Vector3;
  atmosphere?: boolean;
  timeScale?: number;
  rimGlow?: boolean | RimGlowPreset;
  lightingMode?: LightingMode;
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

// Scratch objects reused inside useFrame to eliminate GC pressure
const _tmpQuat = new Quaternion();
const _tmpNormal = new Vector3();
const _tmpCenter = new Vector3();

export default function BodyMesh({
  data,
  position,
  atmosphere = false,
  timeScale = 40,
  rimGlow,
  lightingMode = "cinematic",
  groupRef,
  planetRefs,
  simTimeRef,
  onPointerOver,
  onPointerOut,
  onClick
}: BodyMeshProps) {
  const localGroupRef = useRef<Group | null>(null);
  const meshRef = useRef<Mesh>(null);
  const cloudsMeshRef = useRef<Mesh>(null);
  const venusCloudsMeshRef = useRef<Mesh>(null);

  const isMoon = data.kind === "moon";
  const parentRadiusKm =
    isMoon && data.parentId
      ? PLANET_BY_ID[data.parentId]?.render.radiusKm
      : undefined;
  const radius = useMemo(
    () => scalePlanetRadius(data.render.radiusKm, isMoon, parentRadiusKm),
    [data.render.radiusKm, isMoon, parentRadiusKm]
  );
  const tilt = MathUtils.degToRad(data.rotation.axialTiltDeg);

  const isEarth = data.id === "earth";
  const isVenus = data.id === "venus";
  const isTitan = data.id === "titan";

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
  const earthNightMap = useTextureAsset(isEarth ? EARTH_NIGHT_TEXTURE : null, {
    colorSpace: SRGBColorSpace
  });
  const venusCloudMap = useTextureAsset(
    isVenus ? VENUS_ATMOSPHERE_TEXTURE : null,
    { colorSpace: SRGBColorSpace }
  );

  const ringPresets = useMemo(() => {
    if (!data.rings) return null;
    return Array.isArray(data.rings) ? data.rings : [data.rings];
  }, [data.rings]);

  const primaryRingPreset = useMemo(() => {
    if (!ringPresets || ringPresets.length === 0) return null;
    // Prefer widest/primary textured ring (e.g. Saturn A/B/C rings) for sphere self-shadowing
    return ringPresets.find((r) => Boolean(r.textureUrl)) ?? ringPresets[0];
  }, [ringPresets]);

  const ringShadowMap = useTextureAsset(primaryRingPreset?.textureUrl ?? null, {
    colorSpace: SRGBColorSpace
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
    rimGlow === false || atmosphere === false
      ? null
      : typeof rimGlow === "object"
        ? rimGlow
        : rimGlow === true
          ? {}
          : glowPreset.rim ?? null;

  const shadingConfig = useMemo(
    () => getBodyShadingConfig(data, lightingMode),
    [data, lightingMode]
  );

  const geometry = useMemo(() => new SphereGeometry(radius, 64, 48), [radius]);
  const solarUniforms = useMemo(() => createDefaultSolarUniforms(), []);

  // Sync static & lighting-preset uniforms without triggering material recompilation
  useEffect(() => {
    solarUniforms.uSunBoost.value = shadingConfig.sunBoost;
    solarUniforms.uKeyTint.value.copy(shadingConfig.keyTint);
    solarUniforms.uAmbientRim.value = shadingConfig.ambientRim;
    solarUniforms.uTwilightColor.value.copy(shadingConfig.twilightColor);
    solarUniforms.uAtmoStrength.value = shadingConfig.atmoStrength;
    solarUniforms.uBounceColor.value.copy(shadingConfig.bounceColor);
    solarUniforms.uProceduralKind.value = shadingConfig.proceduralKind;
    solarUniforms.uOceanSpecular.value = shadingConfig.oceanSpecular;

    if (isEarth && earthNightMap) {
      solarUniforms.uNightMap.value = earthNightMap;
      solarUniforms.uHasNightMap.value = 1;
    } else {
      solarUniforms.uHasNightMap.value = 0;
    }

    if (
      primaryRingPreset &&
      data.render.radiusKm > 0 &&
      (data.id === "saturn" || data.id === "uranus")
    ) {
      solarUniforms.uRingShadow.value = 1;
      solarUniforms.uRingInner.value =
        radius * (primaryRingPreset.innerRadiusKm / data.render.radiusKm);
      solarUniforms.uRingOuter.value =
        radius * (primaryRingPreset.outerRadiusKm / data.render.radiusKm);
      if (ringShadowMap && primaryRingPreset.textureUrl) {
        solarUniforms.uRingMap.value = ringShadowMap;
        solarUniforms.uHasRingMap.value = 1;
      } else {
        solarUniforms.uHasRingMap.value = 0;
      }
    } else {
      solarUniforms.uRingShadow.value = 0;
      solarUniforms.uHasRingMap.value = 0;
    }
  }, [
    data.id,
    data.render.radiusKm,
    earthNightMap,
    isEarth,
    primaryRingPreset,
    radius,
    ringShadowMap,
    shadingConfig,
    solarUniforms
  ]);

  const material = useMemo(() => {
    const normalStrength = materialPreset.normalScale ?? 0.55;
    const mat = new MeshStandardMaterial({
      map: baseMap ?? null,
      normalMap: normalMap ?? null,
      normalScale: new Vector2(normalStrength, normalStrength),
      bumpMap: bumpMap ?? null,
      bumpScale: 0.02,
      roughness: materialPreset.roughness,
      metalness: materialPreset.metalness
    });
    applySolarSurfaceShader(mat, solarUniforms);
    return mat;
  }, [baseMap, bumpMap, materialPreset, normalMap, solarUniforms]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const cloudsMaterial = useMemo(() => {
    if (!isEarth) return null;
    return new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCloudColor: { value: new Color("#ffffff") },
        uSunsetColor: { value: new Color("#ff8a4c") }
      },
      vertexShader: /* glsl */ `
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
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uCloudColor;
        uniform vec3 uSunsetColor;
        varying vec3 vObjPos;
        varying vec3 vNormal;
        varying vec3 vWorldPos;

        ${GLSL_NOISE_3D}

        void main() {
          vec3 dir = normalize(vObjPos);
          float cosT = cos(uTime * 0.03);
          float sinT = sin(uTime * 0.03);
          dir.xz = mat2(cosT, -sinT, sinT, cosT) * dir.xz;

          // Swirl along zonal trade-wind belts so clouds form wispy bands rather than round blobs
          vec3 p = dir * vec3(5.2, 10.5, 5.2);
          float swirl = noise3d(p * 0.55);
          float n = fbm3d(p + vec3(swirl * 1.6, 0.15 * swirl, -swirl * 1.6));
          float cloudDensity = smoothstep(0.45, 0.78, n);

          vec3 sunDir = normalize(-vWorldPos);
          float sunDot = dot(normalize(vNormal), sunDir);
          float litCloud = smoothstep(-0.20, 0.35, sunDot);
          float twilight = exp(-pow((sunDot + 0.02) * 5.2, 2.0));

          float polarLat = abs(dir.y);
          float polarFade = smoothstep(0.92, 0.72, polarLat);

          vec3 col = mix(uCloudColor, uSunsetColor, twilight * 0.62);
          col *= (litCloud * 0.96 + 0.04);
          gl_FragColor = vec4(col, cloudDensity * 0.38 * litCloud * polarFade);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false
    });
  }, [isEarth]);

  const venusCloudsMaterial = useMemo(() => {
    if (!isVenus || !venusCloudMap) return null;
    return new ShaderMaterial({
      uniforms: {
        uCloudMap: { value: venusCloudMap },
        uTint: { value: new Color("#f7e3b5") },
        uTwilight: { value: new Color("#e27d29") }
      },
      vertexShader: /* glsl */ `
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
      fragmentShader: /* glsl */ `
        uniform sampler2D uCloudMap;
        uniform vec3 uTint;
        uniform vec3 uTwilight;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorldPos;

        void main() {
          vec3 N = normalize(vNormal);
          vec3 sunDir = normalize(-vWorldPos);
          float sunDot = dot(N, sunDir);
          float dayFactor = smoothstep(-0.22, 0.42, sunDot);
          float twilightBand = exp(-pow((sunDot + 0.03) * 4.5, 2.0));

          vec3 tex = texture2D(uCloudMap, vUv).rgb;
          vec3 lit = tex * uTint * (0.12 + 1.05 * max(sunDot, 0.0));
          lit += uTwilight * twilightBand * 0.35 * dot(tex, vec3(0.333));

          gl_FragColor = vec4(lit, clamp(0.76 * (dayFactor * 0.92 + 0.08), 0.0, 0.82));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false
    });
  }, [isVenus, venusCloudMap]);

  const titanHazeMaterial = useMemo(() => {
    if (!isTitan) return null;
    return new ShaderMaterial({
      uniforms: {
        uHazeColor: { value: new Color("#e8a848") },
        uTerminatorColor: { value: new Color("#cf5d24") },
        uPolarColor: { value: new Color("#8a7e82") }
      },
      vertexShader: /* glsl */ `
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
      fragmentShader: /* glsl */ `
        uniform vec3 uHazeColor;
        uniform vec3 uTerminatorColor;
        uniform vec3 uPolarColor;
        varying vec3 vObjPos;
        varying vec3 vNormal;
        varying vec3 vWorldPos;

        ${GLSL_NOISE_3D}

        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(cameraPosition - vWorldPos);
          vec3 sunDir = normalize(-vWorldPos);

          float ndotv = max(dot(N, V), 0.0);
          float fresnel = pow(1.0 - ndotv, 2.35);

          float sunDot = dot(N, sunDir);
          float dayFactor = smoothstep(-0.24, 0.38, sunDot);
          float terminatorGlow = exp(-pow((sunDot + 0.03) * 5.2, 2.0));

          vec3 p = normalize(vObjPos);
          float n = noise3d(p * vec3(3.2, 8.5, 3.2));
          float band = 0.84 + 0.16 * sin(p.y * 14.0 + n * 2.8);
          float polarHood = smoothstep(0.58, 0.94, abs(p.y));

          float forwardScatter = pow(max(dot(-V, sunDir), 0.0), 3.5) * fresnel * smoothstep(-0.65, 0.20, sunDot);

          vec3 hazeCol = mix(uHazeColor, uPolarColor, polarHood * 0.48);
          hazeCol = mix(hazeCol, uTerminatorColor, terminatorGlow * 0.52);
          hazeCol *= band;

          float diskHaze = 0.04 + 0.62 * fresnel;
          float alpha = diskHaze * (dayFactor * 0.94 + 0.03) + forwardScatter * 0.35;

          gl_FragColor = vec4(hazeCol, clamp(alpha, 0.0, 0.78));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      depthWrite: false
    });
  }, [isTitan]);

  const rimMaterial = useMemo(() => {
    if (!rimPreset) return null;
    const rimScale = rimPreset.scale ?? 1.04;
    const limbMu = Math.sqrt(Math.max(0.001, 1 - 1 / (rimScale * rimScale)));
    const baseColor = rimPreset.color ?? glowPreset.color;
    return new ShaderMaterial({
      uniforms: {
        uColor: { value: new Color(baseColor) },
        uOuterColor: { value: new Color(rimPreset.outerColor ?? baseColor) },
        uTerminatorColor: {
          value: new Color(rimPreset.terminatorColor ?? baseColor)
        },
        uOuterMix: { value: rimPreset.colorMix ?? 0.0 },
        uUpperHaze: { value: isTitan ? 1.0 : 0.0 },
        uPower: { value: rimPreset.power ?? 2.8 },
        uOpacity: { value: rimPreset.opacity ?? 0.08 },
        uLimbMu: { value: limbMu }
      },
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        varying vec3 vWorldPos;
        void main() {
          vNormal = normalize(mat3(modelMatrix) * normal);
          vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform vec3 uOuterColor;
        uniform vec3 uTerminatorColor;
        uniform float uOuterMix;
        uniform float uUpperHaze;
        uniform float uPower;
        uniform float uOpacity;
        uniform float uLimbMu;
        varying vec3 vNormal;
        varying vec3 vWorldPos;

        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(cameraPosition - vWorldPos);
          vec3 sunDir = normalize(-vWorldPos);

          float mu = max(0.0, dot(N, -V));
          float t = clamp(mu / uLimbMu, 0.0, 1.0);

          float edgeFade = smoothstep(0.0, 0.24, t);
          float mainHaze = pow(t, uPower) * edgeFade;
          float upperHaze = exp(-pow((t - 0.36) / 0.18, 2.0)) * smoothstep(0.0, 0.22, t) * 0.14 * uUpperHaze;
          float radial = mainHaze + upperHaze;

          float sunDot = dot(N, sunDir);
          float dayLight = smoothstep(-0.34, 0.48, sunDot);
          float terminatorGlow = exp(-pow((sunDot + 0.04) * 4.5, 2.0));
          float forwardScatter = pow(max(dot(-V, sunDir), 0.0), 4.0) * smoothstep(-0.68, 0.20, sunDot) * 0.42;

          vec3 scatterColor = mix(uOuterColor, uColor, smoothstep(0.28, 0.80, t * mix(1.0, 0.92, uOuterMix)));
          scatterColor = mix(scatterColor, uTerminatorColor, terminatorGlow * 0.42 * uOuterMix);

          float alpha = radial * (dayLight * 0.95 + forwardScatter + 0.03) * uOpacity;
          gl_FragColor = vec4(scatterColor, clamp(alpha, 0.0, 1.0));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      blending: AdditiveBlending,
      side: BackSide,
      depthWrite: false
    });
  }, [glowPreset.color, isTitan, rimPreset]);

  useEffect(() => {
    return () => {
      cloudsMaterial?.dispose();
      venusCloudsMaterial?.dispose();
      titanHazeMaterial?.dispose();
      rimMaterial?.dispose();
    };
  }, [cloudsMaterial, rimMaterial, titanHazeMaterial, venusCloudsMaterial]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const rotationRate =
      (2 * Math.PI) / (data.rotation.rotationPeriodHours * 3600);

    if ((data.id === "pluto" || data.id === "charon") && simTimeRef) {
      // Mutual tidal locking: Pluto & Charon keep the same hemispheres facing each other
      const phase = getPlutoCharonOrbitalPhase(simTimeRef.current);
      meshRef.current.rotation.y = data.id === "pluto" ? -phase : -phase - Math.PI;
    } else {
      meshRef.current.rotation.y += delta * rotationRate * timeScale;
    }

    // Drift clouds independently over Earth
    if (cloudsMeshRef.current) {
      cloudsMeshRef.current.rotation.y += delta * rotationRate * timeScale * 1.15;
    }
    if (cloudsMaterial?.uniforms) {
      cloudsMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    }

    // Venus super-rotating sulfuric cloud deck (~4-day retrograde circulation)
    if (venusCloudsMeshRef.current) {
      venusCloudsMeshRef.current.rotation.y -= delta * rotationRate * timeScale * 14.0;
    }

    const hostObj = localGroupRef.current ?? meshRef.current;
    hostObj.getWorldPosition(_tmpCenter);
    solarUniforms.uBodyCenter.value.copy(_tmpCenter);

    if (solarUniforms.uRingShadow.value > 0.5) {
      hostObj.getWorldQuaternion(_tmpQuat);
      _tmpNormal.set(0, 1, 0).applyQuaternion(_tmpQuat).normalize();
      solarUniforms.uRingNormal.value.copy(_tmpNormal);
    }

    updateBodyLightingUniforms(
      data,
      hostObj,
      planetRefs,
      solarUniforms,
      shadingConfig.bounceBaseIntensity
    );
  });

  return (
    <group
      ref={(node) => {
        localGroupRef.current = node;
        if (typeof groupRef === "function") groupRef(node);
        else if (groupRef) (groupRef as { current: Group | null }).current = node;
      }}
      position={position}
      rotation={[0, 0, tilt]}
    >
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
      {isVenus && venusCloudsMaterial && (
        <mesh
          ref={venusCloudsMeshRef}
          geometry={geometry}
          material={venusCloudsMaterial}
          scale={1.009}
          raycast={() => null}
        />
      )}
      {isTitan && titanHazeMaterial && (
        <mesh
          geometry={geometry}
          material={titanHazeMaterial}
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
          lightingMode={lightingMode}
        />
      )}
    </group>
  );
}
