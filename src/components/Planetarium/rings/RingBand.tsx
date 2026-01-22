import { useMemo } from "react";
import {
  CanvasTexture,
  Color,
  DataTexture,
  DoubleSide,
  LinearFilter,
  MeshStandardMaterial,
  NoColorSpace,
  RGBAFormat,
  RingGeometry
} from "three";
import type { Texture } from "three";
import { useTextureAsset } from "../../../planetarium/hooks/usePlanetTexture";

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

  let bandIndex = 0;
  for (let y = 0; y < height; y += 1) {
    const t = y / (height - 1);
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
    ctx.fillRect(0, y, width, 1);
  }

  const texture = new CanvasTexture(canvas);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.colorSpace = NoColorSpace;
  texture.needsUpdate = true;
  proceduralCache.set(cacheKey, texture);
  return texture;
};

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
    geom.rotateX(Math.PI / 2);
    return geom;
  }, [innerRadius, outerRadius]);

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        color,
        transparent: true,
        opacity,
        alphaMap: alphaMap ?? null,
        alphaTest: 0.05,
        side: DoubleSide,
        roughness: 0.9,
        metalness: 0,
        emissive: new Color(color),
        emissiveIntensity: 0.08,
        depthWrite: false
      }),
    [alphaMap, color, opacity]
  );

  return (
    <mesh
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={renderOrder}
    />
  );
}
