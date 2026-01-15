import { MathUtils, Vector3 } from "three";
import type { OrbitElements } from "../data/types";
import {
  computeRenderOrbitRadius,
  type DistanceScaleMode,
  type DistanceScaleParams
} from "../utils/distanceScale";
import { kmToAu } from "../utils/units";

const solveKepler = (meanAnomaly: number, eccentricity: number) => {
  let eccentricAnomaly = meanAnomaly;
  for (let i = 0; i < 5; i += 1) {
    eccentricAnomaly =
      meanAnomaly + eccentricity * Math.sin(eccentricAnomaly);
  }
  return eccentricAnomaly;
};

export const getOrbitPosition = (
  orbit: OrbitElements,
  timeDays: number,
  scaleMode: DistanceScaleMode,
  scaleParams: DistanceScaleParams
) => {
  const semiMajor = computeRenderOrbitRadius(
    kmToAu(orbit.semiMajorAxisKm),
    scaleMode,
    scaleParams
  );
  const phase = orbit.phaseAtEpoch ?? 0;
  const meanAnomaly =
    (timeDays / orbit.orbitalPeriodDays) * Math.PI * 2 + phase;

  const eccentricAnomaly = solveKepler(meanAnomaly, orbit.eccentricity);
  const cosE = Math.cos(eccentricAnomaly);
  const sinE = Math.sin(eccentricAnomaly);

  const x = semiMajor * (cosE - orbit.eccentricity);
  const z =
    semiMajor * Math.sqrt(1 - orbit.eccentricity ** 2) * sinE;

  const position = new Vector3(x, 0, z);
  const inclination = MathUtils.degToRad(orbit.inclinationDeg);
  position.applyAxisAngle(new Vector3(1, 0, 0), inclination);

  return position;
};
