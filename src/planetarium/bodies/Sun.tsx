import { useEffect, useMemo, useRef, type Ref } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Mesh, SphereGeometry } from "three";
import { usePlanetTexture } from "../hooks/usePlanetTexture";
import { PLANET_TEXTURES } from "../data/textures";
import {
  createSunChromosphereMaterial,
  createSunCoronaMaterial,
  createSunPhotosphereMaterial
} from "../shaders/sunShaders";

export const SUN_RADIUS = 2.6;
const CHROMOSPHERE_SCALE = 1.13;
const CORONA_QUAD_SIZE = SUN_RADIUS * 6.8;

interface SunProps {
  meshRef?: Ref<Mesh>;
  onClick?: () => void;
}

/**
 * Multi-layered Sun renderer: animated 3D photosphere granulation with solar limb darkening,
 * a 3D volumetric chromosphere/prominence shell, and an anisotropic K-corona streamer halo.
 */
export default function Sun({ meshRef, onClick }: SunProps) {
  const texture = usePlanetTexture(PLANET_TEXTURES.sun, "#f6c453");
  const groupRef = useRef<Group>(null);
  const coreMeshRef = useRef<Mesh>(null);
  const chromoMeshRef = useRef<Mesh>(null);
  const coronaMeshRef = useRef<Mesh>(null);
  const { camera } = useThree();

  const coreGeometry = useMemo(() => new SphereGeometry(SUN_RADIUS, 64, 48), []);
  const photosphereMaterial = useMemo(() => createSunPhotosphereMaterial(null), []);
  const chromosphereMaterial = useMemo(
    () => createSunChromosphereMaterial(CHROMOSPHERE_SCALE),
    []
  );
  const coronaMaterial = useMemo(() => createSunCoronaMaterial(), []);

  useEffect(() => {
    photosphereMaterial.uniforms.uMap.value = texture;
    photosphereMaterial.uniforms.uHasMap.value = texture ? 1.0 : 0.0;
  }, [photosphereMaterial, texture]);

  useEffect(() => {
    return () => {
      coreGeometry.dispose();
      photosphereMaterial.dispose();
      chromosphereMaterial.dispose();
      coronaMaterial.dispose();
    };
  }, [chromosphereMaterial, coreGeometry, coronaMaterial, photosphereMaterial]);

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;

    if (coreMeshRef.current) {
      coreMeshRef.current.rotation.y += delta * 0.015;
    }
    if (chromoMeshRef.current) {
      chromoMeshRef.current.rotation.y += delta * 0.022;
    }

    photosphereMaterial.uniforms.uTime.value = elapsed;
    chromosphereMaterial.uniforms.uTime.value = elapsed;

    if (coronaMeshRef.current) {
      coronaMeshRef.current.quaternion.copy(camera.quaternion);
      coronaMaterial.uniforms.uTime.value = elapsed;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* 1. Dynamic Convection & Limb-Darkened Photosphere */}
      <mesh
        ref={(node) => {
          coreMeshRef.current = node;
          if (typeof meshRef === "function") meshRef(node);
          else if (meshRef) (meshRef as { current: Mesh | null }).current = node;
        }}
        geometry={coreGeometry}
        material={photosphereMaterial}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.();
        }}
      />

      {/* 2. 3D Chromosphere & Eruptive Prominence Envelope */}
      <mesh
        ref={chromoMeshRef}
        geometry={coreGeometry}
        material={chromosphereMaterial}
        scale={CHROMOSPHERE_SCALE}
        raycast={() => null}
      />

      {/* 3. Camera-Facing Anisotropic K-Corona & Solar Wind Streamers */}
      <mesh ref={coronaMeshRef} raycast={() => null}>
        <planeGeometry args={[CORONA_QUAD_SIZE, CORONA_QUAD_SIZE]} />
        <primitive object={coronaMaterial} attach="material" />
      </mesh>
    </group>
  );
}
