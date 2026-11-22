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
  getVoyager1TimeFromPhase
} from "./orbitMath";
import { createOrbitPathMaterial } from "../shaders/orbitPathShader";

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
  voyager: "#ffd166"
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
  const isMoon = Boolean(planet?.parentId && planet.parentId !== "sun");
  const isEscapeRay = Boolean(orbit.escapeTrajectory && !isMoon);
  const currentOpacityRef = useRef(isMoon ? 0 : 0.72);
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
        opacity ?? (isMoon ? 0 : 0.72),
        hasTimeRef,
        isEscapeRay
      ),
    // Opacity & selection are updated smoothly via shader uniforms in useFrame
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathColor, hasTimeRef, isEscapeRay]
  );

  const lineObject = useMemo(() => {
    const line = new Line(geometry, material);
    line.frustumCulled = false;
    return line;
  }, [geometry, material]);

  useEffect(() => {
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

      lineObject.visible = true;
    } else {
      // Heliocentric (solar) orbit line: always visible, softly yields when focusing a planet system
      const isFocusedSystem = Boolean(activeSystemId && activeSystemId === planet?.id);
      const baseTarget = opacity ?? (isSelected ? 0.95 : 0.72);
      const targetOpacity = isFocusedSystem
        ? (isSelected ? 0.85 : 0.45)
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
      material.uniforms.uHeadPhase.value = getOrbitPhase(
        orbit,
        timeRef.current,
        scaleMode,
        scaleParams
      );
    }
  });

  return <primitive object={lineObject} />;
}
