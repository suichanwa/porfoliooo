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
  gridSize = 320,
  divisions = 160,
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
      uStrength: { value: strength },
      uGridSize: { value: gridSize },
      uGridSpacing: { value: 6.0 },
      uLineColor: { value: new Color("#0284c7") }, // Soft slate cyan
      uWarpColor: { value: new Color("#6366f1") }, // Subtle indigo well accent
      uDebug: { value: debug ? 1 : 0 }
    }),
    [bodyPositions, bodyMasses, strength, gridSize, debug]
  );

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms,
        side: DoubleSide,
        transparent: true,
        depthWrite: false,
        vertexShader: `
          uniform int uBodyCount;
          uniform vec3 uBodies[${MAX_BODIES}];
          uniform float uMasses[${MAX_BODIES}];
          uniform float uStrength;
          varying vec3 vWorld;
          varying float vInfluence;

          void main() {
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float influence = 0.0;

            for (int i = 0; i < ${MAX_BODIES}; i++) {
              if (i >= uBodyCount) break;
              vec3 offset = worldPos - uBodies[i];
              float distSq = offset.x * offset.x + offset.z * offset.z;
              
              // Clean Lorentzian gravity curve
              float R2 = 16.0;
              float mass = uMasses[i] * 3.5;
              influence += mass / (1.0 + distSq / R2);
            }

            influence = min(influence, 5.0);
            
            // Subtle, smooth downward gravity funnel
            vec3 displaced = position + normal * (-influence * uStrength * 0.5);
            vWorld = (modelMatrix * vec4(displaced, 1.0)).xyz;
            vInfluence = influence;

            gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uGridSize;
          uniform float uGridSpacing;
          uniform vec3 uLineColor;
          uniform vec3 uWarpColor;
          uniform float uDebug;
          varying vec3 vWorld;
          varying float vInfluence;

          // Clean, thin procedural grid
          float drawGrid(vec2 coord, float width) {
            vec2 grid = abs(fract(coord - 0.5) - 0.5);
            vec2 line = step(0.5 - width, grid);
            return max(line.x, line.y);
          }

          void main() {
            vec2 coord = vWorld.xz / uGridSpacing;
            float line = drawGrid(coord, 0.03);

            // Soft radial edge dissolve towards horizon
            float distFromCenter = length(vWorld.xz) / (uGridSize * 0.5);
            float edgeFade = smoothstep(1.0, 0.2, distFromCenter);

            float warpIntensity = clamp(vInfluence / 4.0, 0.0, 1.0);
            vec3 color = mix(uLineColor, uWarpColor, warpIntensity * 0.7);

            if (uDebug > 0.5) {
              vec3 debugColor = mix(vec3(0.05, 0.2, 0.5), vec3(0.95, 0.3, 0.1), warpIntensity);
              color = mix(color, debugColor, 0.85);
            }

            // Minimalist, soft transparency
            float alpha = (line * 0.3 + warpIntensity * 0.2) * edgeFade;
            gl_FragColor = vec4(color, alpha);
          }
        `
      }),
    [uniforms]
  );

  useFrame(() => {
    const count = Math.min(bodies.length, MAX_BODIES);
    uniforms.uBodyCount.value = count;
    uniforms.uStrength.value = strength;
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
      position={[0, -0.1, 0]}
      renderOrder={-5}
      frustumCulled={false}
    />
  );
}
