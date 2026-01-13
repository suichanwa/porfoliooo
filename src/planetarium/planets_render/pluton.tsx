import { useMemo, useRef, type Ref } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  CanvasTexture,
  DataTexture,
  Group,
  LinearFilter,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  RepeatWrapping,
  RGBAFormat,
  SphereGeometry,
  SRGBColorSpace,
  Vector3
} from "three";
import type { PlanetData } from "../data/types";
import { scalePlanetRadius } from "../utils/scale";

interface PlutonProps {
  data: PlanetData;
  position: Vector3;
  atmosphere?: boolean;
  timeScale?: number;
  groupRef?: Ref<Group>;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}

const createFallbackTexture = (hex: string) => {
  const data = new Uint8Array([
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    255
  ]);
  const texture = new DataTexture(data, 1, 1, RGBAFormat);
  texture.needsUpdate = true;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  return texture;
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

const drawEllipse = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rotation: number,
  color: string | CanvasGradient,
  alpha = 1
) => {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const applyNoise = (
  ctx: CanvasRenderingContext2D,
  rng: () => number,
  width: number,
  height: number,
  count: number,
  palette: Array<[number, number, number]>,
  minSize: number,
  maxSize: number,
  minAlpha: number,
  maxAlpha: number
) => {
  for (let i = 0; i < count; i += 1) {
    const [r, g, b] = palette[Math.floor(rng() * palette.length)];
    const size = minSize + rng() * (maxSize - minSize);
    const alpha = minAlpha + rng() * (maxAlpha - minAlpha);
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(rng() * width, rng() * height, size, 0, Math.PI * 2);
    ctx.fill();
  }
};

const createPlutoTexture = (seed = 1337) => {
  if (typeof document === "undefined") {
    return createFallbackTexture("#b79c7a");
  }

  const width = 512;
  const height = 256;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return createFallbackTexture("#b79c7a");
  }

  const rng = mulberry32(seed);

  const baseGradient = ctx.createLinearGradient(0, 0, 0, height);
  baseGradient.addColorStop(0, "#d7c3a3");
  baseGradient.addColorStop(0.5, "#c2a07d");
  baseGradient.addColorStop(1, "#8a6649");
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, width, height);

  drawEllipse(ctx, width * 0.26, height * 0.78, width * 0.27, height * 0.18, -0.3, "#5c3c26", 0.75);
  drawEllipse(ctx, width * 0.78, height * 0.18, width * 0.22, height * 0.14, 0.25, "#7c563c", 0.55);
  drawEllipse(ctx, width * 0.12, height * 0.28, width * 0.18, height * 0.12, -0.15, "#947156", 0.45);

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const heartGradient = ctx.createRadialGradient(
    width * 0.58,
    height * 0.6,
    width * 0.02,
    width * 0.58,
    height * 0.6,
    width * 0.32
  );
  heartGradient.addColorStop(0, "rgba(255, 241, 219, 0.95)");
  heartGradient.addColorStop(1, "rgba(224, 196, 161, 0.55)");
  drawEllipse(
    ctx,
    width * 0.58,
    height * 0.6,
    width * 0.22,
    height * 0.18,
    0.05,
    heartGradient,
    0.95
  );
  drawEllipse(
    ctx,
    width * 0.46,
    height * 0.48,
    width * 0.16,
    height * 0.12,
    -0.15,
    heartGradient,
    0.9
  );
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  drawEllipse(ctx, width * 0.58, height * 0.6, width * 0.24, height * 0.2, 0.05, "#b08e6c", 0.35);
  ctx.restore();

  applyNoise(
    ctx,
    rng,
    width,
    height,
    12000,
    [
      [222, 200, 171],
      [197, 164, 132],
      [160, 126, 96],
      [130, 98, 72]
    ],
    0.4,
    1.8,
    0.05,
    0.18
  );

  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  applyNoise(
    ctx,
    rng,
    width,
    height,
    2500,
    [
      [90, 65, 47],
      [110, 82, 60]
    ],
    0.6,
    2.2,
    0.08,
    0.16
  );
  ctx.restore();

  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.colorSpace = SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
};

export default function Pluton({
  data,
  position,
  timeScale = 40,
  groupRef,
  onPointerOver,
  onPointerOut,
  onClick
}: PlutonProps) {
  const meshRef = useRef<Mesh>(null);
  const texture = useMemo(() => createPlutoTexture(1337), []);
  const radius = useMemo(() => scalePlanetRadius(data.radiusKm), [data.radiusKm]);
  const tilt = MathUtils.degToRad(data.axialTiltDeg);
  const geometry = useMemo(() => new SphereGeometry(radius, 48, 32), [radius]);

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        map: texture,
        roughness: 0.95,
        metalness: 0
      }),
    [texture]
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const rotationRate =
      (2 * Math.PI) / (data.rotationPeriodHours * 3600);
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
    </group>
  );
}
