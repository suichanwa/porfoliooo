import { useMemo, useRef } from "react";
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Vector3, Object3D } from "three";
import type { BodyData, BodyId } from "../data/types";
import type { DistanceScaleMode, DistanceScaleParams } from "../utils/distanceScale";
import { getOrbitPosition } from "../orbits/orbitMath";

interface LabelsProps {
  data: BodyData;
  timeRef: React.MutableRefObject<number>;
  showLabels: boolean;
  isSelected?: boolean;
  isInfoVisible?: boolean;
  hoveredRef?: React.MutableRefObject<boolean>;
  planetRefs?: React.MutableRefObject<Record<BodyId, Object3D | null>>;
  scaleMode: DistanceScaleMode;
  scaleParams: DistanceScaleParams;
}

const LABEL_DISTANCE = 22;

export default function Labels({
  data,
  timeRef,
  showLabels,
  isSelected = false,
  isInfoVisible = false,
  hoveredRef,
  planetRefs,
  scaleMode,
  scaleParams
}: LabelsProps) {
  const groupRef = useRef<Group>(null);
  const orbitPositionRef = useRef(new Vector3());
  const parentWorldPosRef = useRef(new Vector3());
  const { camera } = useThree();
  const isMoon = Boolean(data.parentId && data.parentId !== "sun");

  const initialPosition = useMemo(
    () =>
      data.orbit
        ? getOrbitPosition(
            data.orbit,
            timeRef.current,
            scaleMode,
            scaleParams,
            new Vector3(),
            isMoon
          )
        : new Vector3(),
    [data.orbit, isMoon, scaleMode, scaleParams, timeRef]
  );

  useFrame(() => {
    if (!groupRef.current || !data.orbit) return;
    getOrbitPosition(
      data.orbit,
      timeRef.current,
      scaleMode,
      scaleParams,
      orbitPositionRef.current,
      isMoon
    );

    if (isMoon && data.parentId && planetRefs?.current?.[data.parentId]) {
      const parentObj = planetRefs.current[data.parentId];
      if (parentObj) {
        parentObj.getWorldPosition(parentWorldPosRef.current);
        orbitPositionRef.current.add(parentWorldPosRef.current);
      }
    }

    groupRef.current.position.copy(orbitPositionRef.current);

    const distance = camera.position.distanceTo(orbitPositionRef.current);
    const isHovered = hoveredRef?.current ?? false;
    const hideDueToSelection = Boolean(isSelected && isInfoVisible);

    groupRef.current.visible =
      showLabels && !hideDueToSelection && (isHovered || distance < LABEL_DISTANCE);
  });

  if (!data.orbit) return null;

  return (
    <group ref={groupRef} position={initialPosition}>
      <Html center style={{ pointerEvents: "none" }}>
        <div className="whitespace-nowrap select-none rounded-full border border-white/20 bg-slate-950/75 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.15em] text-slate-200 shadow-md backdrop-blur-md">
          {data.name}
        </div>
      </Html>
    </group>
  );
}
