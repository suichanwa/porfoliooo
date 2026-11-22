export type BodyId =
  | "sun"
  | "mercury"
  | "venus"
  | "earth"
  | "moon"
  | "mars"
  | "jupiter"
  | "io"
  | "europa"
  | "ganymede"
  | "callisto"
  | "saturn"
  | "enceladus"
  | "titan"
  | "uranus"
  | "ariel"
  | "titania"
  | "oberon"
  | "neptune"
  | "triton"
  | "ceres"
  | "pluto"
  | "charon"
  | "voyager1"
  | "halley"
  | "halebopp";

export type BodyKind = "star" | "planet" | "dwarf" | "moon" | "object" | "probe" | "comet";

export interface SecularRates {
  /** Semi-major axis drift (AU / Julian century) */
  aDotAuPerCentury?: number;
  /** Eccentricity drift (/ Julian century) */
  eDotPerCentury?: number;
  /** Inclination drift (deg / Julian century) */
  iDotDegPerCentury?: number;
  /** Mean longitude rate (deg / Julian century) */
  lDotDegPerCentury?: number;
  /** Longitude of perihelion drift (deg / Julian century) */
  periLonDotDegPerCentury?: number;
  /** Longitude of ascending node drift (deg / Julian century) */
  ascNodeDotDegPerCentury?: number;
}

export interface MeanAnomalyPerturbation {
  /** NASA/JPL Table 2b outer-planet terms: ΔM = b·T² + c·cos(f·T) + s·sin(f·T) (deg) */
  b: number;
  c: number;
  s: number;
  f: number;
}

export interface EscapeTrajectory {
  /** Heliocentric distance at J2000.0 epoch (AU) */
  distanceAtJ2000Au: number;
  /** Outward radial escape speed (AU / Julian year) */
  radialSpeedAuPerYear: number;
  /** Asymptotic ecliptic longitude λ (deg) */
  eclipticLonDeg: number;
  /** Asymptotic ecliptic latitude β (deg) */
  eclipticLatDeg: number;
  /** Minimum clamp distance when rewinding past launch (AU) */
  minDistanceAu?: number;
  /** Maximum plotted escape ray distance (AU) */
  maxPlotDistanceAu?: number;
  /** Optional historical multi-flyby trajectory preset (e.g. Voyager 1 Earth->Jupiter->Saturn->Interstellar) */
  historicalPreset?: "voyager1";
}

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
  /** Longitude of ascending node Ω (deg). Orients the 3D line of nodes where the orbit crosses north of the ecliptic. */
  longitudeOfAscendingNodeDeg?: number;
  /** NASA/JPL Table 1 secular rates per Julian century (T = daysSinceJ2000 / 36525). */
  secularRates?: SecularRates;
  /** NASA/JPL Table 2b outer-planet long-period perturbation terms. */
  perturbation?: MeanAnomalyPerturbation;
  /** Radial hyperbolic escape trajectory (e.g. Voyager 1) instead of a closed ellipse. */
  escapeTrajectory?: EscapeTrajectory;
  /** Reference plane for moons: "ecliptic" (Earth's Moon) vs "equatorial" (default, parent equator). */
  orbitFrame?: "ecliptic" | "equatorial";
}

export interface RotationElements {
  rotationPeriodHours: number;
  axialTiltDeg: number;
  /** IAU J2000 equatorial Right Ascension α₀ of the spin pole (deg). */
  poleRaDeg?: number;
  /** IAU J2000 equatorial Declination δ₀ of the spin pole (deg). */
  poleDecDeg?: number;
  /** True when rotation around the specified pole is retrograde (e.g. Venus). */
  retrogradeSpin?: boolean;
  tidallyLocked?: boolean;
}

export interface MaterialPreset {
  roughness: number;
  metalness: number;
  illuminationBoost?: number;
  normalScale?: number;
}

export interface RimGlowPreset {
  color?: string;
  outerColor?: string;
  terminatorColor?: string;
  colorMix?: number;
  opacity?: number;
  scale?: number;
  power?: number;
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
  moonIndex?: number;
  totalSiblingMoons?: number;
  massKg: number;
  mu?: number;
  orbit?: OrbitElements;
  rotation: RotationElements;
  render: RenderPreset;
  rings?: RingPreset | RingPreset[];
}
