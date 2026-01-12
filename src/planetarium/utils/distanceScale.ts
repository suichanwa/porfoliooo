export type DistanceScaleMode = "power" | "log" | "hybrid";

export interface DistanceScaleParams {
  powerK: number;
  powerP: number;
  logK: number;
  logA: number;
  hybridBlend: number;
}

export const DEFAULT_DISTANCE_SCALE_MODE: DistanceScaleMode = "hybrid";
export const DEFAULT_DISTANCE_SCALE_SPACING = 55;

const lerp = (min: number, max: number, t: number) => min + (max - min) * t;

export const computeDistanceScaleParams = (
  mode: DistanceScaleMode,
  spacing: number
): DistanceScaleParams => {
  const t = Math.min(1, Math.max(0, spacing / 100));

  switch (mode) {
    case "power":
      return {
        powerK: lerp(7, 16, t),
        powerP: lerp(0.6, 0.82, t),
        logK: 18,
        logA: 0.8,
        hybridBlend: 0.5
      };
    case "log":
      return {
        powerK: 11,
        powerP: 0.7,
        logK: lerp(12, 26, t),
        logA: lerp(0.55, 1.2, t),
        hybridBlend: 0.5
      };
    case "hybrid":
    default:
      return {
        powerK: lerp(8, 14, t),
        powerP: lerp(0.62, 0.78, t),
        logK: lerp(14, 22, t),
        logA: lerp(0.6, 1.05, t),
        hybridBlend: lerp(0.35, 0.7, t)
      };
  }
};

export const DEFAULT_DISTANCE_SCALE_PARAMS: DistanceScaleParams =
  computeDistanceScaleParams(DEFAULT_DISTANCE_SCALE_MODE, DEFAULT_DISTANCE_SCALE_SPACING);

export const computeRenderOrbitRadius = (
  au: number,
  mode: DistanceScaleMode,
  params: DistanceScaleParams = DEFAULT_DISTANCE_SCALE_PARAMS
) => {
  const power = params.powerK * Math.pow(au, params.powerP);
  const log = params.logK * Math.log1p(params.logA * au);

  switch (mode) {
    case "power":
      return power;
    case "log":
      return log;
    case "hybrid":
    default:
      return log * (1 - params.hybridBlend) + power * params.hybridBlend;
  }
};
