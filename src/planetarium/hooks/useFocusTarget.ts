import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { BodyData, BodyId } from "../data/types";
import { scalePlanetRadius } from "../utils/scale";

const DEFAULT_TARGET = new Vector3(0, 0, 0);
const DEFAULT_POSITION = new Vector3(0, 0, 28);

interface FocusTargetOptions {
  selectedId: BodyId | null;
  resetSignal: number;
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
  planetRefs: React.MutableRefObject<Record<BodyId, Object3D | null>>;
  planetData: Record<BodyId, BodyData>;
  onDistanceTarget?: (value: number | null) => void;
  onFocusChange?: (focused: boolean) => void;
}

export const useFocusTarget = ({
  selectedId,
  resetSignal,
  controlsRef,
  planetRefs,
  planetData,
  onDistanceTarget,
  onFocusChange
}: FocusTargetOptions) => {
  const resetTokenRef = useRef(resetSignal);
  const isResettingRef = useRef(false);
  const focusStateRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const transitionTimeRef = useRef(0);

  useEffect(() => {
    if (resetSignal !== resetTokenRef.current) {
      resetTokenRef.current = resetSignal;
      isResettingRef.current = true;
      isTransitioningRef.current = true;
      transitionTimeRef.current = 0;
    }
  }, [resetSignal]);

  const defaultDirection = useMemo(() => new Vector3(0, 0, 1), []);
  const target = useMemo(() => new Vector3(), []);
  const desiredPosition = useMemo(() => new Vector3(), []);
  const direction = useMemo(() => new Vector3(), []);
  const prevTarget = useMemo(() => new Vector3(), []);
  const displacement = useMemo(() => new Vector3(), []);
  const trackedIdRef = useRef<BodyId | null>(null);
  const nearRef = useRef<number | null>(null);
  const farRef = useRef<number | null>(null);
  const minDistanceRef = useRef<number | null>(null);
  const maxDistanceRef = useRef<number | null>(null);

  useEffect(() => {
    if (selectedId) {
      isTransitioningRef.current = true;
      transitionTimeRef.current = 0;
    }
  }, [selectedId]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    const camera = controls.object;

    if (selectedId) {
      const focusObject = planetRefs.current[selectedId];
      if (!focusObject) return;
      focusObject.getWorldPosition(target);

      // Move camera and orbit target 1:1 with planet orbital velocity
      if (trackedIdRef.current === selectedId) {
        displacement.copy(target).sub(prevTarget);
        camera.position.add(displacement);
        controls.target.add(displacement);
      } else {
        trackedIdRef.current = selectedId;
        prevTarget.copy(target);
        isTransitioningRef.current = true;
        transitionTimeRef.current = 0;
      }
      prevTarget.copy(target);

      const isMoon = planetData[selectedId].kind === "moon";
      const radius = scalePlanetRadius(planetData[selectedId].render.radiusKm, isMoon);
      const desiredDistance = isMoon
        ? Math.max(radius * 12, 1.8)
        : Math.max(radius * 10, 4.5);

      if (isTransitioningRef.current) {
        transitionTimeRef.current += delta;

        direction.copy(camera.position).sub(controls.target);
        if (direction.lengthSq() === 0) {
          direction.copy(defaultDirection);
        } else {
          direction.normalize();
        }

        desiredPosition.copy(target).add(direction.multiplyScalar(desiredDistance));
        onDistanceTarget?.(desiredDistance);

        const positionEase = 1 - Math.exp(-delta * 4.5);
        const targetEase = 1 - Math.exp(-delta * 6.0);

        camera.up.set(0, 1, 0);
        camera.position.lerp(desiredPosition, positionEase);
        controls.target.lerp(target, targetEase);

        if (
          (camera.position.distanceTo(desiredPosition) < 0.15 &&
            controls.target.distanceTo(target) < 0.15) ||
          transitionTimeRef.current > 1.2
        ) {
          isTransitioningRef.current = false;
          controls.target.copy(target);
        }
      } else {
        // Locked Phase: strictly pinned to planet center
        controls.target.copy(target);
      }

      const minDistance = Math.max(radius * 1.2, isMoon ? 0.2 : 0.4);
      const maxDistance = Math.max(minDistance * 10, 70);

      if (minDistanceRef.current !== minDistance) {
        controls.minDistance = minDistance;
        minDistanceRef.current = minDistance;
      }
      if (maxDistanceRef.current !== maxDistance) {
        controls.maxDistance = maxDistance;
        maxDistanceRef.current = maxDistance;
      }

      const nextNear = Math.max(0.05, minDistance * 0.04);
      const nextFar = 800;
      if (nearRef.current !== nextNear || farRef.current !== nextFar) {
        camera.near = nextNear;
        camera.far = nextFar;
        camera.updateProjectionMatrix();
        nearRef.current = nextNear;
        farRef.current = nextFar;
      }

      controls.update();

      const isFocused = !isTransitioningRef.current;
      if (focusStateRef.current !== isFocused) {
        focusStateRef.current = isFocused;
        onFocusChange?.(isFocused);
      }
    } else if (isResettingRef.current) {
      trackedIdRef.current = null;
      target.copy(DEFAULT_TARGET);
      desiredPosition.copy(DEFAULT_POSITION);
      onDistanceTarget?.(null);

      const positionEase = 1 - Math.exp(-delta * 3.5);
      const targetEase = 1 - Math.exp(-delta * 5);

      camera.up.set(0, 1, 0);
      camera.position.lerp(desiredPosition, positionEase);
      controls.target.lerp(target, targetEase);

      controls.minDistance = 8;
      controls.maxDistance = 140;

      if (nearRef.current !== 0.1 || farRef.current !== 2000) {
        camera.near = 0.1;
        camera.far = 2000;
        camera.updateProjectionMatrix();
        nearRef.current = 0.1;
        farRef.current = 2000;
      }

      controls.update();

      if (camera.position.distanceTo(DEFAULT_POSITION) < 0.2) {
        isResettingRef.current = false;
      }
    } else {
      trackedIdRef.current = null;
      if (focusStateRef.current) {
        focusStateRef.current = false;
        onFocusChange?.(false);
      }
      controls.update();
    }
  });
};
