import { useEffect, useRef, useState, useMemo } from "react";
import { motion } from "framer-motion";

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
}

export default function StarryBackground() {
  const [stars, setStars] = useState<Star[]>([]);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();
  const shootingStarTimerRef = useRef<number | null>(null);
  
  // Star colors - stellar appearance
  const starColors = useMemo(() => [
    "#ffffff", // Pure white
    "#fffaf0", // Warm white
    "#f8f8ff", // Ghost white
    "#f0f8ff", // Alice blue
    "#e6e6fa", // Lavender
    "#ffe4b5", // Moccasin (slightly yellow)
    "#b0e0e6", // Powder blue
  ], []);
  
  // Create initial stars
  useEffect(() => {
    if (!containerRef.current) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const starCount = Math.min(150, Math.floor((width * height) / 8000));
    
    const initialStars: Star[] = Array.from({ length: starCount }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 3 + 0.5,
      opacity: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.15 + 0.02,
      color: starColors[Math.floor(Math.random() * starColors.length)],
      twinkleSpeed: Math.random() * 2 + 1,
      angle: (Math.random() * 10 - 5) * (Math.PI / 180),
    }));
    
    setStars(initialStars);
    
    // Create shooting stars at intervals
    shootingStarTimerRef.current = window.setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance to create a shooting star
        createShootingStar();
      }
    }, 3000); // Check every 3 seconds
    
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      const newStarCount = Math.min(150, Math.floor((newWidth * newHeight) / 8000));
      
      setStars(prev => {
        // Keep existing stars that are still in view
        const existingStars = prev
          .filter(star => star.x < newWidth && star.y < newHeight)
          .slice(0, newStarCount);
          
        // Add new stars if needed
        const newStars: Star[] = [];
        for (let i = existingStars.length; i < newStarCount; i++) {
          newStars.push({
            id: prev.length + i,
            x: Math.random() * newWidth,
            y: Math.random() * newHeight,
            size: Math.random() * 3 + 0.5,
            opacity: Math.random() * 0.7 + 0.3,
            speed: Math.random() * 0.15 + 0.02,
            color: starColors[Math.floor(Math.random() * starColors.length)],
            twinkleSpeed: Math.random() * 2 + 1,
            angle: (Math.random() * 10 - 5) * (Math.PI / 180),
          });
        }
        
        return [...existingStars, ...newStars];
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (shootingStarTimerRef.current) {
        clearInterval(shootingStarTimerRef.current);
      }
    };
  }, [starColors]);
  
  const createShootingStar = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Create a more dramatic shooting star with improved trajectory
    const startX = Math.random() * (width * 0.8) + width * 0.1; // Start in the middle 80% of screen
    const startY = -20; // Start just above the viewport
    
    // End point will be toward bottom of screen, with some angle
    const angle = Math.random() * 60 + 60; // 60-120 degrees for more vertical fall
    const distance = Math.random() * height * 1.5 + height * 0.5; // Long travel distance
    
    // Calculate end position
    const radians = (angle * Math.PI) / 180;
    const endX = startX + Math.cos(radians) * distance;
    const endY = startY + Math.sin(radians) * distance;
    
    const shootingStar: ShootingStar = {
      id: Date.now(),
      startX,
      startY,
      endX,
      endY,
      length: Math.random() * 150 + 100, // Longer trail
      duration: Math.random() * 0.8 + 0.7, // Faster (0.7-1.5 seconds)
      opacity: Math.random() * 0.3 + 0.7, // Brighter
      size: Math.random() * 1.5 + 1 // Slightly varied size
    };
    
    setShootingStars(prev => [...prev, shootingStar]);
    
    // Remove this shooting star after it completes its animation plus a buffer
    setTimeout(() => {
      setShootingStars(prev => prev.filter(s => s.id !== shootingStar.id));
    }, shootingStar.duration * 1000 + 500);
  };
  
  // Animation loop for regular stars
  const animate = (time: number) => {
    if (previousTimeRef.current === undefined) {
      previousTimeRef.current = time;
    }
    
    const deltaTime = time - (previousTimeRef.current || 0);
    previousTimeRef.current = time;
    
    // Update regular stars
    setStars(prevStars => {
      const height = window.innerHeight;
      const width = window.innerWidth;
      
      return prevStars.map(star => {
        // Add gentle horizontal drift based on angle
        const newX = star.x + Math.sin(star.angle) * star.speed * deltaTime * 0.01;
        const newY = star.y + Math.cos(star.angle) * star.speed * deltaTime * 0.05;
        
        // Reset stars that fall below or drift out the screen
        if (newY > height || newX < -20 || newX > width + 20) {
          return {
            ...star,
            x: Math.random() * width,
            y: -star.size * 2,
            size: Math.random() * 3 + 0.5,
            opacity: Math.random() * 0.7 + 0.3,
            speed: Math.random() * 0.15 + 0.02,
            color: starColors[Math.floor(Math.random() * starColors.length)],
            angle: (Math.random() * 10 - 5) * (Math.PI / 180),
          };
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
  
  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
      style={{ backgroundColor: 'transparent' }}
    >
      {/* Regular stars */}
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
            boxShadow: `0 0 ${star.size * 2}px ${star.color.replace(')', ', 0.7)')}`,
          }}
          animate={{
            opacity: [star.opacity, star.opacity * 0.5, star.opacity],
          }}
          transition={{
            duration: star.twinkleSpeed,
            ease: "easeInOut", 
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      ))}
      
      {/* Shooting stars */}
      {shootingStars.map(star => (
        <motion.div
          key={star.id}
          className="absolute"
          style={{
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        >
          <motion.div
            className="absolute"
            style={{
              width: `${star.size}px`,
              height: `${star.length}px`,
              left: star.startX,
              top: star.startY,
              background: `linear-gradient(to top, transparent, rgba(255, 255, 255, ${star.opacity}))`,
              borderRadius: `${star.size / 2}px`,
              transformOrigin: 'top',
              boxShadow: `0 0 8px 1px rgba(255, 255, 255, 0.7)`,
              zIndex: 2
            }}
            initial={{
              x: 0,
              y: 0,
              rotate: Math.atan2(star.endY - star.startY, star.endX - star.startX) * (180 / Math.PI) + 90
            }}
            animate={{
              x: star.endX - star.startX,
              y: star.endY - star.startY,
              opacity: [0, star.opacity, 0]
            }}
            transition={{
              duration: star.duration,
              ease: "easeOut",
              times: [0, 0.15, 1]
            }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              width: star.size * 2,
              height: star.size * 2,
              left: star.startX - star.size / 2,
              top: star.startY,
              backgroundColor: "white",
              boxShadow: `0 0 10px 2px rgba(255, 255, 255, 0.9)`,
              zIndex: 3
            }}
            initial={{ scale: 0.2 }}
            animate={{
              x: star.endX - star.startX,
              y: star.endY - star.startY,
              scale: [1.5, 0.5, 0],
              opacity: [0.9, 0.7, 0]
            }}
            transition={{
              duration: star.duration,
              ease: "easeOut"
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}