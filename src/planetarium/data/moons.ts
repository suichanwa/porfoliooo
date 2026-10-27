import type { BodyData, MaterialPreset } from "./types";
import { PLANET_TEXTURES } from "./textures";

const G = 6.6743e-11;
const toMu = (massKg: number) => massKg * G;

const DEFAULT_MATERIAL: MaterialPreset = { roughness: 0.85, metalness: 0 };

export const MOONS: BodyData[] = [
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
      textureUrl: PLANET_TEXTURES.enceladus,
      materialPreset: { roughness: 0.2, metalness: 0.05, illuminationBoost: 0.18 },
      glowPreset: { color: "#f8fafc", intensity: 0.14 }
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
    id: "triton",
    name: "Triton",
    kind: "moon",
    parentId: "neptune",
    moonIndex: 0,
    totalSiblingMoons: 1,
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
  }
];
