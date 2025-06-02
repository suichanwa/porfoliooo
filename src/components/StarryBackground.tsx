import { useEffect, useRef, useState, useMemo } from "react";
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
  // New realistic properties
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
  // New realistic properties
  type: 'meteor' | 'fireball' | 'satellite';
  color: string;
  sparkles: boolean;
}

interface Constellation {
  name: string;
  stars: { x: number; y: number; brightness: number }[];
  connections: { from: number; to: number }[];
}

// Real stellar classifications and their properties
const STELLAR_CLASSES = {
  'O': { temp: 30000, color: '#9bb0ff', rarity: 0.01, size: 15 }, // Blue giants
  'B': { temp: 15000, color: '#aabfff', rarity: 0.03, size: 8 },  // Blue-white
  'A': { temp: 8500, color: '#cad7ff', rarity: 0.08, size: 2.5 }, // White
  'F': { temp: 6500, color: '#f8f7ff', rarity: 0.12, size: 1.5 }, // Yellow-white
  'G': { temp: 5500, color: '#fff4ea', rarity: 0.15, size: 1 },   // Yellow (like our Sun)
  'K': { temp: 4000, color: '#ffd2a1', rarity: 0.25, size: 0.8 }, // Orange
  'M': { temp: 3000, color: '#ffad51', rarity: 0.35, size: 0.6 }  // Red dwarfs
};

// Simple constellations (scaled for screen)
const CONSTELLATIONS: Constellation[] = [
  {
    name: 'Ursa Major (Big Dipper)',
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
  },
  {
    name: 'Orion',
    stars: [
      { x: 0.7, y: 0.4, brightness: 0.9 }, // Betelgeuse
      { x: 0.75, y: 0.6, brightness: 0.8 }, // Rigel
      { x: 0.72, y: 0.5, brightness: 0.6 }, // Bellatrix
      { x: 0.74, y: 0.52, brightness: 0.7 }, // Mintaka
      { x: 0.745, y: 0.53, brightness: 0.7 }, // Alnilam
      { x: 0.75, y: 0.54, brightness: 0.6 }, // Alnitak
    ],
    connections: [
      { from: 0, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 },
      { from: 4, to: 5 }, { from: 5, to: 1 }
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
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const shootingStarTimerRef = useRef<number | null>(null);
  
  // Check for mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Realistic star colors based on temperature
  const getStarColor = (temperature: number): string => {
    if (temperature > 25000) return '#9bb0ff'; // O-type blue
    if (temperature > 10000) return '#aabfff'; // B-type blue-white
    if (temperature > 7500) return '#cad7ff';  // A-type white
    if (temperature > 6000) return '#f8f7ff';  // F-type yellow-white
    if (temperature > 5000) return '#fff4ea';  // G-type yellow
    if (temperature > 3500) return '#ffd2a1';  // K-type orange
    return '#ffad51'; // M-type red
  };

  // Generate realistic star properties
  const generateRealisticStar = (id: number, x: number, y: number): Star => {
    // Determine stellar class based on rarity
    const rand = Math.random();
    let stellarClass = 'M'; // Default to most common
    let cumulative = 0;
    
    for (const [type, props] of Object.entries(STELLAR_CLASSES)) {
      cumulative += props.rarity;
      if (rand <= cumulative) {
        stellarClass = type;
        break;
      }
    }
    
    const classProps = STELLAR_CLASSES[stellarClass as keyof typeof STELLAR_CLASSES];
    const temperature = classProps.temp + (Math.random() - 0.5) * 2000;
    const brightness = Math.random() * 0.7 + 0.3;
    const distance = Math.random() * 1000 + 50; // Light years
    
    // Variable stars (about 10% of stars)
    const isVariable = Math.random() < 0.1;
    
    return {
      id,
      x,
      y,
      size: classProps.size * (Math.random() * 0.5 + 0.75),
      opacity: brightness,
      speed: Math.random() * 0.05 + 0.01, // Slower, more realistic movement
      color: getStarColor(temperature),
      twinkleSpeed: Math.random() * 3 + 1,
      angle: (Math.random() * 2 - 1) * (Math.PI / 180), // Very subtle drift
      stellarClass,
      temperature,
      brightness,
      distance,
      isVariable,
      pulsePeriod: isVariable ? Math.random() * 5 + 2 : undefined
    };
  };

  // Create initial realistic star field
  useEffect(() => {
    if (!containerRef.current) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Create constellation stars first
    const constellationStars: Star[] = [];
    const scaledConstellations = CONSTELLATIONS.map(constellation => ({
      ...constellation,
      stars: constellation.stars.map((star, index) => {
        const starX = star.x * width;
        const starY = star.y * height;
        const realisticStar = generateRealisticStar(
          1000 + constellationStars.length, 
          starX, 
          starY
        );
        
        // Make constellation stars more prominent
        realisticStar.size *= 1.5;
        realisticStar.opacity = star.brightness;
        realisticStar.constellation = constellation.name;
        
        constellationStars.push(realisticStar);
        return { ...star, x: starX, y: starY };
      })
    }));
    
    setConstellations(scaledConstellations);
    
    // Create background star field
    const starCount = Math.min(200, Math.floor((width * height) / 6000));
    const backgroundStars: Star[] = [];
    
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      
      // Don't place stars too close to constellation stars
      const tooClose = constellationStars.some(cStar => 
        Math.sqrt((x - cStar.x) ** 2 + (y - cStar.y) ** 2) < 50
      );
      
      if (!tooClose) {
        backgroundStars.push(generateRealisticStar(i, x, y));
      }
    }
    
    setStars([...constellationStars, ...backgroundStars]);
    
    // Create more realistic shooting stars
    shootingStarTimerRef.current = window.setInterval(() => {
      if (Math.random() > 0.85) { // 15% chance
        createRealisticShootingStar();
      }
    }, 4000); // Every 4 seconds
    
    return () => {
      if (shootingStarTimerRef.current) {
        clearInterval(shootingStarTimerRef.current);
      }
    };
  }, []);

  const createRealisticShootingStar = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Different types of shooting objects
    const types: ('meteor' | 'fireball' | 'satellite')[] = ['meteor', 'meteor', 'meteor', 'fireball', 'satellite'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let startX, startY, endX, endY, duration, color, sparkles;
    
    switch (type) {
      case 'meteor':
        // Regular meteor - fast, white-blue
        startX = Math.random() * width;
        startY = -20;
        endX = startX + (Math.random() - 0.5) * width * 0.8;
        endY = height + 20;
        duration = Math.random() * 0.5 + 0.3;
        color = '#ffffff';
        sparkles = Math.random() > 0.7;
        break;
        
      case 'fireball':
        // Bright fireball - slower, orange-red
        startX = Math.random() * width;
        startY = -20;
        endX = startX + (Math.random() - 0.5) * width * 0.6;
        endY = height * 0.8;
        duration = Math.random() * 1.5 + 1;
        color = '#ff6b35';
        sparkles = true;
        break;
        
      case 'satellite':
        // Satellite - steady, crosses sky horizontally
        startX = -20;
        startY = Math.random() * height * 0.7;
        endX = width + 20;
        endY = startY + (Math.random() - 0.5) * 100;
        duration = Math.random() * 3 + 4;
        color = '#ffd700';
        sparkles = false;
        break;
    }
    
    const shootingStar: ShootingStar = {
      id: Date.now(),
      startX,
      startY,
      endX,
      endY,
      length: type === 'satellite' ? 30 : Math.random() * 100 + 80,
      duration,
      opacity: type === 'fireball' ? 0.9 : 0.7,
      size: type === 'fireball' ? 3 : type === 'satellite' ? 1.5 : 2,
      type,
      color,
      sparkles
    };
    
    setShootingStars(prev => [...prev, shootingStar]);
    
    setTimeout(() => {
      setShootingStars(prev => prev.filter(s => s.id !== shootingStar.id));
    }, shootingStar.duration * 1000 + 1000);
  };

  // Realistic star animation with proper physics
  const animate = (time: number) => {
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = time;
    }
    
    const deltaTime = time - (previousTimeRef.current || 0);
    previousTimeRef.current = time;
    
    setStars(prevStars => {
      const height = window.innerHeight;
      const width = window.innerWidth;
      
      return prevStars.map(star => {
        // Constellation stars don't move
        if (star.constellation) {
          return star;
        }
        
        // Very subtle proper motion for background stars
        const newX = star.x + Math.sin(star.angle) * star.speed * deltaTime * 0.001;
        const newY = star.y + Math.cos(star.angle) * star.speed * deltaTime * 0.002;
        
        // Reset stars that drift off screen
        if (newY > height + 50 || newX < -50 || newX > width + 50) {
          return generateRealisticStar(star.id, Math.random() * width, -20);
        }
        
        return {
          ...star,
          x: newX,
          y: newY
        };
      });
    });
    
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, []);

  // Handle GUI hiding with direct DOM manipulation
  const handleHideGUI = () => {
    const newHideState = !hideGUI;
    setHideGUI(newHideState);
    
    // Close the panel when hiding GUI
    if (newHideState) {
      setIsPanelOpen(false);
    }
    
    // Direct DOM manipulation for immediate effect
    const guiElements = document.querySelectorAll('.gui-element');
    
    guiElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      if (newHideState) {
        htmlElement.style.opacity = '0';
        htmlElement.style.pointerEvents = 'none';
        htmlElement.style.transform = 'translateY(20px)';
      } else {
        htmlElement.style.opacity = '1';
        htmlElement.style.pointerEvents = 'auto';
        htmlElement.style.transform = 'translateY(0)';
      }
    });
    
    // Also call the callback if provided
    onHideGUI?.(newHideState);
  };

  return (
    <>
      {/* Star Control Button - Fixed under navbar */}
      <motion.button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className={`fixed top-20 right-4 z-[9999] p-3 rounded-full border border-white/20 shadow-lg transition-all duration-300 ${
          hideGUI 
            ? 'bg-transparent text-white/30 hover:text-white/60' 
            : 'bg-black/70 backdrop-blur-sm text-white hover:text-blue-300'
        }`}
        style={{ pointerEvents: 'auto' }}
        whileHover={{ scale: hideGUI ? 1 : 1.1 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          opacity: hideGUI ? 0.3 : 1,
          rotate: isPanelOpen ? 180 : 0
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Star Icon */}
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

      {/* Simplified Control Panel - Always shows when panel is open */}
      <AnimatePresence>
        {isPanelOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
              onClick={() => setIsPanelOpen(false)}
              style={{ pointerEvents: 'auto' }}
            />
            
            {/* Simplified Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="fixed top-24 right-4 bg-black/90 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-[9999] w-64"
              style={{ pointerEvents: 'auto' }}
            >
              <div className="p-4">
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-white font-medium text-base">
                    Star Controls
                  </h3>
                  {hideGUI && (
                    <p className="text-white/60 text-xs mt-1">
                      Interface is currently hidden
                    </p>
                  )}
                </div>
                
                {/* Controls */}
                <div className="space-y-3">
                  {/* Constellations Toggle */}
                  <motion.button
                    onClick={() => setShowConstellations(!showConstellations)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      showConstellations 
                        ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30' 
                        : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {showConstellations ? 'Hide' : 'Show'} Constellations
                  </motion.button>

                  {/* GUI Toggle */}
                  <motion.button
                    onClick={handleHideGUI}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      hideGUI 
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30 hover:bg-green-500/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-400/30 hover:bg-red-500/30'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {hideGUI ? 'Show' : 'Hide'} Interface
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Starry Background Container */}
      <div 
        ref={containerRef}
        className="fixed inset-0 z-0 overflow-hidden"
        style={{ 
          backgroundColor: 'transparent',
          background: 'radial-gradient(ellipse at center, rgba(25, 25, 60, 0.1) 0%, rgba(0, 0, 20, 0.3) 100%)',
          pointerEvents: 'none'
        }}
      >
        {/* Constellation lines */}
        {showConstellations && (
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1, pointerEvents: 'none' }}>
            {constellations.map((constellation, constellationIndex) => 
              constellation.connections.map((connection, connectionIndex) => {
                const fromStar = constellation.stars[connection.from];
                const toStar = constellation.stars[connection.to];
                
                return (
                  <motion.line
                    key={`${constellationIndex}-${connectionIndex}`}
                    x1={fromStar.x}
                    y1={fromStar.y}
                    x2={toStar.x}
                    y2={toStar.y}
                    stroke="rgba(255, 255, 255, 0.2)"
                    strokeWidth="0.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ duration: 2, delay: connectionIndex * 0.2 }}
                  />
                );
              })
            )}
          </svg>
        )}

        {/* Stars container with pointer-events disabled */}
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          {/* Regular stars with realistic properties */}
          {stars.map(star => (
            <motion.div
              key={star.id}
              className="absolute rounded-full"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                left: `${star.x}px`,
                top: `${star.y}px`,
                backgroundColor: star.color,
                opacity: star.opacity,
                boxShadow: `0 0 ${star.size * 3}px ${star.color}`,
                filter: star.stellarClass === 'O' || star.stellarClass === 'B' ? 
                  'drop-shadow(0 0 6px rgba(155, 176, 255, 0.8))' : 'none',
              }}
              animate={{
                opacity: star.isVariable ? 
                  [star.opacity, star.opacity * 0.3, star.opacity] : 
                  [star.opacity, star.opacity * 0.7, star.opacity],
                scale: star.stellarClass === 'O' ? [1, 1.2, 1] : [1, 0.9, 1]
              }}
              transition={{
                duration: star.isVariable ? star.pulsePeriod : star.twinkleSpeed,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
              }}
              title={`${star.stellarClass}-type star | ${Math.round(star.temperature)}K | ${star.distance.toFixed(1)} ly`}
            />
          ))}
          
          {/* Realistic shooting stars/meteors */}
          {shootingStars.map(star => (
            <motion.div
              key={star.id}
              className="absolute"
              style={{
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 2,
                pointerEvents: 'none'
              }}
            >
              {/* Main trail */}
              <motion.div
                className="absolute"
                style={{
                  width: `${star.size}px`,
                  height: `${star.length}px`,
                  left: star.startX,
                  top: star.startY,
                  background: star.type === 'satellite' ? 
                    `linear-gradient(to top, transparent, ${star.color})` :
                    `linear-gradient(to top, transparent 0%, ${star.color} 50%, white 100%)`,
                  borderRadius: `${star.size / 2}px`,
                  transformOrigin: 'top',
                  boxShadow: star.type === 'fireball' ? 
                    `0 0 15px 3px ${star.color}` : 
                    `0 0 8px 1px ${star.color}`,
                }}
                initial={{
                  x: 0,
                  y: 0,
                  rotate: Math.atan2(star.endY - star.startY, star.endX - star.startX) * (180 / Math.PI) + 90
                }}
                animate={{
                  x: star.endX - star.startX,
                  y: star.endY - star.startY,
                  opacity: star.type === 'satellite' ? [0, star.opacity, star.opacity, 0] : [0, star.opacity, 0]
                }}
                transition={{
                  duration: star.duration,
                  ease: star.type === 'satellite' ? "linear" : "easeOut",
                  times: star.type === 'satellite' ? [0, 0.1, 0.9, 1] : [0, 0.15, 1]
                }}
              />
              
              {/* Main head/core */}
              <motion.div
                className="absolute rounded-full"
                style={{
                  width: star.size * 2,
                  height: star.size * 2,
                  left: star.startX - star.size / 2,
                  top: star.startY,
                  backgroundColor: star.color,
                  boxShadow: `0 0 ${star.size * 8}px ${star.color}`,
                }}
                initial={{ scale: 0.2 }}
                animate={{
                  x: star.endX - star.startX,
                  y: star.endY - star.startY,
                  scale: star.type === 'fireball' ? [1.5, 2, 0.5, 0] : [1.5, 0.8, 0],
                  opacity: [0.9, star.opacity, 0]
                }}
                transition={{
                  duration: star.duration,
                  ease: star.type === 'satellite' ? "linear" : "easeOut"
                }}
              />
              
              {/* Sparkle effects for fireballs */}
              {star.sparkles && (
                <>
                  {Array.from({ length: 5 }, (_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: '1px',
                        height: '1px',
                        left: star.startX,
                        top: star.startY,
                        backgroundColor: '#ffffff',
                        boxShadow: '0 0 4px white',
                      }}
                      initial={{ scale: 0 }}
                      animate={{
                        x: star.endX - star.startX + (Math.random() - 0.5) * 40,
                        y: star.endY - star.startY + (Math.random() - 0.5) * 40,
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0]
                      }}
                      transition={{
                        duration: star.duration * 0.8,
                        delay: Math.random() * star.duration * 0.3,
                        ease: "easeOut"
                      }}
                    />
                  ))}
                </>
              )}
            </motion.div>
          ))}
          
          {/* Milky Way effect */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.03) 50%, transparent 70%)',
              transform: 'rotate(-15deg) translateY(-20%)',
              opacity: 0.4,
              pointerEvents: 'none'
            }}
          />
        </div>
      </div>
    </>
  );
}