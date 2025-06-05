import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  speed: number;
  color: string;
  twinkleSpeed: number;
  angle: number;
  stellarClass: string;
  temperature: number;
  brightness: number;
  distance: number;
  isVariable: boolean;
  pulsePeriod?: number;
  constellation?: string;
}

interface ShootingStar {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  length: number;
  duration: number;
  opacity: number;
  size: number;
  type: 'meteor' | 'fireball';
  color: string;
  sparkles: boolean;
}

interface Constellation {
  name: string;
  stars: { x: number; y: number; brightness: number }[];
  connections: { from: number; to: number }[];
}

// Optimized stellar classes
const STELLAR_CLASSES = {
  'O': { temp: 30000, color: '#9bb0ff', rarity: 0.02, size: 8 },
  'A': { temp: 8500, color: '#cad7ff', rarity: 0.15, size: 2 },
  'G': { temp: 5500, color: '#fff4ea', rarity: 0.25, size: 1 },
  'M': { temp: 3000, color: '#ffad51', rarity: 0.58, size: 0.8 }
} as const;

// Pre-computed constellations
const CONSTELLATIONS: Constellation[] = [
  {
    name: 'Big Dipper',
    stars: [
      { x: 0.2, y: 0.3, brightness: 0.8 },
      { x: 0.25, y: 0.25, brightness: 0.9 },
      { x: 0.3, y: 0.2, brightness: 0.7 },
      { x: 0.35, y: 0.22, brightness: 0.8 },
      { x: 0.4, y: 0.28, brightness: 0.6 },
      { x: 0.42, y: 0.35, brightness: 0.7 },
      { x: 0.38, y: 0.4, brightness: 0.8 }
    ],
    connections: [
      { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
      { from: 3, to: 4 }, { from: 4, to: 5 }, { from: 5, to: 6 }
    ]
  }
];

interface StarryBackgroundProps {
  onHideGUI?: (hidden: boolean) => void;
}

export default function StarryBackground({ onHideGUI }: StarryBackgroundProps) {
  const [stars, setStars] = useState<Star[]>([]);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);
  const [constellations, setConstellations] = useState<Constellation[]>([]);
  const [showConstellations, setShowConstellations] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [hideGUI, setHideGUI] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isClient, setIsClient] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastUpdateRef = useRef<number>(0);
  const shootingStarTimerRef = useRef<number | null>(null);
  const frameCountRef = useRef<number>(0);
  
  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Memoized device detection - only on client side
  const deviceInfo = useMemo(() => {
    if (!isClient || typeof window === 'undefined') {
      return {
        isMobile: false,
        isLowEnd: false,
        prefersReducedMotion: false
      };
    }
    
    return {
      isMobile: window.innerWidth < 768,
      isLowEnd: (navigator?.hardwareConcurrency || 4) <= 2 || 
                (window.devicePixelRatio > 2 && window.innerWidth < 1024),
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  }, [isClient]);

  // Visibility API optimization - only on client
  useEffect(() => {
    if (!isClient) return;
    
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isClient]);

  // Throttled resize handler with debouncing - only on client
  const handleResize = useCallback(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
    }
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    setIsMobile(deviceInfo.isMobile);
    
    let resizeTimeout: number;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 150);
    };
    
    window.addEventListener('resize', debouncedResize, { passive: true });
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, [handleResize, deviceInfo.isMobile, isClient]);

  // Optimized star color with pre-computed values
  const getStarColor = useCallback((temperature: number): string => {
    // Use binary search-like approach for better performance
    if (temperature >= 20000) return '#9bb0ff';
    if (temperature >= 7000) return '#cad7ff';
    if (temperature >= 5000) return '#fff4ea';
    return '#ffad51';
  }, []);

  // Optimized star generation with object pooling
  const generateStar = useCallback((id: number, x: number, y: number): Star => {
    const rand = Math.random();
    let stellarClass: keyof typeof STELLAR_CLASSES = 'M';
    let cumulative = 0;
    
    // Optimized class selection
    for (const [type, props] of Object.entries(STELLAR_CLASSES)) {
      cumulative += props.rarity;
      if (rand <= cumulative) {
        stellarClass = type as keyof typeof STELLAR_CLASSES;
        break;
      }
    }
    
    const classProps = STELLAR_CLASSES[stellarClass];
    const temperature = classProps.temp + ((Math.random() - 0.5) * 1000);
    const brightness = Math.random() * 0.5 + 0.5;
    
    return {
      id,
      x,
      y,
      size: classProps.size * (Math.random() * 0.3 + 0.8),
      opacity: brightness,
      speed: Math.random() * 0.02 + 0.005,
      color: getStarColor(temperature),
      twinkleSpeed: Math.random() * 2 + 2,
      angle: (Math.random() - 0.5) * 0.02,
      stellarClass,
      temperature,
      brightness,
      distance: Math.random() * 500 + 50,
      isVariable: Math.random() < (deviceInfo.isLowEnd ? 0.02 : 0.05),
      pulsePeriod: Math.random() * 3 + 3
    };
  }, [getStarColor, deviceInfo.isLowEnd]);

  // Optimized star initialization with adaptive quality - only on client
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Adaptive star count based on device performance
    const getStarCount = () => {
      const baseCount = Math.floor((width * height) / 15000);
      if (deviceInfo.isLowEnd) return Math.min(30, baseCount);
      if (deviceInfo.isMobile) return Math.min(60, baseCount);
      return Math.min(120, baseCount);
    };
    
    const starCount = getStarCount();
    
    // Pre-allocate arrays for better performance
    const constellationStars: Star[] = [];
    const backgroundStars: Star[] = [];
    
    // Create constellation stars
    const scaledConstellations = CONSTELLATIONS.map(constellation => ({
      ...constellation,
      stars: constellation.stars.map((star) => {
        const starX = star.x * width;
        const starY = star.y * height;
        const realisticStar = generateStar(1000 + constellationStars.length, starX, starY);
        
        realisticStar.size *= 1.2;
        realisticStar.opacity = star.brightness;
        realisticStar.constellation = constellation.name;
        
        constellationStars.push(realisticStar);
        return { ...star, x: starX, y: starY };
      })
    }));
    
    setConstellations(scaledConstellations);
    
    // Create background stars with spatial optimization
    const gridSize = 100;
    const occupiedCells = new Set<string>();
    
    // Mark constellation areas as occupied
    constellationStars.forEach(cStar => {
      const cellX = Math.floor(cStar.x / gridSize);
      const cellY = Math.floor(cStar.y / gridSize);
      occupiedCells.add(`${cellX},${cellY}`);
    });
    
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const cellX = Math.floor(x / gridSize);
      const cellY = Math.floor(y / gridSize);
      
      if (!occupiedCells.has(`${cellX},${cellY}`)) {
        backgroundStars.push(generateStar(i, x, y));
        occupiedCells.add(`${cellX},${cellY}`);
      }
    }
    
    setStars([...constellationStars, ...backgroundStars]);
    
    // Adaptive shooting star frequency
    const shootingStarInterval = deviceInfo.isLowEnd ? 12000 : 
                                 deviceInfo.isMobile ? 10000 : 8000;
    
    shootingStarTimerRef.current = window.setInterval(() => {
      if (isVisible && Math.random() > 0.85) {
        createShootingStar();
      }
    }, shootingStarInterval);
    
    return () => {
      if (shootingStarTimerRef.current) {
        clearInterval(shootingStarTimerRef.current);
      }
    };
  }, [deviceInfo, generateStar, isVisible, isClient]);

  // Fixed shooting star creation with proper 90s-style diagonal motion
  const createShootingStar = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const type = Math.random() > 0.7 ? 'fireball' : 'meteor';
    
    // Classic diagonal falling motion from top-right to bottom-left
    const startX = width * (0.6 + Math.random() * 0.4); // Start from right side
    const startY = height * (Math.random() * 0.3); // Start from upper area
    const endX = width * (Math.random() * 0.4); // End on left side
    const endY = height * (0.7 + Math.random() * 0.3); // End in lower area
    
    // Calculate the trail length based on the diagonal distance
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const trailLength = Math.min(distance * 0.3, type === 'fireball' ? 150 : 100);
    
    const shootingStar: ShootingStar = {
      id: Date.now() + Math.random(),
      startX,
      startY,
      endX,
      endY,
      length: trailLength,
      duration: type === 'fireball' ? 2.5 : 1.5, // Slightly longer for classic feel
      opacity: type === 'fireball' ? 0.9 : 0.8,
      size: type === 'fireball' ? 4 : 3,
      type,
      color: type === 'fireball' ? '#ff6b35' : '#ffffff',
      sparkles: type === 'fireball'
    };
    
    setShootingStars(prev => [...prev, shootingStar]);
    
    const cleanupDelay = shootingStar.duration * 1000 + 500;
    setTimeout(() => {
      setShootingStars(prev => prev.filter(s => s.id !== shootingStar.id));
    }, cleanupDelay);
  }, []);

  // Highly optimized animation loop with adaptive FPS
  const animate = useCallback((currentTime: number) => {
    if (!isVisible || typeof window === 'undefined') {
      if (typeof window !== 'undefined') {
        animationRef.current = requestAnimationFrame(animate);
      }
      return;
    }
    
    frameCountRef.current++;
    
    // Adaptive frame rate based on performance
    const targetFrameInterval = deviceInfo.isLowEnd ? 66 : // 15 FPS
                                deviceInfo.isMobile ? 50 : // 20 FPS  
                                33; // 30 FPS
    
    if (currentTime - lastUpdateRef.current < targetFrameInterval) {
      animationRef.current = requestAnimationFrame(animate);
      return;
    }
    
    lastUpdateRef.current = currentTime;
    
    // Only update stars every few frames on low-end devices
    const shouldUpdateStars = !deviceInfo.isLowEnd || frameCountRef.current % 2 === 0;
    
    if (shouldUpdateStars) {
      setStars(prevStars => {
        const height = window.innerHeight;
        const width = window.innerWidth;
        
        return prevStars.map(star => {
          if (star.constellation) return star;
          
          // Simplified movement calculation
          const newX = star.x + Math.sin(star.angle) * star.speed;
          const newY = star.y + star.speed * 0.5;
          
          // Efficient boundary check
          if (newY > height + 50 || newX < -50 || newX > width + 50) {
            return generateStar(star.id, Math.random() * width, -20);
          }
          
          return { ...star, x: newX, y: newY };
        });
      });
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [isVisible, deviceInfo, generateStar]);

  useEffect(() => {
    if (isVisible && isClient && typeof window !== 'undefined') {
      animationRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animate, isVisible, isClient]);

  // Optimized GUI hiding with direct DOM manipulation
  const handleHideGUI = useCallback(() => {
    const newHideState = !hideGUI;
    setHideGUI(newHideState);
    
    if (newHideState) {
      setIsPanelOpen(false);
    }
    
    // Batch DOM operations - only on client
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

  // Memoized constellation lines to prevent re-renders
  const constellationLines = useMemo(() => {
    if (!showConstellations) return null;
    
    return (
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1, pointerEvents: 'none' }}>
        {constellations.map((constellation, constellationIndex) => 
          constellation.connections.map((connection, connectionIndex) => {
            const fromStar = constellation.stars[connection.from];
            const toStar = constellation.stars[connection.to];
            
            return (
              <line
                key={`${constellationIndex}-${connectionIndex}`}
                x1={fromStar.x}
                y1={fromStar.y}
                x2={toStar.x}
                y2={toStar.y}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="0.5"
                opacity={0.3}
              />
            );
          })
        )}
      </svg>
    );
  }, [showConstellations, constellations]);

  // Memoized star rendering for better performance
  const starElements = useMemo(() => {
    return stars.map(star => (
      <div
        key={star.id}
        className="absolute rounded-full"
        style={{
          width: `${star.size}px`,
          height: `${star.size}px`,
          left: `${star.x}px`,
          top: `${star.y}px`,
          backgroundColor: star.color,
          opacity: star.opacity,
          boxShadow: deviceInfo.isLowEnd ? 'none' : `0 0 ${star.size * 2}px ${star.color}`,
          transform: star.isVariable ? 'scale(1.1)' : 'scale(1)',
          transition: star.isVariable && !deviceInfo.prefersReducedMotion ? 
            `transform ${star.pulsePeriod}s ease-in-out infinite alternate` : 'none',
          willChange: star.isVariable ? 'transform' : 'auto'
        }}
      />
    ));
  }, [stars, deviceInfo]);

  // Don't render anything on the server
  if (!isClient) {
    return null;
  }

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

      {/* Control Panel */}
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
              className="fixed top-24 right-4 bg-black/90 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-[9999] w-64"
              style={{ pointerEvents: 'auto' }}
            >
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="text-white font-medium text-base">Star Controls</h3>
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
                    {showConstellations ? 'Hide' : 'Show'} Constellations
                  </button>

                  <button
                    onClick={handleHideGUI}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      hideGUI 
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30 hover:bg-green-500/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-400/30 hover:bg-red-500/30'
                    }`}
                  >
                    {hideGUI ? 'Show' : 'Hide'} Interface
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Starry Background */}
      <div 
        ref={containerRef}
        className="fixed inset-0 z-0 overflow-hidden"
        style={{ 
          backgroundColor: 'transparent',
          background: 'radial-gradient(ellipse at center, rgba(25, 25, 60, 0.1) 0%, rgba(0, 0, 20, 0.3) 100%)',
          pointerEvents: 'none',
          willChange: 'auto'
        }}
      >
        {/* Constellation lines - Memoized */}
        {constellationLines}

        {/* Stars - Memoized rendering */}
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          {starElements}
          
          {/* Classic 90s-style shooting stars */}
          {shootingStars.map(star => {
            // Calculate the angle for proper diagonal motion
            const angle = Math.atan2(star.endY - star.startY, star.endX - star.startX);
            
            return (
              <motion.div
                key={star.id}
                className="absolute"
                style={{
                  width: `${star.size}px`,
                  height: `${star.length}px`,
                  left: star.startX,
                  top: star.startY,
                  transformOrigin: 'top center',
                  // Classic gradient trail - bright head fading to transparent tail
                  background: star.type === 'fireball' 
                    ? `linear-gradient(to bottom, 
                        ${star.color} 0%, 
                        #ffaa44 20%, 
                        #ffffff 40%, 
                        rgba(255, 170, 68, 0.6) 70%, 
                        transparent 100%)`
                    : `linear-gradient(to bottom, 
                        #ffffff 0%, 
                        #aaccff 30%, 
                        rgba(255, 255, 255, 0.4) 60%, 
                        transparent 100%)`,
                  borderRadius: `${star.size}px ${star.size}px 0 0`,
                  boxShadow: deviceInfo.isLowEnd ? 'none' : 
                    star.type === 'fireball' 
                      ? `0 0 ${star.size * 3}px ${star.color}, 0 0 ${star.size * 6}px rgba(255, 107, 53, 0.4)`
                      : `0 0 ${star.size * 2}px #ffffff, 0 0 ${star.size * 4}px rgba(255, 255, 255, 0.3)`,
                  willChange: 'transform, opacity',
                  // Rotate to align with the diagonal path
                  transform: `rotate(${angle + Math.PI/2}rad)`
                }}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  opacity: 0,
                  scale: 0.3
                }}
                animate={{
                  x: star.endX - star.startX,
                  y: star.endY - star.startY,
                  opacity: [0, star.opacity, star.opacity * 0.8, 0],
                  scale: [0.3, 1, 1, 0.8]
                }}
                transition={{
                  duration: star.duration,
                  ease: [0.25, 0.46, 0.45, 0.94], // Classic easing curve
                  times: [0, 0.1, 0.7, 1]
                }}
              />
            );
          })}
          
          {/* Add sparkle effects for fireballs */}
          {shootingStars
            .filter(star => star.type === 'fireball')
            .map(star => {
              const sparkleCount = 3;
              const sparkles = [];
              
              for (let i = 0; i < sparkleCount; i++) {
                const delay = i * 0.2;
                const sparkleX = star.startX + (star.endX - star.startX) * (0.2 + i * 0.3);
                const sparkleY = star.startY + (star.endY - star.startY) * (0.2 + i * 0.3);
                
                sparkles.push(
                  <motion.div
                    key={`sparkle-${star.id}-${i}`}
                    className="absolute"
                    style={{
                      width: '3px',
                      height: '3px',
                      left: sparkleX,
                      top: sparkleY,
                      background: '#ffaa44',
                      borderRadius: '50%',
                      boxShadow: deviceInfo.isLowEnd ? 'none' : '0 0 6px #ff6b35',
                      pointerEvents: 'none'
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0],
                      scale: [0, 1.5, 0],
                      x: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 40],
                      y: [(Math.random() - 0.5) * 20, (Math.random() - 0.5) * 40]
                    }}
                    transition={{
                      duration: 1,
                      delay: delay,
                      ease: "easeOut"
                    }}
                  />
                );
              }
              
              return sparkles;
            })}
          
          {/* Milky Way effect - Only on non-low-end devices */}
          {!deviceInfo.isLowEnd && (
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.02) 50%, transparent 70%)',
                transform: 'rotate(-15deg) translateY(-20%)',
                opacity: 0.3,
                pointerEvents: 'none'
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}