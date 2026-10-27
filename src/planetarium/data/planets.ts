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
      materialPreset: { roughness: 0.9, metalness: 0.15 },
      glowPreset: STAR_GLOW,
      bendingDimensions: {
        topHeight: 2.6,
        bottomDepth: 6.5,
        contactRadius: 2.6,
        funnelReach: 18.0
      }
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
      glowPreset: PLANET_GLOW,
      bendingDimensions: {
        topHeight: 0.35,
        bottomDepth: 0.75,
        contactRadius: 0.35,
        funnelReach: 2.0
      }
    },
    orbit: {
      semiMajorAxisKm: auToKm(0.387),
      eccentricity: 0.2056,
      inclinationDeg: 7.005,
      orbitalPeriodDays: 87.969,
      meanLongitudeAtEpochDeg: 252.2503235,
      longitudeOfPerihelionDeg: 77.45779628
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
      glowPreset: PLANET_GLOW,
      bendingDimensions: {
        topHeight: 0.48,
        bottomDepth: 1.35,
        contactRadius: 0.48,
        funnelReach: 3.2
      }
    },
    orbit: {
      semiMajorAxisKm: auToKm(0.723),
      eccentricity: 0.0067,
      inclinationDeg: 3.394,
      orbitalPeriodDays: 224.701,
      meanLongitudeAtEpochDeg: 181.9790995,
      longitudeOfPerihelionDeg: 131.60246718
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
      glowPreset: PLANET_GLOW,
      bendingDimensions: {
        topHeight: 0.5,
        bottomDepth: 1.45,
        contactRadius: 0.5,
        funnelReach: 3.5
      }
    },
    orbit: {
      semiMajorAxisKm: auToKm(1),
      eccentricity: 0.0167,
      inclinationDeg: 0,
      orbitalPeriodDays: 365.256,
      meanLongitudeAtEpochDeg: 100.46457166,
      longitudeOfPerihelionDeg: 102.93768193
    }
  },
  {
    id: "moon",
    name: "Moon",
    kind: "moon",
    parentId: "earth",
    moonIndex: 0,
    totalSiblingMoons: 1,
    massKg: 7.342e22,
    mu: toMu(7.342e22),
    rotation: {
      axialTiltDeg: 1.54,
      rotationPeriodHours: 655.72,
      tidallyLocked: true
    },
    render: {
      radiusKm: 1737.4,
      colorFallback: "#c2c2c2",
      textureUrl: PLANET_TEXTURES.moon,
      materialPreset: DEFAULT_MATERIAL,
      glowPreset: { color: "#d8d8d8", intensity: 0.08 },
      bendingDimensions: {
        topHeight: 0.22,
        bottomDepth: 0.6,
        contactRadius: 0.22,
        funnelReach: 1.6
      }
    },
    orbit: {
      semiMajorAxisKm: 384400,
      eccentricity: 0.0549,
      inclinationDeg: 5.145,
      orbitalPeriodDays: 27.32166,
      meanLongitudeAtEpochDeg: 218.316,
      longitudeOfPerihelionDeg: 83.353
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
      glowPreset: PLANET_GLOW,
      bendingDimensions: {
        topHeight: 0.4,
        bottomDepth: 1.05,
        contactRadius: 0.4,
        funnelReach: 2.6
      }
    },
    orbit: {
      semiMajorAxisKm: auToKm(1.524),
      eccentricity: 0.0934,
      inclinationDeg: 1.85,
      orbitalPeriodDays: 686.98,
      meanLongitudeAtEpochDeg: -4.55343205,
      longitudeOfPerihelionDeg: -23.94362959
    }
  },
  {
    id: "phobos",
    name: "Phobos",
    kind: "moon",
    parentId: "mars",
    moonIndex: 0,
    totalSiblingMoons: 2,
    massKg: 1.0659e16,
    mu: toMu(1.0659e16),
    rotation: {
      axialTiltDeg: 0,
      rotationPeriodHours: 7.65,
      tidallyLocked: true
    },
    render: {
      radiusKm: 11.267,
      colorFallback: "#a8a29e",
      textureUrl: null,
      materialPreset: { roughness: 0.95, metalness: 0 },
      glowPreset: { color: "#a8a29e", intensity: 0.04 }
    },
    orbit: {
      semiMajorAxisKm: 9376,
      eccentricity: 0.0151,
      inclinationDeg: 1.093,
      orbitalPeriodDays: 0.3189,
      meanLongitudeAtEpochDeg: 67.8,
      longitudeOfPerihelionDeg: 150.0
    }
  },
  {
    id: "deimos",
    name: "Deimos",
    kind: "moon",
    parentId: "mars",
    moonIndex: 1,
    totalSiblingMoons: 2,
    massKg: 1.4762e15,
    mu: toMu(1.4762e15),
    rotation: {
      axialTiltDeg: 0,
      rotationPeriodHours: 30.3,
      tidallyLocked: true
    },
    render: {
      radiusKm: 6.2,
      colorFallback: "#78716c",
      textureUrl: null,
      materialPreset: { roughness: 0.95, metalness: 0 },
      glowPreset: { color: "#78716c", intensity: 0.04 }
    },
    orbit: {
      semiMajorAxisKm: 23463,
      eccentricity: 0.00033,
      inclinationDeg: 0.93,
      orbitalPeriodDays: 1.2624,
      meanLongitudeAtEpochDeg: 194.2,
      longitudeOfPerihelionDeg: 280.0
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
      glowPreset: PLANET_GLOW,
      bendingDimensions: {
        topHeight: 1.15,
        bottomDepth: 3.4,
        contactRadius: 1.15,
        funnelReach: 8.0
      }
    },
    rings: {
      innerRadiusKm: 100000,
      outerRadiusKm: 130000,
      color: "#bca987",
      opacity: 0.18,
      patternSeed: 11,
      bandDensity: 0.35
    },
    orbit: {
      semiMajorAxisKm: auToKm(5.204),
      eccentricity: 0.0489,
      inclinationDeg: 1.304,
      orbitalPeriodDays: 4332.59,
      meanLongitudeAtEpochDeg: 34.39644051,
      longitudeOfPerihelionDeg: 14.72847983
    }
  },
  {
    id: "io",
    name: "Io",
    kind: "moon",
    parentId: "jupiter",
    moonIndex: 0,
    totalSiblingMoons: 4,
    massKg: 8.9319e22,
    mu: toMu(8.9319e22),
    rotation: {
      axialTiltDeg: 0,
      rotationPeriodHours: 42.46,
      tidallyLocked: true
    },
    render: {
      radiusKm: 1821.6,
      colorFallback: "#eab308",
      textureUrl: null,
      materialPreset: { roughness: 0.8, metalness: 0, illuminationBoost: 0.05 },
      glowPreset: { color: "#eab308", intensity: 0.08 }
    },
    orbit: {
      semiMajorAxisKm: 421700,
      eccentricity: 0.0041,
      inclinationDeg: 0.05,
      orbitalPeriodDays: 1.769,
      meanLongitudeAtEpochDeg: 106.0,
      longitudeOfPerihelionDeg: 84.0
    }
  },
  {
    id: "europa",
    name: "Europa",
    kind: "moon",
    parentId: "jupiter",
    moonIndex: 1,
    totalSiblingMoons: 4,
    massKg: 4.7998e22,
    mu: toMu(4.7998e22),
    rotation: {
      axialTiltDeg: 0.1,
      rotationPeriodHours: 85.23,
      tidallyLocked: true
    },
    render: {
      radiusKm: 1560.8,
      colorFallback: "#cffafe",
      textureUrl: null,
      materialPreset: { roughness: 0.45, metalness: 0.05, illuminationBoost: 0.12 },
      glowPreset: { color: "#cffafe", intensity: 0.1 }
    },
    orbit: {
      semiMajorAxisKm: 671034,
      eccentricity: 0.009,
      inclinationDeg: 0.47,
      orbitalPeriodDays: 3.551,
      meanLongitudeAtEpochDeg: 219.0,
      longitudeOfPerihelionDeg: 161.0
    }
  },
  {
    id: "ganymede",
    name: "Ganymede",
    kind: "moon",
    parentId: "jupiter",
    moonIndex: 2,
    totalSiblingMoons: 4,
    massKg: 1.4819e23,
    mu: toMu(1.4819e23),
    rotation: {
      axialTiltDeg: 0.2,
      rotationPeriodHours: 171.7,
      tidallyLocked: true
    },
    render: {
      radiusKm: 2634.1,
      colorFallback: "#cbd5e1",
      textureUrl: null,
      materialPreset: { roughness: 0.75, metalness: 0 },
      glowPreset: { color: "#cbd5e1", intensity: 0.06 }
    },
    orbit: {
      semiMajorAxisKm: 1070412,
      eccentricity: 0.0013,
      inclinationDeg: 0.2,
      orbitalPeriodDays: 7.155,
      meanLongitudeAtEpochDeg: 348.0,
      longitudeOfPerihelionDeg: 220.0
    }
  },
  {
    id: "callisto",
    name: "Callisto",
    kind: "moon",
    parentId: "jupiter",
    moonIndex: 3,
    totalSiblingMoons: 4,
    massKg: 1.0759e23,
    mu: toMu(1.0759e23),
    rotation: {
      axialTiltDeg: 0,
      rotationPeriodHours: 400.5,
      tidallyLocked: true
    },
    render: {
      radiusKm: 2410.3,
      colorFallback: "#94a3b8",
      textureUrl: null,
      materialPreset: { roughness: 0.85, metalness: 0 },
      glowPreset: { color: "#94a3b8", intensity: 0.05 }
    },
    orbit: {
      semiMajorAxisKm: 1882709,
      eccentricity: 0.0074,
      inclinationDeg: 0.28,
      orbitalPeriodDays: 16.689,
      meanLongitudeAtEpochDeg: 122.0,
      longitudeOfPerihelionDeg: 54.0
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
      glowPreset: PLANET_GLOW,
      bendingDimensions: {
        topHeight: 1.0,
        bottomDepth: 2.8,
        contactRadius: 1.0,
        funnelReach: 7.0
      }
    },
    rings: SATURN_RING_ALPHA_TEXTURE
      ? {
          innerRadiusKm: 74500,
          outerRadiusKm: 140220,
          textureUrl: SATURN_RING_ALPHA_TEXTURE,
          color: "#d8c7a4",
          opacity: 0.65,
          patternSeed: 5,
          bandDensity: 0.7
        }
      : undefined,
    orbit: {
      semiMajorAxisKm: auToKm(9.582),
      eccentricity: 0.0565,
      inclinationDeg: 2.485,
      orbitalPeriodDays: 10759.22,
      meanLongitudeAtEpochDeg: 49.95424423,
      longitudeOfPerihelionDeg: 92.59887831
    }
  },
  {
    id: "enceladus",
    name: "Enceladus",
    kind: "moon",
    parentId: "saturn",
    moonIndex: 0,
    totalSiblingMoons: 2,
    massKg: 1.08e20,
    mu: toMu(1.08e20),
    rotation: {
      axialTiltDeg: 0,
      rotationPeriodHours: 32.88,
      tidallyLocked: true
    },
    render: {
      radiusKm: 252.1,
      colorFallback: "#f8fafc",
      textureUrl: null,
      materialPreset: { roughness: 0.25, metalness: 0.1, illuminationBoost: 0.15 },
      glowPreset: { color: "#f8fafc", intensity: 0.12 }
    },
    orbit: {
      semiMajorAxisKm: 238000,
      eccentricity: 0.0047,
      inclinationDeg: 0.009,
      orbitalPeriodDays: 1.370,
      meanLongitudeAtEpochDeg: 197.0,
      longitudeOfPerihelionDeg: 280.0
    }
  },
  {
    id: "titan",
    name: "Titan",
    kind: "moon",
    parentId: "saturn",
    moonIndex: 1,
    totalSiblingMoons: 2,
    massKg: 1.3452e23,
    mu: toMu(1.3452e23),
    rotation: {
      axialTiltDeg: 0,
      rotationPeriodHours: 382.68,
      tidallyLocked: true
    },
    render: {
      radiusKm: 2574.7,
      colorFallback: "#f59e0b",
      textureUrl: null,
      materialPreset: { roughness: 0.65, metalness: 0, illuminationBoost: 0.12 },
      glowPreset: {
        color: "#f59e0b",
        intensity: 0.15,
        rim: {
          color: "#fbbf24",
          opacity: 0.35,
          scale: 1.06
        }
      }
    },
    orbit: {
      semiMajorAxisKm: 1221870,
      eccentricity: 0.0288,
      inclinationDeg: 0.348,
      orbitalPeriodDays: 15.945,
      meanLongitudeAtEpochDeg: 261.0,
      longitudeOfPerihelionDeg: 180.0
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
      materialPreset: { roughness: 0.85, metalness: 0, illuminationBoost: 0.15 },
      glowPreset: PLANET_GLOW,
      bendingDimensions: {
        topHeight: 0.75,
        bottomDepth: 2.0,
        contactRadius: 0.75,
        funnelReach: 5.0
      }
    },
    rings: {
      innerRadiusKm: 38000,
      outerRadiusKm: 51100,
      color: "#9aa7b6",
      opacity: 0.28,
      patternSeed: 23,
      bandDensity: 0.8
    },
    orbit: {
      semiMajorAxisKm: auToKm(19.201),
      eccentricity: 0.0472,
      inclinationDeg: 0.773,
      orbitalPeriodDays: 30685.4,
      meanLongitudeAtEpochDeg: 313.23810451,
      longitudeOfPerihelionDeg: 170.9542763
    }
  },
  {
    id: "titania",
    name: "Titania",
    kind: "moon",
    parentId: "uranus",
    moonIndex: 0,
    totalSiblingMoons: 2,
    massKg: 3.4e21,
    mu: toMu(3.4e21),
    rotation: {
      axialTiltDeg: 0,
      rotationPeriodHours: 208.94,
      tidallyLocked: true
    },
    render: {
      radiusKm: 788.4,
      colorFallback: "#cbd5e1",
      textureUrl: null,
      materialPreset: { roughness: 0.7, metalness: 0, illuminationBoost: 0.08 },
      glowPreset: { color: "#cbd5e1", intensity: 0.08 }
    },
    orbit: {
      semiMajorAxisKm: 435910,
      eccentricity: 0.0011,
      inclinationDeg: 0.34,
      orbitalPeriodDays: 8.706,
      meanLongitudeAtEpochDeg: 81.0,
      longitudeOfPerihelionDeg: 290.0
    }
  },
  {
    id: "oberon",
    name: "Oberon",
    kind: "moon",
    parentId: "uranus",
    moonIndex: 1,
    totalSiblingMoons: 2,
    massKg: 3.014e21,
    mu: toMu(3.014e21),
    rotation: {
      axialTiltDeg: 0,
      rotationPeriodHours: 323.11,
      tidallyLocked: true
    },
    render: {
      radiusKm: 761.4,
      colorFallback: "#94a3b8",
      textureUrl: null,
      materialPreset: { roughness: 0.8, metalness: 0, illuminationBoost: 0.06 },
      glowPreset: { color: "#94a3b8", intensity: 0.07 }
    },
    orbit: {
      semiMajorAxisKm: 583520,
      eccentricity: 0.0014,
      inclinationDeg: 0.058,
      orbitalPeriodDays: 13.463,
      meanLongitudeAtEpochDeg: 285.0,
      longitudeOfPerihelionDeg: 105.0
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
      materialPreset: { roughness: 0.55, metalness: 0.4, illuminationBoost: 0.18 },
      glowPreset: PLANET_GLOW,
      bendingDimensions: {
        topHeight: 0.72,
        bottomDepth: 1.95,
        contactRadius: 0.72,
        funnelReach: 4.8
      }
    },
    rings: [
      {
        name: "Galle",
        innerRadiusKm: 40900,
        outerRadiusKm: 42900,
        color: "#4a4f63",
        opacity: 0.08,
        patternSeed: 41,
        bandDensity: 0.25
      },
      {
        name: "Le Verrier",
        innerRadiusKm: 53143.5,
        outerRadiusKm: 53256.5,
        color: "#5a5567",
        opacity: 0.3,
        patternSeed: 52,
        bandDensity: 0.75
      },
      {
        name: "Lassell",
        innerRadiusKm: 53200,
        outerRadiusKm: 57200,
        color: "#43485a",
        opacity: 0.04,
        patternSeed: 63,
        bandDensity: 0.2
      },
      {
        name: "Arago",
        innerRadiusKm: 57160,
        outerRadiusKm: 57240,
        color: "#5f5a6d",
        opacity: 0.18,
        patternSeed: 74,
        bandDensity: 0.6
      },
      {
        name: "Adams",
        innerRadiusKm: 63912.5,
        outerRadiusKm: 63947.5,
        color: "#6a5f73",
        opacity: 0.32,
        patternSeed: 85,
        bandDensity: 0.82
      }
    ],
    orbit: {
      semiMajorAxisKm: auToKm(30.047),
      eccentricity: 0.0086,
      inclinationDeg: 1.77,
      orbitalPeriodDays: 60190,
      meanLongitudeAtEpochDeg: -55.12002969,
      longitudeOfPerihelionDeg: 44.96476227
    }
  },
  {
    id: "proteus",
    name: "Proteus",
    kind: "moon",
    parentId: "neptune",
    moonIndex: 0,
    totalSiblingMoons: 2,
    massKg: 4.4e19,
    mu: toMu(4.4e19),
    rotation: {
      axialTiltDeg: 0,
      rotationPeriodHours: 26.93,
      tidallyLocked: true
    },
    render: {
      radiusKm: 210,
      colorFallback: "#64748b",
      textureUrl: null,
      materialPreset: { roughness: 0.95, metalness: 0 },
      glowPreset: { color: "#64748b", intensity: 0.05 }
    },
    orbit: {
      semiMajorAxisKm: 117647,
      eccentricity: 0.0005,
      inclinationDeg: 0.55,
      orbitalPeriodDays: 1.122,
      meanLongitudeAtEpochDeg: 140.0,
      longitudeOfPerihelionDeg: 25.0
    }
  },
  {
    id: "triton",
    name: "Triton",
    kind: "moon",
    parentId: "neptune",
    moonIndex: 1,
    totalSiblingMoons: 2,
    massKg: 2.14e22,
    mu: toMu(2.14e22),
    rotation: {
      axialTiltDeg: 0,
      rotationPeriodHours: 141.05,
      tidallyLocked: true
    },
    render: {
      radiusKm: 1353.4,
      colorFallback: "#e2e8f0",
      textureUrl: null,
      materialPreset: { roughness: 0.4, metalness: 0.1, illuminationBoost: 0.14 },
      glowPreset: { color: "#e2e8f0", intensity: 0.1 }
    },
    orbit: {
      semiMajorAxisKm: 354759,
      eccentricity: 0.000016,
      inclinationDeg: 156.885,
      orbitalPeriodDays: -5.877,
      meanLongitudeAtEpochDeg: 253.0,
      longitudeOfPerihelionDeg: 160.0
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
      materialPreset: { roughness: 0.85, metalness: 0, illuminationBoost: 0.15 },
      glowPreset: DWARF_GLOW,
      bendingDimensions: {
        topHeight: 0.18,
        bottomDepth: 0.5,
        contactRadius: 0.18,
        funnelReach: 1.2
      }
    },
    orbit: {
      semiMajorAxisKm: auToKm(2.7675),
      eccentricity: 0.0758,
      inclinationDeg: 10.59,
      orbitalPeriodDays: 1680.9,
      meanLongitudeAtEpochDeg: 249.916,
      longitudeOfPerihelionDeg: 153.927
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
      materialPreset: { roughness: 0.85, metalness: 0, illuminationBoost: 0.22 },
      glowPreset: DWARF_GLOW,
      bendingDimensions: {
        topHeight: 0.2,
        bottomDepth: 0.55,
        contactRadius: 0.2,
        funnelReach: 1.3
      }
    },
    orbit: {
      semiMajorAxisKm: auToKm(39.482),
      eccentricity: 0.2488,
      inclinationDeg: 17.16,
      orbitalPeriodDays: 90560,
      meanLongitudeAtEpochDeg: 238.92903833,
      longitudeOfPerihelionDeg: 224.06891629
    }
  },
  {
    id: "voyager1",
    name: "Voyager 1",
    kind: "probe",
    parentId: "sun",
    massKg: 825.5,
    mu: toMu(825.5),
    rotation: {
      axialTiltDeg: 35.5,
      rotationPeriodHours: 0.0,
      tidallyLocked: false
    },
    render: {
      radiusKm: 5500,
      colorFallback: "#d4af37",
      modelUrl: "/models/voyager.glb",
      materialPreset: {
        roughness: 0.35,
        metalness: 0.75,
        illuminationBoost: 0.25
      },
      glowPreset: {
        color: "#ffd700",
        intensity: 0.2
      },
      bendingDimensions: {
        topHeight: 0.02,
        bottomDepth: 0.04,
        contactRadius: 0.05,
        funnelReach: 0.2
      }
    },
    orbit: {
      semiMajorAxisKm: auToKm(171.5),
      eccentricity: 0.01,
      inclinationDeg: 35.5,
      orbitalPeriodDays: 820000.0,
      meanLongitudeAtEpochDeg: 255.4,
      longitudeOfPerihelionDeg: 255.4
    }
  }
];
