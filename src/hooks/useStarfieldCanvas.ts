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
 * Checks if a point falls within core Hero content or Avatar safe zones
 * so constellation lines never cut across text, quote, stats, or avatar.
 */
function isInUISafeZone(x: number, y: number, width: number, height: number, isMobile: boolean): boolean {
  const nx = x / width;
  const ny = y / height;

  if (isMobile || width < 768) {
    // Mobile Hero content zone
    return nx >= 0.06 && nx <= 0.94 && ny >= 0.18 && ny <= 0.52;
  }

  // Desktop Hero Text & Stat Cards Safe Zone:
  const inHero = nx >= 0.02 && nx <= 0.52 && ny >= 0.30 && ny <= 0.68;
  // Desktop Avatar Safe Zone:
  const inAvatar = nx >= 0.72 && nx <= 0.92 && ny >= 0.40 && ny <= 0.64;

  return inHero || inAvatar;
}

/**
 * 2D cross product for counter-clockwise orientation test.
 */
function ccw(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number }
): number {
  return (p3.y - p1.y) * (p2.x - p1.x) - (p2.y - p1.y) * (p3.x - p1.x);
}

/**
 * Returns true if segment p1-p2 properly intersects segment p3-p4.
 * Returns false if they share an endpoint.
 */
function segmentsIntersect(
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  p4: { x: number; y: number }
): boolean {
  if (
    (p1.x === p3.x && p1.y === p3.y) ||
    (p1.x === p4.x && p1.y === p4.y) ||
    (p2.x === p3.x && p2.y === p3.y) ||
    (p2.x === p4.x && p2.y === p4.y)
  ) {
    return false;
  }

  const cp1 = ccw(p1, p2, p3);
  const cp2 = ccw(p1, p2, p4);
  const cp3 = ccw(p3, p4, p1);
  const cp4 = ccw(p3, p4, p2);

  return (
    ((cp1 > 0 && cp2 < 0) || (cp1 < 0 && cp2 > 0)) &&
    ((cp3 > 0 && cp4 < 0) || (cp3 < 0 && cp4 > 0))
  );
}

/**
 * Computes cosine of angle formed at vertex u between vector (w - u) and vector (v - u).
 * cos(theta) = 1 means 0 deg (foldback), 0 means 90 deg, -1 means 180 deg (straight).
 */
function getCosAngle(
  u: { x: number; y: number },
  w: { x: number; y: number },
  v: { x: number; y: number }
): number {
  const ax = w.x - u.x;
  const ay = w.y - u.y;
  const bx = v.x - u.x;
  const by = v.y - u.y;
  const dot = ax * bx + ay * by;
  const magA = Math.hypot(ax, ay);
  const magB = Math.hypot(bx, by);
  if (magA === 0 || magB === 0) return 1;
  return dot / (magA * magB);
}

/**
 * 8-Star Organic Heart Constellation Template (Normalized Vertex Offsets)
 */
const HEART_TEMPLATE: Array<[number, number]> = [
  [0.00, -0.28], // 0: Top center cleft
  [-0.48, -0.68], // 1: Upper-left lobe peak
  [-0.86, -0.15], // 2: Outer-left wing
  [-0.52, 0.42], // 3: Lower-left flank
  [0.00, 0.95], // 4: Bottom point (apex)
  [0.52, 0.42], // 5: Lower-right flank
  [0.86, -0.15], // 6: Outer-right wing
  [0.48, -0.68] // 7: Upper-right lobe peak
];

/**
 * Upgraded 5-Step Geometric Constellation Algorithm:
 * 1. UI Safe-Zone Mask & Open Celestial Corridor Anchors
 * 2. Brightness-Filtered & Poisson-Spaced Cluster Selection
 * 3. Degree-Constrained, Angular-Penalized Spanning Tree
 * 4. Planar Loop Closure with Zero Intersecting Edges
 * 5. Star-Chart Endpoint Insets & Vertex Luminous Boost
 * Easter Egg: Occasional 8-Star Organic Heart Constellation (~45% spawn chance)
 */
function buildConstellations(stars: Star[], width: number, height: number, isMobile: boolean) {
  if (stars.length < 15) {
    return { edges: [], constellationStarIndices: new Set<number>() };
  }

  // Desktop Anchor targets sitting in open celestial corridors
  let anchorRatios: Array<[number, number]> = isMobile
    ? [
        [0.24, 0.10],
        [0.76, 0.11],
        [0.25, 0.82],
        [0.75, 0.82]
      ]
    : [
        [0.18, 0.16], // Top-Left Sky
        [0.58, 0.18], // Top-Center/Right Sky
        [0.84, 0.22], // Top-Far-Right Sky
        [0.18, 0.82], // Bottom-Left Sky
        [0.62, 0.80] // Bottom-Center/Right Sky
      ];

  const chosenAnchorIndices: number[] = [];
  const usedStars = new Set<number>();
  const edges: Array<[number, number]> = [];
  const constellationStarIndices = new Set<number>();

  // Easter Egg: Occasional ~45% chance to spawn an organic 8-star Heart Constellation
  const spawnHeart = Math.random() < 0.45;
  if (spawnHeart) {
    const eligibleSlotIndices = isMobile ? [1, 3] : [1, 4]; // Open sky anchor slots
    const chosenSlotIdx =
      eligibleSlotIndices[Math.floor(Math.random() * eligibleSlotIndices.length)];
    const [hrx, hry] = anchorRatios[chosenSlotIdx];
    const cx = hrx * width;
    const cy = hry * height;
    const R = isMobile ? 50 : 72;

    const hasMargin =
      cx - R > 30 &&
      cx + R < width - 30 &&
      cy - R > 30 &&
      cy + R < height - 30 &&
      !isInUISafeZone(cx, cy, width, height, isMobile);

    if (hasMargin) {
      // Find 8 unused stars closest to (cx, cy)
      const nearbyCandidates = stars
        .map((s, idx) => ({ idx, dist: Math.hypot(s.x - cx, s.y - cy) }))
        .filter((item) => !usedStars.has(item.idx))
        .sort((a, b) => a.dist - b.dist);

      if (nearbyCandidates.length >= 8) {
        // Natural celestial tilt angle: +/- 8 deg to 16 deg
        const sign = Math.random() < 0.5 ? -1 : 1;
        const angle = sign * ((8 + Math.random() * 8) * Math.PI) / 180;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        const heartStarIndices: number[] = [];

        for (let k = 0; k < 8; k++) {
          const starIdx = nearbyCandidates[k].idx;
          heartStarIndices.push(starIdx);
          usedStars.add(starIdx);
          constellationStarIndices.add(starIdx);

          const star = stars[starIdx];
          const [nx, ny] = HEART_TEMPLATE[k];
          const rx = (nx * cosA - ny * sinA) * R;
          const ry = (nx * sinA + ny * cosA) * R;
          const jitterX = (Math.random() - 0.5) * 5;
          const jitterY = (Math.random() - 0.5) * 5;

          star.x = cx + rx + jitterX;
          star.y = cy + ry + jitterY;
          // Apex & top cleft slightly more prominent
          star.radius = Math.max(star.radius, k === 4 || k === 0 ? 1.9 : 1.6);
          star.baseOpacity = Math.max(star.baseOpacity, 0.82);
        }

        // Connect the 8 perimeter edges of the heart loop
        for (let k = 0; k < 8; k++) {
          const nextK = (k + 1) % 8;
          edges.push([heartStarIndices[k], heartStarIndices[nextK]]);
        }

        // Clear interior: nudge any stray background stars away from the heart interior
        for (let i = 0; i < stars.length; i++) {
          if (heartStarIndices.includes(i) || usedStars.has(i)) continue;
          const s = stars[i];
          const dx = s.x - cx;
          const dy = s.y - cy;
          const dist = Math.hypot(dx, dy);
          if (dist < R * 0.88) {
            const angleOut = Math.atan2(dy, dx);
            const pushDist = R * 1.18;
            s.x = cx + Math.cos(angleOut) * pushDist;
            s.y = cy + Math.sin(angleOut) * pushDist;
          }
        }

        // Remove the heart's anchor slot so regular constellations use the remaining slots
        anchorRatios = anchorRatios.filter((_, idx) => idx !== chosenSlotIdx);
      }
    }
  }

  // Step 1: Pick well-spaced anchor stars in open sky regions outside UI safe zones
  for (const [rx, ry] of anchorRatios) {
    const targetX = rx * width;
    const targetY = ry * height;
    let bestIdx = -1;
    let bestDist = Infinity;

    for (let i = 0; i < stars.length; i++) {
      if (usedStars.has(i)) continue;
      const s = stars[i];
      if (isInUISafeZone(s.x, s.y, width, height, isMobile)) continue;

      // Prefer prominent stars
      const typeBonus = s.type === "giant" ? 0.55 : s.type === "bright" ? 0.75 : 1.0;
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

  // Step 2 & 3 & 4: Build each constellation cluster
  for (const anchorIdx of chosenAnchorIndices) {
    const anchor = stars[anchorIdx];

    // Find candidate stars within 300px of anchor, filtered by UI safe zone and used status
    const candidates: Array<{ index: number; dist: number; score: number }> = [];

    for (let i = 0; i < stars.length; i++) {
      if (i === anchorIdx || usedStars.has(i)) continue;
      const s = stars[i];
      if (isInUISafeZone(s.x, s.y, width, height, isMobile)) continue;

      const dist = Math.hypot(s.x - anchor.x, s.y - anchor.y);
      if (dist <= 300) {
        // Brightness-weighted sort metric
        const sizeBonus = s.radius >= 2.0 ? 0.6 : s.radius >= 1.5 ? 0.75 : s.radius >= 1.0 ? 1.0 : 1.35;
        candidates.push({ index: i, dist, score: dist * sizeBonus });
      }
    }

    // Sort candidates by combined brightness and proximity
    candidates.sort((a, b) => a.score - b.score);

    // Poisson-like spacing: MIN_STAR_DIST = 55px, MAX_STAR_DIST = 195px
    const MIN_STAR_DIST = 55;
    const MAX_STAR_DIST = 195;
    const targetClusterSize = isMobile ? 4 : 5 + (Math.random() < 0.5 ? 1 : 0); // 4-6 stars
    const clusterIndices = [anchorIdx];

    // Greedy Poisson addition
    for (const cand of candidates) {
      if (clusterIndices.length >= targetClusterSize) break;
      const candStar = stars[cand.index];

      // Must be at least 55px away from ALL cluster stars
      let tooClose = false;
      let hasNeighborInRange = false;

      for (const idx of clusterIndices) {
        const d = Math.hypot(candStar.x - stars[idx].x, candStar.y - stars[idx].y);
        if (d < MIN_STAR_DIST) {
          tooClose = true;
          break;
        }
        if (d <= MAX_STAR_DIST) {
          hasNeighborInRange = true;
        }
      }

      if (!tooClose && hasNeighborInRange) {
        clusterIndices.push(cand.index);
      }
    }

    // Fallback: if cluster is smaller than 4 stars, retry with relaxed 45px distance
    if (clusterIndices.length < 4) {
      for (const cand of candidates) {
        if (clusterIndices.length >= targetClusterSize) break;
        if (clusterIndices.includes(cand.index)) continue;
        const candStar = stars[cand.index];

        let tooClose = false;
        let hasNeighborInRange = false;
        for (const idx of clusterIndices) {
          const d = Math.hypot(candStar.x - stars[idx].x, candStar.y - stars[idx].y);
          if (d < 45) {
            tooClose = true;
            break;
          }
          if (d <= 220) {
            hasNeighborInRange = true;
          }
        }

        if (!tooClose && hasNeighborInRange) {
          clusterIndices.push(cand.index);
        }
      }
    }

    if (clusterIndices.length < 3) continue;

    // Step 3: Degree-Constrained, Angular-Penalized Spanning Tree
    // Degree Cap: At most ONE node can reach degree === 3. All others degree <= 2.
    const inTree = new Set<number>([anchorIdx]);
    const clusterEdges: Array<[number, number]> = [];
    const degrees = new Map<number, number>();
    const adjacency = new Map<number, number[]>();

    for (const idx of clusterIndices) {
      degrees.set(idx, 0);
      adjacency.set(idx, []);
    }

    while (inTree.size < clusterIndices.length) {
      let bestScore = Infinity;
      let bestU = -1;
      let bestV = -1;

      // Count nodes currently at degree 3 in this cluster
      let degree3Count = 0;
      for (const idx of clusterIndices) {
        if ((degrees.get(idx) || 0) >= 3) degree3Count++;
      }

      for (const u of inTree) {
        const degU = degrees.get(u) || 0;
        if (degU >= 3) continue;
        if (degU === 2 && degree3Count >= 1) continue;

        const starU = stars[u];
        const adjU = adjacency.get(u) || [];

        for (const v of clusterIndices) {
          if (inTree.has(v)) continue;
          const starV = stars[v];
          const dist = Math.hypot(starU.x - starV.x, starU.y - starV.y);
          if (dist > 240) continue;

          // Angular Flow Penalty (No hairpin turns)
          let scoreMultiplier = 1.0;
          let sharpestCos = -1;

          for (const w of adjU) {
            const cosAngle = getCosAngle(starU, stars[w], starV);
            if (cosAngle > sharpestCos) sharpestCos = cosAngle;
          }

          if (sharpestCos > 0.75) {
            // Sharper than 41 deg: reject sharp hairpin
            continue;
          }
          if (sharpestCos > 0.5) {
            // Angle < 60 deg: heavy penalty
            scoreMultiplier = 2.8;
          } else if (sharpestCos <= 0) {
            // Angle >= 90 deg: flowing rewarding multiplier
            scoreMultiplier = 0.85;
          }

          const edgeScore = dist * scoreMultiplier;
          if (edgeScore < bestScore) {
            bestScore = edgeScore;
            bestU = u;
            bestV = v;
          }
        }
      }

      if (bestU !== -1 && bestV !== -1) {
        clusterEdges.push([bestU, bestV]);
        inTree.add(bestV);
        degrees.set(bestU, (degrees.get(bestU) || 0) + 1);
        degrees.set(bestV, (degrees.get(bestV) || 0) + 1);
        adjacency.get(bestU)!.push(bestV);
        adjacency.get(bestV)!.push(bestU);
      } else {
        // Fallback: connect closest pair to avoid isolated components
        let fallbackDist = Infinity;
        let fbU = -1;
        let fbV = -1;

        for (const u of inTree) {
          if ((degrees.get(u) || 0) >= 3) continue;
          for (const v of clusterIndices) {
            if (inTree.has(v)) continue;
            const d = Math.hypot(stars[u].x - stars[v].x, stars[u].y - stars[v].y);
            if (d < fallbackDist) {
              fallbackDist = d;
              fbU = u;
              fbV = v;
            }
          }
        }

        if (fbU !== -1 && fbV !== -1) {
          clusterEdges.push([fbU, fbV]);
          inTree.add(fbV);
          degrees.set(fbU, (degrees.get(fbU) || 0) + 1);
          degrees.set(fbV, (degrees.get(fbV) || 0) + 1);
          adjacency.get(fbU)!.push(fbV);
          adjacency.get(fbV)!.push(fbU);
        } else {
          break;
        }
      }
    }

    // Step 4: Planar Loop Closure (Zero Crossing Lines & No Flat Sliver Triangles)
    // Only close on ~60% of clusters with >= 5 stars (e.g. Dipper or Cygnus kite)
    if (clusterIndices.length >= 5 && Math.random() < 0.6) {
      let degree3Count = 0;
      for (const idx of clusterIndices) {
        if ((degrees.get(idx) || 0) >= 3) degree3Count++;
      }

      let bestLoopEdge: [number, number] | null = null;
      let minLoopDist = Infinity;

      for (let i = 0; i < clusterIndices.length; i++) {
        const u = clusterIndices[i];
        const degU = degrees.get(u) || 0;
        if (degU > 2) continue;

        for (let j = i + 1; j < clusterIndices.length; j++) {
          const v = clusterIndices[j];
          const degV = degrees.get(v) || 0;
          if (degV > 2) continue;

          // Check if adding (u, v) would exceed degree 3 cap
          const wouldAddDeg3 = (degU === 2 ? 1 : 0) + (degV === 2 ? 1 : 0);
          if (degree3Count + wouldAddDeg3 > 1) continue;

          const alreadyConnected = clusterEdges.some(
            ([a, b]) => (a === u && b === v) || (a === v && b === u)
          );
          if (alreadyConnected) continue;

          const d = Math.hypot(stars[u].x - stars[v].x, stars[u].y - stars[v].y);
          if (d < 60 || d > 155) continue;

          // Rule A: Zero segment intersections with any existing edge
          let hasIntersection = false;
          for (const [e1, e2] of clusterEdges) {
            if (segmentsIntersect(stars[u], stars[v], stars[e1], stars[e2])) {
              hasIntersection = true;
              break;
            }
          }
          if (hasIntersection) continue;

          // Rule B: No flat sliver triangles (angle > 42 deg => cos <= 0.74)
          let hasSharpAngle = false;
          for (const w of adjacency.get(u) || []) {
            if (getCosAngle(stars[u], stars[w], stars[v]) > 0.74) {
              hasSharpAngle = true;
              break;
            }
          }
          if (!hasSharpAngle) {
            for (const z of adjacency.get(v) || []) {
              if (getCosAngle(stars[v], stars[z], stars[u]) > 0.74) {
                hasSharpAngle = true;
                break;
              }
            }
          }
          if (hasSharpAngle) continue;

          if (d < minLoopDist) {
            minLoopDist = d;
            bestLoopEdge = [u, v];
          }
        }
      }

      if (bestLoopEdge) {
        clusterEdges.push(bestLoopEdge);
      }
    }

    // Step 5: Elevate vertex stars & store final edges
    for (const [u, v] of clusterEdges) {
      edges.push([u, v]);
    }
    for (const idx of clusterIndices) {
      usedStars.add(idx);
      constellationStarIndices.add(idx);
      // Ensure vertex star is crisp and never a tiny sub-pixel dot
      stars[idx].radius = Math.max(stars[idx].radius, 1.6);
      stars[idx].baseOpacity = Math.max(stars[idx].baseOpacity, 0.75);
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

      // Pre-compute geometric constellations with UI safe-zones and planar graph rules
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

    // 1. Draw Constellation architectural lines with star-chart endpoint insets
    if (showConstellationsActive && constellationEdgesRef.current.length > 0) {
      ctx.strokeStyle = "rgba(126, 182, 255, 0.28)";
      ctx.lineWidth = 0.85;
      ctx.beginPath();

      for (const [i, j] of constellationEdgesRef.current) {
        const s1 = starsRef.current[i];
        const s2 = starsRef.current[j];
        if (s1 && s2) {
          const dx = s2.x - s1.x;
          const dy = s2.y - s1.y;
          const len = Math.hypot(dx, dy);

          // Inset line endpoints leaving clean dark breathing gap around star vertices
          if (len > 14) {
            const ux = dx / len;
            const uy = dy / len;
            const pad1 = Math.max(4, s1.radius * 2.2);
            const pad2 = Math.max(4, s2.radius * 2.2);
            ctx.moveTo(s1.x + ux * pad1, s1.y + uy * pad1);
            ctx.lineTo(s2.x - ux * pad2, s2.y - uy * pad2);
          }
        }
      }

      ctx.stroke();
    }

    // 2. Draw Stars with elevated opacity floor on constellation vertices
    starsRef.current.forEach((star, index) => {
      const twinkle =
        Math.sin(timestamp * star.twinkleSpeed * lensSpeedMultiplier + star.twinklePhase) * 0.3 + 0.7;

      let opacity = star.baseOpacity * twinkle * combinedMultiplier;

      // Elevated opacity floor for active constellation vertices
      if (showConstellationsActive && constellationIndices.has(index)) {
        opacity = Math.min(1, Math.max(opacity + 0.25, 0.75));
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
