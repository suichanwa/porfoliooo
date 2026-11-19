import { AdditiveBlending, BackSide, Color, ShaderMaterial } from "three";
import type { RimGlowPreset } from "../data/types";

const PLANETARY_RIM_VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const PLANETARY_RIM_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uOuterColor;
  uniform vec3 uTerminatorColor;
  uniform float uOuterMix;
  uniform float uUpperHaze;
  uniform float uPower;
  uniform float uOpacity;
  uniform float uLimbMu;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 sunDir = normalize(-vWorldPos);

    // On BackSide shell, -dot(N, V) is 0 at outer mesh edge and approaches uLimbMu at planet horizon
    float mu = max(0.0, dot(N, -V));
    float t = clamp(mu / uLimbMu, 0.0, 1.0);

    // Exponential-like radial scale-height decay with smooth zero fade at outer boundary
    float edgeFade = smoothstep(0.0, 0.24, t);
    float mainHaze = pow(t, uPower) * edgeFade;
    // Faint high-altitude detached bluish upper-haze layer for Titan
    float upperHaze = exp(-pow((t - 0.36) / 0.18, 2.0)) * smoothstep(0.0, 0.22, t) * 0.14 * uUpperHaze;
    float radial = mainHaze + upperHaze;

    float sunDot = dot(N, sunDir);
    float dayLight = smoothstep(-0.34, 0.48, sunDot);
    float terminatorGlow = exp(-pow((sunDot + 0.04) * 4.5, 2.0));
    float forwardScatter = pow(max(dot(-V, sunDir), 0.0), 4.0) * smoothstep(-0.68, 0.20, sunDot) * 0.42;

    vec3 scatterColor = mix(uOuterColor, uColor, smoothstep(0.28, 0.80, t * mix(1.0, 0.92, uOuterMix)));
    scatterColor = mix(scatterColor, uTerminatorColor, terminatorGlow * 0.42 * uOuterMix);

    float alpha = radial * (dayLight * 0.95 + forwardScatter + 0.04) * uOpacity;
    gl_FragColor = vec4(scatterColor, clamp(alpha, 0.0, 1.0));
  }
`;

export function createPlanetaryRimMaterial(
  rimPreset: RimGlowPreset,
  fallbackColor: string,
  isTitan: boolean
): ShaderMaterial {
  const rimScale = rimPreset.scale ?? 1.04;
  const limbMu = Math.sqrt(Math.max(0.001, 1 - 1 / (rimScale * rimScale)));
  const baseColor = rimPreset.color ?? fallbackColor;

  return new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(baseColor) },
      uOuterColor: { value: new Color(rimPreset.outerColor ?? baseColor) },
      uTerminatorColor: { value: new Color(rimPreset.terminatorColor ?? baseColor) },
      uOuterMix: { value: rimPreset.colorMix ?? 0.0 },
      uUpperHaze: { value: isTitan ? 1.0 : 0.0 },
      uPower: { value: rimPreset.power ?? 2.8 },
      uOpacity: { value: rimPreset.opacity ?? 0.08 },
      uLimbMu: { value: limbMu }
    },
    vertexShader: PLANETARY_RIM_VERTEX_SHADER,
    fragmentShader: PLANETARY_RIM_FRAGMENT_SHADER,
    transparent: true,
    blending: AdditiveBlending,
    side: BackSide,
    depthWrite: false
  });
}
