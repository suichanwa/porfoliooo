import { useCallback, useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Group, Object3D, Vector3 } from "three";
import type { BodyData, BodyId } from "../data/types";
import type { DistanceScaleMode, DistanceScaleParams } from "../utils/distanceScale";
import { getOrbitPosition, getPlutoCharonBinaryState } from "../orbits/orbitMath";

export interface UseOrbitingPlanetOptions {
  data: BodyData;
  timeRef: RefObject<number>;
  onSelect?: (id: BodyId | null) => void;
  onObjectRef?: (id: BodyId, object: Object3D | null) => void;
  planetRefs?: RefObject<Record<BodyId, Object3D | null>>;
  scaleMode: DistanceScaleMode;
  scaleParams: DistanceScaleParams;
  activeSystemId?: BodyId | null;
  moonSystemVisRef?: RefObject<Record<string, number>>;
}

export const useOrbitingPlanet = ({
  data,
  timeRef,
  onSelect,
  onObjectRef,
  planetRefs,
  scaleMode,
  scaleParams,
  activeSystemId,
  moonSystemVisRef
}: UseOrbitingPlanetOptions) => {
  const groupRef = useRef<Group>(null);
  const hoveredRef = useRef(false);
  const orbitPositionRef = useRef(new Vector3());
  const parentWorldPosRef = useRef(new Vector3());
  const isMoon = Boolean(data.parentId && data.parentId !== "sun");

  const initialPosition = useMemo(() => {
    if (data.id === "pluto") {
      return getPlutoCharonBinaryState(timeRef.current, scaleMode, scaleParams, 1.0).plutoPos;
    }
    if (data.id === "charon") {
      return getPlutoCharonBinaryState(timeRef.current, scaleMode, scaleParams, 1.0).charonPos;
    }
    return data.orbit
      ? getOrbitPosition(
          data.orbit,
          timeRef.current,
          scaleMode,
          scaleParams,
          new Vector3(),
          isMoon,
          data
        )
      : new Vector3();
  }, [data, data.id, data.orbit, isMoon, scaleMode, scaleParams, timeRef]);

  useFrame(() => {
    if (!groupRef.current || !data.orbit) return;

    if (data.id === "pluto") {
      const state = getPlutoCharonBinaryState(
        timeRef.current,
        scaleMode,
        scaleParams,
        1.0
      );
      groupRef.current.position.copy(state.plutoPos);
      groupRef.current.visible = true;
      groupRef.current.scale.setScalar(1);
      return;
    }

    if (data.id === "charon") {
      const state = getPlutoCharonBinaryState(
        timeRef.current,
        scaleMode,
        scaleParams,
        1.0
      );
      groupRef.current.position.copy(state.charonPos);
      groupRef.current.visible = true;
      groupRef.current.scale.setScalar(1);
      return;
    }

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
        groupRef.current.position
          .copy(parentWorldPosRef.current)
          .add(orbitPositionRef.current);
      } else {
        groupRef.current.position.copy(orbitPositionRef.current);
      }

      // Dynamic Focus LOD scaling & visibility for moons
      const vis = moonSystemVisRef?.current?.[data.parentId] ?? 0;
      if (vis < 0.01) {
        groupRef.current.visible = false;
      } else {
        groupRef.current.visible = true;
        groupRef.current.scale.setScalar(vis);
      }
    } else {
      groupRef.current.position.copy(orbitPositionRef.current);
      groupRef.current.visible = true;
      groupRef.current.scale.setScalar(1);
    }
  });

  useEffect(() => {
    onObjectRef?.(data.id, groupRef.current);
    return () => {
      onObjectRef?.(data.id, null);
    };
  }, [data.id, onObjectRef]);

  const shouldLoadTextures =
    !isMoon || data.id === "charon" || activeSystemId === data.parentId;

  const handlePointerOver = useCallback(() => {
    hoveredRef.current = true;
  }, []);

  const handlePointerOut = useCallback(() => {
    hoveredRef.current = false;
  }, []);

  const handleClick = useCallback(
    (event?: ThreeEvent<MouseEvent>) => {
      // Ignore camera orbit/pan drags so releasing the pointer over a focused body never resets the view
      if (event && event.delta > 6) return;
      onSelect?.(data.id);
    },
    [data.id, onSelect]
  );

  return {
    groupRef,
    hoveredRef,
    initialPosition,
    shouldLoadTextures,
    handlePointerOver,
    handlePointerOut,
    handleClick
  };
};
