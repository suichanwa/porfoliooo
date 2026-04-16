import { PLANETS } from "./planets";
import type { BodyData, BodyId } from "./types";

export interface PlanetInfo {
  summary: string;
  facts: string[];
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(value));

const buildFallbackSummary = (planet: BodyData) => {
  if (planet.kind === "star") {
    return `${planet.name} is the central star that lights and anchors this system view.`;
  }

  if (planet.kind === "dwarf") {
    return `${planet.name} is a dwarf world with its own distinct orbit, rotation, and surface character.`;
  }

  return `${planet.name} is a selectable world in the planetarium with live orbit and scale data.`;
};

const buildFallbackFacts = (planet: BodyData) => {
  const facts = [
    `Radius is about ${formatNumber(planet.render.radiusKm)} km.`,
    `Axial tilt is ${planet.rotation.axialTiltDeg.toFixed(1)} degrees.`,
    `Rotation period is about ${planet.rotation.rotationPeriodHours.toFixed(2)} hours.`
  ];

  if (planet.orbit) {
    facts.splice(
      1,
      0,
      `Orbits the Sun every ${formatNumber(planet.orbit.orbitalPeriodDays)} days at about ${(planet.orbit.semiMajorAxisKm / 149_597_870.7).toFixed(2)} AU.`
    );
    facts.push(`Orbital inclination is ${planet.orbit.inclinationDeg.toFixed(2)} degrees.`);
  }

  if (planet.rings) {
    facts.push("Has a visible ring system in this planetarium view.");
  }

  return facts.slice(0, 3);
};

const PLANET_INFO_OVERRIDES: Partial<Record<BodyId, PlanetInfo>> = {
  sun: {
    summary: "The star that anchors the entire solar system.",
    facts: [
      "Holds about 99.8 percent of solar system mass.",
      "Surface temperature is about 5,500 C.",
      "Solar wind shapes the heliosphere."
    ]
  },
  mercury: {
    summary: "A fast, rocky world with extreme temperatures.",
    facts: [
      "Smallest planet in the solar system.",
      "A day here is longer than its year.",
      "Has no substantial atmosphere."
    ]
  },
  venus: {
    summary: "A hot, cloud-covered planet with a dense atmosphere.",
    facts: [
      "Hottest surface temperature of any planet.",
      "Rotates backward and very slowly.",
      "Surface pressure is about 92x Earth."
    ]
  },
  earth: {
    summary: "The only known planet with surface liquid water.",
    facts: [
      "Active plate tectonics reshape the surface.",
      "One large moon stabilizes the tilt.",
      "Oxygen-rich atmosphere supports life."
    ]
  },
  mars: {
    summary: "A cold desert world with a thin atmosphere.",
    facts: [
      "Home to Olympus Mons, the tallest volcano.",
      "Polar ice caps expand and shrink seasonally.",
      "Evidence of ancient rivers and lakes."
    ]
  },
  jupiter: {
    summary: "The largest planet, wrapped in storms and bands.",
    facts: [
      "Great Red Spot is a centuries-old storm.",
      "Has a powerful magnetic field.",
      "Dozens of moons, including Europa and Io."
    ]
  },
  saturn: {
    summary: "Known for its bright rings of ice and rock.",
    facts: [
      "Rings are thin but span huge distances.",
      "Less dense than water.",
      "Titan has a thick atmosphere."
    ]
  },
  uranus: {
    summary: "An ice giant tipped almost on its side.",
    facts: [
      "Axial tilt is about 98 degrees.",
      "Methane gives it a blue-green hue.",
      "Has faint rings and icy moons."
    ]
  },
  neptune: {
    summary: "A deep-blue ice giant with fierce winds.",
    facts: [
      "Fastest winds in the solar system.",
      "Color comes from methane absorption.",
      "Has large moon Triton."
    ]
  },
  ceres: {
    summary: "A dwarf planet in the asteroid belt.",
    facts: [
      "Largest object in the asteroid belt.",
      "Likely has a briny interior.",
      "Bright salt deposits on its surface."
    ]
  },
  pluto: {
    summary: "A distant dwarf planet in the Kuiper belt.",
    facts: [
      "Binary system with its moon Charon.",
      "Highly elliptical and inclined orbit.",
      "Surface has nitrogen and methane ice."
    ]
  }
};

export const PLANET_INFO = Object.fromEntries(
  PLANETS.map((planet) => [
    planet.id,
    PLANET_INFO_OVERRIDES[planet.id] ?? {
      summary: buildFallbackSummary(planet),
      facts: buildFallbackFacts(planet)
    }
  ])
) as Record<BodyId, PlanetInfo>;
