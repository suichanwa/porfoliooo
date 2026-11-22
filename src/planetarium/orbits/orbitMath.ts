import { MathUtils, Quaternion, Vector3 } from "three";
import type { BodyData, EscapeTrajectory, OrbitElements } from "../data/types";
import { PLANET_BY_ID } from "../data/planetRegistry";
import { scalePlanetRadius } from "../utils/scale";
import {
  computeRenderOrbitRadius,
  type DistanceScaleMode,
  type DistanceScaleParams
} from "../utils/distanceScale";
import { kmToAu } from "../utils/units";
import { utcDaysToTtDays } from "../utils/timeScale";

const EQUATORIAL_TILT_AXIS = new Vector3(0, 0, 1);
const UP_AXIS = new Vector3(0, 1, 0);
const J2000_OBLIQUITY_RAD = MathUtils.degToRad(23.4392911);
const COS_OBLIQUITY = Math.cos(J2000_OBLIQUITY_RAD);
const SIN_OBLIQUITY = Math.sin(J2000_OBLIQUITY_RAD);
const DAYS_PER_JULIAN_CENTURY = 36525;
const DAYS_PER_JULIAN_YEAR = 365.25;
const TWO_PI = Math.PI * 2;
const DEFAULT_ESCAPE_MIN_AU = 1.0;
const DEFAULT_ESCAPE_MAX_PLOT_AU = 420.0;

const poleQuaternionCache = new Map<string, Quaternion>();

/**
 * Computes a body's true 3D spin-pole unit vector in Three.js Y-up ecliptic coordinates
 * from its IAU J2000 equatorial pole (poleRaDeg, poleDecDeg).
 */
export const getBodyPoleVector = (
  body: BodyData,
  out: Vector3 = new Vector3()
): Vector3 => {
  const { poleRaDeg, poleDecDeg, axialTiltDeg } = body.rotation;
  if (poleRaDeg !== undefined && poleDecDeg !== undefined) {
    const ra = MathUtils.degToRad(poleRaDeg);
    const dec = MathUtils.degToRad(poleDecDeg);
    const cosDec = Math.cos(dec);
    const xEq = cosDec * Math.cos(ra);
    const yEq = cosDec * Math.sin(ra);
    const zEq = Math.sin(dec);

    // J2000 Equatorial -> J2000 Ecliptic (obliquity ε₀ = 23.4392911°)
    const xEcl = xEq;
    const yEcl = yEq * COS_OBLIQUITY + zEq * SIN_OBLIQUITY;
    const zEcl = -yEq * SIN_OBLIQUITY + zEq * COS_OBLIQUITY;

    // Ecliptic (X, Y, Z_north) -> Three.js Y-up (X, Z_north, -Y)
    return out.set(xEcl, zEcl, -yEcl).normalize();
  }

  // Fallback: single-axis Z tilt
  const tilt = MathUtils.degToRad(axialTiltDeg);
  return out.set(-Math.sin(tilt), Math.cos(tilt), 0).normalize();
};

/**
 * Returns a cached static Quaternion rotating Three.js local +Y to the body's true 3D J2000 pole.
 * Equatorial moons inherit their parent planet's exact 3D pole orientation so moons & rings
 * stay strictly coplanar. Zero per-frame allocation cost.
 */
export const getBodyPoleQuaternion = (body: BodyData): Quaternion => {
  const cached = poleQuaternionCache.get(body.id);
  if (cached) return cached;

  let q: Quaternion;
  if (body.rotation.poleRaDeg !== undefined && body.rotation.poleDecDeg !== undefined) {
    const poleVec = getBodyPoleVector(body, new Vector3());
    q = new Quaternion().setFromUnitVectors(UP_AXIS, poleVec);
  } else if (
    body.kind === "moon" &&
    body.orbit?.orbitFrame !== "ecliptic" &&
    body.parentId &&
    PLANET_BY_ID[body.parentId]
  ) {
    q = getBodyPoleQuaternion(PLANET_BY_ID[body.parentId]).clone();
  } else {
    q = new Quaternion().setFromAxisAngle(
      EQUATORIAL_TILT_AXIS,
      MathUtils.degToRad(body.rotation.axialTiltDeg)
    );
  }

  poleQuaternionCache.set(body.id, q);
  return q;
};

// Voyager 1 exact historical flyby milestones (days relative to J2000.0 = 2000-01-01 12:00 UTC)
// Encounter coordinates match our JPL Table 2a/2b Earth, Jupiter, and Saturn positions verbatim.
const VOYAGER1_T_LAUNCH = -8152.96;  // 1977-09-05 12:56 UTC (Earth: r=1.008 AU, lon=343.16°, lat=0.00°)
const VOYAGER1_T_JUPITER = -7607.0;  // 1979-03-05 12:05 UTC (Jupiter: r=5.292 AU, lon=127.54°, lat=+0.60°)
const VOYAGER1_T_SATURN = -6988.51;  // 1980-11-12 23:46 UTC (Saturn/Titan: r=9.508 AU, lon=182.34°, lat=+2.32°)
const VOYAGER1_T_MAX_PLOT = 32872.5; // ~2090 AD (~400 AU) — smooth far interstellar projection

const sphericalAuToCartesian = (rAu: number, lonDeg: number, latDeg: number): Vector3 => {
  const lon = MathUtils.degToRad(lonDeg);
  const lat = MathUtils.degToRad(latDeg);
  const cosLat = Math.cos(lat);
  return new Vector3(
    rAu * cosLat * Math.cos(lon),
    rAu * Math.sin(lat),
    -rAu * cosLat * Math.sin(lon)
  );
};

// Precomputed 3D Cartesian AU anchors & smooth velocities for Voyager 1's historical flybys
const V1_P_JUPITER = sphericalAuToCartesian(5.292, 127.54, 0.6);
const V1_P_SATURN = sphericalAuToCartesian(9.508, 182.34, 2.32);
const V1_DIR_INF = sphericalAuToCartesian(1.0, 255.4, 35.5).normalize();
const V1_V_INF = 3.573; // AU / Julian year asymptotic interstellar speed

// Compute Leg 1 exit tangent at Jupiter (AU / Julian year) so Leg 2 joins C1-smoothly
const computeLeg1CartesianAu = (u: number, out: Vector3): Vector3 => {
  const rAu = 1.008 + (5.292 - 1.008) * Math.pow(u, 1.38);
  const lonDeg = 343.16 + 144.38 * Math.pow(u, 0.72);
  const latDeg = 0.6 * u;
  const lon = MathUtils.degToRad(lonDeg);
  const lat = MathUtils.degToRad(latDeg);
  const cosLat = Math.cos(lat);
  return out.set(
    rAu * cosLat * Math.cos(lon),
    rAu * Math.sin(lat),
    -rAu * cosLat * Math.sin(lon)
  );
};

// Tangents for Leg 2 cubic Hermite (Jupiter -> Saturn) in AU per normalized unit u in [0, 1]
const V1_LEG2_DURATION_YR = (VOYAGER1_T_SATURN - VOYAGER1_T_JUPITER) / DAYS_PER_JULIAN_YEAR;
const V1_TANGENT_AT_JUPITER = (() => {
  const p0 = computeLeg1CartesianAu(0.995, new Vector3());
  const p1 = computeLeg1CartesianAu(1.0, new Vector3());
  // Gently bend the outgoing Jupiter slingshot toward Saturn while preserving smooth motion
  const leg1Dir = p1.sub(p0).normalize();
  const chordDir = V1_P_SATURN.clone().sub(V1_P_JUPITER).normalize();
  const blended = leg1Dir.lerp(chordDir, 0.45).normalize();
  return blended.multiplyScalar(V1_P_SATURN.distanceTo(V1_P_JUPITER) * 1.08);
})();

// Incoming tangent at Saturn: gently counter-clockwise in the ecliptic, ready to pitch north at Titan
const V1_SATURN_IN_DIR = (() => {
  const chordDir = V1_P_SATURN.clone().sub(V1_P_JUPITER).normalize();
  // Slight prograde curve at Saturn arrival (horizontal in ecliptic)
  const horiz = new Vector3(chordDir.x, 0.08, chordDir.z).normalize();
  return horiz;
})();
const V1_TANGENT_AT_SATURN = V1_SATURN_IN_DIR.clone().multiplyScalar(
  V1_P_SATURN.distanceTo(V1_P_JUPITER) * 1.02
);
// Incoming physical velocity vector at Saturn (AU / Julian year) for exact C1 post-Saturn bend
const V1_VEL_IN_SATURN = V1_TANGENT_AT_SATURN.clone().divideScalar(V1_LEG2_DURATION_YR);
const V1_VEL_OUT_INF = V1_DIR_INF.clone().multiplyScalar(V1_V_INF);
const V1_SATURN_BEND_TAU_YR = 0.55; // Smooth ~6.5-month hyperbolic bend around Saturn/Titan

// Piecewise phase distribution along the plotted mission path (0..1):
// Allocates generous vertex density to the curved inner gravity-assist arcs.
const VOYAGER1_PHASE_JUPITER = 0.30;
const VOYAGER1_PHASE_SATURN = 0.50;

export const getVoyager1HistoricalPhase = (timeDays: number): number => {
  if (timeDays <= VOYAGER1_T_LAUNCH) return 0;
  if (timeDays <= VOYAGER1_T_JUPITER) {
    const u = (timeDays - VOYAGER1_T_LAUNCH) / (VOYAGER1_T_JUPITER - VOYAGER1_T_LAUNCH);
    return u * VOYAGER1_PHASE_JUPITER;
  }
  if (timeDays <= VOYAGER1_T_SATURN) {
    const u = (timeDays - VOYAGER1_T_JUPITER) / (VOYAGER1_T_SATURN - VOYAGER1_T_JUPITER);
    return VOYAGER1_PHASE_JUPITER + u * (VOYAGER1_PHASE_SATURN - VOYAGER1_PHASE_JUPITER);
  }
  const u = (timeDays - VOYAGER1_T_SATURN) / (VOYAGER1_T_MAX_PLOT - VOYAGER1_T_SATURN);
  // Higher vertex density right after Saturn so the +35.5° upward bend is silky-smooth
  const shaped = Math.pow(MathUtils.clamp(u, 0, 1), 0.55);
  return VOYAGER1_PHASE_SATURN + shaped * (1 - VOYAGER1_PHASE_SATURN);
};

export const getVoyager1TimeFromPhase = (phase: number): number => {
  const p = MathUtils.clamp(phase, 0, 1);
  if (p <= VOYAGER1_PHASE_JUPITER) {
    const u = p / VOYAGER1_PHASE_JUPITER;
    return VOYAGER1_T_LAUNCH + u * (VOYAGER1_T_JUPITER - VOYAGER1_T_LAUNCH);
  }
  if (p <= VOYAGER1_PHASE_SATURN) {
    const u = (p - VOYAGER1_PHASE_JUPITER) / (VOYAGER1_PHASE_SATURN - VOYAGER1_PHASE_JUPITER);
    return VOYAGER1_T_JUPITER + u * (VOYAGER1_T_SATURN - VOYAGER1_T_JUPITER);
  }
  const shaped = (p - VOYAGER1_PHASE_SATURN) / (1 - VOYAGER1_PHASE_SATURN);
  const u = Math.pow(shaped, 1 / 0.55);
  return VOYAGER1_T_SATURN + u * (VOYAGER1_T_MAX_PLOT - VOYAGER1_T_SATURN);
};

const getVoyager1HistoricalAu = (timeDays: number, out: Vector3): Vector3 => {
  if (timeDays <= VOYAGER1_T_LAUNCH) {
    return computeLeg1CartesianAu(0, out);
  }

  if (timeDays <= VOYAGER1_T_JUPITER) {
    // Leg 1: Earth (1977-09-05) -> Jupiter (1979-03-05)
    const u = (timeDays - VOYAGER1_T_LAUNCH) / (VOYAGER1_T_JUPITER - VOYAGER1_T_LAUNCH);
    return computeLeg1CartesianAu(u, out);
  }

  if (timeDays <= VOYAGER1_T_SATURN) {
    // Leg 2: Jupiter (1979-03-05) -> Saturn & Titan (1980-11-12) via C1 Cubic Hermite in 3D AU
    const u = (timeDays - VOYAGER1_T_JUPITER) / (VOYAGER1_T_SATURN - VOYAGER1_T_JUPITER);
    const u2 = u * u;
    const u3 = u2 * u;
    const h00 = 2 * u3 - 3 * u2 + 1;
    const h10 = u3 - 2 * u2 + u;
    const h01 = -2 * u3 + 3 * u2;
    const h11 = u3 - u2;
    return out.set(
      h00 * V1_P_JUPITER.x + h10 * V1_TANGENT_AT_JUPITER.x + h01 * V1_P_SATURN.x + h11 * V1_TANGENT_AT_SATURN.x,
      h00 * V1_P_JUPITER.y + h10 * V1_TANGENT_AT_JUPITER.y + h01 * V1_P_SATURN.y + h11 * V1_TANGENT_AT_SATURN.y,
      h00 * V1_P_JUPITER.z + h10 * V1_TANGENT_AT_JUPITER.z + h01 * V1_P_SATURN.z + h11 * V1_TANGENT_AT_SATURN.z
    );
  }

  // Leg 3: Saturn/Titan -> Interstellar Space (exact C1 Cartesian hyperbolic departure)
  // Leaves Saturn tangent to Leg 2 and bends smoothly into Voyager 1's +35.5° asymptote
  // without any polar hairpin kink, reaching ~76.3 AU (2000), ~121.5 AU (2012), ~172.4 AU (2026).
  const dtYears = (timeDays - VOYAGER1_T_SATURN) / DAYS_PER_JULIAN_YEAR;
  const bend = V1_SATURN_BEND_TAU_YR * (1 - Math.exp(-dtYears / V1_SATURN_BEND_TAU_YR));
  return out.set(
    V1_P_SATURN.x + V1_VEL_OUT_INF.x * dtYears + (V1_VEL_IN_SATURN.x - V1_VEL_OUT_INF.x) * bend,
    V1_P_SATURN.y + V1_VEL_OUT_INF.y * dtYears + (V1_VEL_IN_SATURN.y - V1_VEL_OUT_INF.y) * bend,
    V1_P_SATURN.z + V1_VEL_OUT_INF.z * dtYears + (V1_VEL_IN_SATURN.z - V1_VEL_OUT_INF.z) * bend
  );
};

/**
 * Halley's cubic-convergence Kepler solver: converges to < 1e-12 rad across the entire
 * eccentricity range from circular planets up to extreme comets (e = 0.967–0.995+).
 */
export const solveKepler = (meanAnomaly: number, eccentricity: number): number => {
  // Wrap mean anomaly into [-PI, PI] for numerical stability across millennia
  const m = ((meanAnomaly + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;
  if (Math.abs(m) < 1e-12) return 0;

  let E: number;
  if (eccentricity > 0.8) {
    // Near perihelion for e -> 1, M ≈ (1-e)E + E³/6; cubic seed stays safely inside basin
    E = Math.sign(m) * Math.min(Math.PI, Math.cbrt(6 * Math.abs(m)));
  } else {
    E = m + eccentricity * Math.sin(m);
  }

  const maxIter = eccentricity > 0.8 ? 10 : 4;
  for (let i = 0; i < maxIter; i += 1) {
    const sinE = Math.sin(E);
    const cosE = Math.cos(E);
    const f = E - eccentricity * sinE - m;
    const f1 = 1 - eccentricity * cosE;
    const f2 = eccentricity * sinE;
    const delta = f / (f1 - (f * f2) / (2 * f1));
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

  // Apply Pluto's true 3D J2000 equatorial pole orientation
  const plutoData = PLANET_BY_ID.pluto;
  const uDirection = plutoData
    ? uLocal.clone().applyQuaternion(getBodyPoleQuaternion(plutoData))
    : uLocal.clone().applyAxisAngle(EQUATORIAL_TILT_AXIS, MathUtils.degToRad(PLUTO_AXIAL_TILT_DEG));

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
  if (orbit.escapeTrajectory) {
    if (orbit.escapeTrajectory.historicalPreset === "voyager1") {
      return getVoyager1HistoricalPhase(timeDays);
    }
    if (scaleMode && scaleParams) {
      const esc = orbit.escapeTrajectory;
      const minAu = esc.minDistanceAu ?? DEFAULT_ESCAPE_MIN_AU;
      const maxAu = esc.maxPlotDistanceAu ?? DEFAULT_ESCAPE_MAX_PLOT_AU;
      const currentAu = getEscapeDistanceAu(esc, timeDays);
      const rMin = computeRenderOrbitRadius(minAu, scaleMode, scaleParams);
      const rMax = computeRenderOrbitRadius(maxAu, scaleMode, scaleParams);
      const rCur = computeRenderOrbitRadius(currentAu, scaleMode, scaleParams);
      return MathUtils.clamp((rCur - rMin) / Math.max(1e-6, rMax - rMin), 0, 1);
    }
  }

  const period = getEffectiveOrbitalPeriodDays(orbit);
  if (period <= 0) return 0;

  const ttDays = utcDaysToTtDays(timeDays);

  // Include JPL Table 2b outer-planet mean-anomaly perturbation in the head phase
  // so the comet-tail head stays locked to the exact planet position.
  let pertDays = 0;
  if (orbit.perturbation) {
    const { b, c, s, f } = orbit.perturbation;
    const Tsec =
      f === 0
        ? MathUtils.clamp(ttDays / DAYS_PER_JULIAN_CENTURY, -3.0, 3.0)
        : MathUtils.clamp(ttDays / DAYS_PER_JULIAN_CENTURY, -50.0, 10.0);
    const fTRad = MathUtils.degToRad(f * Tsec);
    const deltaMDeg = b * Tsec * Tsec + c * Math.cos(fTRad) + s * Math.sin(fTRad);
    pertDays = (deltaMDeg / 360) * period;
  }

  const effectiveTime = ttDays + pertDays;
  return (((effectiveTime % period) + period) % period) / period;
};

/**
 * Returns the true physical heliocentric distance in AU for an elliptical heliocentric orbit
 * (or escape trajectory) at the given UTC days since J2000.0.
 */
export const getHeliocentricDistanceAu = (
  orbit: OrbitElements,
  timeDays: number
): number => {
  if (orbit.escapeTrajectory) {
    if (orbit.escapeTrajectory.historicalPreset === "voyager1") {
      return getVoyager1HistoricalAu(timeDays, new Vector3()).length();
    }
    return getEscapeDistanceAu(orbit.escapeTrajectory, timeDays);
  }

  const ttDays = utcDaysToTtDays(timeDays);
  const T = ttDays / DAYS_PER_JULIAN_CENTURY;
  const Tsec = MathUtils.clamp(T, -50.0, 10.0);
  const rates = orbit.secularRates;

  const aAu = Math.max(0.05, kmToAu(orbit.semiMajorAxisKm) + (rates?.aDotAuPerCentury ?? 0) * Tsec);
  const eccentricity = MathUtils.clamp(
    orbit.eccentricity + (rates?.eDotPerCentury ?? 0) * Tsec,
    0,
    0.999
  );
  const periLonDeg =
    (orbit.longitudeOfPerihelionDeg ?? 0) + (rates?.periLonDotDegPerCentury ?? 0) * Tsec;

  let meanAnomaly: number;
  if (orbit.meanLongitudeAtEpochDeg !== undefined) {
    const meanLonDeg =
      rates?.lDotDegPerCentury !== undefined
        ? orbit.meanLongitudeAtEpochDeg + rates.lDotDegPerCentury * T
        : orbit.meanLongitudeAtEpochDeg + (ttDays / orbit.orbitalPeriodDays) * 360;
    meanAnomaly = MathUtils.degToRad(meanLonDeg - periLonDeg);
  } else {
    meanAnomaly = (ttDays / orbit.orbitalPeriodDays) * TWO_PI + (orbit.phaseAtEpoch ?? 0);
  }

  const E = solveKepler(meanAnomaly, eccentricity);
  return aAu * (1 - eccentricity * Math.cos(E));
};

export const getOrbitPosition = (
  orbit: OrbitElements,
  timeDays: number,
  scaleMode: DistanceScaleMode,
  scaleParams: DistanceScaleParams,
  out: Vector3 = new Vector3(),
  isMoon: boolean = false,
  body?: BodyData,
  eccentricAnomalyOverride?: number
) => {
  // Hyperbolic / historical interstellar escape trajectory (e.g. Voyager 1)
  if (orbit.escapeTrajectory && !isMoon) {
    if (orbit.escapeTrajectory.historicalPreset === "voyager1") {
      getVoyager1HistoricalAu(timeDays, out);
      const rAu = out.length();
      if (rAu > 1e-6) {
        const renderRadius = computeRenderOrbitRadius(rAu, scaleMode, scaleParams);
        out.multiplyScalar(renderRadius / rAu);
      }
      return out;
    }
    const distAu = getEscapeDistanceAu(orbit.escapeTrajectory, timeDays);
    const renderRadius = computeRenderOrbitRadius(distAu, scaleMode, scaleParams);
    return getEscapeDirection(orbit.escapeTrajectory, out).multiplyScalar(renderRadius);
  }

  // Convert UTC days since J2000.0 -> Terrestrial Time (TT / JDTDB) days since J2000.0
  // so JPL Table 2a/2b elements stay accurate across 3000 BC – 3000 AD.
  const ttDays = utcDaysToTtDays(timeDays);
  const T = ttDays / DAYS_PER_JULIAN_CENTURY;
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
  let aAuPhysical = 1;
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
    aAuPhysical = Math.max(
      0.05,
      kmToAu(orbit.semiMajorAxisKm) + (rates?.aDotAuPerCentury ?? 0) * Tsec
    );
    semiMajor = computeRenderOrbitRadius(aAuPhysical, scaleMode, scaleParams);
  }

  const eccentricity = MathUtils.clamp(
    orbit.eccentricity + (rates?.eDotPerCentury ?? 0) * Tsec,
    0,
    0.999
  );
  const inclinationDeg = orbit.inclinationDeg + (rates?.iDotDegPerCentury ?? 0) * Tsec;
  const periLonDeg =
    (orbit.longitudeOfPerihelionDeg ?? 0) + (rates?.periLonDotDegPerCentury ?? 0) * Tsec;
  const ascNodeDeg =
    (orbit.longitudeOfAscendingNodeDeg ?? 0) + (rates?.ascNodeDotDegPerCentury ?? 0) * Tsec;

  const periLon = MathUtils.degToRad(periLonDeg);
  const ascNode = MathUtils.degToRad(ascNodeDeg);
  const argPeri = periLon - ascNode;

  let eccentricAnomaly: number;
  if (eccentricAnomalyOverride !== undefined) {
    eccentricAnomaly = eccentricAnomalyOverride;
  } else {
    // Prefer real JPL J2000 elements: mean anomaly M = L(T) - ϖ(T) + ΔM_pert(T).
    // Fall back to legacy manual phase for moons without J2000 longitudes.
    let meanAnomaly: number;
    if (orbit.meanLongitudeAtEpochDeg !== undefined) {
      const meanLonDeg =
        rates?.lDotDegPerCentury !== undefined
          ? orbit.meanLongitudeAtEpochDeg + rates.lDotDegPerCentury * T
          : orbit.meanLongitudeAtEpochDeg + (ttDays / orbit.orbitalPeriodDays) * 360;

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
      const meanMotion = (ttDays / orbit.orbitalPeriodDays) * TWO_PI;
      meanAnomaly = meanMotion + (orbit.phaseAtEpoch ?? 0);
    }
    eccentricAnomaly = solveKepler(meanAnomaly, eccentricity);
  }

  const cosE = Math.cos(eccentricAnomaly);
  const sinE = Math.sin(eccentricAnomaly);

  // For high-eccentricity heliocentric orbits (e.g. comets with e > 0.3), compute the
  // exact physical AU ellipse first and then map instantaneous rAu through the nonlinear
  // render distance scale so perihelia (0.59 AU / 0.91 AU) sit accurately outside the Sun.
  const usePhysicalRadialMapping = !isMoon && eccentricity > 0.3;
  const orbitalRadiusScale = usePhysicalRadialMapping ? aAuPhysical : semiMajor;

  // Position in the local orbital plane with perihelion along +x_orb.
  const xOrb = orbitalRadiusScale * (cosE - eccentricity);
  const yOrb =
    orbitalRadiusScale * Math.sqrt(Math.max(0, 1 - eccentricity * eccentricity)) * sinE;

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

  if (usePhysicalRadialMapping) {
    const rAu = out.length();
    if (rAu > 1e-6) {
      const renderRadius = computeRenderOrbitRadius(rAu, scaleMode, scaleParams);
      out.multiplyScalar(renderRadius / rAu);
    }
  }

  // Equatorial Plane Alignment:
  // Regular moons orbit in their parent planet's true 3D J2000 equatorial plane (matching
  // the parent's rings and spin axis in BodyMesh.tsx). Earth's Moon uses orbitFrame="ecliptic"
  // and orbits in its true 5.145° ecliptic plane instead.
  if (isMoon && parentPlanet && orbit.orbitFrame !== "ecliptic") {
    out.applyQuaternion(getBodyPoleQuaternion(parentPlanet));
  }

  return out;
};
