import { useEffect, useMemo, useRef, type Ref, type RefObject } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  MathUtils,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  PlaneGeometry,
  Points,
  Quaternion,
  ShaderMaterial,
  Vector3
} from "three";
import type { BodyData } from "../data/types";
import type { DistanceScaleMode, DistanceScaleParams } from "../utils/distanceScale";
import {
  getHeliocentricDistanceAu,
  getOrbitPosition
} from "../orbits/orbitMath";

interface CometMeshProps {
  data: BodyData;
  position: Vector3;
  timeRef: RefObject<number>;
  scaleMode: DistanceScaleMode;
  scaleParams: DistanceScaleParams;
  isSelected?: boolean;
  groupRef?: Ref<Group>;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
  onClick?: (event: ThreeEvent<MouseEvent>) => void;
}

const COMET_BEACON_VERTEX_SHADER = /* glsl */ `
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
    float projected = uPixelRatio * clamp(24.0 * (22.0 / dist), 14.0, 28.0);
    gl_PointSize = projected;
  }
`;

const COMET_BEACON_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uAlpha;
  uniform vec3 uColor;

  void main() {
    if (uAlpha <= 0.004) discard;
    vec2 p = (gl_PointCoord - 0.5) * 2.0;
    float r = length(p);
    if (r > 1.0) discard;

    float core = exp(-r * r * 64.0);
    float halo = exp(-r * 4.6) * 0.48 * smoothstep(1.0, 0.5, r);
    float twinkle = 0.92 + 0.08 * sin(uTime * 2.2);

    vec3 col =
      uColor * (halo * 1.15) +
      vec3(0.98, 0.99, 1.0) * (core * 1.45 * twinkle);

    float alpha = clamp((core * 1.2 + halo) * uAlpha, 0.0, 1.0);
    if (alpha <= 0.003) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

const COMA_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/**
 * Compact, pure-white photographic comet head (no opaque rock silhouette, no oversized
 * neon bubble): blazing star-like white pseudonucleus melting seamlessly into the soft
 * milky dust envelope and faint blue ion mist.
 */
const COMA_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uIntensity;
  uniform vec3 uCoreColor;
  uniform vec3 uHaloColor;

  varying vec2 vUv;

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    if (r > 1.0 || uIntensity <= 0.002) discard;

    // Crisp bright white photographic head
    float core = exp(-r * r * 26.0);
    // Soft warm-white inner coma melting into the dust tail root
    float inner = exp(-r * r * 7.5) * 0.62;
    // Ultra-soft translucent outer atmospheric mist
    float outer = exp(-r * 3.8) * 0.24 * smoothstep(1.0, 0.55, r);

    vec3 col = mix(uHaloColor, uCoreColor, clamp(core * 1.25 + inner * 0.65, 0.0, 1.0));
    float alpha = clamp((core * 1.15 + inner + outer) * uIntensity, 0.0, 1.0);
    if (alpha <= 0.002) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

const TAIL_VERTEX_SHADER = /* glsl */ `
  uniform float uStartWidth;
  uniform float uEndWidth;
  uniform float uAngleSlope;
  uniform float uCurveBend;

  varying vec2 vUv;
  varying float vAlong;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // pos.y runs from -0.025 (just wrapping the head) to 1.0 (fading tip)
    float t = clamp(pos.y, 0.0, 1.0);
    vAlong = t;

    // Smooth parabolic fan broadening from the compact white head into a wide misty plume
    float widthScale = mix(uStartWidth, uEndWidth, pow(t, 0.68));
    pos.x *= widthScale;
    pos.z *= widthScale;

    // Offset along +X (orbital lag) for natural V-separation + gentle dust curvature
    pos.x += uAngleSlope * t + uCurveBend * t * t;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

/**
 * Velvety, photographic comet tail shader: soft Gaussian plume with zero harsh laser spine
 * and zero hard geometric edges, fading organically into the starry sky.
 */
const TAIL_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform float uOpacity;
  uniform float uCrossTightness;
  uniform float uLengthFalloff;
  uniform float uWispStrength;
  uniform vec3 uHeadColor;
  uniform vec3 uMidColor;
  uniform vec3 uTipColor;

  varying vec2 vUv;
  varying float vAlong;

  void main() {
    if (uOpacity <= 0.002) discard;

    float along = clamp(vAlong, 0.0, 1.0);
    float across = abs(vUv.x - 0.5) * 2.0;

    // Seamless rounded wrap right out of the white head
    float headSoft = smoothstep(0.0, 0.06, vUv.y);
    // Long, exponential atmospheric fade into dark space (never cuts off abruptly)
    float lengthFade = exp(-along * uLengthFalloff) * smoothstep(1.0, 0.68, along);

    // Pure soft Gaussian plume cross-section (velvety cloud, zero sharp laser line)
    float crossProfile = exp(-across * across * uCrossTightness) * smoothstep(1.0, 0.42, across);

    // Very subtle organic density wisps so the plume feels gaseous rather than geometric
    float wisp = 1.0 + uWispStrength * (
      0.6 * sin(across * 6.5 + along * 5.0 - uTime * 0.35) +
      0.4 * sin(across * 11.0 - along * 8.0 + uTime * 0.25)
    ) * smoothstep(0.08, 0.4, along);

    vec3 col = mix(uHeadColor, uMidColor, smoothstep(0.05, 0.42, along));
    col = mix(col, uTipColor, smoothstep(0.38, 0.92, along));

    float alpha = clamp(headSoft * lengthFade * crossProfile * wisp * uOpacity, 0.0, 1.0);
    if (alpha <= 0.002) discard;

    gl_FragColor = vec4(col, alpha);
  }
`;

/**
 * 4-plane radial volumetric plume (0°, 45°, 90°, 135° around +Y) merged into 1 BufferGeometry
 * (1 draw call per tail) so the silky mist looks completely smooth and round from every 3D angle
 * with zero flat-quad creases.
 */
function createVolumetricPlumeGeometry(segmentsY: number): BufferGeometry {
  const angles = [0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4];
  const planes = angles.map((angle) => {
    const plane = new PlaneGeometry(1, 1.025, 1, segmentsY);
    // Start slightly behind origin (-0.025) so the plume wraps softly around the bright head
    plane.translate(0, 0.4875, 0);
    if (angle !== 0) {
      plane.rotateY(angle);
    }
    return plane;
  });

  const singleVertCount = planes[0].attributes.position.count;
  const singleIdxCount = planes[0].index!.count;
  const positions = new Float32Array(singleVertCount * planes.length * 3);
  const uvs = new Float32Array(singleVertCount * planes.length * 2);
  const indices = new Uint16Array(singleIdxCount * planes.length);

  planes.forEach((plane, pIdx) => {
    const posAttr = plane.attributes.position as BufferAttribute;
    const uvAttr = plane.attributes.uv as BufferAttribute;
    const idxAttr = plane.index!;
    const vOffset = pIdx * singleVertCount;
    const iOffset = pIdx * singleIdxCount;

    positions.set(posAttr.array as Float32Array, vOffset * 3);
    uvs.set(uvAttr.array as Float32Array, vOffset * 2);
    for (let i = 0; i < singleIdxCount; i += 1) {
      indices[iOffset + i] = idxAttr.getX(i) + vOffset;
    }
    plane.dispose();
  });

  const merged = new BufferGeometry();
  merged.setAttribute("position", new Float32BufferAttribute(positions, 3));
  merged.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  merged.setIndex(new BufferAttribute(indices, 1));
  return merged;
}

let sharedHitboxGeometry: OctahedronGeometry | null = null;
function getHitboxGeometry(): OctahedronGeometry {
  if (!sharedHitboxGeometry) {
    sharedHitboxGeometry = new OctahedronGeometry(1, 0);
  }
  return sharedHitboxGeometry;
}

export default function CometMesh({
  data,
  position,
  timeRef,
  scaleMode,
  scaleParams,
  groupRef,
  onPointerOver,
  onPointerOut,
  onClick
}: CometMeshProps) {
  const { camera, gl } = useThree();
  const localGroupRef = useRef<Group | null>(null);
  const comaRef = useRef<Mesh>(null);
  const ionTailGroupRef = useRef<Group>(null);
  const dustTailGroupRef = useRef<Group>(null);
  const glintPointsRef = useRef<Points>(null);
  const hitboxRef = useRef<Mesh>(null);

  const worldPosRef = useMemo(() => new Vector3(), []);
  const prevOrbitPosRef = useMemo(() => new Vector3(), []);
  const antiSolarDirRef = useMemo(() => new Vector3(), []);
  const lagDirRef = useMemo(() => new Vector3(), []);
  const sideDirRef = useMemo(() => new Vector3(), []);
  const basisMatrixRef = useMemo(() => new Matrix4(), []);
  const tailQuatRef = useMemo(() => new Quaternion(), []);

  const isHaleBopp = data.id === "halebopp";
  const sizeBoost = isHaleBopp ? 1.18 : 0.96;

  // Compact, seamless pure-white photographic coma head
  const comaGeometry = useMemo(() => new PlaneGeometry(2, 2), []);
  const comaMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: COMA_VERTEX_SHADER,
        fragmentShader: COMA_FRAGMENT_SHADER,
        uniforms: {
          uIntensity: { value: 0.92 },
          uCoreColor: { value: new Color("#ffffff") },
          uHaloColor: { value: new Color("#c8dcff") }
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending
      }),
    []
  );

  // Delicate, misty translucent straight cobalt/steel-blue Ion (plasma) tail
  const ionTailGeometry = useMemo(() => createVolumetricPlumeGeometry(18), []);
  const ionTailMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: TAIL_VERTEX_SHADER,
        fragmentShader: TAIL_FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0.14 },
          uStartWidth: { value: 0.24 },
          uEndWidth: { value: 1.55 },
          uAngleSlope: { value: 0.0 },
          uCurveBend: { value: 0.0 },
          uCrossTightness: { value: 3.4 },
          uLengthFalloff: { value: 2.35 },
          uWispStrength: { value: 0.08 },
          uHeadColor: { value: new Color("#b8d4ff") },
          uMidColor: { value: new Color("#4f83e6") },
          uTipColor: { value: new Color("#1d3b8a") }
        },
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending
      }),
    []
  );

  // Dominant, broad, silky milky-white / soft warm-silver Dust fan (like 1997 Hale-Bopp photo)
  const dustTailGeometry = useMemo(() => createVolumetricPlumeGeometry(22), []);
  const dustTailMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: TAIL_VERTEX_SHADER,
        fragmentShader: TAIL_FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uOpacity: { value: 0.24 },
          uStartWidth: { value: 0.22 },
          uEndWidth: { value: isHaleBopp ? 2.15 : 1.75 },
          uAngleSlope: { value: isHaleBopp ? 1.25 : 1.02 },
          uCurveBend: { value: isHaleBopp ? 0.95 : 0.72 },
          uCrossTightness: { value: 3.8 },
          uLengthFalloff: { value: 2.45 },
          uWispStrength: { value: 0.05 },
          uHeadColor: { value: new Color("#ffffff") },
          uMidColor: { value: new Color("#e2deda") },
          uTipColor: { value: new Color("#7f8599") }
        },
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending
      }),
    [isHaleBopp]
  );

  const glintGeometry = useMemo(() => {
    const geom = new BufferGeometry();
    geom.setAttribute("position", new BufferAttribute(new Float32Array([0, 0, 0]), 3));
    return geom;
  }, []);

  const glintMaterial = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: COMET_BEACON_VERTEX_SHADER,
        fragmentShader: COMET_BEACON_FRAGMENT_SHADER,
        uniforms: {
          uTime: { value: 0 },
          uAlpha: { value: 1 },
          uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
          uColor: { value: new Color(data.render.colorFallback ?? "#bae6fd") }
        },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending
      }),
    [gl, data.render.colorFallback]
  );

  const hitboxMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color("#bae6fd"),
        transparent: true,
        opacity: 0,
        depthWrite: false
      }),
    []
  );

  useEffect(() => {
    return () => {
      comaGeometry.dispose();
      comaMaterial.dispose();
      ionTailGeometry.dispose();
      ionTailMaterial.dispose();
      dustTailGeometry.dispose();
      dustTailMaterial.dispose();
      glintGeometry.dispose();
      glintMaterial.dispose();
      hitboxMaterial.dispose();
    };
  }, [
    comaGeometry,
    comaMaterial,
    ionTailGeometry,
    ionTailMaterial,
    dustTailGeometry,
    dustTailMaterial,
    glintGeometry,
    glintMaterial,
    hitboxMaterial
  ]);

  useFrame((state) => {
    const root = localGroupRef.current;
    if (!root) return;

    const elapsed = state.clock.elapsedTime;
    const simDays = timeRef.current;

    // Always-photogenic comet baseline (0.72..1.0), swelling gently near perihelion
    const rAu = data.orbit ? getHeliocentricDistanceAu(data.orbit, simDays) : 1.0;
    const solarProximity = 1.0 - MathUtils.smoothstep(rAu, 0.65, isHaleBopp ? 12.0 : 8.5);
    const periFlare = MathUtils.clamp(1.2 / (rAu * rAu + 0.45), 0, 1.0);
    const activity = MathUtils.lerp(
      0.72,
      1.0,
      MathUtils.clamp(solarProximity * 0.65 + periFlare * 0.45, 0, 1.0)
    );

    root.getWorldPosition(worldPosRef);
    const camDist = camera.position.distanceTo(worldPosRef);

    // 1. Compact, seamless pure-white photographic coma head (zero rock peeking through!)
    if (comaRef.current) {
      comaRef.current.quaternion.copy(camera.quaternion);
      const comaRadius = (0.19 + activity * 0.09) * sizeBoost;
      comaRef.current.scale.setScalar(comaRadius);
      comaMaterial.uniforms.uIntensity.value = 0.86 + activity * 0.14;
    }

    // 2. Twin tails: soft straight translucent blue Ion veil + broad curved milky-white Dust fan
    if (ionTailGroupRef.current && dustTailGroupRef.current && worldPosRef.lengthSq() > 1e-6) {
      antiSolarDirRef.copy(worldPosRef).normalize();

      if (data.orbit) {
        const dtStep = Math.max(0.35, Math.min(3.5, rAu * 0.4));
        getOrbitPosition(
          data.orbit,
          simDays - dtStep,
          scaleMode,
          scaleParams,
          prevOrbitPosRef,
          false,
          data
        );
        lagDirRef.copy(prevOrbitPosRef).sub(worldPosRef);
        lagDirRef.addScaledVector(
          antiSolarDirRef,
          -lagDirRef.dot(antiSolarDirRef)
        );
        if (lagDirRef.lengthSq() < 1e-8) {
          lagDirRef.set(1, 0, 0);
          lagDirRef.addScaledVector(
            antiSolarDirRef,
            -lagDirRef.dot(antiSolarDirRef)
          );
        }
        lagDirRef.normalize();
      } else {
        lagDirRef.set(1, 0, 0);
        lagDirRef.addScaledVector(
          antiSolarDirRef,
          -lagDirRef.dot(antiSolarDirRef)
        ).normalize();
      }

      sideDirRef.crossVectors(lagDirRef, antiSolarDirRef).normalize();
      basisMatrixRef.makeBasis(lagDirRef, antiSolarDirRef, sideDirRef);
      tailQuatRef.setFromRotationMatrix(basisMatrixRef);

      // Ion tail: straight, delicate misty blue veil (soft & subordinate to the bright white dust fan)
      const ionLength = (1.65 + activity * 1.15) * sizeBoost;
      const ionWidth = (0.34 + activity * 0.14) * sizeBoost;
      ionTailGroupRef.current.quaternion.copy(tailQuatRef);
      ionTailGroupRef.current.scale.set(ionWidth, ionLength, ionWidth);
      ionTailMaterial.uniforms.uTime.value = elapsed;
      ionTailMaterial.uniforms.uOpacity.value = 0.085 + activity * 0.055;

      // Dust tail: bright, broad, gently curved milky-white fan fanning ~25° off the ion veil
      const dustLength = (1.55 + activity * 1.15) * sizeBoost;
      const dustWidth = (0.44 + activity * 0.18) * sizeBoost;
      dustTailGroupRef.current.quaternion.copy(tailQuatRef);
      dustTailGroupRef.current.scale.set(dustWidth, dustLength, dustWidth);
      dustTailMaterial.uniforms.uTime.value = elapsed;
      dustTailMaterial.uniforms.uOpacity.value = 0.17 + activity * 0.08;
    }

    // 3. Soft icy star glint visible when far out in solar-system overview
    const beaconFade = MathUtils.smoothstep(camDist, 8.5, 22.0);
    glintMaterial.uniforms.uTime.value = elapsed;
    glintMaterial.uniforms.uAlpha.value = beaconFade;
    glintMaterial.uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 2);

    if (glintPointsRef.current) {
      glintPointsRef.current.visible = beaconFade > 0.01;
    }

    if (hitboxRef.current) {
      const hitRadius = Math.max(0.24, Math.min(2.2, camDist * 0.022));
      hitboxRef.current.scale.setScalar(hitRadius);
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

  return (
    <group ref={setCombinedRef} position={position}>
      {/* Pure photographic white coma head (zero opaque rock peeking through) */}
      <mesh
        ref={comaRef}
        geometry={comaGeometry}
        material={comaMaterial}
        renderOrder={4}
        raycast={() => null}
      />

      {/* Delicate, misty straight cobalt-blue Ion (plasma) veil — 4 radial planes (1 draw call) */}
      <group ref={ionTailGroupRef}>
        <mesh
          geometry={ionTailGeometry}
          material={ionTailMaterial}
          renderOrder={2}
          frustumCulled={false}
          raycast={() => null}
        />
      </group>

      {/* Broad, bright milky-white gently curved Dust fan — 4 radial planes (1 draw call) */}
      <group ref={dustTailGroupRef}>
        <mesh
          geometry={dustTailGeometry}
          material={dustTailMaterial}
          renderOrder={3}
          frustumCulled={false}
          raycast={() => null}
        />
      </group>

      {/* Subtle icy star glint visible from solar-system overview */}
      <points
        ref={glintPointsRef}
        geometry={glintGeometry}
        material={glintMaterial}
        frustumCulled={false}
        renderOrder={5}
        raycast={() => null}
      />

      {/* Distance-scaled invisible click hitbox for effortless selection */}
      <mesh
        ref={hitboxRef}
        geometry={getHitboxGeometry()}
        material={hitboxMaterial}
        scale={0.28}
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
    </group>
  );
}
