import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StarryBackgroundProps {
  onHideGUI?: (hidden: boolean) => void;
}

interface Star {
  id: number;
  x: number;
  y: number;
  z: number; // Depth layer
  size: number;
  opacity: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  color: string;
  temperature: number; // Star temperature class
  rightAscension: number;
  declination: number;
  magnitude: number;
  noiseOffset: number; // For smooth noise twinkling
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
  const cameraOffsetRef = useRef({ x: 0, y: 0 });
  
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

  // Star temperature-based colors
  const getStarColor = (temperature: number) => {
    const colors = [
      '#ff6b4a', // Red dwarf
      '#ffaa77', // Orange
      '#fff4e6', // Yellow (Sun-like)
      '#ffffff', // White
      '#e6f3ff', // Blue-white
      '#aaccff', // Blue giant
      '#8899ff'  // Blue supergiant
    ];
    return colors[Math.floor(temperature * colors.length)];
  };

  // FIXED: Much slower depth layers for parallax
  const depthLayers = [
    { speed: 0.005, size: 0.5, density: 0.4, zIndex: 1 }, // Far background - 10x slower
    { speed: 0.01,  size: 0.8, density: 0.3, zIndex: 2 }, // Mid background - 10x slower
    { speed: 0.02,  size: 1.2, density: 0.2, zIndex: 3 }, // Mid foreground - 10x slower
    { speed: 0.04,  size: 1.8, density: 0.1, zIndex: 4 }  // Near foreground - 10x slower
  ];

  // Create initial stars with depth layers
  const createStars = useCallback((width: number, height: number) => {
    const totalStars = deviceInfo.isLowEnd ? 150 : deviceInfo.isMobile ? 250 : 400;
    const stars: Star[] = [];

    depthLayers.forEach((layer, layerIndex) => {
      const layerStarCount = Math.floor(totalStars * layer.density);
      
      for (let i = 0; i < layerStarCount; i++) {
        const temperature = Math.random();
        const magnitude = Math.random() * 5 + 1;
        const baseSize = (6 - magnitude) * layer.size;
        
        stars.push({
          id: stars.length,
          x: Math.random() * width * 1.2 - width * 0.1, // Extend beyond canvas
          y: Math.random() * height * 1.2 - height * 0.1,
          z: layerIndex + 1,
          size: Math.max(0.5, baseSize),
          opacity: Math.random() * 0.6 + 0.4,
          baseOpacity: Math.random() * 0.6 + 0.4,
          twinkleSpeed: Math.random() * 0.0005 + 0.0001,
          twinkleOffset: Math.random() * Math.PI * 2,
          color: getStarColor(temperature),
          temperature,
          rightAscension: Math.random() * 24,
          declination: (Math.random() - 0.5) * 180,
          magnitude,
          noiseOffset: Math.random() * 1000
        });
      }
    });

    return stars;
  }, [deviceInfo.isLowEnd, deviceInfo.isMobile]);

  // Create nebulae
  const createNebulae = useCallback((width: number, height: number) => {
    const nebulae: Nebula[] = [];
    const nebulaCount = deviceInfo.isLowEnd ? 2 : 4;
    
    for (let i = 0; i < nebulaCount; i++) {
      nebulae.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 200 + 100,
        color: ['#ff44aa', '#44aaff', '#aa44ff', '#44ffaa'][Math.floor(Math.random() * 4)],
        opacity: Math.random() * 0.05 + 0.02,
        pulseSpeed: Math.random() * 0.0003 + 0.0001,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
    
    return nebulae;
  }, [deviceInfo.isLowEnd]);

  // Create dynamic constellation lines
  const createConstellationLines = useCallback((stars: Star[]) => {
    const lines: ConstellationLine[] = [];
    const maxDistance = 150;
    
    stars.forEach((star, i) => {
      if (star.z <= 2) return; // Only connect foreground stars
      
      const nearbyStars = stars
        .filter((otherStar, j) => {
          if (i === j || otherStar.z !== star.z) return false;
          const dx = star.x - otherStar.x;
          const dy = star.y - otherStar.y;
          return Math.sqrt(dx * dx + dy * dy) < maxDistance;
        })
        .slice(0, 2); // Max 2 connections per star
      
      nearbyStars.forEach((nearStar) => {
        if (Math.random() < 0.3) { // 30% chance to connect
          lines.push({
            star1: star.id,
            star2: nearStar.id,
            opacity: 0,
            fadeSpeed: Math.random() * 0.02 + 0.01
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
      length: Math.random() * 120 + 80,
      angle,
      speed: Math.random() * 4 + 3,
      opacity: 1,
      life: 0,
      maxLife: Math.random() * 100 + 60,
      trail: []
    };
  }, []);

  // FIXED: Draw star without lens flare/cross effect
  const drawStar = useCallback((
    ctx: CanvasRenderingContext2D, 
    star: Star, 
    time: number,
    cameraOffset: { x: number; y: number }
  ) => {
    // Apply parallax based on depth
    const parallaxFactor = (5 - star.z) * 0.3;
    const x = star.x + cameraOffset.x * parallaxFactor;
    const y = star.y + cameraOffset.y * parallaxFactor;
    
    // Skip if outside extended canvas area
    if (x < -50 || x > ctx.canvas.width + 50 || y < -50 || y > ctx.canvas.height + 50) {
      return;
    }

    // Smooth noise-based twinkling
    const noiseValue = smoothNoise(time * star.twinkleSpeed + star.noiseOffset);
    const twinkle = 0.7 + noiseValue * 0.3;
    const currentOpacity = Math.max(0.1, star.baseOpacity * twinkle);
    const currentSize = star.size * (0.9 + noiseValue * 0.2);

    // REMOVED: Lens flare/cross effect completely removed

    // Glow based on depth and temperature
    const glowSize = currentSize * (6 - star.z) * 0.8;
    const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowSize);
    
    glowGradient.addColorStop(0, `${star.color}${Math.floor(currentOpacity * 0.8 * 255).toString(16).padStart(2, '0')}`);
    glowGradient.addColorStop(0.4, `${star.color}${Math.floor(currentOpacity * 0.3 * 255).toString(16).padStart(2, '0')}`);
    glowGradient.addColorStop(1, `${star.color}00`);

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(x, y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Core star
    const coreGradient = ctx.createRadialGradient(x, y, 0, x, y, currentSize);
    coreGradient.addColorStop(0, `${star.color}${Math.floor(currentOpacity * 255).toString(16).padStart(2, '0')}`);
    coreGradient.addColorStop(0.7, `${star.color}${Math.floor(currentOpacity * 0.6 * 255).toString(16).padStart(2, '0')}`);
    coreGradient.addColorStop(1, `${star.color}00`);

    ctx.fillStyle = coreGradient;
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
    gradient.addColorStop(0.3, `${nebula.color}${Math.floor(currentOpacity * 0.5 * 255).toString(16).padStart(2, '0')}`);
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

    // Update trail
    shootingStar.trail.push({ x: shootingStar.x, y: shootingStar.y, opacity });
    if (shootingStar.trail.length > 20) {
      shootingStar.trail.shift();
    }

    // Draw trail
    shootingStar.trail.forEach((point, i) => {
      const trailOpacity = point.opacity * (i / shootingStar.trail.length) * 0.5;
      const size = (i / shootingStar.trail.length) * 3;
      
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size * 2);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${trailOpacity})`);
      gradient.addColorStop(1, `rgba(100, 150, 255, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw main meteor
    const headGradient = ctx.createRadialGradient(
      shootingStar.x, shootingStar.y, 0,
      shootingStar.x, shootingStar.y, 15
    );
    headGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    headGradient.addColorStop(0.3, `rgba(200, 220, 255, ${opacity * 0.7})`);
    headGradient.addColorStop(1, `rgba(100, 150, 255, 0)`);

    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(shootingStar.x, shootingStar.y, 15, 0, Math.PI * 2);
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

      // Animate line opacity
      line.opacity += (Math.sin(time * line.fadeSpeed) > 0 ? 1 : -1) * 0.01;
      line.opacity = Math.max(0, Math.min(0.3, line.opacity));

      if (line.opacity > 0.05) {
        ctx.strokeStyle = `rgba(100, 150, 255, ${line.opacity})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(star1.x, star1.y);
        ctx.lineTo(star2.x, star2.y);
        ctx.stroke();
      }
    });
  }, []);

  // FIXED: Much slower animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    timeRef.current += 16;

    // FIXED: Much slower camera drift
    cameraOffsetRef.current.x = Math.sin(timeRef.current * 0.000005) * 2; // 10x slower, smaller movement
    cameraOffsetRef.current.y = Math.cos(timeRef.current * 0.000003) * 1; // 10x slower, smaller movement

    // Star trails effect or full clear
    if (enableTrails) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    // Draw nebulae first (background)
    if (enableNebulae) {
      nebulaeRef.current.forEach(nebula => {
        drawNebula(ctx, nebula, timeRef.current);
      });
    }

    // FIXED: Much slower stellar motion
    depthLayers.forEach((layer, layerIndex) => {
      const layerStars = starsRef.current.filter(star => star.z === layerIndex + 1);
      
      layerStars.forEach(star => {
        // FIXED: Much slower stellar motion - reduced by 100x
        const stellarMotion = timeRef.current * 0.00000001 * layer.speed; // Was 0.000001, now 0.00000001
        star.x += Math.cos(star.rightAscension + stellarMotion) * layer.speed * 0.02; // Was layer.speed * 2, now * 0.02
        star.y += Math.sin(star.declination * Math.PI / 180) * layer.speed * 0.01; // Added * 0.01 to slow down

        // Wrap around screen
        if (star.x < -width * 0.1) star.x = width * 1.1;
        if (star.x > width * 1.1) star.x = -width * 0.1;
        if (star.y < -height * 0.1) star.y = height * 1.1;
        if (star.y > height * 1.1) star.y = -height * 0.1;

        drawStar(ctx, star, timeRef.current, cameraOffsetRef.current);
      });
    });

    // Draw dynamic constellation lines
    if (showConstellations && constellationLinesRef.current.length > 0) {
      drawConstellationLines(ctx, starsRef.current, constellationLinesRef.current, timeRef.current);
    }

    // Shooting stars
    if (!deviceInfo.isLowEnd && !deviceInfo.prefersReducedMotion) {
      const meteorInterval = deviceInfo.isMobile ? 15000 : 10000;
      if (timeRef.current - lastShootingStarRef.current > meteorInterval) {
        if (Math.random() < 0.6) {
          shootingStarsRef.current.push(createShootingStar(width, height));
          lastShootingStarRef.current = timeRef.current;
        }
      }
    }

    // Update meteors
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
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        canvas.style.width = rect.width + 'px';
        canvas.style.height = rect.height + 'px';
      }

      const canvasSize = { width: canvas.width / dpr, height: canvas.height / dpr };
      starsRef.current = createStars(canvasSize.width, canvasSize.height);
      nebulaeRef.current = createNebulae(canvasSize.width, canvasSize.height);
      constellationLinesRef.current = createConstellationLines(starsRef.current);
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
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
                    ⭐ {showConstellations ? 'Hide' : 'Show'} Dynamic Constellations
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
                    🌌 {enableNebulae ? 'Hide' : 'Show'} Distant Nebulae
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
                    🌠 4-Layer Parallax Depth<br/>
                    🎨 Temperature-Based Colors<br/>
                    ⭐ No Lens Flare Spikes<br/>
                    ☄️ Enhanced Meteor Trails<br/>
                    📷 Gentle Camera Drift
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Enhanced Canvas Background */}
      <div className="fixed inset-0 z-0 overflow-hidden" style={{ pointerEvents: 'none' }}>
        {/* Deep space gradient background */}
        <div 
          className="absolute inset-0 opacity-60"
          style={{
            background: `
              radial-gradient(ellipse 80% 100% at 50% 50%, 
                rgba(10, 15, 30, 0.2) 0%, 
                rgba(5, 8, 20, 0.4) 40%,
                rgba(0, 0, 0, 0.8) 100%
              )
            `,
          }}
        />
        
        {/* Main enhanced canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{
            background: 'transparent',
            imageRendering: 'auto',
            mixBlendMode: enableTrails ? 'screen' : 'normal'
          }}
        />
      </div>
    </>
  );
}