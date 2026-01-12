import { useMemo } from "react";
import { BufferGeometry, LineBasicMaterial, Vector3 } from "three";
import type { OrbitElements } from "../data/types";
import type { DistanceScaleMode, DistanceScaleParams } from "../utils/distanceScale";
import { getOrbitPosition } from "./orbitMath";

interface OrbitPathProps {
  orbit: OrbitElements;
  segments?: number;
  color?: string;
  opacity?: number;
  scaleMode: DistanceScaleMode;
  scaleParams: DistanceScaleParams;
}

export default function OrbitPath({
  orbit,
  segments = 180,
  color = "#6d7fa3",
  opacity = 0.35,
  scaleMode,
  scaleParams
}: OrbitPathProps) {
  const geometry = useMemo(() => {
    const points: Vector3[] = [];
    for (let i = 0; i <= segments; i += 1) {
      const time = (i / segments) * orbit.orbitalPeriodDays;
      points.push(getOrbitPosition(orbit, time, scaleMode, scaleParams));
    }
    const geom = new BufferGeometry().setFromPoints(points);
    return geom;
  }, [orbit, segments, scaleMode, scaleParams]);

  const material = useMemo(
    () =>
      new LineBasicMaterial({
        color,
        transparent: true,
        opacity
      }),
    [color, opacity]
  );

  return (
    <line geometry={geometry} frustumCulled={false}>
      <primitive object={material} attach="material" />
    </line>
  );
}
