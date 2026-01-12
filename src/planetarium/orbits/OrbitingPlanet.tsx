import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, Object3D, Vector3 } from "three";
import type { PlanetData, PlanetId } from "../data/types";
import Planet from "../bodies/Planet";
import { getOrbitPosition } from "./orbitMath";
import Labels from "../ui/Labels";

interface OrbitingPlanetProps {
  data: PlanetData;
  timeRef: React.MutableRefObject<number>;
  atmosphere?: boolean;
  showLabels?: boolean;
  onSelect?: (id: PlanetId | null) => void;
  onObjectRef?: (id: PlanetId, object: Object3D | null) => void;
}

export default function OrbitingPlanet({
  data,
  timeRef,
  atmosphere = false,
  showLabels = false,
  onSelect,
  onObjectRef
}: OrbitingPlanetProps) {
  const groupRef = useRef<Group>(null);
  const hoveredRef = useRef(false);
  const initialPosition = useMemo(
    () => (data.orbit ? getOrbitPosition(data.orbit, 0) : new Vector3()),
    [data.orbit]
  );

  useFrame(() => {
    if (!groupRef.current || !data.orbit) return;
    const position = getOrbitPosition(data.orbit, timeRef.current);
    groupRef.current.position.copy(position);
  });

  useEffect(() => {
    onObjectRef?.(data.id, groupRef.current);
    return () => {
      onObjectRef?.(data.id, null);
    };
  }, [data.id, onObjectRef]);

  return (
    <>
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
      {showLabels && (
        <Labels
          data={data}
          timeRef={timeRef}
          showLabels={showLabels}
          hoveredRef={hoveredRef}
        />
      )}
    </>
  );
}
