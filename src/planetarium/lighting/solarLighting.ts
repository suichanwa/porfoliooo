import { Color, Vector3, Vector4, type Object3D } from "three";
import type { BodyData, BodyId } from "../data/types";
import { ALL_BODIES, PLANET_BY_ID } from "../data/planetRegistry";
import { scalePlanetRadius } from "../utils/scale";
import { AU_IN_KM } from "../utils/units";

export type LightingMode = "cinematic" | "natural" | "inspect";

export const MAX_OCCLUDERS = 3;

export interface SceneLightRigPreset {
  ambientIntensity: number;
  ambientColor: string;
  hemiIntensity: number;
  hemiSkyColor: string;
  hemiGroundColor: string;
  sunIntensity: number;
  sunColor: string;
  ambientRimScale: number;
  bounceScale: number;
}

const SCENE_LIGHT_PRESETS: Record<LightingMode, SceneLightRigPreset> = {
  cinematic: {
    ambientIntensity: 0.032,
    ambientColor: "#0e172a",
    hemiIntensity: 0.052,
    hemiSkyColor: "#1e3254",
    hemiGroundColor: "#02040a",
    sunIntensity: 2.85,
    sunColor: "#fff8ec",
    ambientRimScale: 0.9,
    bounceScale: 1.05
  },
  natural: {
    ambientIntensity: 0.015,
    ambientColor: "#070b14",
    hemiIntensity: 0.025,
    hemiSkyColor: "#121e36",
    hemiGroundColor: "#010205",
    sunIntensity: 3.05,
    sunColor: "#fff6e5",
    ambientRimScale: 0.42,
    bounceScale: 0.72
  },
  inspect: {
    ambientIntensity: 0.19,
    ambientColor: "#1e293b",
    hemiIntensity: 0.16,
    hemiSkyColor: "#334155",
    hemiGroundColor: "#0b1120",
    sunIntensity: 2.45,
    sunColor: "#ffffff",
    ambientRimScale: 1.45,
    bounceScale: 1.5
  }
};

export function getSceneLightRigPreset(mode: LightingMode): SceneLightRigPreset {
  return SCENE_LIGHT_PRESETS[mode];
}

export interface BodyShadingConfig {
  sunBoost: number;
  keyTint: Color;
  atmoStrength: number;
  twilightColor: Color;
  proceduralKind: number;
  oceanSpecular: number;
  ambientRim: number;
  bounceColor: Color;
  bounceBaseIntensity: number;
  hasAtmosphere: boolean;
}

const PROCEDURAL_KIND_BY_ID: Partial<Record<BodyId, number>> = {
  io: 1,
  europa: 2,
  ganymede: 3,
  callisto: 4,
  titania: 5,
  oberon: 6,
  triton: 7
};

const ATMOSPHERE_PROFILES: Partial<
  Record<BodyId, { strength: number; twilight: string }>
> = {
  venus: { strength: 0.48, twilight: "#f59e0b" },
  earth: { strength: 0.42, twilight: "#f97316" },
  mars: { strength: 0.22, twilight: "#fb7185" },
  jupiter: { strength: 0.18, twilight: "#d99b66" },
  saturn: { strength: 0.16, twilight: "#dcb87e" },
  uranus: { strength: 0.22, twilight: "#38bdf8" },
  neptune: { strength: 0.26, twilight: "#4f46e5" },
  titan: { strength: 0.62, twilight: "#ea580c" }
};

const PLANETSHINE_COLORS: Partial<Record<BodyId, string>> = {
  earth: "#5aa9ff",
  moon: "#cbd5e1",
  jupiter: "#e6c38d",
  saturn: "#e8d39f",
  uranus: "#7dd3fc",
  neptune: "#60a5fa",
  pluto: "#c7ad90",
  charon: "#9ca3af"
};

// Map each parent planet to its inner/major moons that can cast transit shadows.
const MOONS_BY_PARENT: Partial<Record<BodyId, BodyData[]>> = {};
for (const body of ALL_BODIES) {
  if (body.kind === "moon" && body.parentId) {
    const list = MOONS_BY_PARENT[body.parentId] ?? [];
    list.push(body);
    MOONS_BY_PARENT[body.parentId] = list;
  }
}

function getHeliocentricAu(body: BodyData): number {
  if (body.kind === "moon" && body.parentId) {
    const parent = PLANET_BY_ID[body.parentId];
    if (parent?.orbit) {
      return parent.orbit.semiMajorAxisKm / AU_IN_KM;
    }
  }
  return body.orbit ? body.orbit.semiMajorAxisKm / AU_IN_KM : 1;
}

export function bodyHasRefractiveAtmosphere(id: BodyId): boolean {
  return Boolean(ATMOSPHERE_PROFILES[id]);
}

export function getBodyShadingConfig(
  body: BodyData,
  mode: LightingMode
): BodyShadingConfig {
  const preset = getSceneLightRigPreset(mode);
  const au = Math.max(0.2, getHeliocentricAu(body));

  // Compressed inverse-square solar irradiance curve so inner worlds gleam warmly
  // while distant outer ice/dwarf worlds remain clearly resolved and cool-toned.
  const perceptualDrop = Math.pow(1.0 / au, 0.13);
  const boost = body.render.materialPreset?.illuminationBoost ?? 0;
  const sunBoost = Math.min(1.42, Math.max(0.84, 1.05 * perceptualDrop + boost * 0.28));

  // Subtle solar-temperature spectral shift from golden-white near Mercury to cool slate at Pluto
  const warmth = Math.max(0, Math.min(1, 1 - Math.log10(au + 0.5) / 1.65));
  const keyTint = new Color().lerpColors(
    new Color("#dcebff"),
    new Color("#fff3db"),
    warmth
  );

  const atmo = ATMOSPHERE_PROFILES[body.id];
  const bounceParentId =
    body.kind === "moon" && body.parentId
      ? body.parentId
      : body.id === "pluto"
        ? "charon"
        : body.id === "charon"
          ? "pluto"
          : body.id === "earth"
            ? "moon"
            : body.id;
  const bounceColor = new Color(
    PLANETSHINE_COLORS[bounceParentId] ?? "#94a3b8"
  );

  const baseBounce =
    body.kind === "moon"
      ? 0.24
      : body.id === "pluto" || body.id === "charon"
        ? 0.12
        : body.id === "saturn"
          ? 0.10
          : 0.05;

  return {
    sunBoost,
    keyTint,
    atmoStrength: atmo?.strength ?? 0,
    twilightColor: new Color(atmo?.twilight ?? "#94a3b8"),
    proceduralKind: !body.render.textureUrl ? (PROCEDURAL_KIND_BY_ID[body.id] ?? 0) : 0,
    oceanSpecular: body.id === "earth" ? 1 : 0,
    ambientRim: 0.045 * preset.ambientRimScale,
    bounceColor,
    bounceBaseIntensity: baseBounce * preset.bounceScale,
    hasAtmosphere: Boolean(atmo)
  };
}

export interface SolarSurfaceUniforms {
  uSunBoost: { value: number };
  uKeyTint: { value: Color };
  uAmbientRim: { value: number };
  uTwilightColor: { value: Color };
  uAtmoStrength: { value: number };
  uOccluders: { value: Vector4[] };
  uOccluderAtmos: { value: number[] };
  uOccluderCount: { value: number };
  uBouncePos: { value: Vector3 };
  uBounceColor: { value: Color };
  uBounceIntensity: { value: number };
}

// Reusable scratch vectors for zero-allocation per-frame lighting updates
const _selfWorldPos = new Vector3();
const _otherWorldPos = new Vector3();
const _sunToOther = new Vector3();
const _otherToSelf = new Vector3();

function resolveBodyRenderRadius(body: BodyData): number {
  const isMoon = body.kind === "moon";
  const parentRadiusKm =
    isMoon && body.parentId
      ? PLANET_BY_ID[body.parentId]?.render.radiusKm
      : undefined;
  return scalePlanetRadius(body.render.radiusKm, isMoon, parentRadiusKm);
}

/**
 * Updates per-frame world-space occluders (parent eclipses, moon transits,
 * Pluto-Charon mutual eclipses) and sunlit neighbor planetshine without allocations.
 */
export function updateBodyLightingUniforms(
  body: BodyData,
  bodyObject: Object3D,
  planetRefs: React.MutableRefObject<Record<BodyId, Object3D | null>> | undefined,
  uniforms: SolarSurfaceUniforms,
  baseBounceIntensity: number
): void {
  bodyObject.getWorldPosition(_selfWorldPos);

  const occluders = uniforms.uOccluders.value;
  const atmos = uniforms.uOccluderAtmos.value;
  let occCount = 0;

  if (planetRefs?.current) {
    const pushOccluder = (targetBody: BodyData | undefined) => {
      if (!targetBody || occCount >= MAX_OCCLUDERS) return;
      const obj = planetRefs.current[targetBody.id];
      if (!obj || !obj.visible) return;
      obj.getWorldPosition(_otherWorldPos);
      occluders[occCount].set(
        _otherWorldPos.x,
        _otherWorldPos.y,
        _otherWorldPos.z,
        resolveBodyRenderRadius(targetBody)
      );
      atmos[occCount] = bodyHasRefractiveAtmosphere(targetBody.id) ? 1.0 : 0.0;
      occCount += 1;
    };

    if (body.kind === "moon" && body.parentId) {
      // Moons are shadowed by their parent planet (e.g. Earth -> Moon, Jupiter -> Ganymede)
      pushOccluder(PLANET_BY_ID[body.parentId]);
    } else if (body.id === "pluto") {
      pushOccluder(PLANET_BY_ID.charon);
    } else if (body.id === "charon") {
      pushOccluder(PLANET_BY_ID.pluto);
    } else {
      // Major planets receive tiny crisp transit shadows from their moons when aligned
      const siblingMoons = MOONS_BY_PARENT[body.id];
      if (siblingMoons) {
        for (let i = 0; i < siblingMoons.length && occCount < MAX_OCCLUDERS; i += 1) {
          pushOccluder(siblingMoons[i]);
        }
      }
    }
  }

  uniforms.uOccluderCount.value = occCount;

  // Compute secondary reflected planetshine from primary companion / ring plane
  let bounceSourceId: BodyId | undefined;
  if (body.kind === "moon" && body.parentId) {
    bounceSourceId = body.parentId;
  } else if (body.id === "pluto") {
    bounceSourceId = "charon";
  } else if (body.id === "charon") {
    bounceSourceId = "pluto";
  }

  if (bounceSourceId && planetRefs?.current?.[bounceSourceId]) {
    const sourceObj = planetRefs.current[bounceSourceId];
    if (sourceObj) {
      sourceObj.getWorldPosition(_otherWorldPos);
      uniforms.uBouncePos.value.copy(_otherWorldPos);

      // Phase factor: neighbor only bounces light onto body if Sun illuminates neighbor's facing side
      _sunToOther.copy(_otherWorldPos).normalize().negate(); // direction from neighbor to Sun
      _otherToSelf.copy(_selfWorldPos).sub(_otherWorldPos).normalize();
      const phase = Math.max(0.08, 0.5 + 0.5 * _sunToOther.dot(_otherToSelf));
      uniforms.uBounceIntensity.value = baseBounceIntensity * phase;
      return;
    }
  }

  if (body.id === "saturn" || body.id === "uranus") {
    // Self ringshine bounces subtle ambient scatter upward/downward from the bright equatorial rings
    uniforms.uBouncePos.value.copy(_selfWorldPos).setY(_selfWorldPos.y + 0.25);
    uniforms.uBounceIntensity.value = baseBounceIntensity * 0.7;
    return;
  }

  uniforms.uBounceIntensity.value = 0;
}
