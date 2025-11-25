import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StarryBackgroundProps {
  onHideGUI?: (hidden: boolean) => void;
}

interface Star {
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
  cluster: 'sparse' | 'medium' | 'dense'; // New: star distribution type
}

interface ShootingStar {
  id: number;
  x: number;
  y: number;
  length: number;
  angle: number;
  speed: number;
  opacity: number;
  life: number;
  maxLife: number;
  trail: { x: number; y: number; opacity: number }[];
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
  pulseSpeed: number;
  pulseOffset: number;
}

interface ConstellationLine {
  star1: number;
  star2: number;
  opacity: number;
  fadeSpeed: number;
}

export default function StarryBackground({ onHideGUI }: StarryBackgroundProps) {
  const [showConstellations, setShowConstellations] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [hideGUI, setHideGUI] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [enableTrails, setEnableTrails] = useState(false);
  const [enableNebulae, setEnableNebulae] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const nebulaeRef = useRef<Nebula[]>([]);
  const constellationLinesRef = useRef<ConstellationLine[]>([]);
  const timeRef = useRef(0);
  const lastShootingStarRef = useRef(0);
  
  // Device detection
  const deviceInfo = useMemo(() => {
    if (!isClient || typeof window === 'undefined') {
      return { isMobile: false, isLowEnd: false, prefersReducedMotion: false };
    }
    
    return {
      isMobile: window.innerWidth < 768,
      isLowEnd: (navigator?.hardwareConcurrency || 4) <= 2 || 
                (window.devicePixelRatio > 2 && window.innerWidth < 1024),
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  }, [isClient]);

  // Initialize client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

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

  // Create initial stars with sparse, elegant distribution
  const createStars = useCallback((width: number, height: number) => {
    // Significantly reduced star count - 60% fewer stars
    const totalStars = deviceInfo.isLowEnd ? 60 : deviceInfo.isMobile ? 100 : 150;
    const stars: Star[] = [];

    // Define cluster zones (optional dense areas)
    const clusters = [
      { x: width * 0.25, y: height * 0.3, radius: 150 },
      { x: width * 0.75, y: height * 0.6, radius: 120 },
      { x: width * 0.5, y: height * 0.8, radius: 100 }
    ];

    for (let i = 0; i < totalStars; i++) {
      const temperature = Math.random();
      
      // 70% sparse, 20% medium, 10% in clusters
      const distributionRoll = Math.random();
      let cluster: 'sparse' | 'medium' | 'dense' = 'sparse';
      let x: number, y: number;

      if (distributionRoll < 0.7) {
        // Sparse - truly random across entire canvas
        cluster = 'sparse';
        x = Math.random() * width;
        y = Math.random() * height;
      } else if (distributionRoll < 0.9) {
        // Medium - slightly grouped but still spread out
        cluster = 'medium';
        x = Math.random() * width;
        y = Math.random() * height;
      } else {
        // Dense - clustered around specific points
        cluster = 'dense';
        const chosenCluster = clusters[Math.floor(Math.random() * clusters.length)];
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * chosenCluster.radius;
        x = chosenCluster.x + Math.cos(angle) * distance;
        y = chosenCluster.y + Math.sin(angle) * distance;
      }

      // Magnitude system: 1 (brightest) to 6 (dimmest)
      // Most stars are dim (magnitude 4-6), few are bright (1-3)
      const magnitudeRoll = Math.random();
      let magnitude: number;
      
      if (magnitudeRoll < 0.05) {
        magnitude = 1 + Math.random(); // Very bright (5% of stars)
      } else if (magnitudeRoll < 0.15) {
        magnitude = 2 + Math.random(); // Bright (10% of stars)
      } else if (magnitudeRoll < 0.35) {
        magnitude = 3 + Math.random(); // Medium (20% of stars)
      } else {
        magnitude = 4 + Math.random() * 2; // Dim to very dim (65% of stars)
      }

      // Size based on magnitude - smaller overall
      const baseSize = Math.max(0.3, (6 - magnitude) * 0.6);
      
      // Opacity based on magnitude and cluster - much dimmer overall
      let baseOpacity: number;
      if (magnitude < 2) {
        baseOpacity = 0.5 + Math.random() * 0.3; // Bright stars: 0.5-0.8
      } else if (magnitude < 4) {
        baseOpacity = 0.25 + Math.random() * 0.2; // Medium stars: 0.25-0.45
      } else {
        baseOpacity = 0.1 + Math.random() * 0.15; // Dim stars: 0.1-0.25
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
        twinkleSpeed: Math.random() * 0.0003 + 0.0001, // Slower twinkle
        twinkleOffset: Math.random() * Math.PI * 2,
        color: getStarColor(temperature),
        temperature,
        rightAscension: Math.random() * 24,
        declination: (Math.random() - 0.5) * 180,
        magnitude,
        noiseOffset: Math.random() * 1000,
        cluster
      });
    }

    return stars;
  }, [deviceInfo.isLowEnd, deviceInfo.isMobile]);

  // Create nebulae - fewer and more subtle
  const createNebulae = useCallback((width: number, height: number) => {
    const nebulae: Nebula[] = [];
    const nebulaCount = deviceInfo.isLowEnd ? 1 : 2;
    
    for (let i = 0; i < nebulaCount; i++) {
      nebulae.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 150 + 100,
        color: ['#4a3366', '#2a4466', '#3a4466', '#2a5544'][Math.floor(Math.random() * 4)],
        opacity: Math.random() * 0.03 + 0.01, // More subtle
        pulseSpeed: Math.random() * 0.0002 + 0.00005,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
    
    return nebulae;
  }, [deviceInfo.isLowEnd]);

  // Create dynamic constellation lines
  const createConstellationLines = useCallback((stars: Star[]) => {
    const lines: ConstellationLine[] = [];
    const maxDistance = 120; // Shorter max distance
    
    stars.forEach((star, i) => {
      // Only connect brighter stars (magnitude < 4)
      if (star.magnitude > 4) return;
      
      const nearbyStars = stars
        .filter((otherStar, j) => {
          if (i === j) return false;
          if (otherStar.magnitude > 4) return false; // Only connect to bright stars
          const dx = star.x - otherStar.x;
          const dy = star.y - otherStar.y;
          return Math.sqrt(dx * dx + dy * dy) < maxDistance;
        })
        .slice(0, 2);
      
      nearbyStars.forEach((nearStar) => {
        if (Math.random() < 0.25) { // Fewer connections
          lines.push({
            star1: star.id,
            star2: nearStar.id,
            opacity: 0,
            fadeSpeed: Math.random() * 0.015 + 0.005
          });
        }
      });
    });
    
    return lines;
  }, []);

  // Smooth noise function for twinkling
  const smoothNoise = (x: number) => {
    return (Math.sin(x) + Math.sin(x * 2.1) * 0.5 + Math.sin(x * 3.7) * 0.25) / 1.75;
  };

  // Create shooting star with trail
  const createShootingStar = useCallback((width: number, height: number): ShootingStar => {
    const fromRight = Math.random() > 0.5;
    const startX = fromRight ? width + 50 : -50;
    const startY = Math.random() * height * 0.5;
    const angle = fromRight ? Math.PI * 0.75 : Math.PI * 0.25;
    
    return {
      id: Date.now() + Math.random(),
      x: startX,
      y: startY,
      length: Math.random() * 100 + 60,
      angle,
      speed: Math.random() * 3 + 2,
      opacity: 0.8, // Slightly dimmer meteors
      life: 0,
      maxLife: Math.random() * 80 + 50,
      trail: []
    };
  }, []);

  // Draw star with subtler glow
  const drawStar = useCallback((
    ctx: CanvasRenderingContext2D, 
    star: Star, 
    time: number
  ) => {
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
  }, []);

  // Draw nebula
  const drawNebula = useCallback((
    ctx: CanvasRenderingContext2D, 
    nebula: Nebula, 
    time: number
  ) => {
    const pulse = Math.sin(time * nebula.pulseSpeed + nebula.pulseOffset) * 0.3 + 0.7;
    const currentOpacity = nebula.opacity * pulse;
    const currentRadius = nebula.radius * (0.9 + pulse * 0.2);

    const gradient = ctx.createRadialGradient(
      nebula.x, nebula.y, 0,
      nebula.x, nebula.y, currentRadius
    );
    
    gradient.addColorStop(0, `${nebula.color}${Math.floor(currentOpacity * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(0.3, `${nebula.color}${Math.floor(currentOpacity * 0.4 * 255).toString(16).padStart(2, '0')}`);
    gradient.addColorStop(1, `${nebula.color}00`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(nebula.x, nebula.y, currentRadius, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  // Draw shooting star with enhanced trail
  const drawShootingStar = useCallback((
    ctx: CanvasRenderingContext2D, 
    shootingStar: ShootingStar
  ) => {
    const progress = shootingStar.life / shootingStar.maxLife;
    let opacity = shootingStar.opacity;
    
    if (progress < 0.1) {
      opacity *= progress / 0.1;
    } else if (progress > 0.7) {
      opacity *= Math.max(0, (1 - progress) / 0.3);
    }

    shootingStar.trail.push({ x: shootingStar.x, y: shootingStar.y, opacity });
    if (shootingStar.trail.length > 15) {
      shootingStar.trail.shift();
    }

    shootingStar.trail.forEach((point, i) => {
      const trailOpacity = point.opacity * (i / shootingStar.trail.length) * 0.4;
      const size = (i / shootingStar.trail.length) * 2.5;
      
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size * 2);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${trailOpacity})`);
      gradient.addColorStop(1, `rgba(200, 220, 255, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    const headGradient = ctx.createRadialGradient(
      shootingStar.x, shootingStar.y, 0,
      shootingStar.x, shootingStar.y, 12
    );
    headGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    headGradient.addColorStop(0.3, `rgba(220, 230, 255, ${opacity * 0.6})`);
    headGradient.addColorStop(1, `rgba(180, 200, 255, 0)`);

    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(shootingStar.x, shootingStar.y, 12, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  // Draw dynamic constellation lines
  const drawConstellationLines = useCallback((
    ctx: CanvasRenderingContext2D,
    stars: Star[],
    lines: ConstellationLine[],
    time: number
  ) => {
    lines.forEach(line => {
      const star1 = stars.find(s => s.id === line.star1);
      const star2 = stars.find(s => s.id === line.star2);
      
      if (!star1 || !star2) return;

      line.opacity += (Math.sin(time * line.fadeSpeed) > 0 ? 1 : -1) * 0.008;
      line.opacity = Math.max(0, Math.min(0.2, line.opacity)); // Max 0.2 opacity

      if (line.opacity > 0.03) {
        ctx.strokeStyle = `rgba(140, 180, 220, ${line.opacity})`;
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(star1.x, star1.y);
        ctx.lineTo(star2.x, star2.y);
        ctx.stroke();
      }
    });
  }, []);

  // Simplified animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    timeRef.current += 16;

    if (enableTrails) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    if (enableNebulae) {
      nebulaeRef.current.forEach(nebula => {
        drawNebula(ctx, nebula, timeRef.current);
      });
    }

    // Draw all stars with very slow motion
    starsRef.current.forEach(star => {
      const stellarMotion = timeRef.current * 0.000000005; // Even slower
      star.x += Math.cos(star.rightAscension + stellarMotion) * 0.005;
      star.y += Math.sin(star.declination * Math.PI / 180) * 0.003;

      // Wrap around screen
      if (star.x < 0) star.x = width;
      if (star.x > width) star.x = 0;
      if (star.y < 0) star.y = height;
      if (star.y > height) star.y = 0;

      drawStar(ctx, star, timeRef.current);
    });

    if (showConstellations && constellationLinesRef.current.length > 0) {
      drawConstellationLines(ctx, starsRef.current, constellationLinesRef.current, timeRef.current);
    }

    // Less frequent shooting stars
    if (!deviceInfo.isLowEnd && !deviceInfo.prefersReducedMotion) {
      const meteorInterval = deviceInfo.isMobile ? 20000 : 15000;
      if (timeRef.current - lastShootingStarRef.current > meteorInterval) {
        if (Math.random() < 0.4) { // Lower probability
          shootingStarsRef.current.push(createShootingStar(width, height));
          lastShootingStarRef.current = timeRef.current;
        }
      }
    }

    shootingStarsRef.current.forEach((shootingStar, index) => {
      shootingStar.life++;
      shootingStar.x -= Math.cos(shootingStar.angle) * shootingStar.speed;
      shootingStar.y += Math.sin(shootingStar.angle) * shootingStar.speed;

      if (shootingStar.life >= shootingStar.maxLife || 
          shootingStar.x < -200 || shootingStar.x > width + 200 ||
          shootingStar.y > height + 200) {
        shootingStarsRef.current.splice(index, 1);
        return;
      }

      drawShootingStar(ctx, shootingStar);
    });

    animationRef.current = requestAnimationFrame(animate);
  }, [deviceInfo, enableTrails, enableNebulae, showConstellations, drawStar, drawNebula, drawShootingStar, drawConstellationLines, createShootingStar]);

  // Setup canvas and start animation
  useEffect(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      const canvasSize = { width: canvas.width / dpr, height: canvas.height / dpr };
      starsRef.current = createStars(canvasSize.width, canvasSize.height);
      nebulaeRef.current = createNebulae(canvasSize.width, canvasSize.height);
      constellationLinesRef.current = createConstellationLines(starsRef.current);
    };

    resizeCanvas();

    const handleResize = () => {
      resizeCanvas();
    };

    window.addEventListener('resize', handleResize);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isClient, animate, createStars, createNebulae, createConstellationLines]);

  // GUI hiding functionality
  const handleHideGUI = useCallback(() => {
    const newHideState = !hideGUI;
    setHideGUI(newHideState);
    
    if (newHideState) {
      setIsPanelOpen(false);
    }
    
    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        const guiElements = document.querySelectorAll('.gui-element');
        guiElements.forEach(element => {
          const htmlElement = element as HTMLElement;
          if (newHideState) {
            htmlElement.style.cssText = 'opacity: 0; pointer-events: none; transform: translateY(20px);';
          } else {
            htmlElement.style.cssText = 'opacity: 1; pointer-events: auto; transform: translateY(0);';
          }
        });
      });
    }
    
    onHideGUI?.(newHideState);
  }, [hideGUI, onHideGUI]);

  if (!isClient) return null;

  return (
    <>
      {/* Control Button */}
      <motion.button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className={`fixed top-20 right-4 z-[9999] p-3 rounded-full border border-white/20 shadow-lg transition-all duration-300 ${
          hideGUI 
            ? 'bg-transparent text-white/30 hover:text-white/60' 
            : 'bg-black/70 backdrop-blur-sm text-white hover:text-blue-300'
        }`}
        style={{ pointerEvents: 'auto' }}
        whileHover={{ scale: hideGUI ? 1 : 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          opacity: hideGUI ? 0.3 : 1,
          rotate: isPanelOpen ? 180 : 0
        }}
        transition={{ duration: 0.2 }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className="drop-shadow-lg"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </motion.button>

      {/* Enhanced Control Panel */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={() => setIsPanelOpen(false)}
              style={{ pointerEvents: 'auto' }}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="fixed top-24 right-4 bg-black/90 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-[9999] w-72"
              style={{ pointerEvents: 'auto' }}
            >
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="text-white font-medium text-base">🌌 Cosmic Observatory</h3>
                  {hideGUI && (
                    <p className="text-white/60 text-xs mt-1">Interface is currently hidden</p>
                  )}
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setShowConstellations(!showConstellations)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      showConstellations 
                        ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30' 
                        : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    ⭐ {showConstellations ? 'Hide' : 'Show'} Constellations
                  </button>

                  <button
                    onClick={() => setEnableTrails(!enableTrails)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      enableTrails 
                        ? 'bg-purple-500/30 text-purple-300 border border-purple-400/30' 
                        : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    ✨ {enableTrails ? 'Disable' : 'Enable'} Star Trails
                  </button>

                  <button
                    onClick={() => setEnableNebulae(!enableNebulae)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      enableNebulae 
                        ? 'bg-pink-500/30 text-pink-300 border border-pink-400/30' 
                        : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    🌌 {enableNebulae ? 'Hide' : 'Show'} Nebulae
                  </button>

                  <button
                    onClick={handleHideGUI}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      hideGUI 
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30 hover:bg-green-500/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-400/30 hover:bg-red-500/30'
                    }`}
                  >
                    🎛️ {hideGUI ? 'Show' : 'Hide'} Interface
                  </button>
                </div>
                
                <div className="mt-4 pt-3 border-t border-white/10">
                  <p className="text-xs text-white/60 text-center leading-relaxed">
                    ✨ Sparse & Elegant<br/>
                    🌟 Realistic Magnitude System<br/>
                    🎨 Subtle Color Palette<br/>
                    ☄️ Rare Shooting Stars<br/>
                    🌌 Minimal Nebulae
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Canvas Background */}
      <div 
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}
      >
        {/* Darker gradient background */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.7,
            background: `
              radial-gradient(ellipse 70% 90% at 50% 50%, 
                rgba(8, 10, 20, 0.3) 0%, 
                rgba(4, 5, 12, 0.6) 50%,
                rgba(0, 0, 0, 0.9) 100%
              )
            `
          }}
        />
        
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'block',
            background: 'transparent',
            imageRendering: 'auto',
            mixBlendMode: enableTrails ? 'screen' : 'normal'
          }}
        />
      </div>
    </>
  );
}