import { MathUtils, Vector3 } from "three";
import type { OrbitElements } from "../data/types";
import {
  computeRenderOrbitRadius,
  type DistanceScaleMode,
  type DistanceScaleParams
} from "../utils/distanceScale";
import { kmToAu } from "../utils/units";

const ORBIT_TILT_AXIS = new Vector3(1, 0, 0);
const PERIHELION_AXIS = new Vector3(0, 1, 0);

const solveKepler = (meanAnomaly: number, eccentricity: number) => {
  let eccentricAnomaly = meanAnomaly;
  for (let i = 0; i < 6; i += 1) {
    eccentricAnomaly =
      meanAnomaly + eccentricity * Math.sin(eccentricAnomaly);
  }
  return eccentricAnomaly;
};

const EARTH_RADIUS_KM = 6371;
const EARTH_RENDER_RADIUS = 0.5;

export const getOrbitPosition = (
  orbit: OrbitElements,
  timeDays: number,
  scaleMode: DistanceScaleMode,
  scaleParams: DistanceScaleParams,
  out: Vector3 = new Vector3(),
  isMoon: boolean = false
) => {
  let semiMajor: number;

  if (isMoon) {
    // Relative scaling: scales moon orbit distance close to Earth's render radius (0.5),
    // keeping the Moon tightly and realistically bound to Earth rather than sprawling out into deep space.
    const baseEarthRadius = EARTH_RENDER_RADIUS;
    const spacingRatio = Math.min(1.15, Math.max(0.85, (scaleParams.powerK ?? 11) / 11));
    semiMajor = baseEarthRadius * 1.9 * spacingRatio;
  } else {
    semiMajor = computeRenderOrbitRadius(
      kmToAu(orbit.semiMajorAxisKm),
      scaleMode,
      scaleParams
    );
  }

  // Mean motion since J2000 (radians).
  const meanMotion = (timeDays / orbit.orbitalPeriodDays) * Math.PI * 2;

  // Prefer real J2000 elements: mean anomaly M = L - ϖ, advanced by mean motion.
  // Fall back to the legacy manual phase when those elements are absent.
  const periLon = MathUtils.degToRad(orbit.longitudeOfPerihelionDeg ?? 0);
  const meanAnomaly =
    orbit.meanLongitudeAtEpochDeg !== undefined
      ? MathUtils.degToRad(orbit.meanLongitudeAtEpochDeg) - periLon + meanMotion
      : meanMotion + (orbit.phaseAtEpoch ?? 0);

  const eccentricAnomaly = solveKepler(meanAnomaly, orbit.eccentricity);
  const cosE = Math.cos(eccentricAnomaly);
  const sinE = Math.sin(eccentricAnomaly);

  // Position in the orbital plane with perihelion along +x.
  const x = semiMajor * (cosE - orbit.eccentricity);
  const z =
    semiMajor * Math.sqrt(1 - orbit.eccentricity ** 2) * sinE;

  out.set(x, 0, z);
  // Rotate so perihelion points in the correct ecliptic direction, then tilt
  // by the orbital inclination. (Node orientation Ω is approximated.)
  if (periLon !== 0) out.applyAxisAngle(PERIHELION_AXIS, periLon);
  const inclination = MathUtils.degToRad(orbit.inclinationDeg);
  return out.applyAxisAngle(ORBIT_TILT_AXIS, inclination);
};
