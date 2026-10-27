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
  onSelect?: (id: BodyId | null) => void;
  hoveredRef?: React.MutableRefObject<boolean>;
  planetRefs?: React.MutableRefObject<Record<BodyId, Object3D | null>>;
  scaleMode: DistanceScaleMode;
  scaleParams: DistanceScaleParams;
  activeSystemId?: BodyId | null;
  isSystemIsolated?: boolean;
  moonSystemVisRef?: React.MutableRefObject<Record<string, number>>;
}

const LABEL_DISTANCE = 22;

export default function Labels({
  data,
  timeRef,
  showLabels,
  isSelected = false,
  isInfoVisible = false,
  onSelect,
  hoveredRef,
  planetRefs,
  scaleMode,
  scaleParams,
  activeSystemId,
  isSystemIsolated = false,
  moonSystemVisRef
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
            isMoon,
            data
          )
        : new Vector3(),
    [data, data.orbit, isMoon, scaleMode, scaleParams, timeRef]
  );

  useFrame(() => {
    if (!groupRef.current || !data.orbit) return;
    getOrbitPosition(
      data.orbit,
      timeRef.current,
      scaleMode,
      scaleParams,
      orbitPositionRef.current,
      isMoon,
      data
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

    if (isSystemIsolated) {
      if (isMoon) {
        const isCurrentSystem = data.parentId === activeSystemId;
        const vis = data.parentId ? (moonSystemVisRef?.current?.[data.parentId] ?? 0) : 0;
        groupRef.current.visible =
          showLabels && !hideDueToSelection && isCurrentSystem && vis > 0.6;
      } else {
        groupRef.current.visible =
          showLabels && !hideDueToSelection && data.id === activeSystemId;
      }
    } else {
      if (isMoon) {
        groupRef.current.visible = false;
      } else {
        groupRef.current.visible =
          showLabels && !hideDueToSelection && (isHovered || distance < LABEL_DISTANCE);
      }
    }
  });

  if (!data.orbit) return null;

  return (
    <group ref={groupRef} position={initialPosition}>
      <Html center>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(data.id);
          }}
          className={
            isMoon
              ? "whitespace-nowrap select-none text-[10px] font-medium tracking-wider text-slate-300/85 hover:text-white bg-[#070913]/75 backdrop-blur-sm border border-white/10 px-1.5 py-0.5 rounded-full transition-colors cursor-pointer active:scale-95 shadow-md"
              : "whitespace-nowrap select-none rounded-full border border-white/20 bg-slate-950/90 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.15em] text-slate-200 shadow-md hover:border-primary-accent/80 hover:bg-slate-900 hover:text-white transition-colors cursor-pointer active:scale-95"
          }
          title={`Focus ${data.name}`}
        >
          {data.name}
        </button>
      </Html>
    </group>
  );
}
