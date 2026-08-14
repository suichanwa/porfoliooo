const EARTH_RADIUS_KM = 6371;
const BASE_RADIUS = 0.5;
const MIN_RADIUS = 0.05;

export const scalePlanetRadius = (radiusKm: number, isMoon: boolean = false) => {
  if (isMoon) {
    return Math.max(MIN_RADIUS, (radiusKm / EARTH_RADIUS_KM) * BASE_RADIUS);
  }
  const scaled = Math.cbrt(radiusKm / EARTH_RADIUS_KM) * BASE_RADIUS;
  return Math.max(MIN_RADIUS, scaled);
};
