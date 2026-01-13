import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Color,
  DoubleSide,
  PlaneGeometry,
  ShaderMaterial,
  Vector3
} from "three";
import type { GravityBody } from "./gravityField";

const MAX_BODIES = 12;

interface SpacetimeGridProps {
  bodies: GravityBody[];
  gridSize?: number;
  divisions?: number;
  strength: number;
  softening: number;
  maxInfluence: number;
  debug?: boolean;
}

export default function SpacetimeGrid({
  bodies,
  gridSize = 260,
  divisions = 180,
  strength,
  softening,
  maxInfluence,
  debug = false
}: SpacetimeGridProps) {
  const geometry = useMemo(
    () => new PlaneGeometry(gridSize, gridSize, divisions, divisions),
    [gridSize, divisions]
  );

  const bodyPositions = useMemo(
    () => Array.from({ length: MAX_BODIES }, () => new Vector3()),
    []
  );
  const bodyMasses = useMemo(() => new Float32Array(MAX_BODIES), []);

  const uniforms = useMemo(
    () => ({
      uBodyCount: { value: 0 },
      uBodies: { value: bodyPositions },
      uMasses: { value: bodyMasses },
      uSoftening: { value: softening },
      uStrength: { value: strength },
      uMaxInfluence: { value: maxInfluence },
      uGridSize: { value: gridSize },
      uGridSpacing: { value: 10 },
      uBaseColor: { value: new Color("#05080f") },
      uLineColor: { value: new Color("#1c2a3a") },
      uDebug: { value: debug ? 1 : 0 }
    }),
    [bodyPositions, bodyMasses, softening, strength, maxInfluence, gridSize, debug]
  );

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms,
        side: DoubleSide,
        transparent: true,
        depthWrite: false,
        extensions: { derivatives: true },
        vertexShader: `
          uniform int uBodyCount;
          uniform vec3 uBodies[${MAX_BODIES}];
          uniform float uMasses[${MAX_BODIES}];
          uniform float uSoftening;
          uniform float uStrength;
          uniform float uMaxInfluence;
          varying vec3 vWorld;
          varying float vInfluence;
          void main() {
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float influence = 0.0;
            for (int i = 0; i < ${MAX_BODIES}; i++) {
              if (i >= uBodyCount) break;
              vec3 offset = worldPos - uBodies[i];
              float distSq = dot(offset, offset);
              influence += uMasses[i] / (distSq + uSoftening * uSoftening);
            }
            influence = min(influence, uMaxInfluence);
            vec3 displaced = position + normal * (-influence * uStrength);
            vWorld = (modelMatrix * vec4(displaced, 1.0)).xyz;
            vInfluence = influence;
            gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uGridSize;
          uniform float uGridSpacing;
          uniform vec3 uBaseColor;
          uniform vec3 uLineColor;
          uniform float uMaxInfluence;
          uniform float uDebug;
          varying vec3 vWorld;
          varying float vInfluence;
          float gridLine(vec2 coord) {
            vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
            float line = 1.0 - min(min(grid.x, grid.y), 1.0);
            return smoothstep(0.0, 1.0, line);
          }
          void main() {
            vec2 coord = vWorld.xz / uGridSpacing;
            float line = gridLine(coord);
            float radius = length(vWorld.xz) / (uGridSize * 0.5);
            float fade = smoothstep(1.0, 0.35, radius);
            vec3 color = mix(uBaseColor, uLineColor, line);
            color = mix(uBaseColor, color, fade);
            if (uDebug > 0.5) {
              float t = clamp(vInfluence / max(uMaxInfluence, 0.0001), 0.0, 1.0);
              vec3 debugColor = mix(vec3(0.05, 0.15, 0.3), vec3(0.9, 0.3, 0.1), t);
              color = mix(color, debugColor, 0.85);
            }
            gl_FragColor = vec4(color, 0.75 * fade);
          }
        `
      }),
    [uniforms]
  );

  useFrame(() => {
    const count = Math.min(bodies.length, MAX_BODIES);
    uniforms.uBodyCount.value = count;
    uniforms.uSoftening.value = softening;
    uniforms.uStrength.value = strength;
    uniforms.uMaxInfluence.value = maxInfluence;
    uniforms.uDebug.value = debug ? 1 : 0;

    for (let i = 0; i < MAX_BODIES; i += 1) {
      if (i < count) {
        bodyPositions[i].copy(bodies[i].position);
        bodyMasses[i] = bodies[i].visualMass;
      } else {
        bodyPositions[i].set(0, 0, 0);
        bodyMasses[i] = 0;
      }
    }
  });

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -6, 0]}
      renderOrder={-5}
      frustumCulled={false}
    />
  );
}
