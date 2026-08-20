import { useEffect, useMemo, useRef, useState, type Ref } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  Box3,
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import type { BodyData } from "../data/types";
import { scalePlanetRadius } from "../utils/scale";

interface ModelMeshProps {
  data: BodyData;
  position: Vector3;
  timeScale?: number;
  groupRef?: Ref<Group>;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}

export default function ModelMesh({
  data,
  position,
  timeScale = 40,
  groupRef,
  onPointerOver,
  onPointerOut,
  onClick
}: ModelMeshProps) {
  const modelGroupRef = useRef<Group>(null);
  const [loadedScene, setLoadedScene] = useState<Group | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const radius = useMemo(
    () => scalePlanetRadius(data.render.radiusKm, data.kind === "moon"),
    [data.render.radiusKm, data.kind]
  );
  const tilt = MathUtils.degToRad(data.rotation.axialTiltDeg);
  const modelUrl = data.render.modelUrl;

  useEffect(() => {
    if (!modelUrl) return;

    let isMounted = true;
    const loader = new GLTFLoader();

    try {
      loader.setMeshoptDecoder(MeshoptDecoder);
    } catch (err) {
      console.warn("[ModelMesh] Could not initialize MeshoptDecoder:", err);
    }

    loader.load(
      modelUrl,
      (gltf) => {
        if (!isMounted) return;

        const scene = gltf.scene.clone(true);

        // Compute bounding box and center geometry
        const box = new Box3().setFromObject(scene);
        const center = new Vector3();
        box.getCenter(center);
        const size = new Vector3();
        box.getSize(size);

        // Center the model at local (0, 0, 0)
        scene.position.sub(center);

        // Normalize scale to match the target render radius
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) {
          const targetScale = (radius * 2.2) / maxDim;
          scene.scale.setScalar(targetScale);
        }

        // Enable shadows and enhance materials if needed
        scene.traverse((child) => {
          if ((child as Mesh).isMesh) {
            const mesh = child as Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });

        setLoadedScene(scene);
      },
      undefined,
      (err) => {
        console.error(`[ModelMesh] Error loading GLB model from ${modelUrl}:`, err);
        if (isMounted) {
          setLoadError(String(err));
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [modelUrl, radius]);

  useFrame((_, delta) => {
    if (!modelGroupRef.current) return;
    const rotationRate =
      (2 * Math.PI) / (data.rotation.rotationPeriodHours * 3600);
    modelGroupRef.current.rotation.y += delta * rotationRate * timeScale;
  });

  const fallbackGeometry = useMemo(() => new SphereGeometry(radius, 24, 24), [radius]);
  const fallbackMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color(data.render.colorFallback || "#78a6ff"),
        roughness: 0.6,
        metalness: 0.4,
        wireframe: !loadedScene && !loadError
      }),
    [data.render.colorFallback, loadedScene, loadError]
  );

  return (
    <group ref={groupRef} position={position} rotation={[0, 0, tilt]}>
      <group
        ref={modelGroupRef}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
        }}
      >
        {loadedScene ? (
          <primitive object={loadedScene} />
        ) : (
          <mesh geometry={fallbackGeometry} material={fallbackMaterial} />
        )}
      </group>
    </group>
  );
}
