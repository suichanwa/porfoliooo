import {
  AdditiveBlending,
  BackSide,
  Color,
  ShaderMaterial,
  type Texture
} from "three";
import { GLSL_NOISE_3D } from "./noiseGlsl";

export function createSunPhotosphereMaterial(texture: Texture | null) {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMap: { value: texture },
      uHasMap: { value: texture ? 1.0 : 0.0 },
      uCoreColor: { value: new Color("#fff5d6") },
      uMidColor: { value: new Color("#ff9d1c") },
      uLimbColor: { value: new Color("#cf3808") },
      uSunspotColor: { value: new Color("#4f1202") }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vObjPos;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      void main() {
        vUv = uv;
        vObjPos = position;
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform sampler2D uMap;
      uniform float uHasMap;
      uniform vec3 uCoreColor;
      uniform vec3 uMidColor;
      uniform vec3 uLimbColor;
      uniform vec3 uSunspotColor;

      varying vec2 vUv;
      varying vec3 vObjPos;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      ${GLSL_NOISE_3D}

      void main() {
        vec3 p = normalize(vObjPos);
        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);
        float mu = clamp(dot(N, V), 0.0, 1.0);

        // Single-pass 3D convection warp (pole-safe UV flow + spherical granulation)
        float poleDamp = smoothstep(0.98, 0.72, abs(p.y));
        float flowA = fbm3d(p * 4.5 + vec3(uTime * 0.045, 0.0, -uTime * 0.03));
        float flowB = noise3d(p * 5.2 + vec3(2.4, -uTime * 0.04, 1.7));
        vec2 flowOffset = (vec2(flowA, flowB) - 0.5) * 0.015 * poleDamp;

        vec2 warpedUv = vec2(
          fract(vUv.x + flowOffset.x),
          clamp(vUv.y + flowOffset.y, 0.002, 0.998)
        );

        vec3 texSample = uHasMap > 0.5 ? texture2D(uMap, warpedUv).rgb : vec3(0.85, 0.52, 0.16);
        float mapLuma = dot(texSample, vec3(0.299, 0.587, 0.114));

        // Dual-scale solar convection granules (macro + crisp high-frequency boiling cells)
        float macroCells = fbm3d(p * 9.0 + vec3(flowA * 0.7, uTime * 0.055, uTime * 0.035));
        float microGranules = noise3d(p * 26.0 - vec3(uTime * 0.09, -uTime * 0.06, uTime * 0.07));
        float granuleField = clamp(mix(macroCells, microGranules, 0.35), 0.0, 1.0);

        float surfaceEnergy = mix(mapLuma, granuleField, 0.34);
        float activePlages = smoothstep(0.62, 0.95, surfaceEnergy);
        float umbraMask = 1.0 - smoothstep(0.14, 0.42, surfaceEnergy);

        // Astrophysical solar limb darkening: I(mu) = 1 - u1*(1-mu) - u2*(1-mu)^2
        float oneMinusMu = 1.0 - mu;
        float limbDark = clamp(1.0 - 0.56 * oneMinusMu - 0.24 * oneMinusMu * oneMinusMu, 0.20, 1.0);

        vec3 basePlasma = mix(uMidColor, uCoreColor * 1.42, smoothstep(0.32, 0.92, surfaceEnergy));
        basePlasma = mix(basePlasma, texSample * uCoreColor * 1.35, uHasMap * 0.38);
        basePlasma = mix(basePlasma, uSunspotColor, umbraMask * 0.72);
        basePlasma += uCoreColor * activePlages * 0.32;

        vec3 color = mix(uLimbColor, basePlasma, pow(limbDark, 0.78)) * limbDark;

        // Boiling chromospheric rim edge shimmer
        float rimFlare = pow(oneMinusMu, 3.8) * (0.45 + 0.85 * microGranules);
        color += mix(uLimbColor, uCoreColor, 0.38) * rimFlare * 1.1;

        gl_FragColor = vec4(color, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `
  });
}

export function createSunChromosphereMaterial(shellScale = 1.13) {
  const limbMu = Math.sqrt(Math.max(0.001, 1 - 1 / (shellScale * shellScale)));
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uLimbMu: { value: limbMu },
      uInnerColor: { value: new Color("#ffae34") },
      uOuterColor: { value: new Color("#e03c04") }
    },
    vertexShader: /* glsl */ `
      varying vec3 vObjPos;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      void main() {
        vObjPos = position;
        vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uLimbMu;
      uniform vec3 uInnerColor;
      uniform vec3 uOuterColor;

      varying vec3 vObjPos;
      varying vec3 vWorldPos;
      varying vec3 vWorldNormal;

      ${GLSL_NOISE_3D}

      void main() {
        vec3 N = normalize(vWorldNormal);
        vec3 V = normalize(cameraPosition - vWorldPos);

        float mu = max(0.0, dot(N, -V));
        float t = clamp(mu / uLimbMu, 0.0, 1.0);

        float outerMask = smoothstep(0.0, 0.48, t);
        float radialDecay = pow(t, 3.2) * outerMask;

        vec3 dir = normalize(vObjPos);
        float activityBelt = 0.65 + 0.35 * cos(dir.y * 3.14159);
        float prominenceNoise = fbm3d(dir * 7.5 - dir * (uTime * 0.22));
        float spiculeWave = 0.5 + 0.5 * sin(dir.x * 38.0 + dir.z * 34.0 + prominenceNoise * 6.0);
        float flares = smoothstep(0.38, 0.84, prominenceNoise) * (0.60 + 0.55 * spiculeWave) * activityBelt;

        float intensity = radialDecay * (0.45 + flares * 0.90) * 0.72;
        vec3 col = mix(uOuterColor, uInnerColor, smoothstep(0.25, 0.90, t));
        col += uInnerColor * flares * pow(t, 2.0) * 0.42;

        gl_FragColor = vec4(col, clamp(intensity, 0.0, 1.0));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    blending: AdditiveBlending,
    side: BackSide,
    transparent: true,
    depthWrite: false
  });
}

export function createSunCoronaMaterial() {
  return new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColorCore: { value: new Color("#ffe4a0") },
      uColorMid: { value: new Color("#ff9824") },
      uColorOuter: { value: new Color("#b83500") }
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

      ${GLSL_NOISE_3D}

      void main() {
        vec2 centered = vUv - vec2(0.5);
        float dist = length(centered) * 2.0;
        if (dist > 1.0) discard;

        float edgeFade = 1.0 - smoothstep(0.54, 0.98, dist);
        float innerGlow = exp(-dist * 6.2) * 0.56;
        float midGlow = exp(-dist * 2.55) * 0.34;
        float baseGlow = (innerGlow + midGlow) * edgeFade;

        vec2 unitDir = dist > 0.0001 ? centered / (dist * 0.5) : vec2(1.0, 0.0);
        float angle = atan(unitDir.y, unitDir.x);
        float helmetBias = 0.72 + 0.28 * cos(angle * 2.0 + 0.25);

        // Fast 2D anisotropic streamer FBM
        float streamerA = fbm2d(unitDir * 3.4 + vec2(uTime * 0.04, -dist * 0.8));
        float streamerB = noise2d(unitDir * 9.5 + vec2(-uTime * 0.06, dist * 0.9));
        float rayFactor = mix(0.68, 1.40, smoothstep(0.30, 0.82, mix(streamerA, streamerB, 0.38))) * helmetBias;

        float streamerWeight = smoothstep(0.14, 0.50, dist);
        float totalGlow = baseGlow * mix(1.0, rayFactor, streamerWeight * 0.65);

        vec3 color = mix(uColorCore, uColorMid, smoothstep(0.02, 0.40, dist));
        color = mix(color, uColorOuter, smoothstep(0.35, 0.88, dist));

        float breath = 1.0 + 0.015 * sin(uTime * 0.75 + dist * 3.2);
        float alpha = clamp(totalGlow * breath, 0.0, 0.92);

        gl_FragColor = vec4(color, alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false
  });
}
