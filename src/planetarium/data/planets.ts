import type { PlanetData } from "./types";
import { PLANET_TEXTURES } from "./textures";

export const PLANETS: PlanetData[] = [
  {
    id: "sun",
    name: "Sun",
    type: "star",
    radiusKm: 696340,
    axialTiltDeg: 7.25,
    rotationPeriodHours: 609.12,
    colorFallback: "#f6c453",
    textureUrl: PLANET_TEXTURES.sun
  },
  {
    id: "mercury",
    name: "Mercury",
    type: "planet",
    radiusKm: 2439.7,
    axialTiltDeg: 0.034,
    rotationPeriodHours: 1407.6,
    colorFallback: "#9f9a91",
    textureUrl: PLANET_TEXTURES.mercury,
    orbit: {
      semiMajorAxisAU: 0.387,
      eccentricity: 0.2056,
      inclinationDeg: 7.005,
      orbitalPeriodDays: 87.969
    }
  },
  {
    id: "venus",
    name: "Venus",
    type: "planet",
    radiusKm: 6051.8,
    axialTiltDeg: 177.36,
    rotationPeriodHours: 5832.5,
    colorFallback: "#d8c38f",
    textureUrl: PLANET_TEXTURES.venus,
    orbit: {
      semiMajorAxisAU: 0.723,
      eccentricity: 0.0067,
      inclinationDeg: 3.394,
      orbitalPeriodDays: 224.701
    }
  },
  {
    id: "earth",
    name: "Earth",
    type: "planet",
    radiusKm: 6371,
    axialTiltDeg: 23.44,
    rotationPeriodHours: 23.93,
    colorFallback: "#4c8fbe",
    textureUrl: PLANET_TEXTURES.earth,
    orbit: {
      semiMajorAxisAU: 1,
      eccentricity: 0.0167,
      inclinationDeg: 0,
      orbitalPeriodDays: 365.256
    }
  },
  {
    id: "mars",
    name: "Mars",
    type: "planet",
    radiusKm: 3389.5,
    axialTiltDeg: 25.19,
    rotationPeriodHours: 24.62,
    colorFallback: "#c96f49",
    textureUrl: PLANET_TEXTURES.mars,
    orbit: {
      semiMajorAxisAU: 1.524,
      eccentricity: 0.0934,
      inclinationDeg: 1.85,
      orbitalPeriodDays: 686.98
    }
  },
  {
    id: "jupiter",
    name: "Jupiter",
    type: "planet",
    radiusKm: 69911,
    axialTiltDeg: 3.13,
    rotationPeriodHours: 9.93,
    colorFallback: "#d1b38d",
    textureUrl: PLANET_TEXTURES.jupiter,
    orbit: {
      semiMajorAxisAU: 5.204,
      eccentricity: 0.0489,
      inclinationDeg: 1.304,
      orbitalPeriodDays: 4332.59
    }
  },
  {
    id: "saturn",
    name: "Saturn",
    type: "planet",
    radiusKm: 58232,
    axialTiltDeg: 26.73,
    rotationPeriodHours: 10.7,
    colorFallback: "#d8c190",
    textureUrl: PLANET_TEXTURES.saturn,
    orbit: {
      semiMajorAxisAU: 9.582,
      eccentricity: 0.0565,
      inclinationDeg: 2.485,
      orbitalPeriodDays: 10759.22
    }
  },
  {
    id: "uranus",
    name: "Uranus",
    type: "planet",
    radiusKm: 25362,
    axialTiltDeg: 97.77,
    rotationPeriodHours: 17.24,
    colorFallback: "#93c7db",
    textureUrl: PLANET_TEXTURES.uranus,
    orbit: {
      semiMajorAxisAU: 19.201,
      eccentricity: 0.0472,
      inclinationDeg: 0.773,
      orbitalPeriodDays: 30685.4
    }
  },
  {
    id: "neptune",
    name: "Neptune",
    type: "planet",
    radiusKm: 24622,
    axialTiltDeg: 28.32,
    rotationPeriodHours: 16.11,
    colorFallback: "#3f6fb3",
    textureUrl: PLANET_TEXTURES.neptune,
    orbit: {
      semiMajorAxisAU: 30.047,
      eccentricity: 0.0086,
      inclinationDeg: 1.77,
      orbitalPeriodDays: 60190
    }
  },
  {
    id: "ceres",
    name: "Ceres",
    type: "dwarf",
    radiusKm: 473,
    axialTiltDeg: 4,
    rotationPeriodHours: 9.07,
    colorFallback: "#8d8c89",
    textureUrl: PLANET_TEXTURES.ceres,
    orbit: {
      semiMajorAxisAU: 2.7675,
      eccentricity: 0.0758,
      inclinationDeg: 10.59,
      orbitalPeriodDays: 1680.9
    }
  },
  {
    id: "pluto",
    name: "Pluto",
    type: "dwarf",
    radiusKm: 1188.3,
    axialTiltDeg: 119.6,
    rotationPeriodHours: 153.3,
    colorFallback: "#b7a99a",
    textureUrl: PLANET_TEXTURES.pluto,
    orbit: {
      semiMajorAxisAU: 39.482,
      eccentricity: 0.2488,
      inclinationDeg: 17.16,
      orbitalPeriodDays: 90560
    }
  }
];
