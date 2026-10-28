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

  // Clean, standard unlit texture material for the 3D Sun sphere
  const coreMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        map: texture ?? null,
        color: new Color("#fffaf0")
      }),
    [texture]
  );

  // Ultra-smooth, gradual warm golden-orange corona glow (zero sharp rings or white edges)
  const coronaMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColorCore: { value: new Color("#ffe29a") }, // Soft warm golden-white
          uColorMid: { value: new Color("#ff9c26") },  // Radiant warm golden-orange
          uColorOuter: { value: new Color("#cc4400") } // Deep warm amber
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
            float dist = length(center) * 2.0; // 0.0 at center, 1.0 at outer boundary
            if (dist > 1.0) discard;

            // Continuous, seamless exponential radial fade
            float edgeFade = 1.0 - smoothstep(0.70, 1.0, dist);
            float glow = exp(-dist * 3.4) * edgeFade;

            // Warm, gradual color gradient
            vec3 color = mix(uColorCore, uColorMid, smoothstep(0.0, 0.45, dist));
            color = mix(color, uColorOuter, smoothstep(0.40, 0.90, dist));

            // Subtle, gentle organic solar breathing
            float breath = 1.0 + 0.012 * sin(uTime * 0.8 + dist * 3.0);
            float alpha = clamp(glow * 0.82 * breath, 0.0, 1.0);

            gl_FragColor = vec4(color, alpha);
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
      {/* 3D Sun Photosphere Sphere */}
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

      {/* Camera-Facing Ultra-Smooth Radial Corona Glow */}
      <mesh ref={coronaMeshRef} raycast={() => null}>
        <planeGeometry args={[coronaQuadSize, coronaQuadSize]} />
        <primitive object={coronaMaterial} attach="material" />
      </mesh>
    </group>
  );
}
