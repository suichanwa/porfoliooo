import { useEffect, useMemo, useRef, type Ref } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  Group,
  Mesh,
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

  // Living Incandescent Photosphere Shader with Convective UV Perturbation & Fresnel Limb Fusion
  const coreMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTexture: { value: texture ?? null },
          uTime: { value: 0 },
          uColorCore: { value: new Color("#fffdf2") }, // Incandescent white-yellow
          uColorMid: { value: new Color("#ff9d1a") },  // Rich convective golden-amber
          uColorLimb: { value: new Color("#fff5d6").multiplyScalar(1.35) } // Blinding white-gold rim
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          void main() {
            vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewDir = normalize(-mvPosition.xyz);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          uniform float uTime;
          uniform vec3 uColorCore;
          uniform vec3 uColorMid;
          uniform vec3 uColorLimb;
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vViewDir;

          // Efficient 2D Simplex Noise for dynamic solar plasma convection
          vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
          vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

          float snoise(vec2 v) {
            const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
            vec2 i  = floor(v + dot(v, C.yy) );
            vec2 x0 = v -   i + dot(i, C.xx);
            vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec4 x12 = x0.xyxy + C.xxzz;
            x12.xy -= i1;
            i = mod289(i);
            vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
            vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
            m = m*m; m = m*m;
            vec3 x = 2.0 * fract(p * C.www) - 1.0;
            vec3 h = abs(x) - 0.5;
            vec3 ox = floor(x + 0.5);
            vec3 a0 = x - ox;
            m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
            vec3 g;
            g.x  = a0.x  * x0.x  + h.x  * x0.y;
            g.yz = a0.yz * x12.xz + h.yz * x12.yw;
            return 130.0 * dot(m, g);
          }

          void main() {
            // Subtle, slow-moving 2D procedural noise perturbation for living plasma granules
            float slowTime = uTime * 0.15;
            vec2 p1 = vUv * 16.0 + vec2(slowTime * 0.25, -slowTime * 0.15);
            vec2 p2 = vUv * 28.0 - vec2(slowTime * 0.18, slowTime * 0.22);
            vec2 uvPerturb = vec2(snoise(p1), snoise(p2)) * 0.016;

            vec2 sampledUv = vUv + uvPerturb;
            vec4 texSample = texture2D(uTexture, sampledUv);
            vec3 texColor = texSample.rgb;

            // Luminance boosting & color grading
            float lum = dot(texColor, vec3(0.299, 0.587, 0.114));
            vec3 deepCells = uColorMid * (0.85 + 0.35 * lum);
            vec3 brightGranules = uColorCore * 1.18;
            vec3 gradedSurface = mix(deepCells, brightGranules, smoothstep(0.35, 0.82, lum));

            // Combine graded solar plasma with high-resolution texture details
            vec3 baseColor = mix(texColor * 1.35, gradedSurface, 0.68);

            // View-space Fresnel factor to fuse the edge into blinding white-gold
            float NdotV = max(dot(vNormal, vViewDir), 0.0);
            float fresnel = pow(1.0 - NdotV, 2.0);

            // Strongly mix the edge of the sphere toward blinding white-gold right at the silhouette rim
            vec3 finalColor = mix(baseColor, uColorLimb, fresnel * 0.95);

            // Organic solar pulsation term
            float pulse = 1.0 + 0.015 * sin(uTime * 1.4);

            gl_FragColor = vec4(finalColor * pulse, 1.0);
          }
        `
      }),
    [texture]
  );

  // Update texture uniform whenever texture loads
  useEffect(() => {
    if (coreMaterial.uniforms.uTexture) {
      coreMaterial.uniforms.uTexture.value = texture ?? null;
    }
  }, [coreMaterial, texture]);

  // Upgraded Camera-Facing Billboard Corona Shader with White-Hot Core & Coronal Streamers
  const coronaMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColorInner: { value: new Color("#fffcf0") }, // Pure incandescent white-gold
          uColorMid: { value: new Color("#ffae34") },   // Radiant golden amber
          uColorOuter: { value: new Color("#c83e00") }  // Deep solar crimson-orange
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
          uniform vec3 uColorInner;
          uniform vec3 uColorMid;
          uniform vec3 uColorOuter;
          varying vec2 vUv;

          void main() {
            vec2 center = vUv - vec2(0.5);
            float dist = length(center) * 2.0; // 0.0 at center, 1.0 at quad boundary
            if (dist > 1.0) discard;

            // Sun photosphere edge relative to the billboard quad
            float sunDiskRadius = 0.32; 

            // Polar angle for coronal rays
            float angle = atan(center.y, center.x);

            // Smooth multi-harmonic angular ray modulation rotating in opposite directions
            float rays = 0.85
              + 0.08 * sin(angle * 7.0 + uTime * 0.25) * cos(angle * 4.0 - uTime * 0.18)
              + 0.05 * sin(angle * 16.0 - uTime * 0.35)
              + 0.03 * cos(angle * 29.0 + uTime * 0.12);

            float alpha = 0.0;
            vec3 color = uColorInner;

            if (dist < sunDiskRadius) {
              // Inside sun core: pure glowing incandescent light
              alpha = 1.0;
              float innerRamp = smoothstep(0.0, sunDiskRadius, dist);
              color = mix(uColorInner, uColorMid, innerRamp * 0.4);
            } else {
              // Outside sun limb: seamless limb-locked bloom + ray falloff
              float t = (dist - sunDiskRadius) / (1.0 - sunDiskRadius);

              // Multi-layer astronomical coronal falloff
              // 1. Intense white-hot inner bloom right at the limb boundary
              float innerBloom = exp(-10.0 * t) * 1.15;

              // 2. Middle convective coronal streamers modulated by rays
              float midStreamers = exp(-3.2 * t * (2.0 - rays)) * 0.52 * rays;

              // 3. Extended ethereal faint halo
              float outerHalo = pow(max(0.0, 1.0 - t), 3.2) * 0.22 * (0.8 + 0.2 * rays);

              alpha = innerBloom + midStreamers + outerHalo;

              // Smooth gradient from incandescent white-gold through amber to crimson-orange
              color = mix(uColorInner, uColorMid, smoothstep(0.0, 0.22, t));
              color = mix(color, uColorOuter, smoothstep(0.20, 0.82, t));
            }

            // Extremely subtle organic solar breath
            float subtleBreath = 1.0 + 0.018 * sin(uTime * 0.85 + dist * 4.5);
            alpha *= subtleBreath;

            gl_FragColor = vec4(color, clamp(alpha * 0.90, 0.0, 1.0));
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
    if (coreMaterial.uniforms) {
      coreMaterial.uniforms.uTime.value = state.clock.elapsedTime;
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

      {/* Camera-Facing Astronomical Solar Corona Halo */}
      <mesh ref={coronaMeshRef} raycast={() => null}>
        <planeGeometry args={[coronaQuadSize, coronaQuadSize]} />
        <primitive object={coronaMaterial} attach="material" />
      </mesh>
    </group>
  );
}
