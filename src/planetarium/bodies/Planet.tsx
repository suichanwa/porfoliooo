import { useMemo, useRef, type Ref } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3
} from "three";
import type { PlanetData } from "../data/types";
import { usePlanetTexture } from "../hooks/usePlanetTexture";
import { scalePlanetRadius } from "../utils/scale";

interface PlanetProps {
  data: PlanetData;
  position: Vector3;
  atmosphere?: boolean;
  timeScale?: number;
  groupRef?: Ref<Group>;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}

export default function Planet({
  data,
  position,
  atmosphere = false,
  timeScale = 40,
  groupRef,
  onPointerOver,
  onPointerOut,
  onClick
}: PlanetProps) {
  const meshRef = useRef<Mesh>(null);
  const texture = usePlanetTexture(data.textureUrl, data.colorFallback);
  const radius = useMemo(() => scalePlanetRadius(data.radiusKm), [data.radiusKm]);
  const tilt = MathUtils.degToRad(data.axialTiltDeg);

  const geometry = useMemo(() => new SphereGeometry(radius, 48, 32), [radius]);

  const glowColor = useMemo(() => {
    const base = new Color(data.colorFallback);
    return base.lerp(new Color("#ffffff"), 0.35);
  }, [data.colorFallback]);

  const glowOpacity = data.type === "dwarf" ? 0.06 : 0.1;
  const glowScale = data.type === "dwarf" ? 1.08 : 1.06;

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        map: texture,
        roughness: 0.85,
        metalness: 0
      }),
    [texture]
  );

  const glowMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: glowOpacity,
        blending: AdditiveBlending,
        depthWrite: false
      }),
    [glowColor, glowOpacity]
  );

  const atmosphereMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: "#6aa2ff",
        transparent: true,
        opacity: 0.08,
        depthWrite: false
      }),
    []
  );

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const rotationRate =
      (2 * Math.PI) / (data.rotationPeriodHours * 3600);
    meshRef.current.rotation.y += delta * rotationRate * timeScale;
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, 0, tilt]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={material}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
        }}
      />
      {atmosphere && (
        <mesh
          geometry={geometry}
          material={atmosphereMaterial}
          scale={1.035}
          raycast={() => null}
        />
      )}
      <mesh
        geometry={geometry}
        material={glowMaterial}
        scale={glowScale}
        raycast={() => null}
      />
    </group>
  );
}
