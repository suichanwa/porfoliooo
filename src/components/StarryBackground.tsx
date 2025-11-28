import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StarryBackgroundProps {
  onHideGUI?: (hidden: boolean) => void;
  enableNeptuneTransition?: boolean;
  neptuneSectionId?: string;
}

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  driftX: number;
  driftY: number;
  color: string;
}

interface ShootingStar {
  id: number;
  startX: number;
  startY: number;
  angle: number;
  duration: number;
  delay: number;
}

export default function StarryBackground({ 
  onHideGUI, 
  enableNeptuneTransition = false, 
  neptuneSectionId = "neptune-widget" 
}: StarryBackgroundProps) {
  const [showConstellations, setShowConstellations] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [hideGUI, setHideGUI] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [enableNebulae, setEnableNebulae] = useState(true);
  const [neptuneTransitionProgress, setNeptuneTransitionProgress] = useState(0);
  const [stars, setStars] = useState<Star[]>([]);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const shootingStarTimeoutRef = useRef<number>();

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

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Generate stars once on mount
  const generateStars = useCallback(() => {
    const starCount = deviceInfo.isLowEnd ? 40 : deviceInfo.isMobile ? 80 : 120;
    const newStars: Star[] = [];
    
    const colors = ['#ffffff', '#fff8e7', '#e7f0ff', '#ffe7e7'];
    
    for (let i = 0; i < starCount; i++) {
      // Use magnitude-based size distribution (most stars are small)
      const magnitude = Math.random() * 6;
      const size = magnitude < 2 ? Math.random() * 2 + 2 : 
                   magnitude < 4 ? Math.random() * 1.5 + 1 : 
                   Math.random() * 1 + 0.5;
      
      newStars.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size,
        opacity: Math.random() * 0.4 + 0.6,
        twinkleSpeed: Math.random() * 4 + 3,
        twinkleOffset: Math.random() * 10,
        driftX: (Math.random() - 0.5) * 0.5, // Subtle drift
        driftY: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    
    setStars(newStars);
  }, [deviceInfo.isLowEnd, deviceInfo.isMobile]);

  // Generate stars on mount and window resize
  useEffect(() => {
    if (!isClient) return;
    
    generateStars();
    
    let resizeTimeout: number;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(generateStars, 300);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [isClient, generateStars]);

  // Shooting star generator
  useEffect(() => {
    if (!isClient || deviceInfo.isLowEnd || deviceInfo.prefersReducedMotion) return;
    
    const createShootingStar = () => {
      const fromRight = Math.random() > 0.5;
      const newStar: ShootingStar = {
        id: Date.now() + Math.random(),
        startX: fromRight ? 110 : -10,
        startY: Math.random() * 50,
        angle: fromRight ? 135 : 45,
        duration: Math.random() * 1.5 + 1.5,
        delay: 0
      };
      
      setShootingStars(prev => [...prev, newStar]);
      
      // Remove after animation completes
      setTimeout(() => {
        setShootingStars(prev => prev.filter(s => s.id !== newStar.id));
      }, (newStar.duration + 0.5) * 1000);
    };
    
    const scheduleNext = () => {
      const delay = (deviceInfo.isMobile ? 20000 : 15000) + Math.random() * 10000;
      shootingStarTimeoutRef.current = window.setTimeout(() => {
        if (Math.random() < 0.5) {
          createShootingStar();
        }
        scheduleNext();
      }, delay);
    };
    
    scheduleNext();
    
    return () => {
      if (shootingStarTimeoutRef.current) {
        clearTimeout(shootingStarTimeoutRef.current);
      }
    };
  }, [isClient, deviceInfo.isMobile, deviceInfo.isLowEnd, deviceInfo.prefersReducedMotion]);

  // Neptune transition
  useEffect(() => {
    if (!enableNeptuneTransition || !isClient) return;

    const handleScroll = () => {
      const neptuneSection = document.getElementById(neptuneSectionId);
      if (!neptuneSection) return;

      const rect = neptuneSection.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const sectionTop = rect.top;
      
      let progress = 0;
      if (sectionTop < viewportHeight) {
        const fadeStartDistance = viewportHeight * 1.0;
        const fadeEndDistance = viewportHeight * 0.3;
        const distanceFromSection = Math.max(0, viewportHeight - sectionTop);
        
        if (distanceFromSection <= fadeStartDistance) {
          progress = Math.min(Math.max((fadeStartDistance - distanceFromSection) / (fadeStartDistance - fadeEndDistance), 0), 1);
        } else {
          progress = 0;
        }
      }
      
      setNeptuneTransitionProgress(progress);
    };

    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', throttledScroll);
  }, [enableNeptuneTransition, neptuneSectionId, isClient]);

  const getDynamicBackground = useMemo(() => {
    const progress = neptuneTransitionProgress;
    
    if (progress <= 0) {
      return `radial-gradient(ellipse 70% 90% at 50% 50%, 
          rgba(8, 10, 20, 0.3) 0%, 
          rgba(4, 5, 12, 0.6) 50%,
          rgba(0, 0, 0, 0.9) 100%)`;
    }
    
    const spaceOpacity = 1 - progress * 0.7;
    const neptuneOpacity = progress * 0.8;
    
    return `
      radial-gradient(ellipse 70% 90% at 50% 50%, 
        rgba(8, 10, 20, ${spaceOpacity * 0.3}) 0%, 
        rgba(4, 5, 12, ${spaceOpacity * 0.6}) 50%,
        rgba(15, 20, 25, ${spaceOpacity * 0.9}) 100%),
      radial-gradient(ellipse 60% 80% at 30% 70%, 
        rgba(26, 31, 53, ${neptuneOpacity * 0.4}) 0%, 
        rgba(15, 20, 25, ${neptuneOpacity * 0.6}) 50%,
        rgba(10, 15, 20, ${neptuneOpacity * 0.8}) 100%)`;
  }, [neptuneTransitionProgress]);

  const handleHideGUI = useCallback(() => {
    const newHideState = !hideGUI;
    setHideGUI(newHideState);
    if (newHideState) setIsPanelOpen(false);
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
        animate={{ opacity: hideGUI ? 0.3 : 1, rotate: isPanelOpen ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
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
              className="fixed top-24 right-4 bg-black/90 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-[9999] w-72"
              style={{ pointerEvents: 'auto' }}
            >
              <div className="p-4">
                <div className="mb-4">
                  <h3 className="text-white font-medium text-base">🌌 Cosmic Observatory</h3>
                  {hideGUI && <p className="text-white/60 text-xs mt-1">Interface hidden</p>}
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={() => setShowConstellations(!showConstellations)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      showConstellations 
                        ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30' 
                        : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    ⭐ {showConstellations ? 'Hide' : 'Show'} Constellations
                  </button>

                  <button
                    onClick={() => setEnableNebulae(!enableNebulae)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      enableNebulae 
                        ? 'bg-pink-500/30 text-pink-300 border border-pink-400/30' 
                        : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    🌌 {enableNebulae ? 'Hide' : 'Show'} Nebulae
                  </button>

                  <button
                    onClick={handleHideGUI}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      hideGUI 
                        ? 'bg-green-500/20 text-green-300 border border-green-400/30' 
                        : 'bg-red-500/20 text-red-300 border border-red-400/30'
                    }`}
                  >
                    🎛️ {hideGUI ? 'Show' : 'Hide'} Interface
                  </button>
                </div>
                
                <div className="mt-4 pt-3 border-t border-white/10">
                  <p className="text-xs text-white/60 text-center leading-relaxed">
                    ⚡ GPU Optimized<br/>
                    🌟 CSS-Powered Stars<br/>
                    ☄️ Smooth Animations<br/>
                    💫 Ultra Low Power
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Starry Background Container */}
      <div 
        ref={containerRef}
        style={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: -1,
          pointerEvents: 'none',
          overflow: 'hidden',
          background: getDynamicBackground,
          transition: 'background 0.3s ease-out'
        }}
      >
        {/* Nebulae */}
        {enableNebulae && (
          <>
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '15%',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(74, 51, 102, 0.15) 0%, transparent 70%)',
              filter: 'blur(60px)',
              animation: 'nebulaPulse 8s ease-in-out infinite',
              willChange: 'opacity'
            }} />
            
            {!deviceInfo.isLowEnd && (
              <div style={{
                position: 'absolute',
                top: '60%',
                right: '20%',
                width: '250px',
                height: '250px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(42, 68, 102, 0.12) 0%, transparent 70%)',
                filter: 'blur(50px)',
                animation: 'nebulaPulse 10s ease-in-out infinite 2s',
                willChange: 'opacity'
              }} />
            )}
          </>
        )}

        {/* Stars with CSS animations */}
        {stars.map(star => (
          <div
            key={star.id}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              borderRadius: '50%',
              backgroundColor: star.color,
              opacity: star.opacity,
              boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
              animation: `twinkle ${star.twinkleSpeed}s ease-in-out infinite ${star.twinkleOffset}s, 
                         drift ${30 + Math.random() * 20}s ease-in-out infinite ${Math.random() * 10}s`,
              willChange: 'opacity, transform',
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}

        {/* Constellation lines */}
        {showConstellations && (
          <svg 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none'
            }}
          >
            {stars.slice(0, 30).map((star, i) => {
              if (i % 3 !== 0) return null;
              const nextStar = stars[i + 3];
              if (!nextStar) return null;
              
              return (
                <line
                  key={`line-${i}`}
                  x1={`${star.x}%`}
                  y1={`${star.y}%`}
                  x2={`${nextStar.x}%`}
                  y2={`${nextStar.y}%`}
                  stroke="rgba(140, 180, 220, 0.15)"
                  strokeWidth="0.5"
                  style={{
                    animation: 'constellationFade 4s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              );
            })}
          </svg>
        )}

        {/* Shooting Stars */}
        {shootingStars.map(star => (
          <div
            key={star.id}
            style={{
              position: 'absolute',
              left: `${star.startX}%`,
              top: `${star.startY}%`,
              width: '3px',
              height: '3px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 8px #88bbff, 0 0 4px #ffffff',
              animation: `shootingStar ${star.duration}s linear forwards`,
              '--angle': `${star.angle}deg`,
              willChange: 'transform, opacity'
            } as React.CSSProperties}
          />
        ))}

        {/* CSS Animations */}
        <style>{`
          @keyframes twinkle {
            0%, 100% { opacity: var(--base-opacity, 0.8); }
            50% { opacity: calc(var(--base-opacity, 0.8) * 0.3); }
          }
          
          @keyframes drift {
            0%, 100% { transform: translate(-50%, -50%) translate(0, 0); }
            25% { transform: translate(-50%, -50%) translate(3px, -2px); }
            50% { transform: translate(-50%, -50%) translate(-2px, 3px); }
            75% { transform: translate(-50%, -50%) translate(2px, 1px); }
          }
          
          @keyframes nebulaPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          
          @keyframes shootingStar {
            0% {
              transform: translate(0, 0) rotate(var(--angle));
              opacity: 0;
            }
            10% {
              opacity: 1;
            }
            90% {
              opacity: 0.8;
            }
            100% {
              transform: translate(-200px, 200px) rotate(var(--angle));
              opacity: 0;
            }
          }
          
          @keyframes constellationFade {
            0%, 100% { opacity: 0.15; }
            50% { opacity: 0.05; }
          }
        `}</style>
      </div>
    </>
  );
}