import { useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Vector3 } from "three";
import type { PlanetData } from "../data/types";
import type { DistanceScaleMode, DistanceScaleParams } from "../utils/distanceScale";
import { getOrbitPosition } from "../orbits/orbitMath";

interface LabelsProps {
  data: PlanetData;
  timeRef: React.MutableRefObject<number>;
  showLabels: boolean;
  hoveredRef?: React.MutableRefObject<boolean>;
  scaleMode: DistanceScaleMode;
  scaleParams: DistanceScaleParams;
}

const LABEL_DISTANCE = 22;

export default function Labels({
  data,
  timeRef,
  showLabels,
  hoveredRef,
  scaleMode,
  scaleParams
}: LabelsProps) {
  const groupRef = useRef<Group>(null);
  const { camera } = useThree();
  const initialPosition = useMemo(
    () =>
      data.orbit
        ? getOrbitPosition(data.orbit, 0, scaleMode, scaleParams)
        : new Vector3(),
    [data.orbit, scaleMode, scaleParams]
  );

  useFrame(() => {
    if (!groupRef.current || !data.orbit) return;
    const position = getOrbitPosition(
      data.orbit,
      timeRef.current,
      scaleMode,
      scaleParams
    );
    groupRef.current.position.copy(position);

    const distance = camera.position.distanceTo(position);
    const isHovered = hoveredRef?.current ?? false;
    groupRef.current.visible =
      showLabels && (isHovered || distance < LABEL_DISTANCE);
  });

  if (!data.orbit) return null;

  return (
    <group ref={groupRef} position={initialPosition}>
      <Html center distanceFactor={10} style={{ pointerEvents: "none" }}>
        <div className="rounded-full border border-white/10 bg-black/40 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70">
          {data.name}
        </div>
      </Html>
    </group>
  );
}
