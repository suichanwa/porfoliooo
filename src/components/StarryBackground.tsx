import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StarryBackgroundProps {
  onHideGUI?: (hidden: boolean) => void;
  enableNeptuneTransition?: boolean;
  neptuneSectionId?: string;
}

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  driftX: number;
  driftY: number;
  driftSpeed: number;
  driftPhase: number;
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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>();
  const lastFrameTime = useRef<number>(0);
  const isVisible = useRef<boolean>(true);

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

  // Generate optimized stars
  const generateStars = useCallback((width: number, height: number) => {
    const starCount = deviceInfo.isLowEnd ? 30 : deviceInfo.isMobile ? 50 : 80;
    const stars: Star[] = [];
    
    for (let i = 0; i < starCount; i++) {
      const magnitude = Math.random() * 6;
      const radius = magnitude < 2 ? Math.random() * 1.5 + 1.5 : 
                     magnitude < 4 ? Math.random() * 1 + 0.8 : 
                     Math.random() * 0.5 + 0.3;
      
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        opacity: Math.random() * 0.3 + 0.5,
        baseOpacity: Math.random() * 0.3 + 0.5,
        twinkleSpeed: Math.random() * 0.0005 + 0.0002,
        twinklePhase: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 0.3,
        driftY: (Math.random() - 0.5) * 0.2,
        driftSpeed: Math.random() * 0.00008 + 0.00003,
        driftPhase: Math.random() * Math.PI * 2
      });
    }
    
    starsRef.current = stars;
  }, [deviceInfo.isLowEnd, deviceInfo.isMobile]);

  // Optimized render function with frame skipping
  const render = useCallback((timestamp: number) => {
    if (!canvasRef.current || !isVisible.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) return;

    // Target 30 FPS instead of 60 FPS for better performance
    const targetFPS = deviceInfo.isLowEnd ? 20 : 30;
    const frameInterval = 1000 / targetFPS;
    
    if (timestamp - lastFrameTime.current < frameInterval) {
      animationRef.current = requestAnimationFrame(render);
      return;
    }
    
    lastFrameTime.current = timestamp;
    
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw stars with minimal operations
    starsRef.current.forEach(star => {
      // Update twinkle
      const twinkle = Math.sin(timestamp * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
      star.opacity = star.baseOpacity * twinkle;
      
      // Update drift
      const driftOffsetX = Math.sin(timestamp * star.driftSpeed + star.driftPhase) * star.driftX;
      const driftOffsetY = Math.cos(timestamp * star.driftSpeed + star.driftPhase) * star.driftY;
      
      const x = star.x + driftOffsetX;
      const y = star.y + driftOffsetY;
      
      // Draw star (single operation)
      ctx.globalAlpha = star.opacity;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, star.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    ctx.globalAlpha = 1;

    // Draw constellation lines (if enabled)
    if (showConstellations && starsRef.current.length > 10) {
      ctx.strokeStyle = 'rgba(140, 180, 220, 0.15)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      
      for (let i = 0; i < Math.min(starsRef.current.length, 30); i += 3) {
        const star1 = starsRef.current[i];
        const star2 = starsRef.current[i + 3];
        if (!star2) break;
        
        const dx = star2.x - star1.x;
        const dy = star2.y - star1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < width * 0.15) {
          ctx.moveTo(star1.x, star1.y);
          ctx.lineTo(star2.x, star2.y);
        }
      }
      
      ctx.stroke();
    }

    animationRef.current = requestAnimationFrame(render);
  }, [deviceInfo.isLowEnd, showConstellations]);

  // Initialize canvas
  useEffect(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, deviceInfo.isLowEnd ? 1 : 1.5);
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      
      const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      generateStars(width, height);
    };

    setupCanvas();

    let resizeTimeout: number;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(setupCanvas, 300);
    };

    // Visibility API to pause when not visible
    const handleVisibilityChange = () => {
      isVisible.current = !document.hidden;
      if (isVisible.current && !animationRef.current) {
        animationRef.current = requestAnimationFrame(render);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isClient, deviceInfo.isLowEnd, generateStars, render]);

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
                    ⚡ Ultra Optimized<br/>
                    🎯 30 FPS Target<br/>
                    💫 Minimal Redraws<br/>
                    🔋 Battery Friendly
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div 
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
        {enableNebulae && (
          <>
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '15%',
              width: '250px',
              height: '250px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(74, 51, 102, 0.08) 0%, transparent 70%)',
              filter: 'blur(40px)',
              opacity: 0.6
            }} />
            
            {!deviceInfo.isLowEnd && (
              <div style={{
                position: 'absolute',
                top: '60%',
                right: '20%',
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(42, 68, 102, 0.06) 0%, transparent 70%)',
                filter: 'blur(35px)',
                opacity: 0.5
              }} />
            )}
          </>
        )}

        {/* Canvas for stars */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />
      </div>
    </>
  );
}