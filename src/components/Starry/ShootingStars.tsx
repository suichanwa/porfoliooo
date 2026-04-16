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
  const angleDeg = randomBetween(isMobile ? 24 : 26, isMobile ? 32 : 34);
  const angleRad = (angleDeg * Math.PI) / 180;
  const travelDistance = randomBetween(
    isMobile ? 180 : 240,
    isMobile ? 260 : 360
  );

  return {
    id,
    startTop: randomBetween(isMobile ? -8 : -10, isMobile ? 16 : 20),
    startLeft: randomBetween(isMobile ? -14 : -12, isMobile ? 18 : 24),
    deltaX: Math.cos(angleRad) * travelDistance,
    deltaY: Math.sin(angleRad) * travelDistance,
    angleDeg,
    durationMs: randomBetween(isLowEnd ? 700 : 820, isMobile ? 1100 : 1400),
    trailLength: randomBetween(isMobile ? 90 : 120, isMobile ? 130 : 180),
    trailThickness: randomBetween(isMobile ? 1.1 : 1.2, isMobile ? 1.6 : 1.9),
    headSize: randomBetween(isMobile ? 2.8 : 3.2, isMobile ? 4.2 : 4.8),
    glowSize: randomBetween(isMobile ? 12 : 14, isMobile ? 18 : 22)
  };
};

export default function ShootingStars({
  deviceInfo,
  isClient
}: ShootingStarsProps) {
  const [stars, setStars] = useState<ShootingStar[]>([]);
  const spawnTimeoutRef = useRef<number>();
  const cleanupTimeoutsRef = useRef<number[]>([]);
  const nextIdRef = useRef(0);

  useEffect(() => {
    if (!isClient || deviceInfo.prefersReducedMotion) {
      setStars([]);
      return;
    }

    const spawnStar = () => {
      const star = buildShootingStar(nextIdRef.current++, deviceInfo);
      const lifetime = star.durationMs + 180;

      setStars((current) => [...current.slice(-1), star]);

      const timeoutId = window.setTimeout(() => {
        setStars((current) => current.filter((item) => item.id !== star.id));
      }, lifetime);

      cleanupTimeoutsRef.current.push(timeoutId);
    };

    const scheduleNextSpawn = () => {
      const delay = randomBetween(
        deviceInfo.isMobile ? 1800 : 2200,
        deviceInfo.isLowEnd ? 3200 : 4200
      );

      spawnTimeoutRef.current = window.setTimeout(() => {
        spawnStar();
        scheduleNextSpawn();
      }, delay);
    };

    scheduleNextSpawn();

    return () => {
      if (spawnTimeoutRef.current) {
        window.clearTimeout(spawnTimeoutRef.current);
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
            scale: 0.94
          }}
          animate={{
            opacity: [0, 0.9, 0.7, 0],
            x: [0, star.deltaX],
            y: [0, star.deltaY],
            scale: [0.94, 1, 0.985, 0.96]
          }}
          transition={{
            duration: star.durationMs / 1000,
            times: [0, 0.12, 0.72, 1],
            ease: [0.12, 0.72, 0.24, 1]
          }}
          style={{
            position: "absolute",
            top: `${star.startTop}%`,
            left: `${star.startLeft}%`,
            width: `${star.trailLength + star.glowSize}px`,
            height: `${Math.max(star.glowSize, star.headSize * 3.2)}px`,
            rotate: star.angleDeg,
            transformOrigin: "right center",
            willChange: "transform, opacity"
          }}
        >
          <span
            style={{
              position: "absolute",
              right: `${star.headSize * 0.55}px`,
              top: "50%",
              width: `${star.trailLength}px`,
              height: `${star.trailThickness}px`,
              transform: "translateY(-50%)",
              borderRadius: "999px",
              background:
                "linear-gradient(90deg, rgba(160,205,255,0) 0%, rgba(168,212,255,0.03) 30%, rgba(196,226,255,0.16) 68%, rgba(245,250,255,0.72) 100%)",
              filter: "blur(0.9px)"
            }}
          />
          <span
            style={{
              position: "absolute",
              right: `${star.headSize * 0.5}px`,
              top: "50%",
              width: `${Math.max(20, star.trailLength * 0.56)}px`,
              height: `${Math.max(0.8, star.trailThickness * 0.58)}px`,
              transform: "translateY(-50%)",
              borderRadius: "999px",
              background:
                "linear-gradient(90deg, rgba(188,224,255,0) 0%, rgba(228,241,255,0.08) 58%, rgba(255,255,255,0.5) 100%)",
              filter: "blur(0.3px)"
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
                "radial-gradient(circle, rgba(255,255,255,0.58) 0%, rgba(227,239,255,0.28) 42%, rgba(150,198,255,0) 78%)",
              filter: "blur(1.4px)"
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
                "radial-gradient(circle, rgba(255,255,255,0.98) 0%, rgba(240,247,255,0.88) 52%, rgba(170,212,255,0.28) 82%, rgba(170,212,255,0) 100%)",
                filter: "blur(0.1px)"
              }}
            />
        </motion.div>
      ))}
    </div>
  );
}
