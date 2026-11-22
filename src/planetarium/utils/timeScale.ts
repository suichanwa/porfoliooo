/**
 * Terrestrial Time (TT / JDTDB) vs. Universal Time (UT / UTC) conversion utilities.
 *
 * Uses the NASA Eclipse / Espenak & Meeus piecewise polynomial approximations for
 * ΔT = TT - UT (in seconds), covering the full JPL Table 2a/2b span (3000 BC – 3000 AD).
 * Reference: https://eclipse.gsfc.nasa.gov/SEcat5/deltatpoly.html
 */

const SECONDS_PER_DAY = 86400;
const DAYS_PER_JULIAN_YEAR = 365.25;

/**
 * Estimates ΔT = TT - UT in seconds for a decimal astronomical year
 * (where 0 = 1 BC, -1 = 2 BC, 2000.0 = J2000.0).
 */
export function estimateDeltaTSeconds(year: number): number {
  if (year < -500) {
    const u = (year - 1820) / 100;
    return -20 + 32 * u * u;
  }

  if (year < 500) {
    const u = year / 100;
    return (
      10583.6 +
      u *
        (-1014.41 +
          u *
            (33.78311 +
              u *
                (-5.952053 +
                  u * (-0.1798452 + u * (0.022174192 + u * 0.0090316521)))))
    );
  }

  if (year < 1600) {
    const u = (year - 1000) / 100;
    return (
      1574.2 +
      u *
        (-556.01 +
          u *
            (71.23472 +
              u *
                (0.319781 +
                  u * (-0.8503463 + u * (-0.005050998 + u * 0.0083572073)))))
    );
  }

  if (year < 1700) {
    const t = year - 1600;
    return 120 + t * (-0.9808 + t * (-0.01532 + t / 7129));
  }

  if (year < 1800) {
    const t = year - 1700;
    return (
      8.83 +
      t * (0.1603 + t * (-0.0059285 + t * (0.00013336 - t / 1174000)))
    );
  }

  if (year < 1860) {
    const t = year - 1800;
    return (
      13.72 +
      t *
        (-0.332447 +
          t *
            (0.0068612 +
              t *
                (0.0041116 +
                  t *
                    (-0.00037436 +
                      t *
                        (0.0000121272 +
                          t * (-0.0000001699 + t * 0.000000000875))))))
    );
  }

  if (year < 1900) {
    const t = year - 1860;
    return (
      7.62 +
      t *
        (0.5737 +
          t * (-0.251754 + t * (0.01680668 + t * (-0.0004473624 + t / 233174))))
    );
  }

  if (year < 1920) {
    const t = year - 1900;
    return -2.79 + t * (1.494119 + t * (-0.0598939 + t * (0.0061966 - t * 0.000197)));
  }

  if (year < 1941) {
    const t = year - 1920;
    return 21.2 + t * (0.84493 + t * (-0.0761 + t * 0.0020936));
  }

  if (year < 1961) {
    const t = year - 1950;
    return 29.07 + t * (0.407 + t * (-1 / 233 + t / 2547));
  }

  if (year < 1986) {
    const t = year - 1975;
    return 45.45 + t * (1.067 + t * (-1 / 260 - t / 718));
  }

  if (year < 2005) {
    const t = year - 2000;
    return (
      63.86 +
      t *
        (0.3345 +
          t *
            (-0.060374 +
              t * (0.0017275 + t * (0.000651814 + t * 0.00002373599))))
    );
  }

  if (year < 2050) {
    const t = year - 2000;
    return 62.92 + t * (0.32217 + t * 0.005589);
  }

  if (year < 2150) {
    const u = (year - 1820) / 100;
    return -20 + 32 * u * u - 0.5628 * (2150 - year);
  }

  const u = (year - 1820) / 100;
  return -20 + 32 * u * u;
}

/**
 * Converts UTC days since J2000.0 (2000-01-01 12:00:00 UTC) into
 * Terrestrial Time (TT / JDTDB) days since J2000.0.
 */
export function utcDaysToTtDays(utcDaysSinceJ2000: number): number {
  const decimalYear = 2000 + utcDaysSinceJ2000 / DAYS_PER_JULIAN_YEAR;
  return utcDaysSinceJ2000 + estimateDeltaTSeconds(decimalYear) / SECONDS_PER_DAY;
}
