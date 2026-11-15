import { Color, MeshStandardMaterial } from "three";
import type { BodyData, BodyId } from "../data/types";
import { PLANET_BY_ID } from "../data/planetRegistry";
import { AU_IN_KM } from "../utils/units";

export interface SolarShineUniforms {
  uSolarBoost: { value: number };
  uKeyTint: { value: Color };
  uShineTint: { value: Color };
  uShineStrength: { value: number };
  uAtmoWrap: { value: number };
  uTerminatorColor: { value: Color };
  uOceanSpecular: { value: number };
}

interface BodySolarPreset {
  atmoWrap: number;
  terminator: string;
  shineTint: string;
  shineStrength: number;
}

const BODY_SOLAR_PRESETS: Partial<Record<BodyId, BodySolarPreset>> = {
  mercury: {
    atmoWrap: 0.0,
    terminator: "#d6a56e",
    shineTint: "#ffd99e",
    shineStrength: 0.30
  },
  venus: {
    atmoWrap: 0.34,
    terminator: "#e28432",
    shineTint: "#ffe3a8",
    shineStrength: 0.34
  },
  earth: {
    atmoWrap: 0.30,
    terminator: "#eb7c38",
    shineTint: "#b8dcff",
    shineStrength: 0.28
  },
  moon: {
    atmoWrap: 0.0,
    terminator: "#c9bfa8",
    shineTint: "#fff0d1",
    shineStrength: 0.20
  },
  mars: {
    atmoWrap: 0.18,
    terminator: "#d66843",
    shineTint: "#ffcb9e",
    shineStrength: 0.24
  },
  jupiter: {
    atmoWrap: 0.16,
    terminator: "#cc8c5a",
    shineTint: "#ffdfb3",
    shineStrength: 0.18
  },
  saturn: {
    atmoWrap: 0.15,
    terminator: "#cfa872",
    shineTint: "#ffe6bd",
    shineStrength: 0.18
  },
  titan: {
    atmoWrap: 0.36,
    terminator: "#cf6828",
    shineTint: "#ffbe6b",
    shineStrength: 0.28
  },
  uranus: {
    atmoWrap: 0.18,
    terminator: "#4ea8de",
    shineTint: "#c8f0ff",
    shineStrength: 0.18
  },
  neptune: {
    atmoWrap: 0.20,
    terminator: "#5477e6",
    shineTint: "#b5cdff",
    shineStrength: 0.19
  },
  pluto: {
    atmoWrap: 0.10,
    terminator: "#9bb7d9",
    shineTint: "#ffe4c2",
    shineStrength: 0.16
  }
};

function resolveAU(data: BodyData): number {
  const ownKm = data.orbit?.semiMajorAxisKm;
  if (data.kind !== "moon" && ownKm) {
    return ownKm / AU_IN_KM;
  }
  if (data.parentId && PLANET_BY_ID[data.parentId]?.orbit?.semiMajorAxisKm) {
    return PLANET_BY_ID[data.parentId]!.orbit!.semiMajorAxisKm / AU_IN_KM;
  }
  return 1.0;
}

/**
 * Computes calibrated heliocentric solar radiance & warm grazing shine
 * uniformly from a body's orbital distance and atmospheric profile.
 */
export function createSolarShineUniforms(data: BodyData): SolarShineUniforms {
  const au = Math.max(0.25, resolveAU(data));
  const logRatio = Math.log10(au);
  const baseBoost = Math.max(0.76, Math.min(1.18, 1.05 - logRatio * 0.18));
  const presetBoost = data.render.materialPreset?.illuminationBoost ?? 0;
  const solarBoost = baseBoost + presetBoost * 0.65;

  // Inner worlds receive warmer golden solar radiance; outer worlds stay crisp white-gold
  const innerWarmth = Math.max(0, Math.min(1, (1.4 - au) / 1.1));
  const keyTint = new Color("#fff8ee").lerp(new Color("#ffe6ba"), innerWarmth * 0.55);

  const preset = BODY_SOLAR_PRESETS[data.id];
  const fallbackRim = data.render.glowPreset?.rim;

  return {
    uSolarBoost: { value: solarBoost },
    uKeyTint: { value: keyTint },
    uShineTint: {
      value: new Color(preset?.shineTint ?? fallbackRim?.color ?? "#ffebc4")
    },
    uShineStrength: {
      value: preset?.shineStrength ?? (0.17 + innerWarmth * 0.08)
    },
    uAtmoWrap: {
      value: preset?.atmoWrap ?? 0.0
    },
    uTerminatorColor: {
      value: new Color(
        preset?.terminator ?? fallbackRim?.terminatorColor ?? "#e0a96d"
      )
    },
    uOceanSpecular: { value: data.id === "earth" ? 1.0 : 0.0 }
  };
}

const VERTEX_DECL = /* glsl */ `
varying vec3 vSolarWorldPos;
varying vec3 vSolarWorldNormal;
`;

const VERTEX_OUT = /* glsl */ `
#include <worldpos_vertex>
vSolarWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
vSolarWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
`;

const FRAGMENT_PARS = /* glsl */ `
uniform float uSolarBoost;
uniform vec3 uKeyTint;
uniform vec3 uShineTint;
uniform float uShineStrength;
uniform float uAtmoWrap;
uniform vec3 uTerminatorColor;
uniform float uOceanSpecular;
varying vec3 vSolarWorldPos;
varying vec3 vSolarWorldNormal;
`;

/**
 * Integrates cohesive heliocentric sunlight warmth, soft terminator scattering,
 * and grazing solar horizon shine onto MeshStandardMaterial without altering
 * underlying planetary textures or casting harsh cutout shadows.
 */
export function applySolarShineShader(
  material: MeshStandardMaterial,
  uniforms: SolarShineUniforms
): void {
  material.userData.solarShineUniforms = uniforms;
  material.customProgramCacheKey = () => "solar-shine-v1";

  material.onBeforeCompile = (shader) => {
    const active =
      (material.userData.solarShineUniforms as SolarShineUniforms | undefined) ??
      uniforms;

    Object.entries(active).forEach(([key, u]) => {
      shader.uniforms[key] = u;
    });

    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_DECL}`)
      .replace("#include <worldpos_vertex>", VERTEX_OUT);

    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_PARS}`)
      .replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `
        #include <roughnessmap_fragment>
        if (uOceanSpecular > 0.5) {
          // Soft broad solar sheen across oceans without harsh specular hotspots
          float blueLead = diffuseColor.b - max(diffuseColor.r, diffuseColor.g * 0.94);
          float oceanMask = smoothstep(0.015, 0.09, blueLead);
          roughnessFactor = mix(roughnessFactor, 0.46, oceanMask);
        }
        `
      )
      .replace(
        "#include <lights_fragment_end>",
        /* glsl */ `
        #include <lights_fragment_end>
        vec3 _sunVec = -vSolarWorldPos;
        vec3 _sunDir = _sunVec / max(length(_sunVec), 0.001);
        vec3 _worldN = normalize(vSolarWorldNormal);
        float _sunDot = dot(_worldN, _sunDir);

        // Calibrated heliocentric irradiance & warm solar key temperature
        reflectedLight.directDiffuse *= uSolarBoost * uKeyTint;
        reflectedLight.directSpecular *= uSolarBoost * uKeyTint;

        // Soft warm terminator scattering across atmospheric worlds
        if (uAtmoWrap > 0.001) {
          float _twilight = exp(-pow((_sunDot + 0.02) * 4.5, 2.0));
          reflectedLight.directDiffuse +=
            diffuseColor.rgb * uTerminatorColor * _twilight * uAtmoWrap * 0.55;
        }

        // Grazing solar shine catching along the sun-facing limb & forward crescent
        float _ndotv = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
        float _fresnel = pow(1.0 - _ndotv, 2.6);
        float _sunFacing = smoothstep(-0.18, 0.72, _sunDot);
        reflectedLight.directDiffuse +=
          (diffuseColor.rgb * 0.65 + vec3(0.35)) * uShineTint * _fresnel * _sunFacing * uShineStrength;

        vec3 _viewDirW = normalize(cameraPosition - vSolarWorldPos);
        float _backlit = pow(max(dot(-_viewDirW, _sunDir), 0.0), 3.0);
        reflectedLight.directDiffuse +=
          uShineTint * _fresnel * _backlit * smoothstep(-0.55, 0.25, _sunDot) * uShineStrength * 0.65;

        // Subtle cool cosmic rim on dark limb so unlit sides stay cleanly defined
        float _nightMask = smoothstep(0.15, -0.35, _sunDot);
        reflectedLight.indirectDiffuse +=
          diffuseColor.rgb * vec3(0.38, 0.56, 0.90) * pow(1.0 - _ndotv, 3.2) * _nightMask * 0.065;
        `
      );
  };
}
