export type BodyId =
  | "sun"
  | "mercury"
  | "venus"
  | "earth"
  | "moon"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune"
  | "ceres"
  | "pluto";

export type BodyKind = "star" | "planet" | "dwarf" | "moon" | "object";

export interface OrbitElements {
  semiMajorAxisKm: number;
  eccentricity: number;
  inclinationDeg: number;
  orbitalPeriodDays: number;
  /** Legacy manual phase offset (radians). Used only when J2000 elements absent. */
  phaseAtEpoch?: number;
  /** Mean longitude L at the J2000 epoch (deg). Drives the real "now" position. */
  meanLongitudeAtEpochDeg?: number;
  /** Longitude of perihelion ϖ = Ω + ω (deg). Orients the orbit in the ecliptic. */
  longitudeOfPerihelionDeg?: number;
}

export interface RotationElements {
  rotationPeriodHours: number;
  axialTiltDeg: number;
  tidallyLocked?: boolean;
}

export interface MaterialPreset {
  roughness: number;
  metalness: number;
  illuminationBoost?: number;
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

export interface BendingDimensions {
  topHeight: number;
  bottomDepth: number;
  contactRadius: number;
  funnelReach: number;
}

export interface RenderPreset {
  radiusKm: number;
  textureUrl?: string | null;
  normalUrl?: string | null;
  bumpUrl?: string | null;
  modelUrl?: string | null;
  colorFallback: string;
  materialPreset?: MaterialPreset;
  glowPreset?: GlowPreset;
  bendingDimensions?: BendingDimensions;
}

export interface RingPreset {
  name?: string;
  innerRadiusKm: number;
  outerRadiusKm: number;
  textureUrl?: string | null;
  color?: string;
  opacity?: number;
  patternSeed?: number;
  bandDensity?: number;
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
  rings?: RingPreset | RingPreset[];
}
