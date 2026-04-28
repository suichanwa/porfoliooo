import { useCallback, useEffect, useRef } from "react";
import { STAR_TYPES, STAR_TYPE_ORDER, type StarType } from "../components/Starry/types/starry.ts";
import { randomBetween, STARFIELD_CONFIG } from "../utils/starUtils.ts";
import type { DeviceInfo } from "./useDeviceInfo";

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinklePhase: number;
  type: StarType;
  hasStarHead: boolean;
}

// Pre-calculate total weight for weighted random selection (constant across all invocations)
const TOTAL_STAR_TYPE_WEIGHT = STAR_TYPE_ORDER.reduce((sum, type) => sum + STAR_TYPES[type].weight, 0);

const pickStarType = () => {
  let roll = Math.random() * TOTAL_STAR_TYPE_WEIGHT;
  for (const type of STAR_TYPE_ORDER) {
    roll -= STAR_TYPES[type].weight;
    if (roll <= 0) return type;
  }
  return "standard";
};

const drawRoundedFivePointStar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number
) => {
  const outerRadius = radius * 1.28;
  const innerRadius = outerRadius * 0.64;
  const rotation = -Math.PI / 2;
  const step = Math.PI / 5;

  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();

  for (let index = 0; index < 10; index += 1) {
    const angle = rotation + index * step;
    const pointRadius = index % 2 === 0 ? outerRadius : innerRadius;
    const pointX = Math.cos(angle) * pointRadius;
    const pointY = Math.sin(angle) * pointRadius;

    if (index === 0) {
      ctx.moveTo(pointX, pointY);
    } else {
      ctx.lineTo(pointX, pointY);
    }
  }

  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(0.15, outerRadius * 0.22);
  ctx.strokeStyle = "#ffffff";
  ctx.stroke();
  ctx.restore();
};

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
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const dprRef = useRef<number>(1);
  const targetFPSRef = useRef<number>(30);
  const frameIntervalRef = useRef<number>(1000 / 30);
  const showConstellationsRef = useRef<boolean>(showConstellations);
  const constellationCacheRef = useRef<Array<[number, number]>>([]);
  const lastCanvasSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });

  // Update the ref whenever showConstellations prop changes
  useEffect(() => {
    showConstellationsRef.current = showConstellations;
  }, [showConstellations]);

  const generateStars = useCallback(
    (width: number, height: number) => {
      const starCount = deviceInfo.isLowEnd ? STARFIELD_CONFIG.STAR_COUNTS.lowEnd : deviceInfo.isMobile ? STARFIELD_CONFIG.STAR_COUNTS.mobile : STARFIELD_CONFIG.STAR_COUNTS.desktop;
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
          type,
          hasStarHead: Math.random() < STARFIELD_CONFIG.SPECIAL_STAR_CHANCE
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
      const ctx = contextRef.current;
      if (!ctx) return;

      if (timestamp - lastFrameTime.current < frameIntervalRef.current) {
        animationRef.current = requestAnimationFrame(render);
        return;
      }

      lastFrameTime.current = timestamp;

      const width = canvas.width / dprRef.current;
      const height = canvas.height / dprRef.current;

      ctx.clearRect(0, 0, width, height);

      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(timestamp * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7;
        star.opacity = star.baseOpacity * twinkle;

        ctx.globalAlpha = star.opacity;
        if (star.hasStarHead) {
          drawRoundedFivePointStar(ctx, star.x, star.y, star.radius);
        } else {
          ctx.fillStyle = STARFIELD_CONFIG.COLORS.STAR;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;

      if (showConstellationsRef.current && starsRef.current.length > 10) {
        // Recalculate constellation connections only when canvas size changes
        if (lastCanvasSizeRef.current.width !== width || lastCanvasSizeRef.current.height !== height) {
          constellationCacheRef.current = [];
          lastCanvasSizeRef.current = { width, height };

          const maxDistSq = (width * STARFIELD_CONFIG.CONSTELLATION.MAX_DISTANCE_RATIO) ** 2;
          for (let i = 0; i < Math.min(starsRef.current.length, STARFIELD_CONFIG.CONSTELLATION.MAX_STARS_TO_SAMPLE); i += STARFIELD_CONFIG.CONSTELLATION.SAMPLE_INTERVAL) {
            const star1 = starsRef.current[i];
            const star2 = starsRef.current[i + STARFIELD_CONFIG.CONSTELLATION.SAMPLE_INTERVAL];
            if (!star2) break;

            const dx = star2.x - star1.x;
            const dy = star2.y - star1.y;
            const distSq = dx * dx + dy * dy;

            if (distSq < maxDistSq) {
              constellationCacheRef.current.push([i, i + STARFIELD_CONFIG.CONSTELLATION.SAMPLE_INTERVAL]);
            }
          }
        }

        ctx.strokeStyle = STARFIELD_CONFIG.CONSTELLATION.STROKE_COLOR;
        ctx.lineWidth = STARFIELD_CONFIG.CONSTELLATION.LINE_WIDTH;
        ctx.beginPath();

        for (const [i, j] of constellationCacheRef.current) {
          const star1 = starsRef.current[i];
          const star2 = starsRef.current[j];
          ctx.moveTo(star1.x, star1.y);
          ctx.lineTo(star2.x, star2.y);
        }

        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(render);
    },
    []
  );

  useEffect(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, deviceInfo.isLowEnd ? 1 : 1.5);
      dprRef.current = dpr;

      const targetFPS = deviceInfo.isLowEnd ? STARFIELD_CONFIG.TARGET_FPS.lowEnd : STARFIELD_CONFIG.TARGET_FPS.default;
      targetFPSRef.current = targetFPS;
      frameIntervalRef.current = 1000 / targetFPS;

      const width = window.innerWidth;
      const height = window.innerHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
      if (ctx) {
        ctx.scale(dpr, dpr);
        contextRef.current = ctx;
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
