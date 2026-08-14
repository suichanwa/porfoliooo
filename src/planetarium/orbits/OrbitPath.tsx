import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferGeometry, Line, LineBasicMaterial, Vector3 } from "three";
import type { BodyData, BodyId, OrbitElements } from "../data/types";
import type { DistanceScaleMode, DistanceScaleParams } from "../utils/distanceScale";
import { getOrbitPosition } from "./orbitMath";

interface OrbitPathProps {
  planet?: BodyData;
  orbit: OrbitElements;
  segments?: number;
  color?: string;
  opacity?: number;
  scaleMode: DistanceScaleMode;
  scaleParams: DistanceScaleParams;
  planetRefs?: React.MutableRefObject<Record<BodyId, Object3D | null>>;
}

export default function OrbitPath({
  planet,
  orbit,
  segments = 180,
  color = "#6d7fa3",
  opacity = 0.35,
  scaleMode,
  scaleParams,
  planetRefs
}: OrbitPathProps) {
  const lineRef = useRef<Line>(null);
  const parentWorldPosRef = useRef(new Vector3());
  const isMoon = Boolean(planet?.parentId && planet.parentId !== "sun");

  const geometry = useMemo(() => {
    const points: Vector3[] = [];
    for (let i = 0; i <= segments; i += 1) {
      const time = (i / segments) * orbit.orbitalPeriodDays;
      points.push(getOrbitPosition(orbit, time, scaleMode, scaleParams, new Vector3(), isMoon));
    }
    const geom = new BufferGeometry().setFromPoints(points);
    return geom;
  }, [orbit, segments, scaleMode, scaleParams, isMoon]);

  const material = useMemo(
    () =>
      new LineBasicMaterial({
        color,
        transparent: true,
        opacity
      }),
    [color, opacity]
  );

  useFrame(() => {
    if (!lineRef.current) return;
    if (isMoon && planet?.parentId && planetRefs?.current?.[planet.parentId]) {
      const parentObj = planetRefs.current[planet.parentId];
      if (parentObj) {
        parentObj.getWorldPosition(parentWorldPosRef.current);
        lineRef.current.position.copy(parentWorldPosRef.current);
      }
    }
  });

  return (
    <line ref={lineRef} geometry={geometry} frustumCulled={false}>
      <primitive object={material} attach="material" />
    </line>
  );
}
