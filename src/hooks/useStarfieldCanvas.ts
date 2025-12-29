import { useCallback, useEffect, useRef } from "react";
import { STAR_TYPES, STAR_TYPE_ORDER, type StarType } from "../components/Starry/types/starry.ts";
import type { DeviceInfo } from "./useDeviceInfo";

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
  type: StarType;
}

const pickStarType = () => {
  const totalWeight = STAR_TYPE_ORDER.reduce((sum, type) => sum + STAR_TYPES[type].weight, 0);
  let roll = Math.random() * totalWeight;
  for (const type of STAR_TYPE_ORDER) {
    roll -= STAR_TYPES[type].weight;
    if (roll <= 0) return type;
  }
  return "standard";
};

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);

interface StarfieldOptions {
  showConstellations: boolean;
  deviceInfo: DeviceInfo;
  isClient: boolean;
}

export default function useStarfieldCanvas({
  showConstellations,
  deviceInfo,
  isClient
}: StarfieldOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>();
  const lastFrameTime = useRef<number>(0);
  const isVisible = useRef<boolean>(true);

  const generateStars = useCallback(
    (width: number, height: number) => {
      const starCount = deviceInfo.isLowEnd ? 30 : deviceInfo.isMobile ? 50 : 80;
      const stars: Star[] = [];

      for (let i = 0; i < starCount; i++) {
        const type = pickStarType();
        const profile = STAR_TYPES[type];
        const radius = randomBetween(profile.radiusMin, profile.radiusMax);
        const baseOpacity = randomBetween(profile.opacityMin, profile.opacityMax);

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius,
          opacity: baseOpacity,
          baseOpacity,
          twinkleSpeed: randomBetween(profile.twinkleMin, profile.twinkleMax),
          twinklePhase: Math.random() * Math.PI * 2,
          driftX: (Math.random() - 0.5) * profile.driftXMax,
          driftY: (Math.random() - 0.5) * profile.driftYMax,
          driftSpeed: randomBetween(profile.driftSpeedMin, profile.driftSpeedMax),
          driftPhase: Math.random() * Math.PI * 2,
          type
        });
      }

      starsRef.current = stars;
    },
    [deviceInfo.isLowEnd, deviceInfo.isMobile]
  );

  const render = useCallback(
    (timestamp: number) => {
      if (!canvasRef.current || !isVisible.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
      if (!ctx) return;

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

      ctx.clearRect(0, 0, width, height);

      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(timestamp * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
        star.opacity = star.baseOpacity * twinkle;

        const driftOffsetX = Math.sin(timestamp * star.driftSpeed + star.driftPhase) * star.driftX;
        const driftOffsetY = Math.cos(timestamp * star.driftSpeed + star.driftPhase) * star.driftY;

        const x = star.x + driftOffsetX;
        const y = star.y + driftOffsetY;

        ctx.globalAlpha = star.opacity;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1;

      if (showConstellations && starsRef.current.length > 10) {
        ctx.strokeStyle = "rgba(140, 180, 220, 0.15)";
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
    },
    [deviceInfo.isLowEnd, showConstellations]
  );

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

      const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
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

    const handleVisibilityChange = () => {
      isVisible.current = !document.hidden;
      if (isVisible.current && !animationRef.current) {
        animationRef.current = requestAnimationFrame(render);
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isClient, deviceInfo.isLowEnd, generateStars, render]);

  return canvasRef;
}
