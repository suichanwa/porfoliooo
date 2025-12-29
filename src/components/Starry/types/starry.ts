export type StarType = "giant" | "bright" | "standard" | "distant";

export interface StarTypeProfile {
  weight: number;
  radiusMin: number;
  radiusMax: number;
  opacityMin: number;
  opacityMax: number;
  twinkleMin: number;
  twinkleMax: number;
  driftXMax: number;
  driftYMax: number;
  driftSpeedMin: number;
  driftSpeedMax: number;
}

export const STAR_TYPES: Record<StarType, StarTypeProfile> = {
  giant: {
    weight: 0.05,
    radiusMin: 2.2,
    radiusMax: 3.4,
    opacityMin: 0.7,
    opacityMax: 0.95,
    twinkleMin: 0.0007,
    twinkleMax: 0.0016,
    driftXMax: 2.2,
    driftYMax: 1.8,
    driftSpeedMin: 0.00045,
    driftSpeedMax: 0.0009
  },
  bright: {
    weight: 0.2,
    radiusMin: 1.5,
    radiusMax: 2.2,
    opacityMin: 0.6,
    opacityMax: 0.85,
    twinkleMin: 0.0006,
    twinkleMax: 0.0014,
    driftXMax: 1.8,
    driftYMax: 1.4,
    driftSpeedMin: 0.0004,
    driftSpeedMax: 0.0008
  },
  standard: {
    weight: 0.5,
    radiusMin: 0.9,
    radiusMax: 1.4,
    opacityMin: 0.5,
    opacityMax: 0.75,
    twinkleMin: 0.0005,
    twinkleMax: 0.0012,
    driftXMax: 1.4,
    driftYMax: 1.1,
    driftSpeedMin: 0.00035,
    driftSpeedMax: 0.0007
  },
  distant: {
    weight: 0.25,
    radiusMin: 0.4,
    radiusMax: 0.9,
    opacityMin: 0.35,
    opacityMax: 0.6,
    twinkleMin: 0.0004,
    twinkleMax: 0.001,
    driftXMax: 1.0,
    driftYMax: 0.9,
    driftSpeedMin: 0.0003,
    driftSpeedMax: 0.0006
  }
};

export const STAR_TYPE_ORDER: StarType[] = ["giant", "bright", "standard", "distant"];
