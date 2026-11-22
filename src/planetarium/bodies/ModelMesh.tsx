import { useEffect, useMemo, useRef, useState, type Ref, type RefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
  Box3,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  OctahedronGeometry,
  Points,
  ShaderMaterial,
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

const PROBE_BEACON_VERTEX_SHADER = /* glsl */ `
  uniform float uPixelRatio;
  uniform float uAlpha;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    if (uAlpha <= 0.004 || mvPosition.z >= -0.01) {
      gl_PointSize = 0.0;
      return;
    }
    float dist = max(1.0, -mvPosition.z);
    float projected = uPixelRatio * clamp(30.0 * (24.0 / dist), 22.0, 36.0);
    gl_PointSize = projected;
  }
`;

const PROBE_BEACON_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAlpha;
  uniform vec3 uColor;

  void main() {
    if (uAlpha <= 0.004) discard;
    vec2 p = (gl_PointCoord - 0.5) * 2.0;
    float r = length(p);
    if (r > 1.0) discard;

    // Bright pinpoint golden spacecraft core
    float core = exp(-r * r * 72.0);
    float halo = exp(-r * 4.8) * 0.52 * smoothstep(1.0, 0.55, r);

    // Crisp 4-point telemetry crosshair spikes
    float hSpike = exp(-abs(p.y) * 28.0) * exp(-abs(p.x) * 2.8);
    float vSpike = exp(-abs(p.x) * 28.0) * exp(-abs(p.y) * 2.8);
    float crossSpikes = (hSpike + vSpike) * 0.42 * smoothstep(1.0, 0.4, r);

    // Gentle expanding deep-space radio ping ring
    float pulseCycle = fract(uTime * 0.36);
    float ringRadius = 0.18 + pulseCycle * 0.72;
    float ring = exp(-pow((r - ringRadius) * 26.0, 2.0)) * (1.0 - pulseCycle) * 0.65;

    vec3 col =
      uColor * (halo * 1.2 + crossSpikes * 1.25 + ring * 1.35) +
      vec3(1.0, 0.98, 0.90) * (core * 1.5 + crossSpikes * 0.35);

    float alpha = clamp((core * 1.25 + halo + crossSpikes + ring) * uAlpha, 0.0, 1.0);
    if (alpha <= 0.003) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

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
  const { camera, gl } = useThree();
  const localGroupRef = useRef<Group | null>(null);
  const modelGroupRef = useRef<Group>(null);
  const beaconRef = useRef<Mesh>(null);
  const glintPointsRef = useRef<Points>(null);
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
        color: new Color(data.render.colorFallback ?? "#ffd166"),
        transparent: true,
        opacity: 0,
        depthWrite: false
      }),
    [data.render.colorFallback]
  );

  const glintGeometry = useMemo(() => {
    const geom = new BufferGeometry();
    geom.setAttribute("position", new BufferAttribute(new Float32Array([0, 0, 0]), 3));
    return geom;
  }, []);

  const glintMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: PROBE_BEACON_VERTEX_SHADER,
        fragmentShader: PROBE_BEACON_FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uAlpha: { value: 1 },
          uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
          uColor: { value: new Color("#ffd166") }
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending
      }),
    [gl]
  );

  useEffect(() => {
    return () => {
      beaconMaterial.dispose();
      glintGeometry.dispose();
      glintMaterial.dispose();
    };
  }, [beaconMaterial, glintGeometry, glintMaterial]);

  useFrame((state, delta) => {
    const root = localGroupRef.current;
    if (!root) return;

    root.getWorldPosition(worldPosRef.current);
    const distSq = camera.position.distanceToSquared(worldPosRef.current);
    const dist = Math.sqrt(distSq);

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

    // Smoothly show the golden deep-space telemetry beacon when zoomed out,
    // fading out cleanly as the detailed 3D spacecraft model comes into close view.
    const beaconFade =
      nextNear && Boolean(loadedScene)
        ? MathUtils.smoothstep(dist, 5.5, 16.0)
        : 1.0;

    glintMaterial.uniforms.uTime.value = state.clock.elapsedTime;
    glintMaterial.uniforms.uAlpha.value = beaconFade;
    glintMaterial.uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 2);

    if (glintPointsRef.current) {
      glintPointsRef.current.visible = beaconFade > 0.01;
    }

    if (beaconRef.current) {
      // Scale invisible click hitbox gently with camera distance so clicking the distant
      // golden beacon from overview is effortless without interfering up close.
      beaconRef.current.visible = beaconFade > 0.05;
      const hitRadius = Math.max(radius * 0.6, Math.min(2.6, dist * 0.022));
      beaconRef.current.scale.setScalar(hitRadius);
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

      {/* Crisp golden deep-space telemetry beacon visible when zoomed out */}
      <points
        ref={glintPointsRef}
        geometry={glintGeometry}
        material={glintMaterial}
        frustumCulled={false}
        renderOrder={5}
        raycast={() => null}
      />

      {/* Distance-scaled invisible click hitbox for effortless selection of the distant beacon */}
      <mesh
        ref={beaconRef}
        geometry={getBeaconGeometry()}
        material={beaconMaterial}
        scale={radius * 0.6}
        onPointerOver={(event) => {
          event.stopPropagation();
          document.body.style.cursor = "pointer";
          onPointerOver?.(event);
        }}
        onPointerOut={(event) => {
          document.body.style.cursor = "auto";
          onPointerOut?.(event);
        }}
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
