import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { PlanetData, PlanetId } from "../data/types";
import { scalePlanetRadius } from "../utils/scale";

const DEFAULT_TARGET = new Vector3(0, 0, 0);
const DEFAULT_POSITION = new Vector3(0, 0, 28);

interface FocusTargetOptions {
  selectedId: PlanetId | null;
  resetSignal: number;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  planetRefs: React.MutableRefObject<Record<PlanetId, Object3D | null>>;
  planetData: Record<PlanetId, PlanetData>;
  onDistanceTarget?: (value: number | null) => void;
}

export const useFocusTarget = ({
  selectedId,
  resetSignal,
  controlsRef,
  planetRefs,
  planetData,
  onDistanceTarget
}: FocusTargetOptions) => {
  const resetTokenRef = useRef(resetSignal);
  const isResettingRef = useRef(false);

  useEffect(() => {
    if (resetSignal !== resetTokenRef.current) {
      resetTokenRef.current = resetSignal;
      isResettingRef.current = true;
    }
  }, [resetSignal]);

  const defaultDirection = useMemo(() => new Vector3(0, 0, 1), []);
  const target = useMemo(() => new Vector3(), []);
  const desiredPosition = useMemo(() => new Vector3(), []);
  const direction = useMemo(() => new Vector3(), []);
  const nearRef = useRef<number | null>(null);
  const farRef = useRef<number | null>(null);
  const minDistanceRef = useRef<number | null>(null);
  const maxDistanceRef = useRef<number | null>(null);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const camera = controls.object;
    let shouldUpdate = false;

    if (selectedId) {
      const focusObject = planetRefs.current[selectedId];
      if (!focusObject) return;
      focusObject.getWorldPosition(target);

      const radius = scalePlanetRadius(planetData[selectedId].radiusKm);
      const desiredDistance = Math.max(radius * 10, 4.5);

      direction.copy(camera.position).sub(controls.target);
      if (direction.lengthSq() === 0) {
        direction.copy(defaultDirection);
      } else {
        direction.normalize();
      }

      desiredPosition.copy(target).add(direction.multiplyScalar(desiredDistance));
      onDistanceTarget?.(desiredDistance);
      shouldUpdate = true;
    } else if (isResettingRef.current) {
      target.copy(DEFAULT_TARGET);
      desiredPosition.copy(DEFAULT_POSITION);
      onDistanceTarget?.(null);
      shouldUpdate = true;
    } else {
      return;
    }
    if (!shouldUpdate) return;

    camera.position.lerp(desiredPosition, 0.08);
    controls.target.lerp(target, 0.12);

    const minDistance = selectedId
      ? Math.max(scalePlanetRadius(planetData[selectedId].radiusKm) * 3, 1.8)
      : 8;
    const maxDistance = selectedId ? Math.max(minDistance * 10, 70) : 140;

    if (minDistanceRef.current !== minDistance) {
      controls.minDistance = minDistance;
      minDistanceRef.current = minDistance;
    }
    if (maxDistanceRef.current !== maxDistance) {
      controls.maxDistance = maxDistance;
      maxDistanceRef.current = maxDistance;
    }

    const nextNear = selectedId ? Math.max(0.05, minDistance * 0.04) : 0.1;
    const nextFar = selectedId ? 800 : 2000;
    if (nearRef.current !== nextNear || farRef.current !== nextFar) {
      camera.near = nextNear;
      camera.far = nextFar;
      camera.updateProjectionMatrix();
      nearRef.current = nextNear;
      farRef.current = nextFar;
    }
    controls.update();

    if (isResettingRef.current && camera.position.distanceTo(DEFAULT_POSITION) < 0.2) {
      isResettingRef.current = false;
    }
  });
};
