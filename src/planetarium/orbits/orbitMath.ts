import { MathUtils, Vector3 } from "three";
import type { BodyData, OrbitElements } from "../data/types";
import { PLANET_BY_ID } from "../data/planetRegistry";
import { scalePlanetRadius } from "../utils/scale";
import {
  computeRenderOrbitRadius,
  type DistanceScaleMode,
  type DistanceScaleParams
} from "../utils/distanceScale";
import { kmToAu } from "../utils/units";

const ORBIT_TILT_AXIS = new Vector3(1, 0, 0);
const PERIHELION_AXIS = new Vector3(0, 1, 0);
const EQUATORIAL_TILT_AXIS = new Vector3(0, 0, 1);

const solveKepler = (meanAnomaly: number, eccentricity: number) => {
  let eccentricAnomaly = meanAnomaly;
  for (let i = 0; i < 6; i += 1) {
    eccentricAnomaly =
      meanAnomaly + eccentricity * Math.sin(eccentricAnomaly);
  }
  return eccentricAnomaly;
};

const EARTH_RENDER_RADIUS = 0.5;

export const getOrbitPosition = (
  orbit: OrbitElements,
  timeDays: number,
  scaleMode: DistanceScaleMode,
  scaleParams: DistanceScaleParams,
  out: Vector3 = new Vector3(),
  isMoon: boolean = false,
  body?: BodyData
) => {
  let semiMajor: number;
  let parentPlanet: BodyData | null = null;

  if (isMoon) {
    if (body?.parentId) {
      parentPlanet = PLANET_BY_ID[body.parentId] ?? null;
    }
    const Rp = parentPlanet
      ? scalePlanetRadius(parentPlanet.render.radiusKm)
      : EARTH_RENDER_RADIUS;

    let rRingOuter = 0;
    if (parentPlanet?.rings) {
      const rings = Array.isArray(parentPlanet.rings)
        ? parentPlanet.rings
        : [parentPlanet.rings];
      const maxOuterKm = Math.max(...rings.map((r) => r.outerRadiusKm));
      rRingOuter = Rp * (maxOuterKm / parentPlanet.render.radiusKm);
    }

    const totalMoons = body?.totalSiblingMoons ?? 1;
    const k = body?.moonIndex ?? 0;

    // 1. Calculate Inner Shell Boundary (r_min) Respecting Planetary Rings
    let rMin = Math.max(Rp * 1.65, rRingOuter * 1.2);
    // Preserve Earth's single Moon at its existing snug ~0.95 unit distance
    if (body?.id === "moon" || (!rRingOuter && totalMoons === 1)) {
      rMin = 0.95;
    }

    // 2. Calculate Outer Shell Cap (Delta_shell)
    let deltaShell = 0;
    if (totalMoons === 2) {
      deltaShell = 0.55;
    } else if (totalMoons === 4) {
      deltaShell = 1.05;
    } else if (totalMoons > 1) {
      deltaShell = 0.55 + (totalMoons - 2) * 0.25;
    }

    const factor = totalMoons > 1 ? Math.pow(k / (totalMoons - 1), 0.88) : 0;
    semiMajor = rMin + factor * deltaShell;
  } else {
    semiMajor = computeRenderOrbitRadius(
      kmToAu(orbit.semiMajorAxisKm),
      scaleMode,
      scaleParams
    );
  }

  // Mean motion since J2000 (radians).
  // Negative orbitalPeriodDays naturally drives retrograde motion (e.g. Triton)
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

  // Position in the local orbital plane with perihelion along +x.
  const x = semiMajor * (cosE - orbit.eccentricity);
  const z =
    semiMajor * Math.sqrt(Math.max(0, 1 - orbit.eccentricity ** 2)) * sinE;

  out.set(x, 0, z);

  // Rotate so perihelion points in the correct direction, then tilt by orbital inclination
  if (periLon !== 0) out.applyAxisAngle(PERIHELION_AXIS, periLon);
  const inclination = MathUtils.degToRad(orbit.inclinationDeg);
  out.applyAxisAngle(ORBIT_TILT_AXIS, inclination);

  // Equatorial Plane Alignment:
  // For moons, rotate the local orbit by the parent planet's axial tilt around the Z-axis
  // (the exact tilt applied to the parent planet's mesh and ring geometry in BodyMesh.tsx)
  if (isMoon && parentPlanet) {
    const parentTilt = MathUtils.degToRad(parentPlanet.rotation.axialTiltDeg);
    if (parentTilt !== 0) {
      out.applyAxisAngle(EQUATORIAL_TILT_AXIS, parentTilt);
    }
  }

  return out;
};
