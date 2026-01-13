export type PlanetId =
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

export interface OrbitElements {
  semiMajorAxisAU: number;
  eccentricity: number;
  inclinationDeg: number;
  orbitalPeriodDays: number;
}

export interface PlanetData {
  id: PlanetId;
  name: string;
  type: "star" | "planet" | "dwarf";
  radiusKm: number;
  massKg: number;
  mu?: number;
  axialTiltDeg: number;
  rotationPeriodHours: number;
  colorFallback: string;
  textureUrl?: string | null;
  orbit?: OrbitElements;
}
