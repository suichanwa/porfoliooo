import { useEffect, useMemo } from "react";
import {
  CanvasTexture,
  Color,
  DataTexture,
  DoubleSide,
  LinearFilter,
  NoColorSpace,
  RGBAFormat,
  RingGeometry,
  ShaderMaterial,
  UnsignedByteType
} from "three";
import type { Texture } from "three";
import { useTextureAsset } from "../hooks/usePlanetTexture";

interface RingBandProps {
  innerRadius: number;
  outerRadius: number;
  textureUrl?: string | null;
  color?: string;
  opacity?: number;
  patternSeed?: number;
  bandDensity?: number;
  renderOrder?: number;
}

const DEFAULT_RING_COLOR = "#d4c5a6";
const DEFAULT_OPACITY = 0.65;
const SEGMENTS = 160;
const proceduralCache = new Map<string, Texture>();

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const lerp = (min: number, max: number, t: number) => min + (max - min) * t;
const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

const mulberry32 = (seed: number) => {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
};

const createFallbackAlphaTexture = () => {
  const data = new Uint8Array([255, 255, 255, 255]);
  const texture = new DataTexture(data, 1, 1, RGBAFormat);
  texture.needsUpdate = true;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.colorSpace = NoColorSpace;
  return texture;
};

const createProceduralAlphaTexture = (seed: number, bandDensity: number) => {
  const density = clamp(bandDensity, 0.2, 0.9);
  const cacheKey = `${seed}:${density.toFixed(2)}`;
  const cached = proceduralCache.get(cacheKey);
  if (cached) return cached;

  if (typeof document === "undefined") {
    const fallback = createFallbackAlphaTexture();
    proceduralCache.set(cacheKey, fallback);
    return fallback;
  }

  const width = 512;
  const height = 128;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    const fallback = createFallbackAlphaTexture();
    proceduralCache.set(cacheKey, fallback);
    return fallback;
  }

  const rng = mulberry32(seed);
  const bands: Array<{
    start: number;
    end: number;
    alpha: number;
    feather: number;
  }> = [];

  const minRing = lerp(0.02, 0.05, 1 - density);
  const maxRing = lerp(0.05, 0.14, 1 - density);
  const minGap = lerp(0.01, 0.04, 1 - density);
  const maxGap = lerp(0.04, 0.1, 1 - density);

  let cursor = 0;
  let isRing = true;
  while (cursor < 1) {
    const widthFrac = isRing
      ? lerp(minRing, maxRing, rng())
      : lerp(minGap, maxGap, rng());
    const start = cursor;
    const end = Math.min(1, cursor + widthFrac);
    const alpha = isRing ? lerp(0.45, 0.95, rng()) : lerp(0.02, 0.2, rng());
    const feather = lerp(0.06, 0.22, rng());
    bands.push({ start, end, alpha, feather });
    cursor = end;
    isRing = !isRing;
  }

  // bands run along x (U axis) — geometry maps U to radial position
  let bandIndex = 0;
  for (let x = 0; x < width; x += 1) {
    const t = x / (width - 1);
    while (bandIndex < bands.length - 1 && t > bands[bandIndex].end) {
      bandIndex += 1;
    }
    const band = bands[bandIndex];
    const span = Math.max(1e-4, band.end - band.start);
    const local = clamp((t - band.start) / span, 0, 1);
    const edge = Math.min(local, 1 - local);
    const edgeFactor = smoothstep(0, band.feather, edge);
    const noise = (rng() - 0.5) * 0.06;
    const alpha = clamp(band.alpha * edgeFactor + noise, 0, 1);
    const value = Math.round(alpha * 255);
    ctx.fillStyle = `rgb(${value}, ${value}, ${value})`;
    ctx.fillRect(x, 0, 1, height);
  }

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.colorSpace = NoColorSpace;
  texture.needsUpdate = true;
  proceduralCache.set(cacheKey, texture);
  return texture;
};

let cachedRingFallback: DataTexture | null = null;
function getRingFallbackTexture(): DataTexture {
  if (cachedRingFallback) return cachedRingFallback;
  cachedRingFallback = new DataTexture(
    new Uint8Array([255, 255, 255, 255]),
    1,
    1,
    RGBAFormat,
    UnsignedByteType
  );
  cachedRingFallback.needsUpdate = true;
  return cachedRingFallback;
}

export default function RingBand({
  innerRadius,
  outerRadius,
  textureUrl,
  color = DEFAULT_RING_COLOR,
  opacity = DEFAULT_OPACITY,
  patternSeed = 7,
  bandDensity = 0.6,
  renderOrder
}: RingBandProps) {
  const loadedAlpha = useTextureAsset(textureUrl ?? null, {
    colorSpace: NoColorSpace
  });
  const proceduralAlpha = useMemo(() => {
    if (textureUrl) return null;
    return createProceduralAlphaTexture(patternSeed, bandDensity);
  }, [bandDensity, patternSeed, textureUrl]);
  const alphaMap = textureUrl ? loadedAlpha : proceduralAlpha;

  const geometry = useMemo(() => {
    const geom = new RingGeometry(innerRadius, outerRadius, SEGMENTS, 1);
    // RingGeometry UVs are planar; remap so U = radial fraction, matching
    // ring-strip textures (inner edge at U=0, outer edge at U=1).
    const pos = geom.attributes.position;
    const uv = geom.attributes.uv;
    const span = outerRadius - innerRadius;
    for (let i = 0; i < pos.count; i += 1) {
      const r = Math.hypot(pos.getX(i), pos.getY(i));
      uv.setXY(i, (r - innerRadius) / span, 0.5);
    }
    geom.rotateX(Math.PI / 2);
    return geom;
  }, [innerRadius, outerRadius]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uAlphaMap: { value: alphaMap ?? getRingFallbackTexture() },
          uHasAlpha: { value: alphaMap ? 1.0 : 0.0 },
          uHasTexColor: { value: textureUrl ? 1.0 : 0.0 },
          uColor: { value: new Color(color) },
          uSunTint: { value: new Color("#ffefd6") },
          uOpacity: { value: opacity }
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vWorldPos;
          varying vec3 vRadialWorld;
          void main() {
            vUv = uv;
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            vec3 localDir = vec3(position.x, 0.0, position.z);
            float localLen = max(length(localDir), 0.0001);
            vRadialWorld = normalize(mat3(modelMatrix) * (localDir / localLen));
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uAlphaMap;
          uniform float uHasAlpha;
          uniform float uHasTexColor;
          uniform vec3 uColor;
          uniform vec3 uSunTint;
          uniform float uOpacity;
          varying vec2 vUv;
          varying vec3 vWorldPos;
          varying vec3 vRadialWorld;

          void main() {
            vec4 tex = texture2D(uAlphaMap, vUv);
            float alphaMask = uHasAlpha > 0.5
              ? (uHasTexColor > 0.5 ? tex.a : tex.g)
              : 0.72;
            float finalAlpha = alphaMask * uOpacity;
            if (finalAlpha < 0.025) discard;

            // Subtle tonal band modulation from ring map without harsh shadow cutouts
            vec3 bandTint = uHasTexColor > 0.5
              ? mix(vec3(1.0), clamp(tex.rgb * 1.45, 0.45, 1.3), 0.42)
              : vec3(1.0);

            vec3 sunDir = normalize(-vWorldPos);
            vec3 viewDir = normalize(cameraPosition - vWorldPos);
            vec3 radialWorld = normalize(vRadialWorld);

            // Smooth ice-particle solar phase scattering so rings glow warmly toward sunlight
            float sunSide = 0.70 + 0.30 * (0.5 + 0.5 * dot(radialWorld, sunDir));
            float icePhase = pow(0.5 + 0.5 * dot(viewDir, sunDir), 2.0) * 0.22;

            vec3 litColor = uColor * bandTint * (sunSide + icePhase);
            litColor = mix(litColor, litColor * uSunTint * 1.08, 0.45);

            gl_FragColor = vec4(litColor, finalAlpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        transparent: true,
        side: DoubleSide,
        depthWrite: false
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    material.uniforms.uAlphaMap.value = alphaMap ?? getRingFallbackTexture();
    material.uniforms.uHasAlpha.value = alphaMap ? 1.0 : 0.0;
    material.uniforms.uHasTexColor.value = textureUrl ? 1.0 : 0.0;
    (material.uniforms.uColor.value as Color).set(color);
    material.uniforms.uOpacity.value = opacity;
  }, [alphaMap, color, material, opacity, textureUrl]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={renderOrder}
    />
  );
}
