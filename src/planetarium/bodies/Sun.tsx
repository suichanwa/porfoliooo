import { useMemo, useRef, type Ref } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
  SphereGeometry
} from "three";
import { usePlanetTexture } from "../hooks/usePlanetTexture";
import { PLANET_TEXTURES } from "../data/textures";

const SUN_RADIUS = 2.6;

interface SunProps {
  meshRef?: Ref<Mesh>;
  onClick?: () => void;
}

export default function Sun({ meshRef, onClick }: SunProps) {
  const texture = usePlanetTexture(PLANET_TEXTURES.sun, "#f6c453");
  const groupRef = useRef<Group>(null);
  const coreMeshRef = useRef<Mesh>(null);
  const coronaMeshRef = useRef<Mesh>(null);
  const { camera } = useThree();

  const coreGeometry = useMemo(() => new SphereGeometry(SUN_RADIUS, 64, 48), []);

  const coreMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        map: texture,
        color: new Color("#fffaf0")
      }),
    [texture]
  );

  // Realistic Astronomical Solar Corona (Seamless Gaussian / Exponential Atmospheric Glow)
  const coronaMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColorCore: { value: new Color("#fff6e6") },
          uColorMid: { value: new Color("#ffaa2b") },
          uColorOuter: { value: new Color("#d94800") }
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColorCore;
          uniform vec3 uColorMid;
          uniform vec3 uColorOuter;
          varying vec2 vUv;

          void main() {
            vec2 center = vUv - vec2(0.5);
            float dist = length(center) * 2.0; // 0.0 at center, 1.0 at edge
            if (dist > 1.0) discard;

            // Sun photosphere edge relative to the billboard quad
            float sunLimb = 0.32; 

            float alpha = 0.0;
            vec3 color = uColorCore;

            if (dist < sunLimb) {
              // Inside sun core: pure glowing incandescent light
              alpha = 1.0;
              color = mix(uColorCore, uColorMid, smoothstep(sunLimb * 0.6, sunLimb, dist));
            } else {
              // Outside sun limb: authentic exponential solar corona falloff
              float t = (dist - sunLimb) / (1.0 - sunLimb);
              
              // Multi-layer smooth astronomical atmosphere falloff
              float innerCorona = exp(-t * 8.0) * 0.9;
              float outerHaze = exp(-t * 2.5) * 0.35;
              float extendedHalo = pow(1.0 - t, 4.0) * 0.15;
              
              alpha = innerCorona + outerHaze + extendedHalo;

              // Smooth gradient from golden-white to warm amber, fading to deep space
              color = mix(uColorMid, uColorOuter, smoothstep(0.0, 0.65, t));
            }

            // Extremely subtle solar dynamism
            float subtleBreath = 1.0 + 0.015 * sin(uTime * 0.8 + dist * 4.0);
            alpha *= subtleBreath;

            gl_FragColor = vec4(color, clamp(alpha * 0.85, 0.0, 1.0));
          }
        `,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false
      }),
    []
  );

  useFrame((state, delta) => {
    if (coreMeshRef.current) {
      coreMeshRef.current.rotation.y += delta * 0.015;
    }

    if (coronaMeshRef.current) {
      coronaMeshRef.current.quaternion.copy(camera.quaternion);
      if (coronaMaterial.uniforms) {
        coronaMaterial.uniforms.uTime.value = state.clock.elapsedTime;
      }
    }
  });

  const coronaQuadSize = SUN_RADIUS * 6.25;

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* 3D Sun Core Sphere */}
      <mesh
        ref={(node) => {
          coreMeshRef.current = node;
          if (typeof meshRef === "function") meshRef(node);
          else if (meshRef) (meshRef as any).current = node;
        }}
        geometry={coreGeometry}
        material={coreMaterial}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
      />

      {/* Camera-Facing Astronomical Solar Corona Halo */}
      <mesh ref={coronaMeshRef} raycast={() => null}>
        <planeGeometry args={[coronaQuadSize, coronaQuadSize]} />
        <primitive object={coronaMaterial} attach="material" />
      </mesh>
    </group>
  );
}
