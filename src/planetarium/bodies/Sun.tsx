import { useMemo, type Ref } from "react";
import { Mesh, MeshStandardMaterial, SphereGeometry } from "three";
import { usePlanetTexture } from "../hooks/usePlanetTexture";
import { PLANET_TEXTURES } from "../data/textures";

const SUN_RADIUS = 2.6;

interface SunProps {
  meshRef?: Ref<Mesh>;
  onClick?: () => void;
}

export default function Sun({ meshRef, onClick }: SunProps) {
  const texture = usePlanetTexture(PLANET_TEXTURES.sun, "#f6c453");

  const geometry = useMemo(
    () => new SphereGeometry(SUN_RADIUS, 64, 64),
    []
  );

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        map: texture,
        emissiveMap: texture,
        emissiveIntensity: 1.2,
        emissive: "#f5c96b",
        roughness: 0.9,
        metalness: 0
      }),
    [texture]
  );

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={[0, 0, 0]}
      onClick={(event) => {
        event.stopPropagation();
        onClick?.();
      }}
    />
  );
}
