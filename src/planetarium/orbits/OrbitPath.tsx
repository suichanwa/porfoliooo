import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Line,
  MathUtils,
  Object3D,
  Vector3
} from "three";
import type { BodyData, BodyId, OrbitElements } from "../data/types";
import {
  computeRenderOrbitRadius,
  type DistanceScaleMode,
  type DistanceScaleParams
} from "../utils/distanceScale";
import {
  getEffectiveOrbitalPeriodDays,
  getEscapeDirection,
  getOrbitPhase,
  getOrbitPosition,
  getVoyager1TimeFromPhase,
  solveKepler
} from "./orbitMath";
import { createOrbitPathMaterial } from "../shaders/orbitPathShader";

import { utcDaysToTtDays } from "../utils/timeScale";

// Eccentric anomaly half-span for long-period open comet trajectories (e.g. Hale-Bopp):
// stays strictly < PI/2 so the inbound/outbound legs widen out to ~158 AU and fade into deep
// space without ever curving back inward onto themselves.
const OPEN_COMET_ARC_MAX_E = 1.42;

const getOpenCometArcHeadPhase = (orbit: OrbitElements, timeDays: number): number => {
  const ttDays = utcDaysToTtDays(timeDays);
  const e = MathUtils.clamp(orbit.eccentricity, 0, 0.999);
  const periLonDeg = orbit.longitudeOfPerihelionDeg ?? 0;
  const meanLonDeg =
    orbit.meanLongitudeAtEpochDeg !== undefined
      ? orbit.meanLongitudeAtEpochDeg + (ttDays / orbit.orbitalPeriodDays) * 360
      : 0;
  const mRad = MathUtils.degToRad(meanLonDeg - periLonDeg);
  const E = solveKepler(mRad, e);
  return MathUtils.clamp(
    (E + OPEN_COMET_ARC_MAX_E) / (2 * OPEN_COMET_ARC_MAX_E),
    0,
    1
  );
};

export const PLANET_ORBIT_COLORS: Record<string, string> = {
  mercury: "#b0b7c6", // sleek mercury silver-slate
  venus: "#f0c878",   // golden amber
  earth: "#4ea8de",   // vibrant atmospheric cyan-blue
  moon: "#e0e1dd",    // bright moon silver
  mars: "#e76f51",    // rich rust red/orange
  jupiter: "#f4a261", // warm orange-amber
  saturn: "#e9c46a",  // rich ring gold
  uranus: "#48cae4",  // bright electric cyan
  neptune: "#4361ee", // intense vivid royal blue
  ceres: "#90e0ef",   // ice cyan
  pluto: "#c77dff",   // subtle purple / mauve
  charon: "#a78bfa",  // soft lavender/violet
  enceladus: "#e0f2fe", // icy sky tint
  voyager1: "#ffd166", // golden interstellar probe
  voyager: "#ffd166",
  halley: "#38bdf8",   // vibrant ice-cyan comet arc
  halebopp: "#a5f3fc"  // frosty pale-cyan great comet arc
};

interface OrbitPathProps {
  planet?: BodyData;
  orbit: OrbitElements;
  timeRef?: RefObject<number>;
  segments?: number;
  color?: string;
  opacity?: number;
  scaleMode: DistanceScaleMode;
  scaleParams: DistanceScaleParams;
  planetRefs?: RefObject<Record<BodyId, Object3D | null>>;
  isSelected?: boolean;
  activeSystemId?: BodyId | null;
  moonSystemVisRef?: RefObject<Record<string, number>>;
}

export default function OrbitPath({
  planet,
  orbit,
  timeRef,
  segments = 180,
  color,
  opacity,
  scaleMode,
  scaleParams,
  planetRefs,
  isSelected = false,
  activeSystemId,
  moonSystemVisRef
}: OrbitPathProps) {
  // Pluto-Charon binary rings are rendered by PlutoBarycenterVisuals;
  // Voyager 1's long interstellar path is hidden to keep the solar system view uncluttered.
  if (planet?.id === "charon" || planet?.id === "voyager1") {
    return null;
  }

  const parentWorldPosRef = useRef(new Vector3());
  const scratchPointRef = useRef(new Vector3());
  const lastPrecessionSampleDaysRef = useRef<number | null>(null);
  const isMoon = Boolean(planet?.parentId && planet.parentId !== "sun");
  const isComet = planet?.kind === "comet";
  const isOpenCometArc = Boolean(isComet && orbit.eccentricity > 0.985);
  const isEscapeRay = Boolean(orbit.escapeTrajectory && !isMoon);
  const hasFastPrecession =
    isMoon && Math.abs(orbit.secularRates?.ascNodeDotDegPerCentury ?? 0) > 10;
  const currentOpacityRef = useRef(
    isMoon ? 0 : isOpenCometArc ? 0.16 : isComet ? 0.2 : 0.72
  );
  const currentSelectedRef = useRef(isSelected ? 1 : 0);

  // Determine distinctive color for each celestial body
  const pathColor = useMemo(() => {
    if (color) return color;
    if (planet?.id && PLANET_ORBIT_COLORS[planet.id]) {
      return PLANET_ORBIT_COLORS[planet.id];
    }
    if (planet?.render.colorFallback) {
      return planet.render.colorFallback;
    }
    return "#6d7fa3";
  }, [color, planet?.id, planet?.render?.colorFallback]);

  const geometry = useMemo(() => {
    const points: Vector3[] = [];
    const phases = new Float32Array(segments + 1);

    if (orbit.escapeTrajectory && !isMoon) {
      if (orbit.escapeTrajectory.historicalPreset === "voyager1") {
        // Real curved historical trajectory: Earth (1977) -> Jupiter (1979) -> Saturn (1980) -> Interstellar
        // Use higher vertex resolution so the multi-flyby gravity-assist arcs are silky smooth.
        const missionSegments = Math.max(segments, 360);
        const missionPhases = new Float32Array(missionSegments + 1);
        for (let i = 0; i <= missionSegments; i += 1) {
          const phase = i / missionSegments;
          missionPhases[i] = phase;
          const sampleTimeDays = getVoyager1TimeFromPhase(phase);
          points.push(
            getOrbitPosition(
              orbit,
              sampleTimeDays,
              scaleMode,
              scaleParams,
              new Vector3(),
              false,
              planet
            )
          );
        }
        const geo = new BufferGeometry().setFromPoints(points);
        geo.setAttribute("aPhase", new Float32BufferAttribute(missionPhases, 1));
        return geo;
      } else {
        // Open radial escape ray from launch region (1 AU) out into deep space
        const esc = orbit.escapeTrajectory;
        const minAu = esc.minDistanceAu ?? 1.0;
        const maxAu = esc.maxPlotDistanceAu ?? 420.0;
        const rMin = computeRenderOrbitRadius(minAu, scaleMode, scaleParams);
        const rMax = computeRenderOrbitRadius(maxAu, scaleMode, scaleParams);
        const dir = getEscapeDirection(esc, new Vector3());

        for (let i = 0; i <= segments; i += 1) {
          const phase = i / segments;
          phases[i] = phase;
          const r = MathUtils.lerp(rMin, rMax, phase);
          points.push(dir.clone().multiplyScalar(r));
        }
      }
    } else if (isOpenCometArc) {
      // Long-period comet (e.g. Hale-Bopp, P = 2,537 yrs): plot an open deep-space hyperbolic-like
      // inbound -> perihelion -> outbound arc spanning [-E_max, +E_max] that emerges faintly from
      // deep space and fades back out without looping onto itself.
      const arcSegments = Math.max(segments, 260);
      const arcPhases = new Float32Array(arcSegments + 1);
      for (let i = 0; i <= arcSegments; i += 1) {
        const u = i / arcSegments;
        arcPhases[i] = u;
        const E = MathUtils.lerp(-OPEN_COMET_ARC_MAX_E, OPEN_COMET_ARC_MAX_E, u);
        points.push(
          getOrbitPosition(
            orbit,
            0,
            scaleMode,
            scaleParams,
            new Vector3(),
            false,
            planet,
            E
          )
        );
      }
      const geo = new BufferGeometry().setFromPoints(points);
      geo.setAttribute("aPhase", new Float32BufferAttribute(arcPhases, 1));
      return geo;
    } else if (!isMoon && orbit.eccentricity > 0.3) {
      // High-eccentricity comet orbit: sample uniformly in Eccentric Anomaly E so vertices
      // cluster naturally around the tight perihelion turn while aPhase matches exact Keplerian
      // mean-anomaly time phase (so the glowing tail head locks dead-on to the comet!).
      const cometSegments = Math.max(segments, 320);
      const cometPhases = new Float32Array(cometSegments + 1);
      const e = MathUtils.clamp(orbit.eccentricity, 0, 0.999);
      const m0Rad =
        orbit.meanLongitudeAtEpochDeg !== undefined
          ? MathUtils.degToRad(
              orbit.meanLongitudeAtEpochDeg - (orbit.longitudeOfPerihelionDeg ?? 0)
            )
          : (orbit.phaseAtEpoch ?? 0);
      const m0Wrapped =
        (((m0Rad + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
      const e0 = solveKepler(m0Wrapped, e);
      const m0Exact = e0 - e * Math.sin(e0);

      for (let i = 0; i <= cometSegments; i += 1) {
        const E = e0 + (i / cometSegments) * Math.PI * 2;
        const M = E - e * Math.sin(E);
        cometPhases[i] = MathUtils.clamp((M - m0Exact) / (Math.PI * 2), 0, 1);
        points.push(
          getOrbitPosition(
            orbit,
            0,
            scaleMode,
            scaleParams,
            new Vector3(),
            false,
            planet,
            E
          )
        );
      }

      const geo = new BufferGeometry().setFromPoints(points);
      geo.setAttribute("aPhase", new Float32BufferAttribute(cometPhases, 1));
      return geo;
    } else {
      const period = getEffectiveOrbitalPeriodDays(orbit);

      for (let i = 0; i <= segments; i += 1) {
        const phase = i / segments;
        phases[i] = phase;
        points.push(
          getOrbitPosition(
            orbit,
            phase * period,
            scaleMode,
            scaleParams,
            new Vector3(),
            isMoon,
            planet
          )
        );
      }
    }

    const geo = new BufferGeometry().setFromPoints(points);
    geo.setAttribute("aPhase", new Float32BufferAttribute(phases, 1));
    return geo;
  }, [orbit, segments, scaleMode, scaleParams, isMoon, planet]);

  const hasTimeRef = Boolean(timeRef);
  const material = useMemo(
    () =>
      createOrbitPathMaterial(
        pathColor,
        opacity ?? (isMoon ? 0 : isOpenCometArc ? 0.16 : isComet ? 0.2 : 0.72),
        hasTimeRef,
        isEscapeRay,
        isOpenCometArc
      ),
    // Opacity & selection are updated smoothly via shader uniforms in useFrame
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathColor, hasTimeRef, isEscapeRay, isOpenCometArc]
  );

  const lineObject = useMemo(() => {
    const line = new Line(geometry, material);
    line.frustumCulled = false;
    return line;
  }, [geometry, material]);

  useEffect(() => {
    lastPrecessionSampleDaysRef.current = null;
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame((_, delta) => {
    if (isMoon) {
      const parentId = planet?.parentId;
      const isCurrentSystem = Boolean(parentId && parentId === activeSystemId);
      const vis =
        isCurrentSystem && parentId
          ? (moonSystemVisRef?.current?.[parentId] ?? 0)
          : 0;
      const targetOpacity = isCurrentSystem
        ? (opacity ?? (isSelected ? 0.8 : 0.48)) * vis
        : 0;

      currentOpacityRef.current = MathUtils.damp(
        currentOpacityRef.current,
        targetOpacity,
        8.0,
        delta
      );

      if (currentOpacityRef.current < 0.008) {
        lineObject.visible = false;
        return;
      }

      if (parentId && planetRefs?.current?.[parentId]) {
        const parentObj = planetRefs.current[parentId];
        if (parentObj) {
          parentObj.getWorldPosition(parentWorldPosRef.current);
          lineObject.position.copy(parentWorldPosRef.current);
        }
      }

      // Keep fast-precessing lunar orbit lines (Earth's Moon: 18.6-yr nodal precession)
      // strictly aligned with the current simulation date in place (zero allocations).
      if (hasFastPrecession && timeRef) {
        const nowDays = timeRef.current;
        if (
          lastPrecessionSampleDaysRef.current === null ||
          Math.abs(nowDays - lastPrecessionSampleDaysRef.current) > 10
        ) {
          lastPrecessionSampleDaysRef.current = nowDays;
          const period = getEffectiveOrbitalPeriodDays(orbit);
          const baseCycle = Math.floor(nowDays / period) * period;
          const posAttr = geometry.attributes.position as Float32BufferAttribute;
          const arr = posAttr.array as Float32Array;
          const pt = scratchPointRef.current;
          for (let i = 0; i <= segments; i += 1) {
            const phase = i / segments;
            getOrbitPosition(
              orbit,
              baseCycle + phase * period,
              scaleMode,
              scaleParams,
              pt,
              true,
              planet
            );
            arr[i * 3] = pt.x;
            arr[i * 3 + 1] = pt.y;
            arr[i * 3 + 2] = pt.z;
          }
          posAttr.needsUpdate = true;
        }
      }

      lineObject.visible = true;
    } else {
      // Heliocentric (solar) orbit line: always visible, softly yields when focusing a planet system
      const isFocusedSystem = Boolean(activeSystemId && activeSystemId === planet?.id);
      const defaultUnselected = isOpenCometArc ? 0.16 : isComet ? 0.2 : 0.72;
      const defaultSelected = isOpenCometArc ? 0.44 : isComet ? 0.56 : 0.95;
      const baseTarget = opacity ?? (isSelected ? defaultSelected : defaultUnselected);
      const targetOpacity = isFocusedSystem
        ? (isSelected ? (isComet ? defaultSelected : 0.85) : 0.45)
        : baseTarget;

      currentOpacityRef.current = MathUtils.damp(
        currentOpacityRef.current,
        targetOpacity,
        6.0,
        delta
      );
      lineObject.visible = true;
    }

    currentSelectedRef.current = MathUtils.damp(
      currentSelectedRef.current,
      isSelected ? 1.0 : 0.0,
      7.0,
      delta
    );

    material.uniforms.uOpacity.value = currentOpacityRef.current;
    material.uniforms.uSelected.value = currentSelectedRef.current;
    if (timeRef) {
      material.uniforms.uHeadPhase.value = isOpenCometArc
        ? getOpenCometArcHeadPhase(orbit, timeRef.current)
        : getOrbitPhase(orbit, timeRef.current, scaleMode, scaleParams);
    }
  });

  return <primitive object={lineObject} />;
}
