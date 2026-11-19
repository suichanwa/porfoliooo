import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Object3D, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { BodyData, BodyId } from "../data/types";
import { scalePlanetRadius } from "../utils/scale";
import type { DistanceScaleMode, DistanceScaleParams } from "../utils/distanceScale";
import { getPlutoBarycenterPosition, R_CHARON_BARYCENTER } from "../orbits/orbitMath";

const DEFAULT_TARGET = new Vector3(0, 0, 0);
const DEFAULT_POSITION = new Vector3(0, 0, 28);
const FREE_FLY_MIN_DISTANCE = 0.5;
const FREE_FLY_MAX_DISTANCE = 180;

function syncCameraFrustum(
  camera: OrbitControlsImpl["object"],
  nearRef: RefObject<number | null>,
  farRef: RefObject<number | null>,
  nextNear: number,
  nextFar: number
) {
  const EPS = 1e-9;
  if (
    nearRef.current === null ||
    Math.abs(nearRef.current - nextNear) > EPS ||
    farRef.current === null ||
    Math.abs(farRef.current - nextFar) > EPS
  ) {
    camera.near = nextNear;
    camera.far = nextFar;
    camera.updateProjectionMatrix();
    nearRef.current = nextNear;
    farRef.current = nextFar;
  }
}

interface FocusTargetOptions {
  selectedId: BodyId | null;
  resetSignal: number;
  zoomOutSignal?: number;
  controlsRef: RefObject<OrbitControlsImpl | null>;
  planetRefs: RefObject<Record<BodyId, Object3D | null>>;
  planetData: Record<BodyId, BodyData>;
  onDistanceTarget?: (value: number | null) => void;
  onFocusChange?: (focused: boolean) => void;
  timeRef?: RefObject<number>;
  scaleMode?: DistanceScaleMode;
  scaleParams?: DistanceScaleParams;
}

export const useFocusTarget = ({
  selectedId,
  resetSignal,
  zoomOutSignal = 0,
  controlsRef,
  planetRefs,
  planetData,
  onDistanceTarget,
  onFocusChange,
  timeRef,
  scaleMode,
  scaleParams
}: FocusTargetOptions) => {
  const resetTokenRef = useRef(resetSignal);
  const zoomOutTokenRef = useRef(zoomOutSignal);
  const isResettingRef = useRef(false);
  const resetTimeRef = useRef(0);
  const isZoomingOutRef = useRef(false);
  const zoomOutNeedsInitRef = useRef(false);
  const zoomOutTimeRef = useRef(0);
  const focusStateRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const transitionTimeRef = useRef(0);
  const attachedControlsRef = useRef<OrbitControlsImpl | null>(null);
  const cancelAutoMotionRef = useRef<() => void>(() => {
    isResettingRef.current = false;
    isZoomingOutRef.current = false;
    isTransitioningRef.current = false;
  });

  useEffect(() => {
    return () => {
      if (attachedControlsRef.current) {
        attachedControlsRef.current.removeEventListener(
          "start",
          cancelAutoMotionRef.current
        );
        attachedControlsRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (resetSignal !== resetTokenRef.current) {
      resetTokenRef.current = resetSignal;
      isZoomingOutRef.current = false;
      isResettingRef.current = true;
      resetTimeRef.current = 0;
      isTransitioningRef.current = true;
      transitionTimeRef.current = 0;
    }
  }, [resetSignal]);

  useEffect(() => {
    if (zoomOutSignal !== zoomOutTokenRef.current) {
      zoomOutTokenRef.current = zoomOutSignal;
      isResettingRef.current = false;
      isTransitioningRef.current = false;
      isZoomingOutRef.current = true;
      zoomOutNeedsInitRef.current = true;
      zoomOutTimeRef.current = 0;
    }
  }, [zoomOutSignal]);

  const approachDirectionRef = useRef(new Vector3(0, 0.28, 1));
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
      isResettingRef.current = false;
      isZoomingOutRef.current = false;
      isTransitioningRef.current = true;
      transitionTimeRef.current = 0;
    }
  }, [selectedId]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (attachedControlsRef.current !== controls) {
      if (attachedControlsRef.current) {
        attachedControlsRef.current.removeEventListener(
          "start",
          cancelAutoMotionRef.current
        );
      }
      controls.addEventListener("start", cancelAutoMotionRef.current);
      attachedControlsRef.current = controls;
    }

    const camera = controls.object;

    if (selectedId) {
      if (selectedId === "pluto" && timeRef && scaleMode && scaleParams) {
        getPlutoBarycenterPosition(timeRef.current, scaleMode, scaleParams, target);
      } else {
        const focusObject = planetRefs.current[selectedId];
        if (!focusObject) return;
        focusObject.getWorldPosition(target);
      }

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

        // Place camera on the illuminated day-side of the planet:
        // Vector pointing from planet toward the Sun (the sunlit face) is normalize(-target)
        const rLen = Math.hypot(target.x, target.z);
        if (selectedId === "sun" || rLen < 0.1) {
          approachDirectionRef.current.set(0, 0.28, 1).normalize();
        } else {
          // Angle in XZ plane pointing from the planet toward the Sun
          const phiSun = Math.atan2(-target.z, -target.x);
          // Rotate horizontally around Y-axis by ~39° (0.68 rad) with a slight upward tilt (+0.25 on Y)
          const theta = phiSun + 0.68;
          const vx = Math.cos(theta);
          const vz = Math.sin(theta);
          const vy = 0.25;
          approachDirectionRef.current.set(vx, vy, vz).normalize();
        }
      }
      prevTarget.copy(target);

      const selectedBody = planetData[selectedId];
      const isMoon = selectedBody.kind === "moon";
      const parentBody = selectedBody.parentId ? planetData[selectedBody.parentId] : null;
      const radius = scalePlanetRadius(
        selectedBody.render.radiusKm,
        isMoon,
        parentBody?.render.radiusKm
      );

      let desiredDistance: number;
      if (selectedId === "pluto") {
        // Frame Pluto, the barycenter, and Charon's full binary orbit comfortably
        desiredDistance = Math.max(R_CHARON_BARYCENTER * 2.5, 2.75);
      } else if (selectedId === "charon") {
        // Focused close-up inspection of Charon
        desiredDistance = Math.max(radius * 6.5, 0.95);
      } else if (isMoon) {
        desiredDistance = Math.max(radius * 6.5, 0.35);
      } else if (selectedId === "sun") {
        desiredDistance = Math.max(radius * 3.5, 12);
      } else {
        const siblingMoons = Object.values(planetData).filter(
          (b) => b.parentId === selectedId
        );
        const hasMoons = siblingMoons.length > 0;
        const hasRings = Boolean(selectedBody.rings);

        if (hasMoons || hasRings) {
          let rRingOuter = 0;
          if (selectedBody.rings) {
            const rings = Array.isArray(selectedBody.rings)
              ? selectedBody.rings
              : [selectedBody.rings];
            const maxOuterKm = Math.max(...rings.map((r) => r.outerRadiusKm));
            rRingOuter = radius * (maxOuterKm / selectedBody.render.radiusKm);
          }
          const totalMoons = siblingMoons.length;
          let deltaShell = 0;
          if (totalMoons === 2) {
            deltaShell = 0.55;
          } else if (totalMoons === 4) {
            deltaShell = 1.05;
          } else if (totalMoons > 1) {
            deltaShell = 0.55 + (totalMoons - 2) * 0.25;
          }
          let rMin = Math.max(radius * 1.65, rRingOuter * 1.2);
          if (selectedId === "earth") {
            rMin = 0.95;
          }
          const maxMoonOrbitRadius = Math.max(rMin + deltaShell, rRingOuter);
          desiredDistance = Math.max(radius * 4.5, maxMoonOrbitRadius * 2.1);
        } else {
          // Mercury, Venus, Ceres, Pluto, etc. (no moons/rings)
          desiredDistance = Math.max(radius * 5.0, 0.65);
        }
      }

      if (isTransitioningRef.current) {
        transitionTimeRef.current += delta;

        direction.copy(approachDirectionRef.current);
        desiredPosition.copy(target).addScaledVector(direction, desiredDistance);
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
        // Locked Phase: camera and orbit target track the planet's orbital displacement (lines 77-79),
        // preserving any user right-click canvas panning offset.
      }

      const minDistance = isMoon
        ? 0.08
        : Math.min(0.15, Math.max(radius * 1.2, 0.08));
      const maxDistance = Math.max(minDistance * 10, 70);

      if (minDistanceRef.current !== minDistance) {
        controls.minDistance = minDistance;
        minDistanceRef.current = minDistance;
      }
      if (maxDistanceRef.current !== maxDistance) {
        controls.maxDistance = maxDistance;
        maxDistanceRef.current = maxDistance;
      }

      const nextNear = 0.01;
      const nextFar = 800;
      syncCameraFrustum(camera, nearRef, farRef, nextNear, nextFar);

      controls.update();

      const isFocused = !isTransitioningRef.current;
      if (focusStateRef.current !== isFocused) {
        focusStateRef.current = isFocused;
        onFocusChange?.(isFocused);
      }
    } else if (isZoomingOutRef.current) {
      trackedIdRef.current = null;
      if (focusStateRef.current) {
        focusStateRef.current = false;
        onFocusChange?.(false);
      }
      onDistanceTarget?.(null);

      if (zoomOutNeedsInitRef.current) {
        zoomOutNeedsInitRef.current = false;
        direction.copy(camera.position).sub(controls.target);
        const currDist = direction.length();
        if (currDist < 1e-4) {
          direction.set(0, 0.28, 1).normalize();
        } else {
          direction.divideScalar(currDist);
        }
        const zoomOutDist = Math.min(14, Math.max(currDist * 4.5, 4.8));
        desiredPosition.copy(controls.target).addScaledVector(direction, zoomOutDist);
      }

      zoomOutTimeRef.current += delta;
      const ease = 1 - Math.exp(-delta * 5.0);
      camera.up.set(0, 1, 0);
      camera.position.lerp(desiredPosition, ease);

      controls.minDistance = FREE_FLY_MIN_DISTANCE;
      controls.maxDistance = FREE_FLY_MAX_DISTANCE;
      minDistanceRef.current = null;
      maxDistanceRef.current = null;
      syncCameraFrustum(camera, nearRef, farRef, 0.05, 2000);

      controls.update();

      if (
        camera.position.distanceTo(desiredPosition) < 0.2 ||
        zoomOutTimeRef.current > 0.75
      ) {
        isZoomingOutRef.current = false;
      }
    } else if (isResettingRef.current) {
      trackedIdRef.current = null;
      if (focusStateRef.current) {
        focusStateRef.current = false;
        onFocusChange?.(false);
      }
      target.copy(DEFAULT_TARGET);
      desiredPosition.copy(DEFAULT_POSITION);
      onDistanceTarget?.(null);

      resetTimeRef.current += delta;
      const positionEase = 1 - Math.exp(-delta * 3.5);
      const targetEase = 1 - Math.exp(-delta * 5);

      camera.up.set(0, 1, 0);
      camera.position.lerp(desiredPosition, positionEase);
      controls.target.lerp(target, targetEase);

      controls.minDistance = FREE_FLY_MIN_DISTANCE;
      controls.maxDistance = FREE_FLY_MAX_DISTANCE;
      minDistanceRef.current = null;
      maxDistanceRef.current = null;
      syncCameraFrustum(camera, nearRef, farRef, 0.1, 2000);

      controls.update();

      if (
        (camera.position.distanceTo(DEFAULT_POSITION) < 0.2 &&
          controls.target.distanceTo(DEFAULT_TARGET) < 0.15) ||
        resetTimeRef.current > 1.6
      ) {
        isResettingRef.current = false;
      }
    } else {
      trackedIdRef.current = null;
      minDistanceRef.current = null;
      maxDistanceRef.current = null;
      controls.minDistance = FREE_FLY_MIN_DISTANCE;
      controls.maxDistance = FREE_FLY_MAX_DISTANCE;
      syncCameraFrustum(camera, nearRef, farRef, 0.05, 2000);
      if (focusStateRef.current) {
        focusStateRef.current = false;
        onFocusChange?.(false);
      }
      controls.update();
    }
  });
};
