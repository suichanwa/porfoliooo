/**
 * Shared Star Engine
 * Provides unified star generation and rendering for both StarryBackground and Neptune components
 * Ensures both components use identical star data and rendering logic
 */

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
  declination: number;
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

// Star temperature-based colors - cooler, more subtle palette
const getStarColor = (temperature: number) => {
  const colors = [
    '#ffaa88', // Warm orange
    '#ffe6d5', // Pale warm
    '#fffff0', // Ivory white
    '#f0f8ff', // Alice blue
    '#e6f2ff', // Very pale blue
    '#d5e5ff', // Light blue
    '#c5d9ff'  // Soft blue
  ];
  return colors[Math.floor(temperature * colors.length)];
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
  count: number = 150, 
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
  
  // Use seeded random for consistent generation
  const rand = createSeededRandom(seed);
  
  // Adjust star count based on device capabilities
  const totalStars = finalIsLowEnd ? Math.min(count, 60) : 
                     finalIsMobile ? Math.min(count, 100) : 
                     count;

  const stars: Star[] = [];

  // Define cluster zones for more realistic distribution
  const clusters = [
    { x: width * 0.25, y: height * 0.3, radius: 150 },
    { x: width * 0.75, y: height * 0.6, radius: 120 },
    { x: width * 0.5, y: height * 0.8, radius: 100 }
  ];

  for (let i = 0; i < totalStars; i++) {
    const temperature = rand();
    
    // 70% sparse, 20% medium, 10% in clusters
    const distributionRoll = rand();
    let cluster: 'sparse' | 'medium' | 'dense' = 'sparse';
    let x: number, y: number;

    if (distributionRoll < 0.7) {
      // Sparse - truly random across entire canvas
      cluster = 'sparse';
      x = rand() * width;
      y = rand() * height;
    } else if (distributionRoll < 0.9) {
      // Medium - slightly grouped but still spread out
      cluster = 'medium';
      x = rand() * width;
      y = rand() * height;
    } else {
      // Dense - clustered around specific points
      cluster = 'dense';
      const chosenCluster = clusters[Math.floor(rand() * clusters.length)];
      const angle = rand() * Math.PI * 2;
      const distance = rand() * chosenCluster.radius;
      x = chosenCluster.x + Math.cos(angle) * distance;
      y = chosenCluster.y + Math.sin(angle) * distance;
    }

    // Magnitude system: 1 (brightest) to 6 (dimmest)
    // Most stars are dim (magnitude 4-6), few are bright (1-3)
    const magnitudeRoll = rand();
    let magnitude: number;
    
    if (magnitudeRoll < 0.05) {
      magnitude = 1 + rand(); // Very bright (5% of stars)
    } else if (magnitudeRoll < 0.15) {
      magnitude = 2 + rand(); // Bright (10% of stars)
    } else if (magnitudeRoll < 0.35) {
      magnitude = 3 + rand(); // Medium (20% of stars)
    } else {
      magnitude = 4 + rand() * 2; // Dim to very dim (65% of stars)
    }

    // Size based on magnitude
    const baseSize = Math.max(0.3, (6 - magnitude) * 0.6);
    
    // Opacity based on magnitude and cluster
    let baseOpacity: number;
    if (magnitude < 2) {
      baseOpacity = 0.5 + rand() * 0.3; // Bright stars: 0.5-0.8
    } else if (magnitude < 4) {
      baseOpacity = 0.25 + rand() * 0.2; // Medium stars: 0.25-0.45
    } else {
      baseOpacity = 0.1 + rand() * 0.15; // Dim stars: 0.1-0.25
    }

    // Clustered stars are slightly brighter
    if (cluster === 'dense') {
      baseOpacity *= 1.2;
    }
    
    stars.push({
      id: i,
      x: Math.max(0, Math.min(width, x)),
      y: Math.max(0, Math.min(height, y)),
      z: 1,
      size: baseSize,
      opacity: baseOpacity,
      baseOpacity,
      twinkleSpeed: rand() * 0.0003 + 0.0001, // Slower twinkle
      twinkleOffset: rand() * Math.PI * 2,
      color: getStarColor(temperature),
      temperature,
      rightAscension: rand() * 24,
      declination: (rand() - 0.5) * 180,
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
    const currentOpacity = Math.max(0.05, star.baseOpacity * twinkle);
    const currentSize = star.size * (0.9 + noiseValue * 0.2);

    // Subtle glow - only for brighter stars
    if (star.magnitude < 3) {
      const glowSize = currentSize * 4;
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
      
      glowGradient.addColorStop(0, `${star.color}${Math.floor(currentOpacity * 0.4 * 255).toString(16).padStart(2, '0')}`);
      glowGradient.addColorStop(0.5, `${star.color}${Math.floor(currentOpacity * 0.15 * 255).toString(16).padStart(2, '0')}`);
      glowGradient.addColorStop(1, `${star.color}00`);

      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(x, y, glowSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Core star - simple point
    ctx.fillStyle = `${star.color}${Math.floor(currentOpacity * 255).toString(16).padStart(2, '0')}`;
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
    const stellarMotion = time * 0.000000005; // Very slow motion
    star.x += Math.cos(star.rightAscension + stellarMotion) * 0.005;
    star.y += Math.sin(star.declination * Math.PI / 180) * 0.003;

    // Wrap around screen edges
    if (star.x < 0) star.x = canvasWidth;
    if (star.x > canvasWidth) star.x = 0;
    if (star.y < 0) star.y = canvasHeight;
    if (star.y > canvasHeight) star.y = 0;
  });
};

// Export a singleton instance for consistent use across components
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
    }
    return StarEngine.instance;
  }

  public generate(width: number, height: number, count: number = 150): Star[] {
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
