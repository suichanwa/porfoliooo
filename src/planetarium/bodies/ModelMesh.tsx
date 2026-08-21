import { useEffect, useMemo, useRef, useState, type Ref } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import {
  Box3,
  Color,
  DoubleSide,
  Group,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  Vector3
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
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

    // Configure Draco Decoder
    try {
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath(
        "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
      );
      loader.setDRACOLoader(dracoLoader);
    } catch (err) {
      console.warn("[ModelMesh] DRACOLoader initialization warning:", err);
    }

    // Configure Meshopt Decoder
    try {
      loader.setMeshoptDecoder(MeshoptDecoder);
    } catch (err) {
      console.warn("[ModelMesh] MeshoptDecoder initialization warning:", err);
    }

    loader.load(
      modelUrl,
      (gltf) => {
        if (!isMounted) return;

        const rawScene = gltf.scene.clone(true);

        // Compute bounding box accurately across all meshes
        const box = new Box3().setFromObject(rawScene);
        const center = new Vector3();
        box.getCenter(center);
        const size = new Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);

        // Build a centered container group so position is at exact 0,0,0
        const wrapper = new Group();
        rawScene.position.set(-center.x, -center.y, -center.z);
        wrapper.add(rawScene);

        if (maxDim > 0) {
          const targetScale = (radius * 2.6) / maxDim;
          wrapper.scale.setScalar(targetScale);
        }

        // Configure authentic materials and textures (no artificial color tinting)
        rawScene.traverse((child) => {
          if ((child as Mesh).isMesh) {
            const mesh = child as Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            if (mesh.material) {
              const materials = Array.isArray(mesh.material)
                ? mesh.material
                : [mesh.material];

              materials.forEach((mat) => {
                mat.side = DoubleSide;
                if ("map" in mat && mat.map instanceof Texture) {
                  mat.map.colorSpace = SRGBColorSpace;
                }
                if (mat instanceof MeshStandardMaterial) {
                  // Keep true material colors without artificial yellow emissive tint
                  mat.emissive = new Color(0x050508);
                  mat.emissiveIntensity = 0.05;
                }
              });
            }
          }
        });

        setLoadedScene(wrapper);
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
    if (data.rotation.rotationPeriodHours > 0) {
      const rotationRate =
        (2 * Math.PI) / (data.rotation.rotationPeriodHours * 3600);
      modelGroupRef.current.rotation.y += delta * rotationRate * timeScale;
    }
  });

  const fallbackGeometry = useMemo(() => new SphereGeometry(radius, 24, 24), [radius]);
  const fallbackMaterial = useMemo(
    () =>
      new MeshStandardMaterial({
        color: new Color("#e2e8f0"),
        roughness: 0.4,
        metalness: 0.6
      }),
    []
  );

  return (
    <group ref={groupRef} position={position} rotation={[0, 0, tilt]}>
      {/* Neutral white lighting rig ensuring authentic PBR material colors in deep space */}
      <directionalLight position={[radius * 4, radius * 3, radius * 4]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-radius * 4, -radius * 2, -radius * 4]} intensity={0.9} color="#cbd5e1" />
      <ambientLight intensity={0.65} color="#ffffff" />

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
