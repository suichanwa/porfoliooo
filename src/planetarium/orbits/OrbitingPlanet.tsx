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
  scaleMode,
  scaleParams
}: OrbitingPlanetProps) {
  const groupRef = useRef<Group>(null);
  const hoveredRef = useRef(false);
  const initialPosition = useMemo(
    () =>
      data.orbit
        ? getOrbitPosition(data.orbit, timeRef.current, scaleMode, scaleParams)
        : new Vector3(),
    [data.orbit, scaleMode, scaleParams, timeRef]
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
          scaleMode={scaleMode}
          scaleParams={scaleParams}
        />
      )}
    </>
  );
}
