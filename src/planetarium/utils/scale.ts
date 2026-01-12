const EARTH_RADIUS_KM = 6371;
const BASE_RADIUS = 0.5;
const MIN_RADIUS = 0.18;
const ORBIT_SCALE = 16;

export const scalePlanetRadius = (radiusKm: number) => {
  const scaled = Math.cbrt(radiusKm / EARTH_RADIUS_KM) * BASE_RADIUS;
  return Math.max(MIN_RADIUS, scaled);
};

export const scaleOrbitRadius = (au: number) =>
  Math.log1p(au) * ORBIT_SCALE;
