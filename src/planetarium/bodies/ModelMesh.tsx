import { useEffect, useMemo, useRef, useState, type Ref, type RefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  Box3,
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  SRGBColorSpace,
  Texture,
  Vector3
} from "three";
import type { BodyData } from "../data/types";
import { scalePlanetRadius } from "../utils/scale";

interface ModelMeshProps {
  data: BodyData;
  position: Vector3;
  timeScale?: number;
  isSelected?: boolean;
  groupRef?: Ref<Group>;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}

const LOAD_DISTANCE_SQ = 26 * 26;
const VISIBLE_DISTANCE_SQ = 24 * 24;

let sharedBeaconGeometry: OctahedronGeometry | null = null;
function getBeaconGeometry(): OctahedronGeometry {
  if (!sharedBeaconGeometry) {
    sharedBeaconGeometry = new OctahedronGeometry(1, 0);
  }
  return sharedBeaconGeometry;
}

function disposeObjectTree(root: Group) {
  root.traverse((child) => {
    if ((child as Mesh).isMesh) {
      const mesh = child as Mesh;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      materials.forEach((mat) => {
        if (!mat) return;
        for (const value of Object.values(mat)) {
          if (value instanceof Texture) {
            value.dispose();
          }
        }
        mat.dispose();
      });
    }
  });
}

export default function ModelMesh({
  data,
  position,
  timeScale = 40,
  isSelected = false,
  groupRef,
  onPointerOver,
  onPointerOut,
  onClick
}: ModelMeshProps) {
  const { camera } = useThree();
  const localGroupRef = useRef<Group | null>(null);
  const modelGroupRef = useRef<Group>(null);
  const beaconRef = useRef<Mesh>(null);
  const worldPosRef = useRef(new Vector3());
  const isNearRef = useRef(false);

  const [shouldLoad, setShouldLoad] = useState(isSelected);
  const [isNear, setIsNear] = useState(isSelected);
  const [loadedScene, setLoadedScene] = useState<Group | null>(null);

  const radius = useMemo(
    () => scalePlanetRadius(data.render.radiusKm, data.kind === "moon"),
    [data.render.radiusKm, data.kind]
  );
  const tilt = MathUtils.degToRad(data.rotation.axialTiltDeg);
  const modelUrl = data.render.modelUrl;

  useEffect(() => {
    if (isSelected) {
      setShouldLoad(true);
      if (!isNearRef.current) {
        isNearRef.current = true;
        setIsNear(true);
      }
    }
  }, [isSelected]);

  // Lazy-load the heavy GLB and decoders strictly on demand (selection or close proximity)
  useEffect(() => {
    if (!shouldLoad || !modelUrl || loadedScene) return;

    let isMounted = true;
    let dracoLoader: { dispose: () => void } | null = null;

    void (async () => {
      try {
        const [
          { GLTFLoader },
          { DRACOLoader },
          { MeshoptDecoder }
        ] = await Promise.all([
          import("three/examples/jsm/loaders/GLTFLoader.js"),
          import("three/examples/jsm/loaders/DRACOLoader.js"),
          import("three/examples/jsm/libs/meshopt_decoder.module.js")
        ]);

        if (!isMounted) return;

        const loader = new GLTFLoader();

        try {
          const draco = new DRACOLoader();
          draco.setDecoderPath(
            "https://www.gstatic.com/draco/versioned/decoders/1.5.6/"
          );
          loader.setDRACOLoader(draco);
          dracoLoader = draco;
        } catch (err) {
          console.warn("[ModelMesh] DRACOLoader initialization warning:", err);
        }

        try {
          loader.setMeshoptDecoder(MeshoptDecoder);
        } catch (err) {
          console.warn("[ModelMesh] MeshoptDecoder initialization warning:", err);
        }

        loader.load(
          modelUrl,
          (gltf) => {
            // Immediately free Draco WASM worker once decoded
            dracoLoader?.dispose();
            dracoLoader = null;

            if (!isMounted) {
              disposeObjectTree(gltf.scene);
              return;
            }

            const rawScene = gltf.scene;
            const box = new Box3().setFromObject(rawScene);
            const center = new Vector3();
            box.getCenter(center);
            const size = new Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);

            const wrapper = new Group();
            rawScene.position.set(-center.x, -center.y, -center.z);
            wrapper.add(rawScene);

            if (maxDim > 0) {
              const targetScale = (radius * 2.6) / maxDim;
              wrapper.scale.setScalar(targetScale);
            }

            rawScene.traverse((child) => {
              if ((child as Mesh).isMesh) {
                const mesh = child as Mesh;
                mesh.castShadow = false;
                mesh.receiveShadow = false;

                if (mesh.material) {
                  const materials = Array.isArray(mesh.material)
                    ? mesh.material
                    : [mesh.material];

                  materials.forEach((mat) => {
                    if ("map" in mat && mat.map instanceof Texture) {
                      mat.map.colorSpace = SRGBColorSpace;
                    }
                    if (mat instanceof MeshStandardMaterial) {
                      mat.emissive = new Color(0x161922);
                      mat.emissiveIntensity = 0.22;
                    }
                  });
                }
              }
            });

            setLoadedScene(wrapper);
          },
          undefined,
          (err) => {
            dracoLoader?.dispose();
            dracoLoader = null;
            console.error(
              `[ModelMesh] Error loading GLB model from ${modelUrl}:`,
              err
            );
          }
        );
      } catch (err) {
        console.error("[ModelMesh] Failed to initialize GLTF loader:", err);
      }
    })();

    return () => {
      isMounted = false;
      dracoLoader?.dispose();
    };
  }, [shouldLoad, modelUrl, radius, loadedScene]);

  useEffect(() => {
    return () => {
      if (loadedScene) {
        disposeObjectTree(loadedScene);
      }
    };
  }, [loadedScene]);

  const beaconMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color(data.render.colorFallback ?? "#ffd166")
      }),
    [data.render.colorFallback]
  );

  useEffect(() => {
    return () => {
      beaconMaterial.dispose();
    };
  }, [beaconMaterial]);

  useFrame((_, delta) => {
    const root = localGroupRef.current;
    if (!root) return;

    root.getWorldPosition(worldPosRef.current);
    const distSq = camera.position.distanceToSquared(worldPosRef.current);

    if (!shouldLoad && distSq < LOAD_DISTANCE_SQ) {
      setShouldLoad(true);
    }

    const nextNear = isSelected || distSq < VISIBLE_DISTANCE_SQ;
    if (nextNear !== isNearRef.current) {
      isNearRef.current = nextNear;
      setIsNear(nextNear);
    }

    if (modelGroupRef.current) {
      modelGroupRef.current.visible = nextNear && Boolean(loadedScene);
      if (modelGroupRef.current.visible && data.rotation.rotationPeriodHours > 0) {
        const rotationRate =
          (2 * Math.PI) / (data.rotation.rotationPeriodHours * 3600);
        modelGroupRef.current.rotation.y += delta * rotationRate * timeScale;
      }
    }

    if (beaconRef.current) {
      beaconRef.current.visible = !nextNear || !loadedScene;
    }
  });

  const setCombinedRef = (node: Group | null) => {
    localGroupRef.current = node;
    if (typeof groupRef === "function") {
      groupRef(node);
    } else if (groupRef && "current" in groupRef) {
      (groupRef as RefObject<Group | null>).current = node;
    }
  };

  const showDetailed = isSelected || isNear;

  return (
    <group ref={setCombinedRef} position={position} rotation={[0, 0, tilt]}>
      {/* Strictly local, short-range fill lights mounted ONLY while inspecting Voyager
          so they add 0 global lights to the rest of the solar system. */}
      {showDetailed && (
        <>
          <pointLight
            position={[radius * 4, radius * 3, radius * 4]}
            intensity={8.0}
            distance={radius * 18}
            decay={2}
            color="#ffffff"
          />
          <pointLight
            position={[-radius * 4, -radius * 2, -radius * 4]}
            intensity={3.5}
            distance={radius * 16}
            decay={2}
            color="#cbd5e1"
          />
        </>
      )}

      {/* Lightweight 8-triangle golden beacon when Voyager is far away or loading */}
      <mesh
        ref={beaconRef}
        geometry={getBeaconGeometry()}
        material={beaconMaterial}
        scale={radius * 0.28}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
        }}
      />

      {/* Full 20K-triangle GLB mounted & visible ONLY when selected or nearby */}
      <group
        ref={modelGroupRef}
        visible={false}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onClick={(event) => {
          event.stopPropagation();
          onClick?.(event);
        }}
      >
        {loadedScene && <primitive object={loadedScene} />}
      </group>
    </group>
  );
}
