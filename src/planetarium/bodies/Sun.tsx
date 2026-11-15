import { useEffect, useMemo, useRef, type Ref } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  DataTexture,
  Group,
  Mesh,
  RGBAFormat,
  ShaderMaterial,
  SphereGeometry,
  UnsignedByteType
} from "three";
import { usePlanetTexture } from "../hooks/usePlanetTexture";
import { PLANET_TEXTURES } from "../data/textures";

const SUN_RADIUS = 2.6;

let cachedWhiteTex: DataTexture | null = null;
function getWhiteTex(): DataTexture {
  if (cachedWhiteTex) return cachedWhiteTex;
  cachedWhiteTex = new DataTexture(
    new Uint8Array([255, 255, 255, 255]),
    1,
    1,
    RGBAFormat,
    UnsignedByteType
  );
  cachedWhiteTex.needsUpdate = true;
  return cachedWhiteTex;
}

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

  // Clean photographic solar photosphere with subtle limb darkening & luminous edge integration
  const coreMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uMap: { value: texture ?? getWhiteTex() },
          uHasMap: { value: texture ? 1.0 : 0.0 },
          uFallbackColor: { value: new Color("#f6c453") },
          uCoreTint: { value: new Color("#fff8e6") },
          uLimbTint: { value: new Color("#ff9824") }
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vNormalView;
          varying vec3 vViewPos;
          void main() {
            vUv = uv;
            vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
            vViewPos = -mvPos.xyz;
            vNormalView = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * mvPos;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform sampler2D uMap;
          uniform float uHasMap;
          uniform vec3 uFallbackColor;
          uniform vec3 uCoreTint;
          uniform vec3 uLimbTint;
          varying vec2 vUv;
          varying vec3 vNormalView;
          varying vec3 vViewPos;

          void main() {
            vec3 texCol = uHasMap > 0.5 ? texture2D(uMap, vUv).rgb : uFallbackColor;
            float ndotv = clamp(dot(normalize(vNormalView), normalize(vViewPos)), 0.0, 1.0);

            // Subtle limb darkening toward edge plus warm luminous chromosphere rim
            float limb = pow(ndotv, 0.34);
            float rimFlare = pow(1.0 - ndotv, 3.0);
            vec3 tint = mix(uLimbTint, uCoreTint, limb);

            vec3 col = texCol * tint * (0.90 + 0.24 * limb);
            col += uLimbTint * rimFlare * 0.42;

            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    coreMaterial.uniforms.uMap.value = texture ?? getWhiteTex();
    coreMaterial.uniforms.uHasMap.value = texture ? 1.0 : 0.0;
  }, [coreMaterial, texture]);

  // Ultra-smooth, gradual warm golden-orange corona glow (zero sharp rings or streaks)
  const coronaMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColorCore: { value: new Color("#ffeaad") },
          uColorMid: { value: new Color("#ff9c26") },
          uColorOuter: { value: new Color("#c74200") }
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          uniform vec3 uColorCore;
          uniform vec3 uColorMid;
          uniform vec3 uColorOuter;
          varying vec2 vUv;

          void main() {
            vec2 center = vUv - vec2(0.5);
            float dist = length(center) * 2.0; // 0.0 at center, 1.0 at outer boundary
            if (dist > 1.0) discard;

            // Continuous, seamless exponential radial fade + subtle inner skirt near limb (dist ~ 0.32)
            float edgeFade = 1.0 - smoothstep(0.68, 1.0, dist);
            float skirt = exp(-pow(max(0.0, dist - 0.31) * 9.0, 2.0)) * 0.24;
            float glow = (exp(-dist * 3.55) + skirt) * edgeFade;

            vec3 color = mix(uColorCore, uColorMid, smoothstep(0.08, 0.46, dist));
            color = mix(color, uColorOuter, smoothstep(0.42, 0.90, dist));

            float breath = 1.0 + 0.01 * sin(uTime * 0.75 + dist * 2.8);
            float alpha = clamp(glow * 0.84 * breath, 0.0, 1.0);

            gl_FragColor = vec4(color, alpha);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
        blending: AdditiveBlending,
        transparent: true,
        depthWrite: false
      }),
    []
  );

  useEffect(() => {
    return () => {
      coreGeometry.dispose();
      coreMaterial.dispose();
      coronaMaterial.dispose();
    };
  }, [coreGeometry, coreMaterial, coronaMaterial]);

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
