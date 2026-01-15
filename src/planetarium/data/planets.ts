import type { BodyData, GlowPreset, MaterialPreset } from "./types";
import { PLANET_TEXTURES, SATURN_RING_ALPHA_TEXTURE } from "./textures";
import { auToKm } from "../utils/units";

const G = 6.6743e-11;
const toMu = (massKg: number) => massKg * G;

const DEFAULT_MATERIAL: MaterialPreset = { roughness: 0.85, metalness: 0 };
const PLANET_GLOW: GlowPreset = { color: "#f3d4a6", intensity: 0.12 };
const DWARF_GLOW: GlowPreset = { color: "#f3d4a6", intensity: 0.08 };
const STAR_GLOW: GlowPreset = { color: "#f5c96b", intensity: 1.2 };

export const PLANETS: BodyData[] = [
  {
    id: "sun",
    name: "Sun",
    kind: "star",
    massKg: 1.9885e30,
    mu: toMu(1.9885e30),
    rotation: {
      axialTiltDeg: 7.25,
      rotationPeriodHours: 609.12
    },
    render: {
      radiusKm: 696340,
      colorFallback: "#f6c453",
      textureUrl: PLANET_TEXTURES.sun,
      materialPreset: { roughness: 0.9, metalness: 0 },
      glowPreset: STAR_GLOW
    }
  },
  {
    id: "mercury",
    name: "Mercury",
    kind: "planet",
    parentId: "sun",
    massKg: 3.3011e23,
    mu: toMu(3.3011e23),
    rotation: {
      axialTiltDeg: 0.034,
      rotationPeriodHours: 1407.6
    },
    render: {
      radiusKm: 2439.7,
      colorFallback: "#9f9a91",
      textureUrl: PLANET_TEXTURES.mercury,
      materialPreset: DEFAULT_MATERIAL,
      glowPreset: PLANET_GLOW
    },
    orbit: {
      semiMajorAxisKm: auToKm(0.387),
      eccentricity: 0.2056,
      inclinationDeg: 7.005,
      orbitalPeriodDays: 87.969
    }
  },
  {
    id: "venus",
    name: "Venus",
    kind: "planet",
    parentId: "sun",
    massKg: 4.8675e24,
    mu: toMu(4.8675e24),
    rotation: {
      axialTiltDeg: 177.36,
      rotationPeriodHours: 5832.5
    },
    render: {
      radiusKm: 6051.8,
      colorFallback: "#d8c38f",
      textureUrl: PLANET_TEXTURES.venus,
      materialPreset: DEFAULT_MATERIAL,
      glowPreset: PLANET_GLOW
    },
    orbit: {
      semiMajorAxisKm: auToKm(0.723),
      eccentricity: 0.0067,
      inclinationDeg: 3.394,
      orbitalPeriodDays: 224.701
    }
  },
  {
    id: "earth",
    name: "Earth",
    kind: "planet",
    parentId: "sun",
    massKg: 5.9724e24,
    mu: toMu(5.9724e24),
    rotation: {
      axialTiltDeg: 23.44,
      rotationPeriodHours: 23.93
    },
    render: {
      radiusKm: 6371,
      colorFallback: "#4c8fbe",
      textureUrl: PLANET_TEXTURES.earth,
      materialPreset: DEFAULT_MATERIAL,
      glowPreset: PLANET_GLOW
    },
    orbit: {
      semiMajorAxisKm: auToKm(1),
      eccentricity: 0.0167,
      inclinationDeg: 0,
      orbitalPeriodDays: 365.256
    }
  },
  {
    id: "mars",
    name: "Mars",
    kind: "planet",
    parentId: "sun",
    massKg: 6.4171e23,
    mu: toMu(6.4171e23),
    rotation: {
      axialTiltDeg: 25.19,
      rotationPeriodHours: 24.62
    },
    render: {
      radiusKm: 3389.5,
      colorFallback: "#c96f49",
      textureUrl: PLANET_TEXTURES.mars,
      materialPreset: DEFAULT_MATERIAL,
      glowPreset: PLANET_GLOW
    },
    orbit: {
      semiMajorAxisKm: auToKm(1.524),
      eccentricity: 0.0934,
      inclinationDeg: 1.85,
      orbitalPeriodDays: 686.98
    }
  },
  {
    id: "jupiter",
    name: "Jupiter",
    kind: "planet",
    parentId: "sun",
    massKg: 1.8982e27,
    mu: toMu(1.8982e27),
    rotation: {
      axialTiltDeg: 3.13,
      rotationPeriodHours: 9.93
    },
    render: {
      radiusKm: 69911,
      colorFallback: "#d1b38d",
      textureUrl: PLANET_TEXTURES.jupiter,
      materialPreset: DEFAULT_MATERIAL,
      glowPreset: PLANET_GLOW
    },
    orbit: {
      semiMajorAxisKm: auToKm(5.204),
      eccentricity: 0.0489,
      inclinationDeg: 1.304,
      orbitalPeriodDays: 4332.59
    }
  },
  {
    id: "saturn",
    name: "Saturn",
    kind: "planet",
    parentId: "sun",
    massKg: 5.6834e26,
    mu: toMu(5.6834e26),
    rotation: {
      axialTiltDeg: 26.73,
      rotationPeriodHours: 10.7
    },
    render: {
      radiusKm: 58232,
      colorFallback: "#d8c190",
      textureUrl: PLANET_TEXTURES.saturn,
      materialPreset: DEFAULT_MATERIAL,
      glowPreset: PLANET_GLOW
    },
    rings: SATURN_RING_ALPHA_TEXTURE
      ? {
          innerRadiusKm: 74500,
          outerRadiusKm: 140220,
          textureUrl: SATURN_RING_ALPHA_TEXTURE
        }
      : undefined,
    orbit: {
      semiMajorAxisKm: auToKm(9.582),
      eccentricity: 0.0565,
      inclinationDeg: 2.485,
      orbitalPeriodDays: 10759.22
    }
  },
  {
    id: "uranus",
    name: "Uranus",
    kind: "planet",
    parentId: "sun",
    massKg: 8.681e25,
    mu: toMu(8.681e25),
    rotation: {
      axialTiltDeg: 97.77,
      rotationPeriodHours: 17.24
    },
    render: {
      radiusKm: 25362,
      colorFallback: "#93c7db",
      textureUrl: PLANET_TEXTURES.uranus,
      materialPreset: DEFAULT_MATERIAL,
      glowPreset: PLANET_GLOW
    },
    orbit: {
      semiMajorAxisKm: auToKm(19.201),
      eccentricity: 0.0472,
      inclinationDeg: 0.773,
      orbitalPeriodDays: 30685.4
    }
  },
  {
    id: "neptune",
    name: "Neptune",
    kind: "planet",
    parentId: "sun",
    massKg: 1.02413e26,
    mu: toMu(1.02413e26),
    rotation: {
      axialTiltDeg: 28.32,
      rotationPeriodHours: 16.11
    },
    render: {
      radiusKm: 24622,
      colorFallback: "#3f6fb3",
      textureUrl: PLANET_TEXTURES.neptune,
      materialPreset: DEFAULT_MATERIAL,
      glowPreset: PLANET_GLOW
    },
    orbit: {
      semiMajorAxisKm: auToKm(30.047),
      eccentricity: 0.0086,
      inclinationDeg: 1.77,
      orbitalPeriodDays: 60190
    }
  },
  {
    id: "ceres",
    name: "Ceres",
    kind: "dwarf",
    parentId: "sun",
    massKg: 9.393e20,
    mu: toMu(9.393e20),
    rotation: {
      axialTiltDeg: 4,
      rotationPeriodHours: 9.07
    },
    render: {
      radiusKm: 473,
      colorFallback: "#8d8c89",
      textureUrl: PLANET_TEXTURES.ceres,
      materialPreset: DEFAULT_MATERIAL,
      glowPreset: DWARF_GLOW
    },
    orbit: {
      semiMajorAxisKm: auToKm(2.7675),
      eccentricity: 0.0758,
      inclinationDeg: 10.59,
      orbitalPeriodDays: 1680.9
    }
  },
  {
    id: "pluto",
    name: "Pluto",
    kind: "dwarf",
    parentId: "sun",
    massKg: 1.303e22,
    mu: toMu(1.303e22),
    rotation: {
      axialTiltDeg: 119.6,
      rotationPeriodHours: 153.3
    },
    render: {
      radiusKm: 1188.3,
      colorFallback: "#b7a99a",
      textureUrl: PLANET_TEXTURES.pluto,
      materialPreset: DEFAULT_MATERIAL,
      glowPreset: DWARF_GLOW
    },
    orbit: {
      semiMajorAxisKm: auToKm(39.482),
      eccentricity: 0.2488,
      inclinationDeg: 17.16,
      orbitalPeriodDays: 90560
    }
  }
];
