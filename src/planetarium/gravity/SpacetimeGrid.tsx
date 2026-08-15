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
  const bodyBottomDepths = useMemo(() => new Float32Array(MAX_BODIES), []);
  const bodyContactRadii = useMemo(() => new Float32Array(MAX_BODIES), []);
  const bodyFunnelReaches = useMemo(() => new Float32Array(MAX_BODIES), []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBodyCount: { value: 0 },
      uBodies: { value: bodyPositions },
      uMasses: { value: bodyMasses },
      uBottomDepths: { value: bodyBottomDepths },
      uContactRadii: { value: bodyContactRadii },
      uFunnelReaches: { value: bodyFunnelReaches },
      uStrength: { value: strength },
      uGridSize: { value: gridSize },
      uGridSpacing: { value: 6.0 },
      uLineColor: { value: new Color("#0284c7") },
      uWarpColor: { value: new Color("#7c3aed") },
      uDebug: { value: debug ? 1 : 0 }
    }),
    [
      bodyPositions,
      bodyMasses,
      bodyBottomDepths,
      bodyContactRadii,
      bodyFunnelReaches,
      strength,
      gridSize,
      debug
    ]
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
        uniform float uBottomDepths[${MAX_BODIES}];
        uniform float uContactRadii[${MAX_BODIES}];
        uniform float uFunnelReaches[${MAX_BODIES}];
        uniform float uStrength;
        varying vec3 vWorld;
        varying vec3 vWorldNormal;
        varying float vInfluence;
        varying float vDepth;

        void main() {
          vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
          float totalDepth = 0.0;
          float totalInfluence = 0.0;
          vec2 grad = vec2(0.0);

          for (int i = 0; i < ${MAX_BODIES}; i++) {
            if (i >= uBodyCount) break;
            vec3 offset = worldPos - uBodies[i];
            float dist = length(offset.xz);
            
            float Rc = max(0.1, uContactRadii[i]);
            float Db = max(Rc + 0.15, uBottomDepths[i] * max(0.8, uStrength * 1.5));
            float Rf = max(Rc * 2.0, uFunnelReaches[i]);
            
            float bodyDepth = 0.0;
            vec2 dGrad = vec2(0.0);
            
            if (dist < Rc) {
              // Direct spherical contact curvature wrapping under bottom of celestial sphere
              float sphereBottom = sqrt(max(0.0, Rc * Rc - dist * dist));
              bodyDepth = (Db - Rc) + sphereBottom;
              
              if (sphereBottom > 0.005) {
                dGrad = (offset.xz / sphereBottom);
              }
            } else {
              // Elastic membrane stretching smoothly upward from equator contact circle to space
              float distOutside = dist - Rc;
              float reachOutside = max(0.4, Rf - Rc);
              float t = distOutside / reachOutside;
              float decay = 1.0 / (1.0 + pow(t * 2.2, 1.8));
              bodyDepth = (Db - Rc) * decay;
              
              if (dist > 0.005) {
                float dDecay = -1.8 * (2.2 / reachOutside) * pow(t * 2.2, 0.8) / pow(1.0 + pow(t * 2.2, 1.8), 2.0);
                dGrad = (offset.xz / dist) * (-(Db - Rc) * dDecay);
              }
            }
            
            totalDepth += bodyDepth;
            grad += dGrad;
            totalInfluence += (Db / (1.0 + dist * dist / (Rc * Rc * 2.5)));
          }

          vec3 displaced = position + normal * (-totalDepth);
          vWorld = (modelMatrix * vec4(displaced, 1.0)).xyz;
          
          vec3 N = normalize(vec3(-grad.x * 0.35, 1.0, -grad.y * 0.35));
          vWorldNormal = (modelMatrix * vec4(N, 0.0)).xyz;

          vInfluence = min(totalInfluence, 8.0);
          vDepth = totalDepth;

          gl_Position = projectionMatrix * viewMatrix * vec4(vWorld, 1.0);
        }
      `,
      fragmentShader: `
        const float PI = 3.141592653589793;
        const int MAX_BODIES = ${MAX_BODIES};
        uniform float uTime;
        uniform int uBodyCount;
        uniform vec3 uBodies[MAX_BODIES];
        uniform float uMasses[MAX_BODIES];
        uniform float uGridSize;
        uniform vec3 uLineColor;
        uniform vec3 uWarpColor;
        uniform float uDebug;
        varying vec3 vWorld;
        varying vec3 vWorldNormal;
        varying float vInfluence;
        varying float vDepth;

        void main() {
          // 1. Global Polar Coordinates from Sun at origin
          float r = length(vWorld.xz);
          float theta = atan(vWorld.z, vWorld.x);

          // Radial Geodesic Spokes radiating outward from Sun
          float numSpokes = 64.0;
          float spokeFract = abs(fract((theta / (2.0 * PI)) * numSpokes + 0.5) - 0.5);
          float globalSpokes = smoothstep(0.045, 0.012, spokeFract) * smoothstep(3.0, 12.0, r);

          // 2. Subtle Gravitational Pulse Wave
          float pulse = sin(r * 0.35 - uTime * 0.6) * 0.5 + 0.5;

          // 3. Volumetric Curvature Lighting & Depth Glow
          vec3 viewDir = normalize(cameraPosition - vWorld);
          vec3 normal = normalize(vWorldNormal);
          float slope = 1.0 - abs(dot(normal, vec3(0.0, 1.0, 0.0)));
          float fresnel = pow(1.0 - max(0.0, dot(viewDir, normal)), 2.5) * slope;

          float warpFactor = clamp(vInfluence / 4.0, 0.0, 1.0);
          float wellGlow = pow(warpFactor, 1.2) * 0.45;

          // Horizon radial fade
          float distFromCenter = length(vWorld.xz) / (uGridSize * 0.48);
          float edgeFade = smoothstep(1.0, 0.12, distFromCenter);

          // Color Palette: Cyan geodesic spokes -> Luminous violet in wells
          vec3 baseWebColor = uLineColor;
          vec3 wellWebColor = mix(uLineColor, uWarpColor, warpFactor);

          vec3 finalColor = mix(baseWebColor, wellWebColor, warpFactor);
          finalColor += uWarpColor * fresnel * 0.85;
          finalColor += vec3(0.2, 0.6, 1.0) * pulse * 0.08 * globalSpokes;

          if (uDebug > 0.5) {
            vec3 debugColor = mix(vec3(0.05, 0.2, 0.6), vec3(0.98, 0.35, 0.1), warpFactor);
            finalColor = mix(finalColor, debugColor, 0.85);
          }

          // Composite Alpha
          float spokeAlpha = globalSpokes * 0.4;
          float totalAlpha = (spokeAlpha + wellGlow + fresnel * 0.35) * edgeFade;

          gl_FragColor = vec4(finalColor, clamp(totalAlpha, 0.0, 0.92));
        }
      `
      }),
    [uniforms]
  );

  useFrame((state) => {
    const count = Math.min(bodies.length, MAX_BODIES);
    uniforms.uTime.value = state.clock.elapsedTime;
    uniforms.uBodyCount.value = count;
    uniforms.uStrength.value = strength;
    uniforms.uDebug.value = debug ? 1 : 0;

    for (let i = 0; i < MAX_BODIES; i += 1) {
      if (i < count) {
        bodyPositions[i].copy(bodies[i].position);
        bodyMasses[i] = bodies[i].visualMass;
        const dims = bodies[i].bendingDimensions;
        bodyBottomDepths[i] = dims ? dims.bottomDepth : bodies[i].renderRadius * 1.25 + 0.3;
        bodyContactRadii[i] = dims ? dims.contactRadius : bodies[i].renderRadius;
        bodyFunnelReaches[i] = dims ? dims.funnelReach : bodies[i].renderRadius * 3.5 + 1.0;
      } else {
        bodyPositions[i].set(0, 0, 0);
        bodyMasses[i] = 0;
        bodyBottomDepths[i] = 0;
        bodyContactRadii[i] = 0;
        bodyFunnelReaches[i] = 0;
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
