import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, Line, LineBasicMaterial, Object3D, Vector3 } from "three";
import type { BodyData, BodyId, OrbitElements } from "../data/types";
import type { DistanceScaleMode, DistanceScaleParams } from "../utils/distanceScale";
import { getOrbitPosition } from "./orbitMath";

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
  voyager: "#ffd166"  // golden probe
};

interface OrbitPathProps {
  planet?: BodyData;
  orbit: OrbitElements;
  segments?: number;
  color?: string;
  opacity?: number;
  scaleMode: DistanceScaleMode;
  scaleParams: DistanceScaleParams;
  planetRefs?: React.MutableRefObject<Record<BodyId, Object3D | null>>;
  isSelected?: boolean;
}

export default function OrbitPath({
  planet,
  orbit,
  segments = 180,
  color,
  opacity,
  scaleMode,
  scaleParams,
  planetRefs,
  isSelected = false
}: OrbitPathProps) {
  const parentWorldPosRef = useRef(new Vector3());
  const isMoon = Boolean(planet?.parentId && planet.parentId !== "sun");

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

  // Higher opacity when selected or distinctively visible
  const effectiveOpacity = useMemo(() => {
    if (opacity !== undefined) return opacity;
    if (isSelected) return 0.85;
    if (isMoon) return 0.35;
    return 0.5;
  }, [opacity, isSelected, isMoon]);

  const geometry = useMemo(() => {
    const points: Vector3[] = [];
    for (let i = 0; i <= segments; i += 1) {
      const time = (i / segments) * orbit.orbitalPeriodDays;
      points.push(getOrbitPosition(orbit, time, scaleMode, scaleParams, new Vector3(), isMoon));
    }
    return new BufferGeometry().setFromPoints(points);
  }, [orbit, segments, scaleMode, scaleParams, isMoon]);

  const material = useMemo(
    () =>
      new LineBasicMaterial({
        color: pathColor,
        transparent: true,
        opacity: effectiveOpacity,
        depthWrite: false
      }),
    [pathColor, effectiveOpacity]
  );

  const lineObject = useMemo(() => {
    const line = new Line(geometry, material);
    line.frustumCulled = false;
    return line;
  }, [geometry, material]);

  useFrame(() => {
    if (isMoon && planet?.parentId && planetRefs?.current?.[planet.parentId]) {
      const parentObj = planetRefs.current[planet.parentId];
      if (parentObj) {
        parentObj.getWorldPosition(parentWorldPosRef.current);
        lineObject.position.copy(parentWorldPosRef.current);
      }
    }
  });

  return <primitive object={lineObject} />;
}
