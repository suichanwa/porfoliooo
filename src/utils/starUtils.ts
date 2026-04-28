/**
 * Shared utilities for star rendering and animation
 * Used by both useStarfieldCanvas hook and starEngine
 */

/**
 * Generate a random number between min and max
 */
export const randomBetween = (min: number, max: number): number =>
  min + Math.random() * (max - min);

/**
 * Convert hex color with opacity value
 */
export const colorWithOpacity = (color: string, opacity: number): string => {
  const hex = Math.floor(opacity * 255).toString(16).padStart(2, '0');
  return `${color}${hex}`;
};

/**
 * Calculate star count based on device capabilities
 */
export const getStarCount = (
  baseCount: number,
  isLowEnd: boolean,
  isMobile: boolean
): number => {
  if (isLowEnd) return Math.min(baseCount, 60);
  if (isMobile) return Math.min(baseCount, 100);
  return baseCount;
};

/**
 * Starfield configuration constants
 */
export const STARFIELD_CONFIG = {
  SPECIAL_STAR_CHANCE: 0.3,
  STAR_COUNTS: {
    lowEnd: 30,
    mobile: 50,
    desktop: 80
  },
  TARGET_FPS: {
    lowEnd: 20,
    default: 30
  },
  CONSTELLATION: {
    MAX_STARS_TO_SAMPLE: 30,
    SAMPLE_INTERVAL: 3,
    MAX_DISTANCE_RATIO: 0.15,
    STROKE_COLOR: 'rgba(140, 180, 220, 0.15)',
    LINE_WIDTH: 0.5
  },
  COLORS: {
    STAR: '#ffffff'
  }
} as const;

/**
 * Star Engine configuration constants
 */
export const STAR_ENGINE_CONFIG = {
  DEFAULT_STAR_COUNT: 150,
  MAGNITUDE_DISTRIBUTION: {
    VERY_BRIGHT: { threshold: 0.05, min: 1, max: 2 },
    BRIGHT: { threshold: 0.15, min: 2, max: 3 },
    MEDIUM: { threshold: 0.35, min: 3, max: 4 },
    DIM: { min: 4, max: 6 }
  },
  OPACITY: {
    BRIGHT: { min: 0.5, max: 0.8 },
    MEDIUM: { min: 0.25, max: 0.45 },
    DIM: { min: 0.1, max: 0.25 },
    MIN_VALUE: 0.05,
    CLUSTER_MULTIPLIER: 1.2
  },
  TWINKLE: {
    SPEED_MIN: 0.0001,
    SPEED_MAX: 0.0003
  },
  COLORS: {
    palette: [
      '#ffaa88', // Warm orange
      '#ffe6d5', // Pale warm
      '#fffff0', // Ivory white
      '#f0f8ff', // Alice blue
      '#e6f2ff', // Very pale blue
      '#d5e5ff', // Light blue
      '#c5d9ff'  // Soft blue
    ] as const
  },
  CLUSTER_DEFINITIONS: [
    { x: 0.25, y: 0.3, radius: 150 },
    { x: 0.75, y: 0.6, radius: 120 },
    { x: 0.5, y: 0.8, radius: 100 }
  ] as const,
  GLOW: {
    MAGNITUDE_THRESHOLD: 3,
    SIZE_MULTIPLIER: 4,
    OPACITY_STOPS: [0.4, 0.15] as const
  },
  STELLAR_MOTION: {
    SPEED: 0.000000005,
    X_MOVEMENT: 0.005,
    Y_MOVEMENT: 0.003
  }
} as const;
