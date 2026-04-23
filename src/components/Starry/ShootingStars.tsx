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
  hasStarHead: boolean;
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const METEOR_SHOWER_CHANCE = 0.05;
const STAR_HEAD_CHANCE = 1;

const buildShootingStar = (
  id: number,
  deviceInfo: DeviceInfo,
  forceStarHead = false
): ShootingStar => {
  const isMobile = deviceInfo.isMobile;
  const isLowEnd = deviceInfo.isLowEnd;
  const viewportWidth = window.innerWidth || 1440;
  const viewportHeight = window.innerHeight || 900;
  const diagonal = Math.hypot(viewportWidth, viewportHeight);
  const angleDeg = randomBetween(312, 318);
  const angleRad = (angleDeg * Math.PI) / 180;
  const travelDistance = randomBetween(
    diagonal * (isMobile ? 0.62 : 0.72),
    diagonal * (isMobile ? 0.92 : 1.08)
  );

  return {
    id,
    startTop: randomBetween(isMobile ? -6 : -10, isMobile ? 22 : 28),
    startLeft: randomBetween(isMobile ? 76 : 72, isMobile ? 108 : 112),
    deltaX: Math.cos(angleRad) * -travelDistance,
    deltaY: Math.sin(angleRad) * -travelDistance,
    angleDeg,
    durationMs: randomBetween(isLowEnd ? 1200 : 1400, isMobile ? 1900 : 2500),
    trailLength: randomBetween(isMobile ? 140 : 180, isMobile ? 210 : 280),
    trailThickness: randomBetween(isMobile ? 0.9 : 1, isMobile ? 1.4 : 1.7),
    headSize: randomBetween(isMobile ? 2.4 : 2.8, isMobile ? 3.8 : 4.4),
    glowSize: randomBetween(isMobile ? 7 : 8, isMobile ? 11 : 13),
    hasStarHead: forceStarHead || Math.random() < STAR_HEAD_CHANCE
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

    const spawnStar = (maxActiveStars = 2, forceStarHead = false) => {
      const star = buildShootingStar(nextIdRef.current++, deviceInfo, forceStarHead);
      const lifetime = star.durationMs + 180;
      const keepCount = Math.max(1, Math.floor(maxActiveStars) - 1);

      setStars((current) => [...current.slice(-keepCount), star]);

      const timeoutId = window.setTimeout(() => {
        setStars((current) => current.filter((item) => item.id !== star.id));
      }, lifetime);

      cleanupTimeoutsRef.current.push(timeoutId);
    };

    const spawnMeteorShower = () => {
      const burstCount = Math.round(
        randomBetween(deviceInfo.isMobile ? 2 : 3, deviceInfo.isLowEnd ? 4 : 6)
      );
      const burstGapRange = deviceInfo.isLowEnd ? [120, 210] : [90, 170];
      const showerCapacity = deviceInfo.isLowEnd ? 4 : 6;

      for (let index = 0; index < burstCount; index += 1) {
        const burstDelay =
          randomBetween(burstGapRange[0], burstGapRange[1]) * (index + 1);

        const timeoutId = window.setTimeout(() => {
          spawnStar(showerCapacity, true);
        }, burstDelay);

        cleanupTimeoutsRef.current.push(timeoutId);
      }
    };

    const scheduleNextSpawn = () => {
      const delay = randomBetween(
        deviceInfo.isMobile ? 1200 : 1400,
        deviceInfo.isLowEnd ? 2600 : 3400
      );

      spawnTimeoutRef.current = window.setTimeout(() => {
        spawnStar(2);

        if (Math.random() < METEOR_SHOWER_CHANCE) {
          spawnMeteorShower();
        }

        scheduleNextSpawn();
      }, delay);
    };

    spawnStar(2);
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
      {stars.map((star) => {
        const isSuiseiStar = star.hasStarHead;
        const headCenterX = star.glowSize * 0.5;
        const headLeft = headCenterX - star.headSize / 2;
        const starHeadSize = star.headSize * 1.2;
        const starHeadLeft = headCenterX - starHeadSize / 2;
        const tailLeft = headCenterX + (isSuiseiStar ? starHeadSize * 0.06 : 0);
        const tailLength = isSuiseiStar ? star.trailLength * 0.84 : star.trailLength;
        const tailThickness = isSuiseiStar
          ? Math.max(0.8, star.trailThickness * 0.86)
          : star.trailThickness;
        const softGlowSize = star.glowSize;
        const softGlowLeft = headCenterX - softGlowSize / 2;

        return (
          <motion.div
            key={star.id}
            initial={{
              opacity: 0,
              x: 0,
              y: 0,
              scale: 0.97
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              x: [0, star.deltaX],
              y: [0, star.deltaY],
              scale: [0.97, 1, 1, 0.99]
            }}
            transition={{
              duration: star.durationMs / 1000,
              times: [0, 0.08, 0.72, 1],
              ease: "linear"
            }}
            style={{
              position: "absolute",
              top: `${star.startTop}%`,
              left: `${star.startLeft}%`,
              width: `${tailLength + star.glowSize + 12}px`,
              height: `${Math.max(star.glowSize, star.headSize * 2.4)}px`,
              rotate: star.angleDeg,
              transformOrigin: "left center",
              willChange: "transform, opacity"
            }}
          >
            <span
              style={{
                position: "absolute",
                left: `${tailLeft}px`,
                top: "50%",
                width: `${tailLength}px`,
                height: `${tailThickness}px`,
                transform: "translateY(-50%)",
                borderRadius: "999px",
                background:
                  isSuiseiStar
                    ? "linear-gradient(90deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.34) 18%, rgba(255,255,255,0.1) 48%, rgba(255,255,255,0) 100%)"
                    : "linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.42) 24%, rgba(255,255,255,0.12) 58%, rgba(255,255,255,0) 100%)",
                filter: isSuiseiStar ? "blur(0.32px)" : "blur(0.45px)"
              }}
            />
            <span
              style={{
                position: "absolute",
                left: `${tailLeft}px`,
                top: "50%",
                width: `${Math.max(36, tailLength * (isSuiseiStar ? 0.24 : 0.28))}px`,
                height: `${Math.max(0.5, tailThickness * (isSuiseiStar ? 0.5 : 0.55))}px`,
                transform: "translateY(-50%)",
                borderRadius: "999px",
                background:
                  isSuiseiStar
                    ? "linear-gradient(90deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.13) 40%, rgba(255,255,255,0) 100%)"
                    : "linear-gradient(90deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.16) 45%, rgba(255,255,255,0) 100%)",
                filter: isSuiseiStar ? "blur(0.14px)" : "blur(0.18px)"
              }}
            />
            <span
              style={{
                position: "absolute",
                left: `${softGlowLeft}px`,
                top: "50%",
                width: `${softGlowSize}px`,
                height: `${softGlowSize}px`,
                transform: "translateY(-50%)",
                borderRadius: "999px",
                background:
                  "radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.1) 46%, rgba(255,255,255,0) 74%)",
                filter: "blur(1px)"
              }}
            />
            {star.hasStarHead ? (
              <span
                style={{
                  position: "absolute",
                  left: `${starHeadLeft}px`,
                  top: "50%",
                  width: `${starHeadSize}px`,
                  height: `${starHeadSize}px`,
                  transform: "translateY(-50%)",
                  filter: "drop-shadow(0 0 2px rgba(255,255,255,0.2))"
                }}
              >
                <svg
                  viewBox="0 0 16 16"
                  width="100%"
                  height="100%"
                  aria-hidden="true"
                  focusable="false"
                  style={{ display: "block" }}
                >
                  <path
                    d="M8 1.85C8.38 1.85 8.68 2.11 8.9 2.58L9.57 4.03C9.76 4.43 10.07 4.64 10.49 4.69L12.07 4.9C12.73 4.98 13.01 5.73 12.51 6.12L11.34 7.03C11.01 7.29 10.87 7.64 10.95 8.06L11.26 9.63C11.39 10.28 10.71 10.77 10.13 10.47L8.74 9.75C8.36 9.56 7.94 9.56 7.56 9.75L6.17 10.47C5.59 10.77 4.91 10.28 5.04 9.63L5.35 8.06C5.43 7.64 5.29 7.29 4.96 7.03L3.79 6.12C3.29 5.73 3.57 4.98 4.23 4.9L5.81 4.69C6.23 4.64 6.54 4.43 6.73 4.03L7.4 2.58C7.62 2.11 7.92 1.85 8.3 1.85H8Z"
                    fill="rgba(255,255,255,0.98)"
                    stroke="rgba(255,255,255,0.98)"
                    strokeWidth="0.36"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            ) : (
              <span
                style={{
                  position: "absolute",
                  left: `${headLeft}px`,
                  top: "50%",
                  width: `${star.headSize}px`,
                  height: `${star.headSize}px`,
                  transform: "translateY(-50%)",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.98)",
                  boxShadow: "0 0 8px rgba(255,255,255,0.14)"
                }}
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
