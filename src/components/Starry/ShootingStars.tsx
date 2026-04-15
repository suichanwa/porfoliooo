import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { DeviceInfo } from "../../hooks/useDeviceInfo";

interface ShootingStarsProps {
  deviceInfo: DeviceInfo;
  isClient: boolean;
}

interface ShootingStar {
  id: number;
  startTop: number;
  startLeft: number;
  deltaX: number;
  deltaY: number;
  curveLift: number;
  angleDeg: number;
  durationMs: number;
  trailLength: number;
  trailThickness: number;
  headSize: number;
  glowSize: number;
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

const buildShootingStar = (id: number, deviceInfo: DeviceInfo): ShootingStar => {
  const isMobile = deviceInfo.isMobile;
  const isLowEnd = deviceInfo.isLowEnd;

  return {
    id,
    startTop: randomBetween(isMobile ? 8 : 7, isMobile ? 16 : 14),
    startLeft: randomBetween(isMobile ? 3 : 4, isMobile ? 12 : 14),
    deltaX: randomBetween(isMobile ? 34 : 38, isMobile ? 44 : 52),
    deltaY: randomBetween(isMobile ? 22 : 24, isMobile ? 30 : 34),
    curveLift: randomBetween(isMobile ? 1.2 : 1.8, isMobile ? 2.8 : 3.8),
    angleDeg: randomBetween(30, 34),
    durationMs: randomBetween(isLowEnd ? 1250 : 1350, isMobile ? 1700 : 2100),
    trailLength: randomBetween(isMobile ? 54 : 68, isMobile ? 84 : 110),
    trailThickness: randomBetween(isMobile ? 1.4 : 1.6, isMobile ? 2 : 2.4),
    headSize: randomBetween(isMobile ? 3.2 : 3.8, isMobile ? 4.8 : 5.6),
    glowSize: randomBetween(isMobile ? 10 : 12, isMobile ? 16 : 20)
  };
};

export default function ShootingStars({
  deviceInfo,
  isClient
}: ShootingStarsProps) {
  const [stars, setStars] = useState<ShootingStar[]>([]);
  const intervalRef = useRef<number>();
  const cleanupTimeoutsRef = useRef<number[]>([]);
  const nextIdRef = useRef(0);

  useEffect(() => {
    if (!isClient || deviceInfo.prefersReducedMotion) {
      setStars([]);
      return;
    }

    const spawnStar = () => {
      const star = buildShootingStar(nextIdRef.current++, deviceInfo);
      const lifetime = star.durationMs + 120;

      setStars((current) => [...current.slice(-2), star]);

      const timeoutId = window.setTimeout(() => {
        setStars((current) => current.filter((item) => item.id !== star.id));
      }, lifetime);

      cleanupTimeoutsRef.current.push(timeoutId);
    };

    spawnStar();
    intervalRef.current = window.setInterval(spawnStar, 1000);

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
      }

      cleanupTimeoutsRef.current.forEach((timeoutId) => {
        window.clearTimeout(timeoutId);
      });
      cleanupTimeoutsRef.current = [];
    };
  }, [
    deviceInfo.isLowEnd,
    deviceInfo.isMobile,
    deviceInfo.prefersReducedMotion,
    isClient
  ]);

  if (!isClient || deviceInfo.prefersReducedMotion) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none"
      }}
    >
      {stars.map((star) => (
        <motion.div
          key={star.id}
          initial={{
            opacity: 0,
            x: 0,
            y: 0,
            scale: 0.9
          }}
          animate={{
            opacity: [0, 0.14, 0.34, 0.22, 0],
            x: [0, star.deltaX * 0.28, star.deltaX * 0.65, star.deltaX],
            y: [0, star.deltaY * 0.18 - star.curveLift, star.deltaY * 0.62 - star.curveLift * 0.35, star.deltaY],
            scale: [0.92, 1, 1, 0.98]
          }}
          transition={{
            duration: star.durationMs / 1000,
            times: [0, 0.16, 0.42, 0.78, 1],
            ease: [0.18, 0.72, 0.24, 1]
          }}
          style={{
            position: "absolute",
            top: `${star.startTop}%`,
            left: `${star.startLeft}%`,
            width: `${star.trailLength}px`,
            height: `${star.glowSize}px`,
            transform: `rotate(${star.angleDeg}deg)`,
            transformOrigin: "right center",
            willChange: "transform, opacity"
          }}
        >
          <span
            style={{
              position: "absolute",
              right: `${star.headSize * 0.45}px`,
              top: "50%",
              width: `${Math.max(20, star.trailLength - star.headSize)}px`,
              height: `${star.trailThickness}px`,
              transform: "translateY(-50%)",
              borderRadius: "999px",
              background:
                "linear-gradient(90deg, rgba(122,172,255,0) 0%, rgba(140,190,255,0.02) 22%, rgba(165,208,255,0.08) 48%, rgba(212,235,255,0.22) 78%, rgba(248,252,255,0.5) 100%)",
              filter: "blur(1.2px)"
            }}
          />
          <span
            style={{
              position: "absolute",
              right: `${star.headSize * 0.4}px`,
              top: "50%",
              width: `${Math.max(16, star.trailLength * 0.72)}px`,
              height: `${Math.max(0.7, star.trailThickness * 0.48)}px`,
              transform: "translateY(-50%)",
              borderRadius: "999px",
              background:
                "linear-gradient(90deg, rgba(180,220,255,0) 0%, rgba(215,236,255,0.04) 46%, rgba(255,255,255,0.22) 100%)",
              filter: "blur(0.45px)"
            }}
          />
          <span
            style={{
              position: "absolute",
              right: 0,
              top: "50%",
              width: `${star.glowSize}px`,
              height: `${star.glowSize}px`,
              transform: "translateY(-50%)",
              borderRadius: "999px",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.26) 0%, rgba(228,241,255,0.14) 42%, rgba(150,198,255,0) 76%)",
              filter: "blur(1.8px)"
            }}
          />
          <span
            style={{
              position: "absolute",
              right: `${(star.glowSize - star.headSize) / 2}px`,
              top: "50%",
              width: `${star.headSize}px`,
              height: `${star.headSize}px`,
              transform: "translateY(-50%)",
              borderRadius: "999px",
              background:
                "radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(236,245,255,0.72) 48%, rgba(170,212,255,0.22) 78%, rgba(170,212,255,0) 100%)",
              filter: "blur(0.1px)"
            }}
          />
        </motion.div>
      ))}
    </div>
  );
}
