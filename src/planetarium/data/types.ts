export type BodyId =
  | "sun"
  | "mercury"
  | "venus"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "ceres"
  | "pluto";

export type BodyKind = "star" | "planet" | "dwarf" | "moon";

export interface OrbitElements {
  semiMajorAxisKm: number;
  eccentricity: number;
  inclinationDeg: number;
  orbitalPeriodDays: number;
  phaseAtEpoch?: number;
}

export interface RotationElements {
  rotationPeriodHours: number;
  axialTiltDeg: number;
  tidallyLocked?: boolean;
}

export interface MaterialPreset {
  roughness: number;
  metalness: number;
}

export interface RimGlowPreset {
  color?: string;
  opacity?: number;
  scale?: number;
}

export interface GlowPreset {
  color: string;
  intensity: number;
  rim?: RimGlowPreset;
}

export interface RenderPreset {
  radiusKm: number;
  textureUrl?: string | null;
  normalUrl?: string | null;
  bumpUrl?: string | null;
  colorFallback: string;
  materialPreset?: MaterialPreset;
  glowPreset?: GlowPreset;
}

export interface RingPreset {
  innerRadiusKm: number;
  outerRadiusKm: number;
  textureUrl: string;
}

export interface BodyData {
  id: BodyId;
  name: string;
  kind: BodyKind;
  parentId?: BodyId;
  massKg: number;
  mu?: number;
  orbit?: OrbitElements;
  rotation: RotationElements;
  render: RenderPreset;
  rings?: RingPreset;
}
