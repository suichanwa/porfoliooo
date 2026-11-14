import {
  Color,
  DataTexture,
  LinearFilter,
  MeshStandardMaterial,
  NoColorSpace,
  RGBAFormat,
  SRGBColorSpace,
  Texture,
  Vector3,
  Vector4
} from "three";
import { GLSL_NOISE_3D } from "./noiseGlsl";
import { MAX_OCCLUDERS, type SolarSurfaceUniforms } from "../lighting/solarLighting";

export interface RingShadowUniforms {
  uRingShadow: { value: number };
  uBodyCenter: { value: Vector3 };
  uRingNormal: { value: Vector3 };
  uRingInner: { value: number };
  uRingOuter: { value: number };
  uRingMap: { value: Texture };
  uHasRingMap: { value: number };
}

export interface ExtendedSolarUniforms
  extends SolarSurfaceUniforms,
    RingShadowUniforms {
  uProceduralKind: { value: number };
  uOceanSpecular: { value: number };
  uNightMap: { value: Texture };
  uHasNightMap: { value: number };
}

let cachedFallbackTex: DataTexture | null = null;
function getFallbackTexture(): DataTexture {
  if (!cachedFallbackTex) {
    cachedFallbackTex = new DataTexture(
      new Uint8Array([0, 0, 0, 0]),
      1,
      1,
      RGBAFormat
    );
    cachedFallbackTex.minFilter = LinearFilter;
    cachedFallbackTex.magFilter = LinearFilter;
    cachedFallbackTex.colorSpace = NoColorSpace;
    cachedFallbackTex.needsUpdate = true;
  }
  return cachedFallbackTex;
}

export function createDefaultSolarUniforms(): ExtendedSolarUniforms {
  const fallbackTex = getFallbackTexture();
  return {
    uSunBoost: { value: 1.0 },
    uKeyTint: { value: new Color("#fff8ec") },
    uAmbientRim: { value: 0.045 },
    uTwilightColor: { value: new Color("#f97316") },
    uAtmoStrength: { value: 0.0 },
    uOccluders: {
      value: Array.from(
        { length: MAX_OCCLUDERS },
        () => new Vector4(0, 0, 0, 0)
      )
    },
    uOccluderAtmos: { value: Array(MAX_OCCLUDERS).fill(0) },
    uOccluderCount: { value: 0 },
    uBouncePos: { value: new Vector3() },
    uBounceColor: { value: new Color("#94a3b8") },
    uBounceIntensity: { value: 0.0 },
    uRingShadow: { value: 0.0 },
    uBodyCenter: { value: new Vector3() },
    uRingNormal: { value: new Vector3(0, 1, 0) },
    uRingInner: { value: 1.2 },
    uRingOuter: { value: 2.3 },
    uRingMap: { value: fallbackTex },
    uHasRingMap: { value: 0.0 },
    uProceduralKind: { value: 0 },
    uOceanSpecular: { value: 0.0 },
    uNightMap: { value: fallbackTex },
    uHasNightMap: { value: 0.0 }
  };
}

const VERTEX_DECL = /* glsl */ `
varying vec3 vSolarWorldPos;
varying vec3 vSolarObjPos;
varying vec3 vSolarWorldNormal;
varying vec2 vSolarUv;
`;

const VERTEX_OUT = /* glsl */ `
#include <worldpos_vertex>
vSolarWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
vSolarObjPos = transformed;
vSolarWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
vSolarUv = uv;
`;

const FRAGMENT_PARS = /* glsl */ `
uniform float uSunBoost;
uniform vec3 uKeyTint;
uniform float uAmbientRim;
uniform vec3 uTwilightColor;
uniform float uAtmoStrength;
uniform vec4 uOccluders[${MAX_OCCLUDERS}];
uniform float uOccluderAtmos[${MAX_OCCLUDERS}];
uniform int uOccluderCount;
uniform vec3 uBouncePos;
uniform vec3 uBounceColor;
uniform float uBounceIntensity;
uniform float uRingShadow;
uniform vec3 uBodyCenter;
uniform vec3 uRingNormal;
uniform float uRingInner;
uniform float uRingOuter;
uniform sampler2D uRingMap;
uniform float uHasRingMap;
uniform int uProceduralKind;
uniform float uOceanSpecular;
uniform sampler2D uNightMap;
uniform float uHasNightMap;

varying vec3 vSolarWorldPos;
varying vec3 vSolarObjPos;
varying vec3 vSolarWorldNormal;
varying vec2 vSolarUv;

${GLSL_NOISE_3D}

vec3 srgbApproxToLinear(vec3 c) {
  return pow(max(c, vec3(0.0)), vec3(2.2));
}

/**
 * Generates seamless spherical 3D albedo + bump height (w) for worlds without static textures:
 * 1: Io | 2: Europa | 3: Ganymede | 4: Callisto | 5: Titania | 6: Oberon | 7: Triton
 */
vec4 evalProceduralPlanet(int kind, vec3 dir) {
  float macro = fbm3d(dir * 3.8);
  float detail = fbm3d(dir * 12.5);
  float fine = noise3d(dir * 29.0);

  if (kind == 1) {
    // Io: mottled sulfur flats, orange lava flows, dark volcanic calderas
    vec2 vor = voronoi3d(dir * 7.0);
    float caldera = 1.0 - smoothstep(0.06, 0.18, vor.x);
    float sulfurMix = smoothstep(0.32, 0.72, macro);
    vec3 cream = srgbApproxToLinear(vec3(0.95, 0.88, 0.56));
    vec3 gold = srgbApproxToLinear(vec3(0.89, 0.65, 0.16));
    vec3 orangeRed = srgbApproxToLinear(vec3(0.75, 0.28, 0.08));
    vec3 col = mix(cream, gold, sulfurMix);
    col = mix(col, orangeRed, smoothstep(0.55, 0.85, detail) * 0.62);
    col = mix(col, vec3(0.04, 0.03, 0.02), caldera * 0.82);
    float h = detail * 0.35 + fine * 0.15 - caldera * 0.55;
    return vec4(col, h);
  }

  if (kind == 2) {
    // Europa: creamy bright water ice crisscrossed by reddish-ochre tectonic lineae
    float ridgeA = abs(sin((dir.x * 7.5 + dir.y * 4.2 + macro * 2.6) * 3.2));
    float ridgeB = abs(sin((dir.z * 8.1 - dir.y * 5.6 + detail * 2.1) * 2.9));
    float lineae = 1.0 - smoothstep(0.0, 0.11, min(ridgeA, ridgeB));
    vec3 iceBase = srgbApproxToLinear(vec3(0.85, 0.88, 0.90));
    vec3 chaotix = srgbApproxToLinear(vec3(0.64, 0.50, 0.38));
    vec3 rusty = srgbApproxToLinear(vec3(0.54, 0.34, 0.24));
    vec3 col = mix(iceBase, chaotix, smoothstep(0.45, 0.82, macro) * 0.55);
    col = mix(col, rusty, lineae * 0.75);
    float h = lineae * 0.42 + detail * 0.14;
    return vec4(col, h);
  }

  if (kind == 3) {
    // Ganymede: dark Galileo-like cratered basins broken by bright grooved icy sulci & bright frost craters
    float basinMask = smoothstep(0.36, 0.62, macro);
    float groove = 0.5 + 0.5 * sin(dir.y * 42.0 + dir.x * 26.0 + detail * 8.0);
    vec2 vor = voronoi3d(dir * 9.5);
    float craterRim = exp(-pow((vor.x - 0.19) * 16.0, 2.0));
    float craterBowl = 1.0 - smoothstep(0.05, 0.19, vor.x);
    vec3 darkBasin = srgbApproxToLinear(vec3(0.35, 0.34, 0.36));
    vec3 sulciIce = srgbApproxToLinear(vec3(0.76, 0.78, 0.82));
    vec3 frost = srgbApproxToLinear(vec3(0.92, 0.94, 0.97));
    vec3 col = mix(darkBasin, sulciIce, basinMask * (0.65 + 0.35 * groove));
    col = mix(col, frost, craterRim * 0.38);
    col *= (0.86 + 0.28 * fine);
    float h = basinMask * groove * 0.28 + craterRim * 0.55 - craterBowl * 0.45 + detail * 0.22;
    return vec4(col, h);
  }

  if (kind == 4) {
    // Callisto: dark ancient carbonaceous ice densely speckled with bright icy impact rims
    vec2 vor1 = voronoi3d(dir * 12.0);
    float microCrater = smoothstep(0.68, 0.94, fine);
    float rim = exp(-pow((vor1.x - 0.15) * 18.0, 2.0)) + 0.45 * microCrater;
    float bowl = 1.0 - smoothstep(0.04, 0.15, vor1.x);
    vec3 darkIce = srgbApproxToLinear(vec3(0.28, 0.26, 0.25));
    vec3 midRock = srgbApproxToLinear(vec3(0.45, 0.43, 0.40));
    vec3 brightSpot = srgbApproxToLinear(vec3(0.84, 0.86, 0.89));
    vec3 col = mix(darkIce, midRock, smoothstep(0.35, 0.75, macro));
    col = mix(col, brightSpot, clamp(rim * 0.45, 0.0, 0.72));
    float h = rim * 0.50 - bowl * 0.42 + fine * 0.18;
    return vec4(col, h);
  }

  if (kind == 5 || kind == 6) {
    // Titania (5) & Oberon (6): cratered gray-rose outer icy worlds with rift scarps
    vec2 vor = voronoi3d(dir * 11.0);
    float craterRim = exp(-pow((vor.x - 0.17) * 16.0, 2.0));
    float bowl = 1.0 - smoothstep(0.04, 0.17, vor.x);
    float rift = 1.0 - smoothstep(0.0, 0.08, abs(dir.y * 1.4 + dir.x * 0.8 + macro * 0.9 - 0.35));
    vec3 baseCol = kind == 5
      ? srgbApproxToLinear(vec3(0.70, 0.68, 0.67))
      : srgbApproxToLinear(vec3(0.54, 0.49, 0.48));
    vec3 shadowCol = baseCol * 0.52;
    vec3 col = mix(shadowCol, baseCol, smoothstep(0.3, 0.8, detail));
    col = mix(col, baseCol * 1.25, craterRim * 0.45);
    col = mix(col, shadowCol * 0.7, rift * 0.45);
    float h = craterRim * 0.48 - bowl * 0.38 - rift * 0.35 + detail * 0.25;
    return vec4(col, h);
  }

  // Triton (7): nitrogen-methane pink-tan cantaloupe crust + bright southern frost cap
  float southCap = smoothstep(0.15, 0.65, -dir.y + macro * 0.25);
  vec2 vor = voronoi3d(dir * 16.0);
  float cantaloupe = smoothstep(0.12, 0.35, vor.x);
  vec3 tanCrust = srgbApproxToLinear(vec3(0.76, 0.66, 0.62));
  vec3 nitrogenFrost = srgbApproxToLinear(vec3(0.92, 0.88, 0.87));
  vec3 darkStreak = srgbApproxToLinear(vec3(0.36, 0.31, 0.32));
  vec3 col = mix(tanCrust * 0.86, tanCrust, cantaloupe);
  col = mix(col, darkStreak, smoothstep(0.68, 0.90, detail) * 0.45 * (1.0 - southCap));
  col = mix(col, nitrogenFrost, southCap * 0.85);
  float h = cantaloupe * 0.22 + fine * 0.15;
  return vec4(col, h);
}

/**
 * Computes screen-space normal perturbation cleanly from a continuous height field h.
 */
vec3 solarPerturbNormal(vec3 viewDirToSurf, vec3 surfNormal, float h, float scale) {
  vec3 dPosX = dFdx(viewDirToSurf);
  vec3 dPosY = dFdy(viewDirToSurf);
  vec3 R1 = cross(dPosY, surfNormal);
  vec3 R2 = cross(surfNormal, dPosX);
  float fDet = dot(dPosX, R1);
  if (abs(fDet) < 1e-8) return surfNormal;
  vec3 surfGrad = sign(fDet) * (dFdx(h) * R1 + dFdy(h) * R2);
  return normalize(abs(fDet) * surfNormal - scale * surfGrad);
}

/**
 * Evaluates analytical sphere-ray eclipse shadows.
 * Returns vec2(directLightVisibility, redAtmosphericUmbraIntensity).
 */
vec2 evalEclipseShadow(vec3 worldPos, vec3 sunDir, float sunDist) {
  float vis = 1.0;
  float redUmbra = 0.0;

  for (int i = 0; i < ${MAX_OCCLUDERS}; i++) {
    if (i >= uOccluderCount) break;
    vec4 occ = uOccluders[i];
    if (occ.w <= 0.0001) continue;

    vec3 toOcc = occ.xyz - worldPos;
    float proj = dot(toOcc, sunDir);
    if (proj > 0.0 && proj < sunDist) {
      float perp = length(toOcc - sunDir * proj);
      float ratio = perp / occ.w;
      float penumbra = clamp(0.05 + (proj / sunDist) * 0.42, 0.045, 0.22);
      float occVis = smoothstep(1.0 - penumbra, 1.0 + penumbra, ratio);
      vis = min(vis, occVis);

      if (uOccluderAtmos[i] > 0.5 && occVis < 0.95) {
        float umbraDepth = (1.0 - occVis) * smoothstep(0.0, 0.75, 1.0 - ratio * 0.35);
        redUmbra = max(redUmbra, umbraDepth);
      }
    }
  }

  return vec2(vis, redUmbra);
}

/**
 * Evaluates ray-plane intersection shadow cast by Saturn/Uranus rings onto the planet globe.
 */
float evalRingShadow(vec3 worldPos, vec3 sunDir) {
  if (uRingShadow < 0.5) return 1.0;

  vec3 offset = worldPos - uBodyCenter;
  float denom = dot(sunDir, uRingNormal);
  if (abs(denom) < 0.001) return 1.0;

  float tHit = -dot(offset, uRingNormal) / denom;
  if (tHit <= 0.0) return 1.0;

  vec3 hitPos = offset + sunDir * tHit;
  float r = length(hitPos);
  if (r <= uRingInner || r >= uRingOuter) return 1.0;

  float u = clamp((r - uRingInner) / max(0.0001, uRingOuter - uRingInner), 0.0, 1.0);
  float density = 0.65;
  if (uHasRingMap > 0.5) {
    vec4 sampleRing = texture2D(uRingMap, vec2(u, 0.5));
    // Prefer alpha if RGBA texture encodes gaps in alpha, otherwise luminance
    density = sampleRing.a < 0.995 ? sampleRing.a : sampleRing.g;
  } else {
    density = 0.45 * smoothstep(0.0, 0.08, u) * (1.0 - smoothstep(0.92, 1.0, u));
  }

  float edgeFeather = smoothstep(0.0, 0.04, u) * (1.0 - smoothstep(0.96, 1.0, u));
  return 1.0 - clamp(density * edgeFeather * 0.82, 0.0, 0.82);
}
`;

/**
 * Installs our unified PBR astronomical lighting, eclipse shadows, ring shadows,
 * procedural moon geology, Earth ocean speculars & city nightlights onto a MeshStandardMaterial.
 */
export function applySolarSurfaceShader(
  material: MeshStandardMaterial,
  uniforms: ExtendedSolarUniforms
): void {
  material.userData.solarUniforms = uniforms;
  material.customProgramCacheKey = () => "solar-pbr-surface-v1";

  material.onBeforeCompile = (shader) => {
    const activeUniforms =
      (material.userData.solarUniforms as ExtendedSolarUniforms | undefined) ??
      uniforms;

    Object.entries(activeUniforms).forEach(([key, uniform]) => {
      shader.uniforms[key] = uniform;
    });

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_DECL}`)
      .replace("#include <worldpos_vertex>", VERTEX_OUT);

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_PARS}`)
      .replace(
        "#include <map_fragment>",
        /* glsl */ `
        #include <map_fragment>
        vec4 _procSample = vec4(0.0);
        if (uProceduralKind > 0) {
          _procSample = evalProceduralPlanet(uProceduralKind, normalize(vSolarObjPos));
          diffuseColor.rgb = _procSample.rgb;
        }
        `
      )
      .replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `
        #include <roughnessmap_fragment>
        if (uOceanSpecular > 0.5) {
          // Smooth specular ocean glint where blue dominates landmass/polar ice
          float blueLead = (diffuseColor.b - max(diffuseColor.r, diffuseColor.g * 0.94));
          float oceanMask = smoothstep(0.015, 0.085, blueLead);
          roughnessFactor = mix(roughnessFactor, 0.40, oceanMask);
        } else if (uProceduralKind == 2 || uProceduralKind == 3) {
          // Icy moons glisten subtly on bright water-ice terrains
          float iceShine = smoothstep(0.35, 0.72, dot(diffuseColor.rgb, vec3(0.333)));
          roughnessFactor = mix(roughnessFactor, 0.42, iceShine * 0.65);
        }
        `
      )
      .replace(
        "#include <normal_fragment_maps>",
        /* glsl */ `
        #include <normal_fragment_maps>
        if (uProceduralKind > 0) {
          float bumpStrength = uProceduralKind == 1 ? 0.35 : 0.55;
          normal = solarPerturbNormal(-vViewPosition, normal, _procSample.w, bumpStrength);
        }
        `
      )
      .replace(
        "#include <lights_fragment_end>",
        /* glsl */ `
        #include <lights_fragment_end>
        vec3 _sunVec = -vSolarWorldPos;
        float _sunDist = max(length(_sunVec), 0.001);
        vec3 _sunDir = _sunVec / _sunDist;
        vec3 _worldN = normalize(vSolarWorldNormal);
        float _sunDot = dot(_worldN, _sunDir);

        vec2 _occData = evalEclipseShadow(vSolarWorldPos, _sunDir, _sunDist);
        float _ringShadow = evalRingShadow(vSolarWorldPos, _sunDir);
        float _totalShadow = _occData.x * _ringShadow;

        // Perceptual solar irradiance scaling & spectral temperature
        reflectedLight.directDiffuse *= uSunBoost * uKeyTint * _totalShadow;
        reflectedLight.directSpecular *= uSunBoost * uKeyTint * _totalShadow;

        // Refracted copper-crimson umbra glow during Earth/Saturn lunar eclipses
        if (_occData.y > 0.001) {
          float umbraFacing = max(0.0, _sunDot * 0.8 + 0.2);
          reflectedLight.directDiffuse +=
            diffuseColor.rgb * vec3(0.85, 0.18, 0.05) * _occData.y * 0.48 * umbraFacing;
        }

        // Warm twilight atmospheric forward-scattering along terminator vs regolith contrast
        if (uAtmoStrength > 0.001) {
          float terminatorBand = exp(-pow((_sunDot + 0.025) * 4.8, 2.0));
          reflectedLight.directDiffuse +=
            diffuseColor.rgb * uTwilightColor * terminatorBand * uAtmoStrength * 0.62 * _totalShadow;
        }

        // Secondary reflected neighbor planetshine & ringshine
        if (uBounceIntensity > 0.001) {
          vec3 _toBounce = normalize(uBouncePos - vSolarWorldPos);
          float _bounceDiff = max(0.0, dot(_worldN, _toBounce) * 0.85 + 0.15);
          reflectedLight.indirectDiffuse +=
            diffuseColor.rgb * uBounceColor * uBounceIntensity * _bounceDiff;
        }
        if (uRingShadow > 0.5) {
          float _ringShine = (1.0 - abs(dot(_worldN, uRingNormal))) * 0.4 + 0.6 * abs(dot(_worldN, uRingNormal));
          reflectedLight.indirectDiffuse +=
            diffuseColor.rgb * vec3(0.90, 0.82, 0.64) * 0.065 * _ringShine;
        }

        // Subtle cool deep-space starlight rim so dark limbs keep readable silhouette
        float _ndotv = clamp(dot(normalize(geometryNormal), geometryViewDir), 0.0, 1.0);
        float _starRim = pow(1.0 - _ndotv, 3.2);
        reflectedLight.indirectDiffuse +=
          diffuseColor.rgb * vec3(0.45, 0.64, 0.96) * _starRim * uAmbientRim;

        // Earth city lights on night hemisphere (thresholding out texture dark ocean floor)
        if (uHasNightMap > 0.5) {
          vec3 _cityRaw = texture2D(uNightMap, vSolarUv).rgb;
          float _cityLuma = dot(_cityRaw, vec3(0.299, 0.587, 0.114));
          float _citySignal = smoothstep(0.11, 0.48, _cityLuma);
          float _nightFactor = smoothstep(0.06, -0.22, _sunDot);
          // Also brighten faint twilight glow if inside total eclipse
          float _nightMask = max(_nightFactor, (1.0 - _totalShadow) * 0.75 * smoothstep(-0.2, 0.4, _sunDot));
          totalEmissiveRadiance +=
            srgbApproxToLinear(_cityRaw) * vec3(1.55, 1.08, 0.62) * _citySignal * _nightMask * 2.1;
        }
        `
      );
  };
}

export { SRGBColorSpace };
