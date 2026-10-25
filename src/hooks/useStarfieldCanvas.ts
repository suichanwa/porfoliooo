import { useCallback, useEffect, useRef } from "react";
import { STAR_TYPES, STAR_TYPE_ORDER, type CelestialLens, type StarType } from "../components/Starry/types/starry.ts";
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
  cursorTether?: boolean;
  celestialLens?: CelestialLens;
  deviceInfo: DeviceInfo;
  isClient: boolean;
}

export default function useStarfieldCanvas({
  showConstellations,
  cursorTether = false,
  celestialLens = "void",
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
  const cursorTetherRef = useRef<boolean>(cursorTether);
  const celestialLensRef = useRef<CelestialLens>(celestialLens);
  const constellationCacheRef = useRef<Array<[number, number]>>([]);
  const lastCanvasSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 });
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false
  });

  // Keep refs synchronized with props
  useEffect(() => {
    showConstellationsRef.current = showConstellations;
  }, [showConstellations]);

  useEffect(() => {
    cursorTetherRef.current = cursorTether;
  }, [cursorTether]);

  useEffect(() => {
    celestialLensRef.current = celestialLens;
  }, [celestialLens]);

  // Track cursor coordinates passively on fine pointer devices
  useEffect(() => {
    if (!isClient) return;
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    const handlePointerMove = (e: PointerEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
        active: true
      };
    };

    const handlePointerLeave = () => {
      mouseRef.current.active = false;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [isClient]);

  const generateStars = useCallback(
    (width: number, height: number) => {
      const starCount = deviceInfo.isLowEnd
        ? STARFIELD_CONFIG.STAR_COUNTS.lowEnd
        : deviceInfo.isMobile
          ? STARFIELD_CONFIG.STAR_COUNTS.mobile
          : STARFIELD_CONFIG.STAR_COUNTS.desktop;
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

      const isSupernova = celestialLensRef.current === "supernova";
      const speedMultiplier = isSupernova ? 1.55 : 1;
      const opacityMultiplier = isSupernova ? 1.35 : 1;

      // 1. Draw Background Stars
      starsRef.current.forEach((star) => {
        const twinkle = Math.sin(timestamp * star.twinkleSpeed * speedMultiplier + star.twinklePhase) * 0.3 + 0.7;
        star.opacity = Math.min(1, star.baseOpacity * twinkle * opacityMultiplier);

        ctx.globalAlpha = star.opacity;
        if (star.hasStarHead) {
          drawRoundedFivePointStar(ctx, star.x, star.y, star.radius);
        } else {
          ctx.fillStyle = STARFIELD_CONFIG.COLORS.STAR;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Diffraction spikes in Supernova lens mode for largest stars
        if (isSupernova && (star.type === "giant" || star.type === "bright")) {
          const spikeLen = star.radius * 3.6;
          ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity * 0.5})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(star.x - spikeLen, star.y);
          ctx.lineTo(star.x + spikeLen, star.y);
          ctx.moveTo(star.x, star.y - spikeLen);
          ctx.lineTo(star.x, star.y + spikeLen);
          ctx.stroke();
        }
      });

      ctx.globalAlpha = 1;

      // 2. Draw Constellations
      if (showConstellationsRef.current && starsRef.current.length > 10) {
        if (lastCanvasSizeRef.current.width !== width || lastCanvasSizeRef.current.height !== height) {
          constellationCacheRef.current = [];
          lastCanvasSizeRef.current = { width, height };

          const maxDistSq = (width * STARFIELD_CONFIG.CONSTELLATION.MAX_DISTANCE_RATIO) ** 2;
          for (
            let i = 0;
            i < Math.min(starsRef.current.length, STARFIELD_CONFIG.CONSTELLATION.MAX_STARS_TO_SAMPLE);
            i += STARFIELD_CONFIG.CONSTELLATION.SAMPLE_INTERVAL
          ) {
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

        // Draw glowing vertex halo nodes on constellation vertices
        ctx.fillStyle = "rgba(199, 146, 234, 0.22)";
        for (const [i, j] of constellationCacheRef.current) {
          const star1 = starsRef.current[i];
          const star2 = starsRef.current[j];
          if (star1) {
            ctx.beginPath();
            ctx.arc(star1.x, star1.y, star1.radius * 2.8, 0, Math.PI * 2);
            ctx.fill();
          }
          if (star2) {
            ctx.beginPath();
            ctx.arc(star2.x, star2.y, star2.radius * 2.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Draw visible, glowing blue-cyan constellation links
        ctx.strokeStyle = "rgba(94, 159, 255, 0.44)";
        ctx.lineWidth = 1.0;
        ctx.beginPath();

        for (const [i, j] of constellationCacheRef.current) {
          const star1 = starsRef.current[i];
          const star2 = starsRef.current[j];
          if (star1 && star2) {
            ctx.moveTo(star1.x, star1.y);
            ctx.lineTo(star2.x, star2.y);
          }
        }

        ctx.stroke();
      }

      // 3. Draw Interactive Astral Tether (Cursor to Star magnetic links)
      if (cursorTetherRef.current && mouseRef.current.active && !deviceInfo.prefersReducedMotion) {
        const mouseX = mouseRef.current.x;
        const mouseY = mouseRef.current.y;
        const tetherRadius = 135;
        let tethersDrawn = 0;

        for (let i = 0; i < starsRef.current.length && tethersDrawn < 4; i++) {
          const star = starsRef.current[i];
          const dx = star.x - mouseX;
          const dy = star.y - mouseY;
          const dist = Math.hypot(dx, dy);

          if (dist < tetherRadius) {
            tethersDrawn++;
            const alpha = (1 - dist / tetherRadius) * 0.72;
            const grad = ctx.createLinearGradient(mouseX, mouseY, star.x, star.y);
            grad.addColorStop(0, `rgba(199, 146, 234, ${alpha})`);
            grad.addColorStop(1, `rgba(94, 159, 255, ${alpha * 0.8})`);

            ctx.strokeStyle = grad;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(mouseX, mouseY);
            ctx.lineTo(star.x, star.y);
            ctx.stroke();

            // Luminous halo around tethered star
            ctx.fillStyle = `rgba(94, 159, 255, ${alpha * 0.35})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.radius * 3.4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        if (tethersDrawn > 0) {
          // Cursor focal star node
          ctx.fillStyle = "rgba(199, 146, 234, 0.85)";
          ctx.beginPath();
          ctx.arc(mouseX, mouseY, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    },
    [deviceInfo.prefersReducedMotion]
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
      const hidden = document.hidden;
      isVisible.current = !hidden;
      if (hidden) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
          animationRef.current = undefined;
        }
      } else if (!animationRef.current) {
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
