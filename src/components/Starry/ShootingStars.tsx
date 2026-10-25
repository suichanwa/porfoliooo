import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { DeviceInfo } from "../../hooks/useDeviceInfo";
import type { MeteorFrequency } from "./types/starry";

interface ShootingStarsProps {
  deviceInfo: DeviceInfo;
  isClient: boolean;
  meteorFrequency?: MeteorFrequency;
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
  isWish?: boolean;
}

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const METEOR_SHOWER_CHANCE = 0.02; // 2% default chance for meteor shower
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
    headSize: randomBetween(isMobile ? 3.2 : 3.8, isMobile ? 5 : 5.8),
    glowSize: randomBetween(isMobile ? 7 : 8, isMobile ? 11 : 13),
    hasStarHead: forceStarHead || Math.random() < STAR_HEAD_CHANCE,
    isWish: false
  };
};

const buildWishComet = (id: number, deviceInfo: DeviceInfo): ShootingStar => {
  const isMobile = deviceInfo.isMobile;
  const viewportWidth = window.innerWidth || 1440;
  const viewportHeight = window.innerHeight || 900;
  const diagonal = Math.hypot(viewportWidth, viewportHeight);
  const angleDeg = randomBetween(310, 316);
  const angleRad = (angleDeg * Math.PI) / 180;
  const travelDistance = diagonal * 1.08;

  return {
    id,
    startTop: randomBetween(2, 22),
    startLeft: randomBetween(82, 106),
    deltaX: Math.cos(angleRad) * -travelDistance,
    deltaY: Math.sin(angleRad) * -travelDistance,
    angleDeg,
    durationMs: 2400,
    trailLength: isMobile ? 240 : 360,
    trailThickness: isMobile ? 2.2 : 2.8,
    headSize: isMobile ? 5.5 : 7,
    glowSize: isMobile ? 15 : 20,
    hasStarHead: true,
    isWish: true
  };
};

export default function ShootingStars({
  deviceInfo,
  isClient,
  meteorFrequency = "normal"
}: ShootingStarsProps) {
  const [stars, setStars] = useState<ShootingStar[]>([]);
  const spawnTimeoutRef = useRef<number>();
  const cleanupTimeoutsRef = useRef<number[]>([]);
  const nextIdRef = useRef(0);
  const meteorFrequencyRef = useRef(meteorFrequency);

  useEffect(() => {
    meteorFrequencyRef.current = meteorFrequency;
  }, [meteorFrequency]);

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

    const spawnWishStar = () => {
      const wishStar = buildWishComet(nextIdRef.current++, deviceInfo);
      const lifetime = wishStar.durationMs + 200;
      setStars((current) => [...current, wishStar]);
      const timeoutId = window.setTimeout(() => {
        setStars((current) => current.filter((item) => item.id !== wishStar.id));
      }, lifetime);
      cleanupTimeoutsRef.current.push(timeoutId);
    };

    const spawnMeteorShower = () => {
      const burstCount = Math.round(
        randomBetween(deviceInfo.isMobile ? 3 : 4, deviceInfo.isLowEnd ? 5 : 8)
      );
      const burstGapRange = deviceInfo.isLowEnd ? [100, 190] : [70, 150];
      const showerCapacity = deviceInfo.isLowEnd ? 5 : 8;

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
      const isShower = meteorFrequencyRef.current === "shower";
      const minDelay = isShower ? 450 : deviceInfo.isMobile ? 1200 : 1400;
      const maxDelay = isShower ? 1200 : deviceInfo.isLowEnd ? 2600 : 3400;
      const delay = randomBetween(minDelay, maxDelay);

      spawnTimeoutRef.current = window.setTimeout(() => {
        spawnStar(isShower ? 4 : 2);

        const showerChance = isShower ? 0.35 : METEOR_SHOWER_CHANCE;
        if (Math.random() < showerChance) {
          spawnMeteorShower();
        }

        scheduleNextSpawn();
      }, delay);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (spawnTimeoutRef.current) {
          window.clearTimeout(spawnTimeoutRef.current);
          spawnTimeoutRef.current = undefined;
        }
      } else if (!spawnTimeoutRef.current) {
        scheduleNextSpawn();
      }
    };

    const handleMakeWishEvent = () => {
      spawnWishStar();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("observatory:make-wish", handleMakeWishEvent);

    spawnStar(2);
    scheduleNextSpawn();

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("observatory:make-wish", handleMakeWishEvent);
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
        const starHeadSize = star.headSize * 2.2;
        const starHeadLeft = headCenterX - starHeadSize / 2;
        const tailLeft = headCenterX;
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
                background: star.isWish
                  ? "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(94,159,255,0.92) 20%, rgba(199,146,234,0.7) 60%, rgba(199,146,234,0) 100%)"
                  : isSuiseiStar
                    ? "linear-gradient(90deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.34) 18%, rgba(255,255,255,0.1) 48%, rgba(255,255,255,0) 100%)"
                    : "linear-gradient(90deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.42) 24%, rgba(255,255,255,0.12) 58%, rgba(255,255,255,0) 100%)",
                filter: star.isWish
                  ? "drop-shadow(0 0 8px rgba(94,159,255,0.9)) blur(0.25px)"
                  : isSuiseiStar
                    ? "blur(0.32px)"
                    : "blur(0.45px)"
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
                background: star.isWish
                  ? "linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(199,146,234,0.6) 40%, rgba(255,255,255,0) 100%)"
                  : isSuiseiStar
                    ? "linear-gradient(90deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.13) 40%, rgba(255,255,255,0) 100%)"
                    : "linear-gradient(90deg, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.16) 45%, rgba(255,255,255,0) 100%)",
                filter: star.isWish ? "blur(0.2px)" : isSuiseiStar ? "blur(0.14px)" : "blur(0.18px)"
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
                background: star.isWish
                  ? "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(94,159,255,0.8) 32%, rgba(199,146,234,0.4) 65%, transparent 100%)"
                  : "radial-gradient(circle, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.1) 46%, rgba(255,255,255,0) 74%)",
                filter: star.isWish ? "blur(0.5px)" : "blur(1px)"
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
                  filter: star.isWish
                    ? "drop-shadow(0 0 6px #5e9fff) drop-shadow(0 0 12px #c792ea)"
                    : "drop-shadow(0 0 2px rgba(255,255,255,0.2))"
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
                    transform="translate(0 1.8)"
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
