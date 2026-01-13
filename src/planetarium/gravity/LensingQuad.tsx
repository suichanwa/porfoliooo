import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Mesh, PlaneGeometry, ShaderMaterial, Vector2, Vector3 } from "three";
import type { Texture } from "three";
import type { GravityBody } from "./gravityField";

const MAX_BODIES = 12;

interface LensingQuadProps {
  texture: Texture;
  bodies: GravityBody[];
  strength: number;
  softening: number;
  maxInfluence: number;
  debug?: boolean;
}

export default function LensingQuad({
  texture,
  bodies,
  strength,
  softening,
  maxInfluence,
  debug = false
}: LensingQuadProps) {
  const meshRef = useRef<Mesh>(null);
  const { camera } = useThree();

  const bodyPositions = useMemo(
    () => Array.from({ length: MAX_BODIES }, () => new Vector2()),
    []
  );
  const bodyMasses = useMemo(() => new Float32Array(MAX_BODIES), []);
  const temp = useMemo(() => new Vector3(), []);
  const cameraDirection = useMemo(() => new Vector3(), []);

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uBodyCount: { value: 0 },
      uBodies: { value: bodyPositions },
      uMasses: { value: bodyMasses },
      uSoftening: { value: softening },
      uStrength: { value: strength },
      uMaxInfluence: { value: maxInfluence },
      uDebug: { value: debug ? 1 : 0 }
    }),
    [bodyPositions, bodyMasses, softening, strength, maxInfluence, debug, texture]
  );

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms,
        depthWrite: false,
        depthTest: false,
        transparent: true,
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D uTexture;
          uniform int uBodyCount;
          uniform vec2 uBodies[${MAX_BODIES}];
          uniform float uMasses[${MAX_BODIES}];
          uniform float uSoftening;
          uniform float uStrength;
          uniform float uMaxInfluence;
          uniform float uDebug;
          varying vec2 vUv;
          void main() {
            vec2 uv = vUv;
            vec2 offset = vec2(0.0);
            for (int i = 0; i < ${MAX_BODIES}; i++) {
              if (i >= uBodyCount) break;
              vec2 toBody = uv - uBodies[i];
              float distSq = dot(toBody, toBody) + uSoftening * uSoftening;
              float influence = min(uMasses[i] / distSq, uMaxInfluence);
              offset += normalize(toBody) * influence;
            }
            uv += offset * uStrength * 0.012;
            uv = clamp(uv, 0.0, 1.0);
            vec4 color = texture2D(uTexture, uv);
            if (uDebug > 0.5) {
              float heat = clamp(length(offset) * 12.0, 0.0, 1.0);
              vec3 debugColor = mix(color.rgb, vec3(0.9, 0.2, 0.1), heat);
              gl_FragColor = vec4(debugColor, color.a);
              return;
            }
            gl_FragColor = color;
          }
        `
      }),
    [uniforms]
  );

  useEffect(() => {
    uniforms.uTexture.value = texture;
  }, [texture, uniforms]);

  const geometry = useMemo(() => new PlaneGeometry(2, 2), []);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const count = Math.min(bodies.length, MAX_BODIES);
    uniforms.uBodyCount.value = count;
    uniforms.uSoftening.value = softening;
    uniforms.uStrength.value = strength;
    uniforms.uMaxInfluence.value = maxInfluence;
    uniforms.uDebug.value = debug ? 1 : 0;

    camera.getWorldDirection(cameraDirection);
    for (let i = 0; i < MAX_BODIES; i += 1) {
      if (i < count) {
        const body = bodies[i];
        temp.copy(body.position).sub(camera.position);
        const inFront = temp.dot(cameraDirection) > 0;
        if (inFront) {
          temp.add(camera.position);
          temp.project(camera);
          bodyPositions[i].set(
            temp.x * 0.5 + 0.5,
            temp.y * 0.5 + 0.5
          );
          bodyMasses[i] = body.visualMass;
        } else {
          bodyPositions[i].set(-10, -10);
          bodyMasses[i] = 0;
        }
      } else {
        bodyPositions[i].set(-10, -10);
        bodyMasses[i] = 0;
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      frustumCulled={false}
      renderOrder={-20}
    />
  );
}
