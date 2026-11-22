import { MathUtils, Vector3 } from "three";
import type { BodyData, EscapeTrajectory, OrbitElements } from "../data/types";
import { PLANET_BY_ID } from "../data/planetRegistry";
import { scalePlanetRadius } from "../utils/scale";
import {
  computeRenderOrbitRadius,
  type DistanceScaleMode,
  type DistanceScaleParams
} from "../utils/distanceScale";
import { kmToAu } from "../utils/units";

const EQUATORIAL_TILT_AXIS = new Vector3(0, 0, 1);
const DAYS_PER_JULIAN_CENTURY = 36525;
const DAYS_PER_JULIAN_YEAR = 365.25;
const TWO_PI = Math.PI * 2;
const DEFAULT_ESCAPE_MIN_AU = 1.0;
const DEFAULT_ESCAPE_MAX_PLOT_AU = 420.0;

/**
 * 4-step Newton-Raphson Kepler solver: converges to < 1e-13 rad even for
 * high-eccentricity bodies like Mercury (0.206) and Pluto (0.249).
 */
const solveKepler = (meanAnomaly: number, eccentricity: number): number => {
  // Wrap mean anomaly into [-PI, PI] for numerical stability across millennia
  let m = ((meanAnomaly + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;
  let E = m + eccentricity * Math.sin(m);
  for (let i = 0; i < 4; i += 1) {
    const delta = (E - eccentricity * Math.sin(E) - m) / (1 - eccentricity * Math.cos(E));
    E -= delta;
    if (Math.abs(delta) < 1e-12) break;
  }
  return E;
};

const EARTH_RENDER_RADIUS = 0.5;

// Pluto-Charon Binary Barycenter Constants & Visuals
export const PLUTO_CHARON_TOTAL_SEPARATION = 1.48;
export const PLUTO_BARYCENTRIC_RATIO = 0.261;
export const R_PLUTO_RENDER = scalePlanetRadius(1188.3);
export const R_CHARON_RENDER = scalePlanetRadius(606.0, true, 1188.3);
export const R_PLUTO_BARYCENTER = Math.max(
  R_PLUTO_RENDER * 1.35,
  PLUTO_BARYCENTRIC_RATIO * PLUTO_CHARON_TOTAL_SEPARATION
); // ~0.386 units (strictly outside Pluto's 3D sphere)
export const R_CHARON_BARYCENTER = PLUTO_CHARON_TOTAL_SEPARATION - R_PLUTO_BARYCENTER; // ~1.094 units
export const PLUTO_CHARON_ORBIT_PERIOD_DAYS = 6.3872;
export const PLUTO_AXIAL_TILT_DEG = 119.6;

export const getPlutoCharonOrbitalPhase = (timeDays: number): number => {
  const epochRad = MathUtils.degToRad(135.0);
  return epochRad + (timeDays / PLUTO_CHARON_ORBIT_PERIOD_DAYS) * TWO_PI;
};

export const getPlutoBarycenterPosition = (
  timeDays: number,
  scaleMode: DistanceScaleMode,
  scaleParams: DistanceScaleParams,
  out: Vector3 = new Vector3()
): Vector3 => {
  const plutoData = PLANET_BY_ID.pluto;
  if (!plutoData?.orbit) return out.set(0, 0, 0);
  return getOrbitPosition(
    plutoData.orbit,
    timeDays,
    scaleMode,
    scaleParams,
    out,
    false,
    plutoData
  );
};

export interface PlutoCharonBinaryState {
  barycenterPos: Vector3;
  plutoPos: Vector3;
  charonPos: Vector3;
  rPluto: number;
  rCharon: number;
  totalSeparation: number;
  uDirection: Vector3;
  orbitalPhaseRad: number;
}

export const getPlutoCharonBinaryState = (
  timeDays: number,
  scaleMode: DistanceScaleMode,
  scaleParams: DistanceScaleParams,
  vis: number = 1.0
): PlutoCharonBinaryState => {
  const barycenterPos = getPlutoBarycenterPosition(
    timeDays,
    scaleMode,
    scaleParams,
    new Vector3()
  );
  const phase = getPlutoCharonOrbitalPhase(timeDays);

  // Orbital direction vector in local XZ plane (before axial tilt)
  const ux = Math.cos(phase);
  const uz = Math.sin(phase);
  const uLocal = new Vector3(ux, 0, uz);

  // Apply Pluto's 119.6° equatorial tilt around Z axis
  const tiltRad = MathUtils.degToRad(PLUTO_AXIAL_TILT_DEG);
  const uDirection = uLocal.clone().applyAxisAngle(EQUATORIAL_TILT_AXIS, tiltRad);

  // Pluto is on opposite side (-u), scaled by visibility vis (glides to barycenter in overview)
  const plutoOffset = uDirection.clone().multiplyScalar(-R_PLUTO_BARYCENTER * vis);
  const plutoPos = barycenterPos.clone().add(plutoOffset);

  // Charon is on (+u) side
  const charonOffset = uDirection.clone().multiplyScalar(R_CHARON_BARYCENTER);
  const charonPos = barycenterPos.clone().add(charonOffset);

  return {
    barycenterPos,
    plutoPos,
    charonPos,
    rPluto: R_PLUTO_BARYCENTER,
    rCharon: R_CHARON_BARYCENTER,
    totalSeparation: PLUTO_CHARON_TOTAL_SEPARATION,
    uDirection,
    orbitalPhaseRad: phase
  };
};

export const getEscapeDirection = (
  escape: EscapeTrajectory,
  out: Vector3 = new Vector3()
): Vector3 => {
  const lon = MathUtils.degToRad(escape.eclipticLonDeg);
  const lat = MathUtils.degToRad(escape.eclipticLatDeg);
  const cosLat = Math.cos(lat);
  return out.set(
    cosLat * Math.cos(lon),
    Math.sin(lat),
    -cosLat * Math.sin(lon)
  );
};

export const getEscapeDistanceAu = (
  escape: EscapeTrajectory,
  timeDays: number
): number => {
  const minAu = escape.minDistanceAu ?? DEFAULT_ESCAPE_MIN_AU;
  const yearsSinceJ2000 = timeDays / DAYS_PER_JULIAN_YEAR;
  return Math.max(minAu, escape.distanceAtJ2000Au + escape.radialSpeedAuPerYear * yearsSinceJ2000);
};

export const getEffectiveOrbitalPeriodDays = (orbit: OrbitElements): number => {
  const lDot = orbit.secularRates?.lDotDegPerCentury;
  if (lDot && Math.abs(lDot) > 1e-9) {
    return (360 / Math.abs(lDot)) * DAYS_PER_JULIAN_CENTURY;
  }
  return Math.abs(orbit.orbitalPeriodDays);
};

export const getOrbitPhase = (
  orbit: OrbitElements,
  timeDays: number,
  scaleMode?: DistanceScaleMode,
  scaleParams?: DistanceScaleParams
): number => {
  if (orbit.escapeTrajectory && scaleMode && scaleParams) {
    const esc = orbit.escapeTrajectory;
    const minAu = esc.minDistanceAu ?? DEFAULT_ESCAPE_MIN_AU;
    const maxAu = esc.maxPlotDistanceAu ?? DEFAULT_ESCAPE_MAX_PLOT_AU;
    const currentAu = getEscapeDistanceAu(esc, timeDays);
    const rMin = computeRenderOrbitRadius(minAu, scaleMode, scaleParams);
    const rMax = computeRenderOrbitRadius(maxAu, scaleMode, scaleParams);
    const rCur = computeRenderOrbitRadius(currentAu, scaleMode, scaleParams);
    return MathUtils.clamp((rCur - rMin) / Math.max(1e-6, rMax - rMin), 0, 1);
  }

  const period = getEffectiveOrbitalPeriodDays(orbit);
  if (period <= 0) return 0;

  // Include JPL Table 2b outer-planet mean-anomaly perturbation in the head phase
  // so the comet-tail head stays locked to the exact planet position.
  let pertDays = 0;
  if (orbit.perturbation) {
    const { b, c, s, f } = orbit.perturbation;
    const Tsec =
      f === 0
        ? MathUtils.clamp(timeDays / DAYS_PER_JULIAN_CENTURY, -3.0, 3.0)
        : MathUtils.clamp(timeDays / DAYS_PER_JULIAN_CENTURY, -50.0, 10.0);
    const fTRad = MathUtils.degToRad(f * Tsec);
    const deltaMDeg = b * Tsec * Tsec + c * Math.cos(fTRad) + s * Math.sin(fTRad);
    pertDays = (deltaMDeg / 360) * period;
  }

  const effectiveTime = timeDays + pertDays;
  return (((effectiveTime % period) + period) % period) / period;
};

export const getOrbitPosition = (
  orbit: OrbitElements,
  timeDays: number,
  scaleMode: DistanceScaleMode,
  scaleParams: DistanceScaleParams,
  out: Vector3 = new Vector3(),
  isMoon: boolean = false,
  body?: BodyData
) => {
  // Hyperbolic / radial interstellar escape trajectory (e.g. Voyager 1)
  if (orbit.escapeTrajectory && !isMoon) {
    const distAu = getEscapeDistanceAu(orbit.escapeTrajectory, timeDays);
    const renderRadius = computeRenderOrbitRadius(distAu, scaleMode, scaleParams);
    return getEscapeDirection(orbit.escapeTrajectory, out).multiplyScalar(renderRadius);
  }

  const T = timeDays / DAYS_PER_JULIAN_CENTURY;
  // Clamp secular element drift to JPL Table 2a/2b validity window (3000 BC – 3000 AD,
  // or ±3 centuries for Pluto/Charon's narrower 1800–2050 fit) so extreme fast-forward
  // never pushes eccentricities or inclinations out of physical bounds.
  const isPlutoSystem = body?.id === "pluto" || body?.id === "charon";
  const Tsec = isPlutoSystem
    ? MathUtils.clamp(T, -3.0, 3.0)
    : MathUtils.clamp(T, -50.0, 10.0);
  const rates = orbit.secularRates;
  const pert = orbit.perturbation;

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
    if (body?.id === "moon") {
      rMin = 0.95;
    } else if (body?.id === "charon" || parentPlanet?.id === "pluto") {
      // Pluto-Charon binary dwarf companion: maintain snug binary orbit
      rMin = Rp * 2.2;
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
    const aAu = kmToAu(orbit.semiMajorAxisKm) + (rates?.aDotAuPerCentury ?? 0) * Tsec;
    semiMajor = computeRenderOrbitRadius(Math.max(0.05, aAu), scaleMode, scaleParams);
  }

  const eccentricity = MathUtils.clamp(
    orbit.eccentricity + (rates?.eDotPerCentury ?? 0) * Tsec,
    0,
    0.98
  );
  const inclinationDeg = orbit.inclinationDeg + (rates?.iDotDegPerCentury ?? 0) * Tsec;
  const periLonDeg =
    (orbit.longitudeOfPerihelionDeg ?? 0) + (rates?.periLonDotDegPerCentury ?? 0) * Tsec;
  const ascNodeDeg =
    (orbit.longitudeOfAscendingNodeDeg ?? 0) + (rates?.ascNodeDotDegPerCentury ?? 0) * Tsec;

  const periLon = MathUtils.degToRad(periLonDeg);
  const ascNode = MathUtils.degToRad(ascNodeDeg);
  const argPeri = periLon - ascNode;

  // Prefer real JPL J2000 elements: mean anomaly M = L(T) - ϖ(T) + ΔM_pert(T).
  // Fall back to legacy manual phase for moons without J2000 longitudes.
  let meanAnomaly: number;
  if (orbit.meanLongitudeAtEpochDeg !== undefined) {
    const meanLonDeg =
      rates?.lDotDegPerCentury !== undefined
        ? orbit.meanLongitudeAtEpochDeg + rates.lDotDegPerCentury * T
        : orbit.meanLongitudeAtEpochDeg + (timeDays / orbit.orbitalPeriodDays) * 360;

    let mDeg = meanLonDeg - periLonDeg;
    if (pert) {
      const fTRad = MathUtils.degToRad(pert.f * Tsec);
      mDeg +=
        pert.b * Tsec * Tsec +
        pert.c * Math.cos(fTRad) +
        pert.s * Math.sin(fTRad);
    }
    meanAnomaly = MathUtils.degToRad(mDeg);
  } else {
    // Negative orbitalPeriodDays naturally drives retrograde motion (e.g. Triton)
    const meanMotion = (timeDays / orbit.orbitalPeriodDays) * TWO_PI;
    meanAnomaly = meanMotion + (orbit.phaseAtEpoch ?? 0);
  }

  const eccentricAnomaly = solveKepler(meanAnomaly, eccentricity);
  const cosE = Math.cos(eccentricAnomaly);
  const sinE = Math.sin(eccentricAnomaly);

  // Position in the local orbital plane with perihelion along +x_orb.
  const xOrb = semiMajor * (cosE - eccentricity);
  const yOrb =
    semiMajor * Math.sqrt(Math.max(0, 1 - eccentricity * eccentricity)) * sinE;

  // Full 3D Keplerian Euler rotation (ω = ϖ - Ω, inclination i, ascending node Ω):
  // 1. Rotate within the orbital plane by argument of perihelion ω
  const cosW = Math.cos(argPeri);
  const sinW = Math.sin(argPeri);
  const x1 = xOrb * cosW - yOrb * sinW;
  const y1 = xOrb * sinW + yOrb * cosW;

  // 2. Tilt out of the ecliptic plane by inclination i around the line of nodes
  const inclination = MathUtils.degToRad(inclinationDeg);
  const cosI = Math.cos(inclination);
  const sinI = Math.sin(inclination);
  const y2 = y1 * cosI;
  const zEcl = y1 * sinI;

  // 3. Rotate around the ecliptic pole by longitude of ascending node Ω
  const cosO = Math.cos(ascNode);
  const sinO = Math.sin(ascNode);
  const xEcl = x1 * cosO - y2 * sinO;
  const yEcl = x1 * sinO + y2 * cosO;

  // Map heliocentric ecliptic (X, Y, Z_north) -> Three.js right-handed Y-up (X, Z_north, -Y)
  // so prograde orbits run counter-clockwise when viewed from Ecliptic North (+Y).
  out.set(xEcl, zEcl, -yEcl);

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
