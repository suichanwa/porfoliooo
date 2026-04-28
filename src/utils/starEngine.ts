/**
 * Shared Star Engine
 * Provides unified star generation and rendering for both StarryBackground and Neptune components
 * Ensures both components use identical star data and rendering logic
 */

import { colorWithOpacity, STAR_ENGINE_CONFIG } from './starUtils';

// Star interface definition
export interface Star {
  id: number;
  x: number;
  y: number;
  z: number;
  size: number;
  opacity: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
  temperature: number;
  rightAscension: number;
  rightAscensionRad: number; // Pre-computed for performance
  declination: number;
  declinationRad: number; // Pre-computed for performance
  magnitude: number;
  noiseOffset: number;
  cluster: 'sparse' | 'medium' | 'dense';
}

// Star generation options
export interface StarGenerationOptions {
  seed?: number;
  count?: number;
  width?: number;
  height?: number;
  isMobile?: boolean;
  isLowEnd?: boolean;
}

// Device detection utility
const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return { isMobile: false, isLowEnd: false };
  }

  return {
    isMobile: window.innerWidth < 768,
    isLowEnd: (navigator?.hardwareConcurrency || 4) <= 2 ||
              (window.devicePixelRatio > 2 && window.innerWidth < 1024)
  };
};

// Star temperature-based colors - pre-computed and reused
const STAR_COLOR_PALETTE = STAR_ENGINE_CONFIG.COLORS.palette;

// Get star color based on temperature
const getStarColor = (temperature: number) => {
  return STAR_COLOR_PALETTE[Math.floor(temperature * STAR_COLOR_PALETTE.length)];
};

// Seeded random number generator for consistent results
const createSeededRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

// Smooth noise function for twinkling
const smoothNoise = (x: number) => {
  return (Math.sin(x) + Math.sin(x * 2.1) * 0.5 + Math.sin(x * 3.7) * 0.25) / 1.75;
};

/**
 * Generate stars with consistent, reproducible patterns
 * @param count Number of stars to generate
 * @param options Generation options including seed for consistency
 * @returns Array of star objects
 */
export const generateStars = (
  count: number = STAR_ENGINE_CONFIG.DEFAULT_STAR_COUNT,
  options: StarGenerationOptions = {}
): Star[] => {
  const {
    seed = Date.now(),
    width = 1920,
    height = 1080,
    isMobile = false,
    isLowEnd = false
  } = options;

  const deviceInfo = getDeviceInfo();
  const finalIsMobile = isMobile || deviceInfo.isMobile;
  const finalIsLowEnd = isLowEnd || deviceInfo.isLowEnd;

  const rand = createSeededRandom(seed);

  const totalStars = finalIsLowEnd ? Math.min(count, 60) :
                     finalIsMobile ? Math.min(count, 100) :
                     count;

  const stars: Star[] = [];

  const clusters = STAR_ENGINE_CONFIG.CLUSTER_DEFINITIONS.map(c => ({
    x: c.x * width,
    y: c.y * height,
    radius: c.radius
  }));

  for (let i = 0; i < totalStars; i++) {
    const temperature = rand();

    // 70% sparse, 20% medium, 10% in clusters
    const distributionRoll = rand();
    let cluster: 'sparse' | 'medium' | 'dense' = 'sparse';
    let x: number, y: number;

    if (distributionRoll < 0.7) {
      cluster = 'sparse';
      x = rand() * width;
      y = rand() * height;
    } else if (distributionRoll < 0.9) {
      cluster = 'medium';
      x = rand() * width;
      y = rand() * height;
    } else {
      cluster = 'dense';
      const chosenCluster = clusters[Math.floor(rand() * clusters.length)];
      const angle = rand() * Math.PI * 2;
      const distance = rand() * chosenCluster.radius;
      x = chosenCluster.x + Math.cos(angle) * distance;
      y = chosenCluster.y + Math.sin(angle) * distance;
    }

    // Magnitude system: 1 (brightest) to 6 (dimmest)
    const magnitudeRoll = rand();
    const {min: magMin, max: magMax, threshold} =
      magnitudeRoll < STAR_ENGINE_CONFIG.MAGNITUDE_DISTRIBUTION.VERY_BRIGHT.threshold
        ? {min: STAR_ENGINE_CONFIG.MAGNITUDE_DISTRIBUTION.VERY_BRIGHT.min, max: STAR_ENGINE_CONFIG.MAGNITUDE_DISTRIBUTION.VERY_BRIGHT.max, threshold: STAR_ENGINE_CONFIG.MAGNITUDE_DISTRIBUTION.VERY_BRIGHT.threshold}
        : magnitudeRoll < STAR_ENGINE_CONFIG.MAGNITUDE_DISTRIBUTION.BRIGHT.threshold
        ? {min: STAR_ENGINE_CONFIG.MAGNITUDE_DISTRIBUTION.BRIGHT.min, max: STAR_ENGINE_CONFIG.MAGNITUDE_DISTRIBUTION.BRIGHT.max, threshold: STAR_ENGINE_CONFIG.MAGNITUDE_DISTRIBUTION.BRIGHT.threshold}
        : magnitudeRoll < STAR_ENGINE_CONFIG.MAGNITUDE_DISTRIBUTION.MEDIUM.threshold
        ? {min: STAR_ENGINE_CONFIG.MAGNITUDE_DISTRIBUTION.MEDIUM.min, max: STAR_ENGINE_CONFIG.MAGNITUDE_DISTRIBUTION.MEDIUM.max, threshold: STAR_ENGINE_CONFIG.MAGNITUDE_DISTRIBUTION.MEDIUM.threshold}
        : {min: STAR_ENGINE_CONFIG.MAGNITUDE_DISTRIBUTION.DIM.min, max: STAR_ENGINE_CONFIG.MAGNITUDE_DISTRIBUTION.DIM.max, threshold: 1};

    const magnitude = magMin + rand() * (magMax - magMin);

    // Size based on magnitude
    const baseSize = Math.max(0.3, (6 - magnitude) * 0.6);

    // Opacity based on magnitude and cluster
    let baseOpacity: number;
    if (magnitude < 2) {
      baseOpacity = STAR_ENGINE_CONFIG.OPACITY.BRIGHT.min + rand() * (STAR_ENGINE_CONFIG.OPACITY.BRIGHT.max - STAR_ENGINE_CONFIG.OPACITY.BRIGHT.min);
    } else if (magnitude < 4) {
      baseOpacity = STAR_ENGINE_CONFIG.OPACITY.MEDIUM.min + rand() * (STAR_ENGINE_CONFIG.OPACITY.MEDIUM.max - STAR_ENGINE_CONFIG.OPACITY.MEDIUM.min);
    } else {
      baseOpacity = STAR_ENGINE_CONFIG.OPACITY.DIM.min + rand() * (STAR_ENGINE_CONFIG.OPACITY.DIM.max - STAR_ENGINE_CONFIG.OPACITY.DIM.min);
    }

    // Clustered stars are slightly brighter
    if (cluster === 'dense') {
      baseOpacity *= STAR_ENGINE_CONFIG.OPACITY.CLUSTER_MULTIPLIER;
    }

    const rightAscension = rand() * 24;
    const declination = (rand() - 0.5) * 180;

    stars.push({
      id: i,
      x: Math.max(0, Math.min(width, x)),
      y: Math.max(0, Math.min(height, y)),
      z: 1,
      size: baseSize,
      opacity: baseOpacity,
      baseOpacity,
      twinkleSpeed: rand() * (STAR_ENGINE_CONFIG.TWINKLE.SPEED_MAX - STAR_ENGINE_CONFIG.TWINKLE.SPEED_MIN) + STAR_ENGINE_CONFIG.TWINKLE.SPEED_MIN,
      twinkleOffset: rand() * Math.PI * 2,
      color: getStarColor(temperature),
      temperature,
      rightAscension,
      rightAscensionRad: (rightAscension * Math.PI) / 12, // Pre-compute: convert hours to radians (24 hours = 2π)
      declination,
      declinationRad: (declination * Math.PI) / 180, // Pre-compute: convert degrees to radians
      magnitude,
      noiseOffset: rand() * 1000,
      cluster
    });
  }

  return stars;
};

/**
 * Render stars to canvas context with consistent styling
 * @param ctx Canvas rendering context
 * @param stars Array of stars to render
 * @param time Current time for animations
 */
export const renderStars = (
  ctx: CanvasRenderingContext2D,
  stars: Star[],
  time: number
) => {
  stars.forEach(star => {
    const x = star.x;
    const y = star.y;

    if (x < -50 || x > ctx.canvas.width + 50 || y < -50 || y > ctx.canvas.height + 50) {
      return;
    }

    const noiseValue = smoothNoise(time * star.twinkleSpeed + star.noiseOffset);
    const twinkle = 0.7 + noiseValue * 0.3;
    const currentOpacity = Math.max(STAR_ENGINE_CONFIG.OPACITY.MIN_VALUE, star.baseOpacity * twinkle);
    const currentSize = star.size * (0.9 + noiseValue * 0.2);

    // Subtle glow - only for brighter stars
    if (star.magnitude < STAR_ENGINE_CONFIG.GLOW.MAGNITUDE_THRESHOLD) {
      const glowSize = currentSize * STAR_ENGINE_CONFIG.GLOW.SIZE_MULTIPLIER;
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);

      glowGradient.addColorStop(0, colorWithOpacity(star.color, currentOpacity * STAR_ENGINE_CONFIG.GLOW.OPACITY_STOPS[0]));
      glowGradient.addColorStop(0.5, colorWithOpacity(star.color, currentOpacity * STAR_ENGINE_CONFIG.GLOW.OPACITY_STOPS[1]));
      glowGradient.addColorStop(1, `${star.color}00`);

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(x, y, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Core star - simple point
    ctx.fillStyle = colorWithOpacity(star.color, currentOpacity);
    ctx.beginPath();
    ctx.arc(x, y, currentSize, 0, Math.PI * 2);
    ctx.fill();
  });
};

/**
 * Update star positions for gentle motion
 * @param stars Array of stars to update
 * @param time Current time
 * @param canvasWidth Canvas width for wrapping
 * @param canvasHeight Canvas height for wrapping
 */
export const updateStarPositions = (
  stars: Star[],
  time: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  stars.forEach(star => {
    const stellarMotion = time * STAR_ENGINE_CONFIG.STELLAR_MOTION.SPEED;
    star.x += Math.cos(star.rightAscensionRad + stellarMotion) * STAR_ENGINE_CONFIG.STELLAR_MOTION.X_MOVEMENT;
    star.y += Math.sin(star.declinationRad) * STAR_ENGINE_CONFIG.STELLAR_MOTION.Y_MOVEMENT;

    // Wrap around screen edges
    if (star.x < 0) star.x = canvasWidth;
    if (star.x > canvasWidth) star.x = 0;
    if (star.y < 0) star.y = canvasHeight;
    if (star.y > canvasHeight) star.y = 0;
  });
};

// Export a singleton instance for consistent use across components
/**
 * StarEngine singleton - maintains consistent star state across components
 *
 * Note: This is a legacy wrapper around pure functions. Prefer using
 * generateStars(), renderStars(), and updateStarPositions() directly for new code.
 * The singleton pattern is useful for components that need shared state but
 * can add confusion with immutable defaults. Consider refactoring to Context API.
 */
export class StarEngine {
  private static instance: StarEngine;
  private stars: Star[] = [];
  private seed: number;

  private constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  public static getInstance(seed?: number): StarEngine {
    if (!StarEngine.instance) {
      StarEngine.instance = new StarEngine(seed);
    } else if (seed !== undefined && seed !== StarEngine.instance.seed) {
      // Error if different seed requested - prevents silent misuse
      console.warn(
        `StarEngine.getInstance called with seed ${seed} but instance already initialized with seed ${StarEngine.instance.seed}. Use setSeed() to change seeds.`
      );
    }
    return StarEngine.instance;
  }

  public generate(width: number, height: number, count: number = STAR_ENGINE_CONFIG.DEFAULT_STAR_COUNT): Star[] {
    this.stars = generateStars(count, {
      seed: this.seed,
      width,
      height
    });
    return this.stars;
  }

  public getStars(): Star[] {
    return this.stars;
  }

  public render(ctx: CanvasRenderingContext2D, time: number): void {
    renderStars(ctx, this.stars, time);
  }

  public update(time: number, width: number, height: number): void {
    updateStarPositions(this.stars, time, width, height);
  }

  public setSeed(seed: number): void {
    this.seed = seed;
  }

  public getSeed(): number {
    return this.seed;
  }
}

// Default export for easy importing
export default StarEngine;
