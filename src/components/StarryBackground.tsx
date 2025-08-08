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
  
  // FIXED: Much slower and smoother galaxy rotation
  useEffect(() => {
    if (!isClient || deviceInfo.prefersReducedMotion) return;
    
    const galaxyAnimationInterval = setInterval(() => {
      setGalaxyRotation(prev => (prev + 0.005) % 360); // Slightly faster but still very slow
    }, 500); // More frequent updates for smoother rotation
    
    return () => clearInterval(galaxyAnimationInterval);
  }, [isClient, deviceInfo.prefersReducedMotion]);

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

  // FIXED: Beautiful smooth stars with proper animations
  const starsParticlesOptions = useMemo(() => ({
    background: {
      color: {
        value: "transparent",
      },
    },
    fpsLimit: 60, // Increased for smoother animations
    particles: {
      number: {
        value: deviceInfo.isLowEnd ? 25 : deviceInfo.isMobile ? 40 : 60,
        density: {
          enable: true,
          area: 2000, // Larger area for better spread
        },
      },
      color: {
        value: ["#ffffff", "#e6f3ff", "#fff9e6", "#f0f8ff"],
      },
      size: {
        value: { min: 1, max: 3 },
        animation: {
          enable: true,
          speed: 0.5,
          minimumValue: 0.5,
          sync: false,
          startValue: "min",
          mode: "increase"
        }
      },
      opacity: {
        value: { min: 0.1, max: 0.9 },
        animation: {
          enable: true,
          speed: 0.8, // Smooth twinkling
          minimumValue: 0.1,
          sync: false,
          mode: "auto"
        }
      },
      move: {
        enable: true,
        speed: 0.1, // Very gentle movement
        direction: "none",
        random: true,
        straight: false,
        outModes: {
          default: "bounce", // Bounce instead of disappearing
        },
        attract: {
          enable: false,
          rotateX: 600,
          rotateY: 1200
        },
        bounce: false,
        warp: false
      },
      life: {
        count: 1,
        duration: {
          value: { min: 20, max: 40 }, // Much longer life
        },
        delay: {
          value: { min: 0, max: 5 }, // Staggered appearance
        }
      },
      // Add smooth spawning animation
      destroy: {
        mode: "none"
      }
    },
    detectRetina: true,
    smooth: true,
    // Add interactivity for smooth feel
    interactivity: {
      detectsOn: "canvas",
      events: {
        onHover: {
          enable: true,
          mode: "bubble"
        },
        resize: true
      },
      modes: {
        bubble: {
          distance: 100,
          size: 5,
          duration: 2,
          opacity: 1,
          speed: 3
        }
      }
    }
  }), [deviceInfo.isLowEnd, deviceInfo.isMobile]);

  // FIXED: Beautiful smooth shooting stars with trail effects
  const shootingStarsOptions = useMemo(() => ({
    fullScreen: {
      enable: false,
    },
    background: {
      color: {
        value: "transparent",
      },
    },
    fpsLimit: 30,
    particles: {
      number: {
        value: 0, // We'll spawn them via emitters
      },
      color: {
        value: ["#ffffff", "#e6f3ff", "#fff9e6"],
      },
      move: {
        enable: true,
        speed: { min: 2, max: 4 }, // Slower, more graceful
        direction: "bottom-right",
        straight: true,
        outModes: {
          default: "destroy",
        },
        trail: {
          enable: true,
          length: 8,
          fillColor: "#000000"
        }
      },
      size: {
        value: { min: 1, max: 2.5 },
        animation: {
          enable: true,
          speed: 2,
          minimumValue: 0.5,
          sync: false,
          mode: "decrease"
        }
      },
      life: {
        count: 1,
        duration: {
          value: { min: 3, max: 6 },
        },
        delay: {
          value: { min: 0, max: 2 },
        }
      },
      shape: {
        type: "circle",
      },
      opacity: {
        value: { min: 0.4, max: 1 },
        animation: {
          enable: true,
          speed: 1.5,
          minimumValue: 0,
          sync: false,
          mode: "decrease"
        }
      },
      // Add glow effect
      stroke: {
        width: 0.5,
        color: "#ffffff"
      }
    },
    emitters: [
      {
        direction: "bottom-right",
        rate: {
          delay: deviceInfo.isLowEnd ? 25 : 15, // Reasonable delays
          quantity: 1,
        },
        position: {
          x: { min: 60, max: 95 },
          y: { min: 0, max: 25 },
        },
        life: {
          count: 0,
          duration: 2,
          delay: deviceInfo.isLowEnd ? 25 : 15,
        },
        particles: {
          move: {
            speed: { min: 1.5, max: 3 },
          },
          size: {
            value: { min: 1, max: 2 },
          },
          opacity: {
            value: { min: 0.6, max: 1 },
            animation: {
              enable: true,
              speed: 2,
              minimumValue: 0,
              sync: false,
              mode: "decrease"
            }
          }
        },
      },
      // Add a second emitter for variety
      {
        direction: "bottom-left",
        rate: {
          delay: deviceInfo.isLowEnd ? 35 : 25,
          quantity: 1,
        },
        position: {
          x: { min: 5, max: 40 },
          y: { min: 0, max: 25 },
        },
        life: {
          count: 0,
          duration: 2,
          delay: deviceInfo.isLowEnd ? 35 : 25,
        },
        particles: {
          move: {
            speed: { min: 1, max: 2.5 },
            direction: "bottom-left"
          },
          size: {
            value: { min: 0.8, max: 1.8 },
          },
          color: {
            value: "#f0f8ff"
          },
          opacity: {
            value: { min: 0.5, max: 0.9 },
            animation: {
              enable: true,
              speed: 1.8,
              minimumValue: 0,
              sync: false,
              mode: "decrease"
            }
          }
        },
      }
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
          background: 'radial-gradient(ellipse at center, rgba(25, 25, 60, 0.08) 0%, rgba(0, 0, 20, 0.25) 100%)',
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      >
        {/* Enhanced galaxy background with smoother rotation */}
        <div className="absolute inset-0" style={{ pointerEvents: 'none' }}>
          {/* Main Galaxy Spiral */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 50% 70% at 50% 50%, 
                  rgba(100, 150, 255, 0.03) 0%, 
                  rgba(200, 180, 255, 0.02) 30%,
                  rgba(255, 200, 150, 0.01) 60%,
                  transparent 80%
                )
              `,
              transform: `rotate(${galaxyRotation}deg)`,
              transformOrigin: 'center center',
              transition: 'transform 0.5s linear',
              opacity: deviceInfo.isLowEnd ? 0.3 : 0.5
            }}
          />
          
          {/* Galaxy Core with gentle pulse */}
          <motion.div 
            className="absolute top-1/2 left-1/2"
            style={{
              width: '200px',
              height: '200px',
              marginLeft: '-100px',
              marginTop: '-100px',
              background: `
                radial-gradient(circle at center, 
                  rgba(255, 255, 255, 0.06) 0%, 
                  rgba(200, 180, 255, 0.03) 20%,
                  rgba(255, 200, 150, 0.015) 40%,
                  transparent 70%
                )
              `,
              borderRadius: '50%',
              opacity: deviceInfo.isLowEnd ? 0.2 : 0.4
            }}
            animate={{
              scale: [1, 1.05, 1],
              opacity: deviceInfo.isLowEnd ? [0.2, 0.25, 0.2] : [0.4, 0.5, 0.4]
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          {/* Subtle spiral arms */}
          {!deviceInfo.isLowEnd && (
            <div 
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(ellipse 80% 40% at 50% 50%, 
                    transparent 0%, 
                    rgba(180, 200, 255, 0.008) 20%,
                    rgba(255, 180, 200, 0.005) 50%,
                    transparent 70%
                  )
                `,
                transform: `rotate(${galaxyRotation * -0.7}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.5s linear',
                opacity: 0.6
              }}
            />
          )}
        </div>
        
        {/* Enhanced constellation lines with animation */}
        {showConstellations && (
          <motion.svg 
            className="absolute inset-0 w-full h-full" 
            style={{ zIndex: 1, pointerEvents: 'none' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.line
              x1="20%"
              y1="30%"
              x2="25%"
              y2="25%"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0 }}
            />
            <motion.line
              x1="25%"
              y1="25%"
              x2="30%"
              y2="20%"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.2 }}
            />
            <motion.line
              x1="30%"
              y1="20%"
              x2="35%"
              y2="22%"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            />
            <motion.line
              x1="35%"
              y1="22%"
              x2="40%"
              y2="28%"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            />
            <motion.line
              x1="40%"
              y1="28%"
              x2="42%"
              y2="35%"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.8 }}
            />
            <motion.line
              x1="42%"
              y1="35%"
              x2="38%"
              y2="40%"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 1 }}
            />
            
            {/* Add constellation stars */}
            {['20%,30%', '25%,25%', '30%,20%', '35%,22%', '40%,28%', '42%,35%', '38%,40%'].map((pos, i) => {
              const [x, y] = pos.split(',');
              return (
                <motion.circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="2"
                  fill="rgba(255, 255, 255, 0.8)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: [0.4, 1, 0.4] }}
                  transition={{ 
                    scale: { duration: 0.5, delay: i * 0.2 },
                    opacity: { duration: 2, repeat: Infinity, delay: i * 0.3 }
                  }}
                />
              );
            })}
          </motion.svg>
        )}
        
        {/* tsParticles with smooth animations */}
        {init && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2 }}
            className="absolute inset-0"
          >
            <Particles
              id="stars"
              options={starsParticlesOptions}
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
              }}
            />
            
            {/* Shooting stars with smooth entrance */}
            {!deviceInfo.isLowEnd && !deviceInfo.prefersReducedMotion && (
              <Particles
                id="shootingStars"
                options={shootingStarsOptions}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                }}
              />
            )}
          </motion.div>
        )}
      </div>
    </>
  );
}