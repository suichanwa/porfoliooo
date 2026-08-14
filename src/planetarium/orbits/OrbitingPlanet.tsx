import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Object3D, Vector3 } from "three";
import type { BodyData, BodyId } from "../data/types";
import type { DistanceScaleMode, DistanceScaleParams } from "../utils/distanceScale";
import Planet from "../bodies/Planet";
import Pluton from "../planets_render/pluton";
import { getOrbitPosition } from "./orbitMath";
import Labels from "../ui/Labels";

interface OrbitingPlanetProps {
  data: BodyData;
  timeRef: React.MutableRefObject<number>;
  atmosphere?: boolean;
  showLabels?: boolean;
  onSelect?: (id: BodyId | null) => void;
  onObjectRef?: (id: BodyId, object: Object3D | null) => void;
  planetRefs?: React.MutableRefObject<Record<BodyId, Object3D | null>>;
  scaleMode: DistanceScaleMode;
  scaleParams: DistanceScaleParams;
}

export default function OrbitingPlanet({
  data,
  timeRef,
  atmosphere = false,
  showLabels = false,
  onSelect,
  onObjectRef,
  planetRefs,
  scaleMode,
  scaleParams
}: OrbitingPlanetProps) {
  const groupRef = useRef<Group>(null);
  const hoveredRef = useRef(false);
  const orbitPositionRef = useRef(new Vector3());
  const parentWorldPosRef = useRef(new Vector3());
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
        groupRef.current.position
          .copy(parentWorldPosRef.current)
          .add(orbitPositionRef.current);
      } else {
        groupRef.current.position.copy(orbitPositionRef.current);
      }
    } else {
      groupRef.current.position.copy(orbitPositionRef.current);
    }
  });

  useEffect(() => {
    onObjectRef?.(data.id, groupRef.current);
    return () => {
      onObjectRef?.(data.id, null);
    };
  }, [data.id, onObjectRef]);

  const usePlutoFallback = data.id === "pluto" && !data.render.textureUrl;

  return (
    <>
      {usePlutoFallback ? (
        <Pluton
          data={data}
          position={initialPosition}
          groupRef={groupRef}
          onPointerOver={() => {
            hoveredRef.current = true;
          }}
          onPointerOut={() => {
            hoveredRef.current = false;
          }}
          onClick={() => {
            onSelect?.(data.id);
          }}
        />
      ) : (
        <Planet
          data={data}
          position={initialPosition}
          atmosphere={atmosphere}
          groupRef={groupRef}
          onPointerOver={() => {
            hoveredRef.current = true;
          }}
          onPointerOut={() => {
            hoveredRef.current = false;
          }}
          onClick={() => {
            onSelect?.(data.id);
          }}
        />
      )}
      {showLabels && (
        <Labels
          data={data}
          timeRef={timeRef}
          showLabels={showLabels}
          hoveredRef={hoveredRef}
          planetRefs={planetRefs}
          scaleMode={scaleMode}
          scaleParams={scaleParams}
        />
      )}
    </>
  );
}
