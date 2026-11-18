import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  MathUtils,
  Object3D,
  Points,
  ShaderMaterial
} from "three";
import { MOONS } from "../data/moons";
import { PLANET_BY_ID } from "../data/planetRegistry";
import type { BodyData, BodyId } from "../data/types";
import { scalePlanetRadius } from "../utils/scale";

interface MoonGlintsProps {
  planetRefs: React.MutableRefObject<Record<BodyId, Object3D | null>>;
  moonSystemVisRef: React.MutableRefObject<Record<string, number>>;
  selectedId: BodyId | null;
  onSelect: (id: BodyId | null) => void;
  prefersReducedMotion?: boolean;
}

interface GlintEntry {
  moon: BodyData;
  parentId: BodyId;
  farStart: number;
  nearFull: number;
  baseSize: number;
  tint: Color;
  seed: number;
}

const VERTEX_SHADER = /* glsl */ `
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aSize;
  attribute float aSeed;

  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vSeed;

  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vSeed = aSeed;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    if (aAlpha <= 0.004 || mvPosition.z >= -0.01) {
      gl_PointSize = 0.0;
      return;
    }

    float dist = max(1.2, -mvPosition.z);
    float projected = aSize * uPixelRatio * (22.0 / dist);
    gl_PointSize = clamp(projected, 26.0 * uPixelRatio, 108.0 * uPixelRatio);
  }
`;

const FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uShimmerAmp;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vSeed;

  // Dual-layer anti-aliased diffraction spike (colored glow sheath + razor-sharp needle)
  float spikeAlong(vec2 p, vec2 dir, float lengthDecay) {
    float par = abs(dot(p, dir));
    float perp = abs(p.x * (-dir.y) + p.y * dir.x);
    float needle = exp(-perp * 36.0) * exp(-par * lengthDecay);
    float sheath = exp(-perp * 15.5) * exp(-par * (lengthDecay * 1.25)) * 0.48;
    return needle + sheath;
  }

  void main() {
    if (vAlpha <= 0.004) discard;

    vec2 p = (gl_PointCoord - 0.5) * 2.0;
    float r = length(p);
    if (r > 1.0) discard;

    // Smooth radial fadeout at sprite boundary so square edges never appear
    float edgeMask = smoothstep(1.0, 0.58, r);

    // 1. Hot pinpoint astronomical star nucleus
    float core = exp(-r * r * 115.0);

    // 2. Luminous JWST sapphire/tinted inner & outer corona
    float innerHalo = exp(-r * 6.2) * 0.65;
    float outerHalo = exp(-r * 2.75) * 0.24 * edgeMask;

    // 3. Signature JWST 6-point hexagonal diffraction spikes + faint horizontal strut
    float s1 = spikeAlong(p, vec2(0.1392, 0.9903), 1.95);
    float s2 = spikeAlong(p, vec2(0.9272, 0.3746), 2.15);
    float s3 = spikeAlong(p, vec2(-0.7880, 0.6157), 2.15);
    float sHoriz = spikeAlong(p, vec2(0.9903, -0.1392), 3.4);

    float spikes = ((s1 + s2 + s3) * 0.52 + sHoriz * 0.16) * edgeMask;

    float shimmer = 1.0 + uShimmerAmp * sin(uTime * 2.1 + vSeed * 6.283185);

    vec3 color =
      vColor * (innerHalo * 1.15 + outerHalo * 1.35 + spikes * 1.35) +
      vec3(0.96, 0.99, 1.0) * (core * 1.45 + innerHalo * 0.4 + spikes * 0.42 * exp(-r * 2.4));

    color *= vAlpha * shimmer;
    float alpha = clamp((core * 1.3 + innerHalo + outerHalo + spikes) * vAlpha * shimmer, 0.0, 1.0);
    if (alpha <= 0.002) discard;

    gl_FragColor = vec4(color, alpha);
  }
`;

// Match orbitMath.ts outer moon shell so distance reveal scales consistently per system
function estimateMaxMoonOrbitRadius(parentId: BodyId): number {
  const parent = PLANET_BY_ID[parentId];
  if (!parent) return 1.5;
  const Rp = scalePlanetRadius(parent.render.radiusKm);
  let rRingOuter = 0;
  if (parent.rings) {
    const rings = Array.isArray(parent.rings) ? parent.rings : [parent.rings];
    const maxOuterKm = Math.max(...rings.map((r) => r.outerRadiusKm));
    rRingOuter = Rp * (maxOuterKm / parent.render.radiusKm);
  }
  const rMin = parentId === "earth" ? 0.95 : Math.max(Rp * 1.65, rRingOuter * 1.2);
  const siblings = MOONS.filter((m) => m.parentId === parentId).length;
  let deltaShell = 0;
  if (siblings === 2) deltaShell = 0.55;
  else if (siblings === 4) deltaShell = 1.05;
  else if (siblings > 1) deltaShell = 0.55 + (siblings - 2) * 0.25;
  return rMin + deltaShell;
}

export default function MoonGlints({
  planetRefs,
  moonSystemVisRef,
  selectedId,
  onSelect,
  prefersReducedMotion = false
}: MoonGlintsProps) {
  const { camera, gl } = useThree();
  const pointsRef = useRef<Points>(null);
  const hoveredIndexRef = useRef<number | null>(null);

  const entries = useMemo<GlintEntry[]>(() => {
    const jwstSapphire = new Color("#5b9bff");
    const jwstIceBlue = new Color("#93c5fd");

    // Exclude Charon because Pluto-Charon is always rendered as a visible binary pair
    return MOONS.filter(
      (moon): moon is BodyData & { parentId: BodyId } =>
        Boolean(moon.parentId) && moon.id !== "charon"
    ).map((moon, idx) => {
      const parentId = moon.parentId;
      const maxOrbit = estimateMaxMoonOrbitRadius(parentId);
      const isIceGiantMoon = parentId === "uranus" || parentId === "neptune";

      // Distance thresholds tuned so wide solar-system overview stays uncluttered,
      // while approaching any planet smoothly reveals its orbiting moon glints.
      const farStart = MathUtils.clamp(
        maxOrbit * (isIceGiantMoon ? 12.2 : 11.2),
        14.5,
        35.0
      );
      const nearFull = MathUtils.clamp(maxOrbit * 3.8, 5.2, 12.0);

      // Blend each moon's authentic color with crisp JWST sapphire/ice-blue starlight
      const baseColor = new Color(moon.render.colorFallback ?? "#cbd5e1");
      const tint = isIceGiantMoon
        ? baseColor.clone().lerp(jwstSapphire, 0.78).lerp(jwstIceBlue, 0.16)
        : baseColor.clone().lerp(jwstIceBlue, 0.52);

      // Slightly larger glint for larger major moons (Titania/Oberon/Ganymede/Titan/Triton)
      const sizeWeight = MathUtils.clamp(
        Math.cbrt(moon.render.radiusKm / 600),
        0.88,
        1.35
      );

      return {
        moon,
        parentId,
        farStart,
        nearFull,
        baseSize: 34.0 * sizeWeight,
        tint,
        seed: (idx * 0.371 + 0.13) % 1.0
      };
    });
  }, []);

  const count = entries.length;
  const alphasRef = useRef<Float32Array>(new Float32Array(count));

  const geometry = useMemo(() => {
    const geom = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const alphas = new Float32Array(count);
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);

    entries.forEach((entry, i) => {
      colors[i * 3] = entry.tint.r;
      colors[i * 3 + 1] = entry.tint.g;
      colors[i * 3 + 2] = entry.tint.b;
      alphas[i] = 0;
      sizes[i] = entry.baseSize;
      seeds[i] = entry.seed;
    });

    geom.setAttribute("position", new BufferAttribute(positions, 3));
    geom.setAttribute("aColor", new BufferAttribute(colors, 3));
    geom.setAttribute("aAlpha", new BufferAttribute(alphas, 1));
    geom.setAttribute("aSize", new BufferAttribute(sizes, 1));
    geom.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    return geom;
  }, [count, entries]);

  const material = useMemo(() => {
    return new ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
        uShimmerAmp: { value: prefersReducedMotion ? 0.0 : 0.06 }
      },
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: AdditiveBlending
    });
  }, [gl, prefersReducedMotion]);

  useEffect(() => {
    material.uniforms.uShimmerAmp.value = prefersReducedMotion ? 0.0 : 0.06;
  }, [material, prefersReducedMotion]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
      document.body.style.cursor = "auto";
    };
  }, [geometry, material]);

  useFrame((state) => {
    const posAttr = geometry.getAttribute("position") as BufferAttribute;
    const alphaAttr = geometry.getAttribute("aAlpha") as BufferAttribute;
    const sizeAttr = geometry.getAttribute("aSize") as BufferAttribute;

    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 2);

    const camPos = camera.position;
    const posArray = posAttr.array as Float32Array;
    const alphaArray = alphaAttr.array as Float32Array;
    const sizeArray = sizeAttr.array as Float32Array;

    for (let i = 0; i < count; i += 1) {
      const entry = entries[i];
      const moonObj = planetRefs.current[entry.moon.id];
      const parentObj = planetRefs.current[entry.parentId];

      if (!moonObj || !parentObj) {
        alphaArray[i] = 0;
        alphasRef.current[i] = 0;
        continue;
      }

      // OrbitingPlanet keeps moonObj.position & parentObj.position synced in world space every frame
      const mx = moonObj.position.x;
      const my = moonObj.position.y;
      const mz = moonObj.position.z;
      posArray[i * 3] = mx;
      posArray[i * 3 + 1] = my;
      posArray[i * 3 + 2] = mz;

      const distToParent = camPos.distanceTo(parentObj.position);
      const distToMoon = camPos.distanceTo(moonObj.position);

      // 1. Proximity reveal: invisible from far solar-system overview, blooms in as you approach
      const proximityReveal =
        1.0 - MathUtils.smoothstep(distToParent, entry.nearFull, entry.farStart);

      // 2. Smooth handoff when parent system is selected & full 3D moons appear:
      //    Keep a subtle JWST beacon flare from medium planet-viewing distance,
      //    and fade cleanly to 0 when zooming close into the 3D moon mesh.
      const systemVis = moonSystemVisRef.current[entry.parentId] ?? 0;
      const isSelectedMoon = selectedId === entry.moon.id;
      const closeMeshFade = isSelectedMoon
        ? MathUtils.smoothstep(distToMoon, 1.15, 3.0)
        : MathUtils.smoothstep(distToMoon, 0.85, 2.35);

      const selectedSystemIntensity = 0.56 * closeMeshFade;
      const targetAlpha =
        proximityReveal * MathUtils.lerp(1.0, selectedSystemIntensity, systemVis);

      const isHovered = hoveredIndexRef.current === i && targetAlpha > 0.14;
      const finalAlpha = Math.min(1.0, targetAlpha * (isHovered ? 1.32 : 1.0));

      alphaArray[i] = finalAlpha;
      alphasRef.current[i] = finalAlpha;
      sizeArray[i] = entry.baseSize * (isHovered ? 1.24 : 1.0);
    }

    posAttr.needsUpdate = true;
    alphaAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });

  const findVisibleGlintIndex = (event: ThreeEvent<PointerEvent | MouseEvent>): number | null => {
    const idx = event.index;
    if (idx === undefined || idx < 0 || idx >= count) return null;
    if (alphasRef.current[idx] <= 0.14) return null;

    // Require tight ray proximity so glints never steal clicks from nearby planets
    const hitLimit = Math.min(0.45, Math.max(0.16, event.distance * 0.022));
    if (event.distanceToRay !== undefined && event.distanceToRay > hitLimit) {
      return null;
    }
    return idx;
  };

  return (
    <points
      ref={pointsRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={4}
      onPointerMove={(event) => {
        const idx = findVisibleGlintIndex(event);
        if (idx !== null) {
          event.stopPropagation();
          hoveredIndexRef.current = idx;
          document.body.style.cursor = "pointer";
        } else if (hoveredIndexRef.current !== null) {
          hoveredIndexRef.current = null;
          document.body.style.cursor = "auto";
        }
      }}
      onPointerOut={() => {
        if (hoveredIndexRef.current !== null) {
          hoveredIndexRef.current = null;
          document.body.style.cursor = "auto";
        }
      }}
      onClick={(event) => {
        const idx = findVisibleGlintIndex(event);
        if (idx !== null) {
          event.stopPropagation();
          onSelect(entries[idx].moon.id);
        }
      }}
    />
  );
}
