import { useCallback, useEffect, useRef } from "react";
import {
  STAR_TYPES,
  STAR_TYPE_ORDER,
  type CelestialLens,
  type StarType
} from "../components/Starry/types/starry.ts";
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

// Pre-calculate total weight for weighted random selection
const TOTAL_STAR_TYPE_WEIGHT = STAR_TYPE_ORDER.reduce(
  (sum, type) => sum + STAR_TYPES[type].weight,
  0
);

const pickStarType = (): StarType => {
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
  celestialLens?: CelestialLens;
  deviceInfo: DeviceInfo;
  isClient: boolean;
}

/**
 * Builds 4-6 distinct geometric constellation figures using Prim's MST.
 * Guarantees connected multi-segment figures (Ursa Major, Cassiopeia style)
 * rather than isolated 2-star sticks.
 */
function buildConstellations(stars: Star[], width: number, height: number, isMobile: boolean) {
  if (stars.length < 15) {
    return { edges: [], constellationStarIndices: new Set<number>() };
  }

  // Anchor regions across quadrants of viewport
  const anchorRatios = isMobile
    ? [
        [0.28, 0.22],
        [0.72, 0.48],
        [0.35, 0.78]
      ]
    : [
        [0.18, 0.24],
        [0.78, 0.22],
        [0.48, 0.48],
        [0.22, 0.74],
        [0.82, 0.72]
      ];

  const chosenAnchorIndices: number[] = [];
  const usedStars = new Set<number>();
  const edges: Array<[number, number]> = [];
  const constellationStarIndices = new Set<number>();

  // 1. Pick well-spaced anchor stars
  for (const [rx, ry] of anchorRatios) {
    const targetX = rx * width;
    const targetY = ry * height;
    let bestIdx = -1;
    let bestDist = Infinity;

    for (let i = 0; i < stars.length; i++) {
      if (usedStars.has(i)) continue;
      const s = stars[i];
      // Prefer bright/giant stars
      const typeBonus = s.type === "giant" ? 0.6 : s.type === "bright" ? 0.8 : 1.0;
      const dist = Math.hypot(s.x - targetX, s.y - targetY) * typeBonus;

      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    if (bestIdx !== -1) {
      chosenAnchorIndices.push(bestIdx);
      usedStars.add(bestIdx);
    }
  }

  // 2. Build connected cluster for each anchor
  for (const anchorIdx of chosenAnchorIndices) {
    const anchor = stars[anchorIdx];
    const clusterStarCandidates: Array<{ index: number; dist: number }> = [];

    for (let i = 0; i < stars.length; i++) {
      if (i === anchorIdx || usedStars.has(i)) continue;
      const dist = Math.hypot(stars[i].x - anchor.x, stars[i].y - anchor.y);
      if (dist <= 280) {
        clusterStarCandidates.push({ index: i, dist });
      }
    }

    // Sort by distance to anchor and take 4-6 stars
    clusterStarCandidates.sort((a, b) => a.dist - b.dist);
    let clusterIndices = [anchorIdx];

    const targetClusterSize = isMobile ? 4 : 5 + Math.floor(Math.random() * 2); // 5-6 stars
    const selectedNeighbors = clusterStarCandidates.slice(0, targetClusterSize);

    for (const neighbor of selectedNeighbors) {
      clusterIndices.push(neighbor.index);
      usedStars.add(neighbor.index);
    }

    if (clusterIndices.length < 3) continue;

    // 3. Minimum Spanning Tree (Prim's Algorithm)
    const inTree = new Set<number>([anchorIdx]);
    const clusterEdges: Array<[number, number]> = [];

    while (inTree.size < clusterIndices.length) {
      let minEdgeDist = Infinity;
      let bestU = -1;
      let bestV = -1;

      for (const u of inTree) {
        const starU = stars[u];
        for (const v of clusterIndices) {
          if (inTree.has(v)) continue;
          const starV = stars[v];
          const d = Math.hypot(starU.x - starV.x, starU.y - starV.y);
          if (d < minEdgeDist) {
            minEdgeDist = d;
            bestU = u;
            bestV = v;
          }
        }
      }

      if (bestU !== -1 && bestV !== -1) {
        clusterEdges.push([bestU, bestV]);
        inTree.add(bestV);
      } else {
        break;
      }
    }

    // 4. Optionally close 1 triangle loop in 5+ star clusters
    if (clusterIndices.length >= 5) {
      let loopAdded = false;
      for (let i = 0; i < clusterIndices.length && !loopAdded; i++) {
        const u = clusterIndices[i];
        for (let j = i + 1; j < clusterIndices.length && !loopAdded; j++) {
          const v = clusterIndices[j];
          const alreadyConnected = clusterEdges.some(
            ([a, b]) => (a === u && b === v) || (a === v && b === u)
          );
          if (!alreadyConnected) {
            const d = Math.hypot(stars[u].x - stars[v].x, stars[u].y - stars[v].y);
            if (d < 140) {
              clusterEdges.push([u, v]);
              loopAdded = true;
            }
          }
        }
      }
    }

    for (const [u, v] of clusterEdges) {
      edges.push([u, v]);
    }
    for (const idx of clusterIndices) {
      constellationStarIndices.add(idx);
    }
  }

  return { edges, constellationStarIndices };
}

export default function useStarfieldCanvas({
  showConstellations,
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
  const celestialLensRef = useRef<CelestialLens>(celestialLens);

  // Precomputed geometric constellations
  const constellationEdgesRef = useRef<Array<[number, number]>>([]);
  const constellationStarIndicesRef = useRef<Set<number>>(new Set());

  // Starlight Boost on Quote Hover
  const starlightMultiplierRef = useRef<number>(1.0);
  const targetStarlightMultiplierRef = useRef<number>(1.0);

  // Keep refs synchronized with props
  useEffect(() => {
    showConstellationsRef.current = showConstellations;
  }, [showConstellations]);

  useEffect(() => {
    celestialLensRef.current = celestialLens;
  }, [celestialLens]);

  // Listen for starlight boost events from the Hero quote
  useEffect(() => {
    if (!isClient) return;

    const handleStarlightBoost = (e: Event) => {
      const customEvent = e as CustomEvent<{ active?: boolean }>;
      targetStarlightMultiplierRef.current = customEvent.detail?.active ? 1.45 : 1.0;
    };

    window.addEventListener("observatory:starlight-boost", handleStarlightBoost);
    return () => {
      window.removeEventListener("observatory:starlight-boost", handleStarlightBoost);
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

      // Pre-compute geometric constellations for these stars
      const { edges, constellationStarIndices } = buildConstellations(
        stars,
        width,
        height,
        deviceInfo.isMobile
      );
      constellationEdgesRef.current = edges;
      constellationStarIndicesRef.current = constellationStarIndices;
    },
    [deviceInfo.isLowEnd, deviceInfo.isMobile]
  );

  const render = useCallback((timestamp: number) => {
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

    // Smoothly interpolate starlight boost multiplier (Quote hover)
    starlightMultiplierRef.current +=
      (targetStarlightMultiplierRef.current - starlightMultiplierRef.current) * 0.12;

    const isRadiant = celestialLensRef.current === "radiant";
    const lensSpeedMultiplier = isRadiant ? 1.35 : 1.0;
    const lensOpacityMultiplier = isRadiant ? 1.25 : 1.0;
    const combinedMultiplier = lensOpacityMultiplier * starlightMultiplierRef.current;

    const showConstellationsActive = showConstellationsRef.current;
    const constellationIndices = constellationStarIndicesRef.current;

    // 1. Draw Constellation architectural lines first (behind star nodes)
    if (showConstellationsActive && constellationEdgesRef.current.length > 0) {
      ctx.strokeStyle = "rgba(94, 159, 255, 0.25)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();

      for (const [i, j] of constellationEdgesRef.current) {
        const star1 = starsRef.current[i];
        const star2 = starsRef.current[j];
        if (star1 && star2) {
          ctx.moveTo(star1.x, star1.y);
          ctx.lineTo(star2.x, star2.y);
        }
      }

      ctx.stroke();
    }

    // 2. Draw Stars
    starsRef.current.forEach((star, index) => {
      const twinkle =
        Math.sin(timestamp * star.twinkleSpeed * lensSpeedMultiplier + star.twinklePhase) * 0.3 + 0.7;

      let opacity = star.baseOpacity * twinkle * combinedMultiplier;

      // Subtly boost vertex star alpha if part of active constellation
      if (showConstellationsActive && constellationIndices.has(index)) {
        opacity += 0.25;
      }

      star.opacity = Math.min(1, Math.max(0, opacity));

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

    animationRef.current = requestAnimationFrame(render);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const setupCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, deviceInfo.isLowEnd ? 1 : 1.5);
      dprRef.current = dpr;

      const targetFPS = deviceInfo.isLowEnd
        ? STARFIELD_CONFIG.TARGET_FPS.lowEnd
        : STARFIELD_CONFIG.TARGET_FPS.default;
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
