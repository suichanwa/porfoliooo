import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

interface StarryBackgroundProps {
  onHideGUI?: (hidden: boolean) => void;
}

export default function StarryBackground({ onHideGUI }: StarryBackgroundProps) {
  const [showConstellations, setShowConstellations] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [hideGUI, setHideGUI] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [init, setInit] = useState(false);
  const [galaxyRotation, setGalaxyRotation] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Check if we're on the client side and initialize particles
  useEffect(() => {
    setIsClient(true);
    
    // Initialize particles engine with loadSlim for better performance
    const initEngine = async () => {
      await initParticlesEngine(async (engine: Engine) => {
        // Use loadSlim instead of loadFull for better performance
        await loadSlim(engine);
      });
      
      setInit(true);
    };
    
    initEngine();
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

  // Handle window resize
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
  
  // Add galaxy rotation animation
  useEffect(() => {
    if (!isClient) return;
    
    const galaxyAnimationInterval = setInterval(() => {
      setGalaxyRotation(prev => (prev + 0.05) % 360); // Very slow rotation
    }, 100);
    
    return () => clearInterval(galaxyAnimationInterval);
  }, [isClient]);

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

  // Background stars particles config - Fixed for @tsparticles/slim
  const starsParticlesOptions = useMemo(() => ({
    background: {
      color: {
        value: "transparent",
      },
    },
    fpsLimit: 60,
    particles: {
      number: {
        value: deviceInfo.isLowEnd ? 30 : deviceInfo.isMobile ? 60 : 100,
        density: {
          enable: true,
          area: 800, // Fixed: changed from value_area to area
        },
      },
      color: {
        value: ["#ffffff", "#cad7ff", "#fff4ea", "#ffad51"],
      },
      size: {
        value: { min: 0.5, max: 3 },
      },
      opacity: {
        value: { min: 0.3, max: 0.8 },
      },
      move: {
        enable: true,
        direction: "top",
        speed: { min: 0.05, max: 0.3 },
        straight: true,
        outModes: {
          default: "out",
          top: "destroy",
          bottom: "none",
        },
      },
      life: {
        count: 1,
        duration: {
          value: 20,
        },
      },
    },
    detectRetina: true,
    emitters: {
      position: {
        x: 50,
        y: 100,
      },
      rate: {
        delay: 0.2,
        quantity: 2,
      },
      size: {
        width: 100,
        height: 0,
      },
    },
  }), [deviceInfo.isLowEnd, deviceInfo.isMobile]);

  // Shooting stars particles config - Simplified for better compatibility
  const shootingStarsOptions = useMemo(() => ({
    fullScreen: {
      enable: false,
    },
    background: {
      color: {
        value: "transparent",
      },
    },
    particles: {
      number: {
        value: 0,
      },
      color: {
        value: "#ffffff",
      },
      move: {
        enable: true,
        speed: { min: 30, max: 70 },
        direction: "bottom-left",
        straight: true,
        outModes: {
          default: "out",
        },
      },
      size: {
        value: { min: 1, max: 3 },
      },
      life: {
        count: 1,
        duration: {
          value: { min: 1, max: 3 },
        },
      },
      shape: {
        type: "circle", // Changed from "line" to "circle" for better compatibility
      },
    },
    emitters: [
      {
        direction: "bottom-left",
        rate: {
          delay: deviceInfo.isLowEnd ? 12 : 8,
          quantity: 1,
        },
        position: {
          x: 80,
          y: 0,
        },
        life: {
          count: 0,
          duration: 3,
          delay: deviceInfo.isLowEnd ? 12 : 8,
        },
        particles: {
          move: {
            speed: { min: 40, max: 60 },
          },
          size: {
            value: { min: 1, max: 3 },
          },
        },
      },
      {
        direction: "bottom-left",
        rate: {
          delay: deviceInfo.isLowEnd ? 22 : 15,
          quantity: 1,
        },
        position: {
          x: 100,
          y: 0,
        },
        life: {
          count: 0,
          duration: 3,
          delay: deviceInfo.isLowEnd ? 22 : 15,
        },
        particles: {
          move: {
            speed: { min: 35, max: 50 },
          },
          color: {
            value: "#ff6b35",
          },
          size: {
            value: { min: 2, max: 4 },
          },
        },
      },
    ],
  }), [deviceInfo.isLowEnd]);

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

      {/* Starry Background with Galaxy */}
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
        {/* Animated Galaxy Background */}
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          {/* Main Galaxy Spiral */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 40% 60% at 50% 50%, 
                  rgba(100, 150, 255, 0.03) 0%, 
                  rgba(200, 180, 255, 0.02) 30%,
                  rgba(255, 200, 150, 0.01) 60%,
                  transparent 80%
                ),
                radial-gradient(ellipse 60% 40% at 50% 50%, 
                  rgba(255, 150, 100, 0.02) 0%, 
                  rgba(150, 100, 255, 0.015) 40%,
                  transparent 70%
                )
              `,
              transform: `rotate(${galaxyRotation}deg) scale(1.2)`,
              transformOrigin: 'center center',
              transition: 'transform 0.1s linear',
              opacity: deviceInfo.isLowEnd ? 0.3 : 0.6
            }}
          />
          
          {/* Secondary Galaxy Arms */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 30% at 50% 50%, 
                  transparent 0%, 
                  rgba(180, 200, 255, 0.015) 20%,
                  rgba(255, 180, 200, 0.01) 50%,
                  transparent 70%
                )
              `,
              transform: `rotate(${galaxyRotation * -0.7}deg) scale(1.5)`,
              transformOrigin: 'center center',
              transition: 'transform 0.1s linear',
              opacity: deviceInfo.isLowEnd ? 0.2 : 0.4
            }}
          />
          
          {/* Galaxy Core */}
          <div 
            className="absolute top-1/2 left-1/2"
            style={{
              width: '200px',
              height: '200px',
              marginLeft: '-100px',
              marginTop: '-100px',
              background: `
                radial-gradient(circle at center, 
                  rgba(255, 255, 255, 0.08) 0%, 
                  rgba(200, 180, 255, 0.04) 20%,
                  rgba(255, 200, 150, 0.02) 40%,
                  transparent 70%
                )
              `,
              borderRadius: '50%',
              transform: `rotate(${galaxyRotation * 0.3}deg) scale(${1 + Math.sin(galaxyRotation * 0.01) * 0.1})`,
              transformOrigin: 'center center',
              transition: 'transform 0.1s linear',
              opacity: deviceInfo.isLowEnd ? 0.4 : 0.7
            }}
          />
          
          {/* Floating Galaxy Dust Particles */}
          {!deviceInfo.isLowEnd && (
            <>
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={`dust-${i}`}
                  className="absolute"
                  style={{
                    width: '4px',
                    height: '4px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '50%',
                    left: `${20 + (i * 8)}%`,
                    top: `${30 + Math.sin(i) * 20}%`,
                    transform: `
                      rotate(${galaxyRotation + i * 45}deg) 
                      translateX(${50 + Math.cos(galaxyRotation * 0.01 + i) * 30}px)
                      translateY(${Math.sin(galaxyRotation * 0.008 + i) * 20}px)
                    `,
                    transformOrigin: '50vw 50vh',
                    transition: 'transform 0.1s linear',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.2)',
                    opacity: 0.3 + Math.sin(galaxyRotation * 0.02 + i) * 0.2
                  }}
                />
              ))}
            </>
          )}
          
          {/* Nebula Clouds */}
          {!deviceInfo.isLowEnd && (
            <>
              <div 
                className="absolute"
                style={{
                  width: '300px',
                  height: '150px',
                  background: `
                    radial-gradient(ellipse at center, 
                      rgba(255, 100, 150, 0.03) 0%, 
                      rgba(100, 150, 255, 0.02) 50%,
                      transparent 80%
                    )
                  `,
                  left: '20%',
                  top: '20%',
                  borderRadius: '50%',
                  transform: `
                    rotate(${galaxyRotation * 0.5}deg) 
                    scale(${1 + Math.sin(galaxyRotation * 0.005) * 0.2})
                  `,
                  transformOrigin: 'center center',
                  transition: 'transform 0.1s linear',
                  opacity: 0.6
                }}
              />
              
              <div 
                className="absolute"
                style={{
                  width: '250px',
                  height: '200px',
                  background: `
                    radial-gradient(ellipse at center, 
                      rgba(150, 255, 100, 0.025) 0%, 
                      rgba(255, 200, 100, 0.015) 50%,
                      transparent 80%
                    )
                  `,
                  right: '15%',
                  bottom: '25%',
                  borderRadius: '50%',
                  transform: `
                    rotate(${galaxyRotation * -0.4}deg) 
                    scale(${1 + Math.cos(galaxyRotation * 0.007) * 0.15})
                  `,
                  transformOrigin: 'center center',
                  transition: 'transform 0.1s linear',
                  opacity: 0.5
                }}
              />
            </>
          )}
        </div>
        
        {/* Constellation lines */}
        {showConstellations && (
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1, pointerEvents: 'none' }}>
            <line
              x1="20%"
              y1="30%"
              x2="25%"
              y2="25%"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="0.5"
              opacity={0.3}
            />
            <line
              x1="25%"
              y1="25%"
              x2="30%"
              y2="20%"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="0.5"
              opacity={0.3}
            />
            <line
              x1="30%"
              y1="20%"
              x2="35%"
              y2="22%"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="0.5"
              opacity={0.3}
            />
            <line
              x1="35%"
              y1="22%"
              x2="40%"
              y2="28%"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="0.5"
              opacity={0.3}
            />
            <line
              x1="40%"
              y1="28%"
              x2="42%"
              y2="35%"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="0.5"
              opacity={0.3}
            />
            <line
              x1="42%"
              y1="35%"
              x2="38%"
              y2="40%"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="0.5"
              opacity={0.3}
            />
          </svg>
        )}

        {/* Milky Way effect - Only on non-low-end devices */}
        {!deviceInfo.isLowEnd && (
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.02) 50%, transparent 70%)',
              transform: `rotate(${-15 + galaxyRotation * 0.1}deg) translateY(-20%)`,
              opacity: 0.3 + Math.sin(galaxyRotation * 0.01) * 0.1,
              pointerEvents: 'none',
              transition: 'transform 0.1s linear, opacity 0.1s linear'
            }}
          />
        )}
        
        {/* tsParticles stars - conditionally rendered after init */}
        {init && (
          <>
            <Particles
              id="stars"
              options={starsParticlesOptions}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
              }}
            />
            
            {/* tsParticles shooting stars */}
            <Particles
              id="shootingStars"
              options={shootingStarsOptions}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
              }}
            />
          </>
        )}
      </div>
    </>
  );
}