import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Line,
  LineBasicMaterial,
  LineSegments,
  MathUtils,
  Vector3
} from "three";
import type { BodyId } from "../data/types";
import type { DistanceScaleMode, DistanceScaleParams } from "../utils/distanceScale";
import {
  PLUTO_AXIAL_TILT_DEG,
  R_CHARON_BARYCENTER,
  R_PLUTO_BARYCENTER,
  getPlutoBarycenterPosition,
  getPlutoCharonOrbitalPhase
} from "./orbitMath";

interface PlutoBarycenterVisualsProps {
  timeRef: React.MutableRefObject<number>;
  scaleMode: DistanceScaleMode;
  scaleParams: DistanceScaleParams;
  activeSystemId?: BodyId | null;
  moonSystemVisRef?: React.MutableRefObject<Record<string, number>>;
  isSelected?: boolean;
  segments?: number;
}

export default function PlutoBarycenterVisuals({
  timeRef,
  scaleMode,
  scaleParams,
  activeSystemId,
  moonSystemVisRef,
  isSelected = false,
  segments = 180
}: PlutoBarycenterVisualsProps) {
  const groupRef = useRef<Group>(null);
  const barycenterPosRef = useRef(new Vector3());
  const innerOpacityRef = useRef(0);
  const outerOpacityRef = useRef(0);
  const crosshairOpacityRef = useRef(0);
  const tetherOpacityRef = useRef(0);

  // Pluto's inner orbital ring around the barycenter
  const innerRingGeometry = useMemo(() => {
    const points: Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(
        new Vector3(
          R_PLUTO_BARYCENTER * Math.cos(theta),
          0,
          R_PLUTO_BARYCENTER * Math.sin(theta)
        )
      );
    }
    return new BufferGeometry().setFromPoints(points);
  }, [segments]);

  const innerRingMaterial = useMemo(
    () =>
      new LineBasicMaterial({
        color: "#c77dff",
        transparent: true,
        opacity: 0,
        depthWrite: false
      }),
    []
  );

  // Charon's outer orbital ring around the barycenter
  const outerRingGeometry = useMemo(() => {
    const points: Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      points.push(
        new Vector3(
          R_CHARON_BARYCENTER * Math.cos(theta),
          0,
          R_CHARON_BARYCENTER * Math.sin(theta)
        )
      );
    }
    return new BufferGeometry().setFromPoints(points);
  }, [segments]);

  const outerRingMaterial = useMemo(
    () =>
      new LineBasicMaterial({
        color: "#a78bfa",
        transparent: true,
        opacity: 0,
        depthWrite: false
      }),
    []
  );

  // Delicate tether line connecting Pluto and Charon through the barycenter
  const tetherGeometry = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = new Float32Array(6); // 2 vertices * 3 coords
    geo.setAttribute("position", new Float32BufferAttribute(positions, 3));
    return geo;
  }, []);

  const tetherMaterial = useMemo(
    () =>
      new LineBasicMaterial({
        color: "#cbd5e1",
        transparent: true,
        opacity: 0,
        depthWrite: false
      }),
    []
  );

  // Crisp 3D crosshair node positioned at the empty barycenter
  const crosshairGeometry = useMemo(() => {
    const size = 0.035;
    const points: Vector3[] = [
      new Vector3(-size, 0, 0),
      new Vector3(size, 0, 0),
      new Vector3(0, -size, 0),
      new Vector3(0, size, 0),
      new Vector3(0, 0, -size),
      new Vector3(0, 0, size)
    ];
    return new BufferGeometry().setFromPoints(points);
  }, []);

  const crosshairMaterial = useMemo(
    () =>
      new LineBasicMaterial({
        color: "#f1f5f9",
        transparent: true,
        opacity: 0,
        depthWrite: false
      }),
    []
  );

  const tiltRad = useMemo(
    () => MathUtils.degToRad(PLUTO_AXIAL_TILT_DEG),
    []
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Update group position to heliocentric barycenter
    getPlutoBarycenterPosition(
      timeRef.current,
      scaleMode,
      scaleParams,
      barycenterPosRef.current
    );
    groupRef.current.position.copy(barycenterPosRef.current);

    const isCurrentSystem = activeSystemId === "pluto";
    const vis = isCurrentSystem ? (moonSystemVisRef?.current?.pluto ?? 0) : 0;

    // Target opacities based on visibility
    const targetInner = 0.2 * vis;
    const targetOuter = (isSelected ? 0.55 : 0.35) * vis;
    const targetCrosshair = 0.4 * vis;
    const targetTether = 0.16 * vis;

    innerOpacityRef.current = MathUtils.damp(
      innerOpacityRef.current,
      targetInner,
      8.0,
      delta
    );
    outerOpacityRef.current = MathUtils.damp(
      outerOpacityRef.current,
      targetOuter,
      8.0,
      delta
    );
    crosshairOpacityRef.current = MathUtils.damp(
      crosshairOpacityRef.current,
      targetCrosshair,
      8.0,
      delta
    );
    tetherOpacityRef.current = MathUtils.damp(
      tetherOpacityRef.current,
      targetTether,
      8.0,
      delta
    );

    if (vis < 0.01 && outerOpacityRef.current < 0.005) {
      groupRef.current.visible = false;
      return;
    }

    groupRef.current.visible = true;
    innerRingMaterial.opacity = innerOpacityRef.current;
    outerRingMaterial.opacity = outerOpacityRef.current;
    crosshairMaterial.opacity = crosshairOpacityRef.current;
    tetherMaterial.opacity = tetherOpacityRef.current;

    // Dynamically update tether endpoints connecting Pluto and Charon
    const phase = getPlutoCharonOrbitalPhase(timeRef.current);
    const cosP = Math.cos(phase);
    const sinP = Math.sin(phase);

    const posAttr = tetherGeometry.attributes.position as Float32BufferAttribute;
    const arr = posAttr.array as Float32Array;

    // Pluto endpoint (-u * R_PLUTO_BARYCENTER)
    arr[0] = -R_PLUTO_BARYCENTER * cosP;
    arr[1] = 0;
    arr[2] = -R_PLUTO_BARYCENTER * sinP;

    // Charon endpoint (+u * R_CHARON_BARYCENTER)
    arr[3] = R_CHARON_BARYCENTER * cosP;
    arr[4] = 0;
    arr[5] = R_CHARON_BARYCENTER * sinP;

    posAttr.needsUpdate = true;
  });

  return (
    <group ref={groupRef} rotation={[0, 0, tiltRad]}>
      <primitive object={new Line(innerRingGeometry, innerRingMaterial)} />
      <primitive object={new Line(outerRingGeometry, outerRingMaterial)} />
      <primitive object={new Line(tetherGeometry, tetherMaterial)} />
      <primitive
        object={new LineSegments(crosshairGeometry, crosshairMaterial)}
      />
    </group>
  );
}
