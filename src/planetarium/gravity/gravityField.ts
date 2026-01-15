import { Vector3 } from "three";
import type { BodyId } from "../data/types";

export interface GravityBody {
  id: BodyId;
  position: Vector3;
  massKg: number;
  radiusKm: number;
  visualMass: number;
}

export interface MassScaleParams {
  minLogMass: number;
  maxLogMass: number;
  power: number;
  scale: number;
}

export const DEFAULT_MASS_SCALE_PARAMS: MassScaleParams = {
  minLogMass: 20,
  maxLogMass: 30,
  power: 0.8,
  scale: 1
};

export const getMassScaleForVisuals = (
  massKg: number,
  params: MassScaleParams = DEFAULT_MASS_SCALE_PARAMS
) => {
  const safeMass = Math.max(1, massKg);
  const logMass = Math.log10(safeMass);
  const normalized =
    (logMass - params.minLogMass) /
    Math.max(1, params.maxLogMass - params.minLogMass);
  const clamped = Math.min(1, Math.max(0, normalized));
  return Math.pow(clamped, params.power) * params.scale;
};

export interface GravityFieldParams {
  softening: number;
  maxInfluence: number;
  falloffRadius?: number;
  massScale?: MassScaleParams;
  debug?: boolean;
}

export interface GravitySettings {
  gridStrength: number;
  lensingStrength: number;
  softening: number;
  maxInfluence: number;
}

export const DEFAULT_GRAVITY_SETTINGS: GravitySettings = {
  gridStrength: 0.55,
  lensingStrength: 0.25,
  softening: 4.5,
  maxInfluence: 2.2
};

export const gravityInfluence = (
  pointWorld: Vector3,
  bodies: GravityBody[],
  params: GravityFieldParams
) => {
  const softeningSq = params.softening * params.softening;
  const falloffSq = params.falloffRadius
    ? params.falloffRadius * params.falloffRadius
    : null;
  let influence = 0;

  for (const body of bodies) {
    const distSq = pointWorld.distanceToSquared(body.position);
    if (falloffSq && distSq > falloffSq) continue;
    const visualMass = getMassScaleForVisuals(
      body.massKg,
      params.massScale ?? DEFAULT_MASS_SCALE_PARAMS
    );
    influence += visualMass / (distSq + softeningSq);
  }

  const clamped = Math.min(params.maxInfluence, influence);
  if (params.debug) {
    // Optional debug hook for manual inspection.
    console.debug("gravityInfluence", clamped);
  }
  return clamped;
};
