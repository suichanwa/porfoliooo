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
  SRGBColorSpace
} from "three";
import type { Texture } from "three";
import { useTextureAsset } from "../../../planetarium/hooks/usePlanetTexture";
import type { LightingMode } from "../../../planetarium/lighting/solarLighting";

interface RingBandProps {
  innerRadius: number;
  outerRadius: number;
  planetRadius: number;
  textureUrl?: string | null;
  color?: string;
  opacity?: number;
  patternSeed?: number;
  bandDensity?: number;
  renderOrder?: number;
  lightingMode?: LightingMode;
}

const DEFAULT_RING_COLOR = "#d4c5a6";
const DEFAULT_OPACITY = 0.65;
const SEGMENTS = 192;
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

let fallbackWhiteTex: DataTexture | null = null;
const getFallbackAlphaTexture = () => {
  if (fallbackWhiteTex) return fallbackWhiteTex;
  const data = new Uint8Array([255, 255, 255, 255]);
  const texture = new DataTexture(data, 1, 1, RGBAFormat);
  texture.needsUpdate = true;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.colorSpace = NoColorSpace;
  fallbackWhiteTex = texture;
  return texture;
};

const createProceduralAlphaTexture = (seed: number, bandDensity: number) => {
  const density = clamp(bandDensity, 0.2, 0.9);
  const cacheKey = `${seed}:${density.toFixed(2)}`;
  const cached = proceduralCache.get(cacheKey);
  if (cached) return cached;

  if (typeof document === "undefined") {
    const fallback = getFallbackAlphaTexture();
    proceduralCache.set(cacheKey, fallback);
    return fallback;
  }

  const width = 512;
  const height = 64;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    const fallback = getFallbackAlphaTexture();
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

  // Bands run along U axis — geometry maps U to radial position
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

const RING_SHADOW_AMBIENT: Record<LightingMode, number> = {
  cinematic: 0.075,
  natural: 0.025,
  inspect: 0.22
};

export default function RingBand({
  innerRadius,
  outerRadius,
  planetRadius,
  textureUrl,
  color = DEFAULT_RING_COLOR,
  opacity = DEFAULT_OPACITY,
  patternSeed = 7,
  bandDensity = 0.6,
  renderOrder,
  lightingMode = "cinematic"
}: RingBandProps) {
  const loadedTexture = useTextureAsset(textureUrl ?? null, {
    colorSpace: SRGBColorSpace
  });
  const proceduralAlpha = useMemo(() => {
    if (textureUrl) return null;
    return createProceduralAlphaTexture(patternSeed, bandDensity);
  }, [bandDensity, patternSeed, textureUrl]);
  const ringMap = (textureUrl ? loadedTexture : proceduralAlpha) ?? getFallbackAlphaTexture();

  const geometry = useMemo(() => {
    const geom = new RingGeometry(innerRadius, outerRadius, SEGMENTS, 1);
    // Remap planar UVs so U = radial fraction (inner edge = 0, outer edge = 1).
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
          uMap: { value: getFallbackAlphaTexture() },
          uHasRgba: { value: 0 },
          uColor: { value: new Color(DEFAULT_RING_COLOR) },
          uOpacity: { value: DEFAULT_OPACITY },
          uPlanetRadius: { value: 1.0 },
          uShadowAmbient: { value: 0.075 }
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vWorldPos;
          varying vec3 vPlanetCenter;

          void main() {
            vUv = uv;
            vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            vPlanetCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          uniform float uHasRgba;
          uniform vec3 uColor;
          uniform float uOpacity;
          uniform float uPlanetRadius;
          uniform float uShadowAmbient;

          varying vec2 vUv;
          varying vec3 vWorldPos;
          varying vec3 vPlanetCenter;

          void main() {
            vec4 tex = texture2D(uMap, vUv);
            float alphaSample = uHasRgba > 0.5 ? tex.a : tex.g;
            float finalAlpha = alphaSample * uOpacity;
            if (finalAlpha < 0.025) discard;

            vec3 sunDir = normalize(-vWorldPos);
            vec3 viewDir = normalize(cameraPosition - vWorldPos);

            // Exact curved planetary shadow cast by parent planet across night half of rings
            vec3 toPlanet = vPlanetCenter - vWorldPos;
            float proj = dot(toPlanet, sunDir);
            float sunVis = 1.0;
            if (proj > 0.0) {
              float perp = length(toPlanet - sunDir * proj);
              float ratio = perp / max(uPlanetRadius, 0.0001);
              sunVis = smoothstep(0.955, 1.045, ratio);
            }

            // Ice grain anisotropic phase scattering (backscatter & forward glow)
            float cosPhase = dot(sunDir, viewDir);
            float icePhase = 0.86 + 0.30 * pow(abs(cosPhase), 2.2);

            vec3 bandTint = mix(uColor, uColor * (0.62 + 0.58 * tex.rgb), uHasRgba);
            vec3 nightTint = mix(vec3(0.05, 0.08, 0.14), bandTint * 0.25, 0.5);
            vec3 litColor = bandTint * icePhase * 1.18;

            // Subtle amber refraction along penumbra transition edge
            float penumbraRim = sunVis * (1.0 - sunVis) * 4.0;
            vec3 finalColor = mix(nightTint * max(uShadowAmbient * 6.0, 0.2), litColor, sunVis);
            finalColor += vec3(0.85, 0.38, 0.12) * penumbraRim * 0.18;

            gl_FragColor = vec4(finalColor * mix(uShadowAmbient * 3.0 + 0.25, 1.0, sunVis), finalAlpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        transparent: true,
        side: DoubleSide,
        depthWrite: false
      }),
    []
  );

  useEffect(() => {
    material.uniforms.uMap.value = ringMap;
    material.uniforms.uHasRgba.value = textureUrl && loadedTexture ? 1 : 0;
    material.uniforms.uColor.value.set(color);
    material.uniforms.uOpacity.value = opacity;
    material.uniforms.uPlanetRadius.value = planetRadius;
    material.uniforms.uShadowAmbient.value = RING_SHADOW_AMBIENT[lightingMode];
  }, [
    color,
    lightingMode,
    loadedTexture,
    material,
    opacity,
    planetRadius,
    ringMap,
    textureUrl
  ]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={renderOrder}
    />
  );
}
