import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, type Ref, type RefObject } from "react";
import { MathUtils, MOUSE, Object3D, Spherical, TOUCH, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { BodyId } from "./data/types";

interface CameraRigProps {
  controlsRef?: Ref<OrbitControlsImpl>;
  planetRefs?: RefObject<Record<BodyId, Object3D | null>>;
  minDistance?: number;
  maxDistance?: number;
  isInspecting?: boolean;
  onZoomOut?: () => void;
}

const KEYBOARD_CONTROL_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End"
]);

const CURSOR_CONE_COS = Math.cos(MathUtils.degToRad(12));
const ORIGIN = new Vector3(0, 0, 0);

export default function CameraRig({
  controlsRef,
  planetRefs,
  minDistance = 0.05,
  maxDistance = 420,
  isInspecting = false,
  onZoomOut
}: CameraRigProps) {
  const { gl } = useThree();
  const localControlsRef = useRef<OrbitControlsImpl | null>(null);
  const isInspectingRef = useRef(isInspecting);
  const offsetRef = useRef(new Vector3());
  const sphericalRef = useRef(new Spherical());
  const previousRadiusRef = useRef<number>(0);

  // Delta-damped free-fly zoom state (zero per-event allocations)
  const camDeltaRef = useRef(new Vector3());
  const targetDeltaRef = useRef(new Vector3());
  const rayDirRef = useRef(new Vector3());
  const desiredCamRef = useRef(new Vector3());
  const desiredTargetRef = useRef(new Vector3());
  const moveDirRef = useRef(new Vector3());
  const bodyPosRef = useRef(new Vector3());
  const toBodyRef = useRef(new Vector3());
  const bestBodyPosRef = useRef(new Vector3());
  const nextCamRef = useRef(new Vector3());
  const nextTargetRef = useRef(new Vector3());
  const stepVecRef = useRef(new Vector3());

  useEffect(() => {
    isInspectingRef.current = isInspecting;
    if (isInspecting) {
      camDeltaRef.current.set(0, 0, 0);
      targetDeltaRef.current.set(0, 0, 0);
    }
  }, [isInspecting]);

  const setRefs = useCallback(
    (controls: OrbitControlsImpl | null) => {
      localControlsRef.current = controls;
      if (controls) {
        const camera = controls.object;
        const targetPoint = controls.target;
        offsetRef.current.copy(camera.position).sub(targetPoint);
        previousRadiusRef.current = offsetRef.current.length();
      }
      if (!controlsRef) return;
      if (typeof controlsRef === "function") {
        controlsRef(controls);
      } else {
        (controlsRef as RefObject<OrbitControlsImpl | null>).current = controls;
      }
    },
    [controlsRef]
  );

  useEffect(() => {
    const controls = localControlsRef.current;
    if (!controls) return;

    const handleStart = () => {
      // Cancel any residual free-fly wheel glide immediately when user drags/pans
      camDeltaRef.current.set(0, 0, 0);
      targetDeltaRef.current.set(0, 0, 0);
    };

    const updateOffset = () => {
      const camera = controls.object;
      const targetPoint = controls.target;
      offsetRef.current.copy(camera.position).sub(targetPoint);
      previousRadiusRef.current = offsetRef.current.length();
    };

    controls.addEventListener("start", handleStart);
    controls.addEventListener("end", updateOffset);
    return () => {
      controls.removeEventListener("start", handleStart);
      controls.removeEventListener("end", updateOffset);
    };
  }, []);

  // Smart Free-Fly Zoom-to-Cursor + Infinite Dolly-Through:
  // When no body is locked (!isInspecting), scrolling zooms smoothly toward the cursor
  // (gently guiding toward any celestial body under the pointer) and continuously slides
  // controls.target forward so you never hit an invisible wall at an old/stale pivot.
  useEffect(() => {
    const domElement = gl.domElement;
    if (!domElement) return;

    const handleWheel = (event: WheelEvent) => {
      if (isInspectingRef.current) return;
      const controls = localControlsRef.current;
      if (!controls) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const rawDelta =
        event.deltaMode === 1
          ? event.deltaY * 16
          : event.deltaMode === 2
            ? event.deltaY * 120
            : event.deltaY;
      const clampedDelta = MathUtils.clamp(rawDelta, -140, 140);
      if (Math.abs(clampedDelta) < 0.01) return;

      const camera = controls.object;
      const rect = domElement.getBoundingClientRect();
      const ndcX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      const desiredCam = desiredCamRef.current
        .copy(camera.position)
        .add(camDeltaRef.current);
      const desiredTarget = desiredTargetRef.current
        .copy(controls.target)
        .add(targetDeltaRef.current);
      const distToTarget = desiredCam.distanceTo(desiredTarget);

      if (clampedDelta < 0) {
        // ZOOM IN: project ray through pointer
        const rayDir = rayDirRef.current
          .set(ndcX, ndcY, 0.5)
          .unproject(camera)
          .sub(camera.position)
          .normalize();

        // Check if the cursor is aiming near any visible celestial body
        let hasMatchedBody = false;
        let bestScore = CURSOR_CONE_COS;
        let bestDist = Infinity;

        if (planetRefs?.current) {
          const refs = planetRefs.current;
          for (const key in refs) {
            const obj = refs[key as BodyId];
            if (!obj || !obj.visible) continue;
            obj.getWorldPosition(bodyPosRef.current);
            const toBody = toBodyRef.current.copy(bodyPosRef.current).sub(desiredCam);
            const dist = toBody.length();
            if (dist < 0.15) continue;
            toBody.divideScalar(dist);
            const cosAngle = toBody.dot(rayDir);
            if (cosAngle > bestScore) {
              bestScore = cosAngle;
              bestDist = dist;
              bestBodyPosRef.current.copy(bodyPosRef.current);
              hasMatchedBody = true;
            }
          }
        }

        const moveDir = moveDirRef.current.copy(rayDir);
        let referenceDist: number;

        if (hasMatchedBody) {
          // Gently steer approach toward the targeted body so flying to distant Voyager/planets feels effortless
          toBodyRef.current
            .copy(bestBodyPosRef.current)
            .sub(desiredCam)
            .normalize();
          moveDir.lerp(toBodyRef.current, 0.38).normalize();
          referenceDist = bestDist;
        } else {
          // Open space: keep a responsive minimum reference distance so you never stall at a stale target
          referenceDist = Math.max(distToTarget, 8.0);
        }

        const zoomFraction = Math.min(0.45, (-clampedDelta / 420) * 1.15);
        let step = MathUtils.clamp(referenceDist * zoomFraction, 0.05, 36);

        if (hasMatchedBody) {
          // Allow gliding close to the body without punching straight through its center
          const maxSafeStep = Math.max(0, bestDist - 0.55);
          step = Math.min(step, maxSafeStep);
        }

        const nextCam = nextCamRef.current
          .copy(desiredCam)
          .addScaledVector(moveDir, step);

        // Keep the camera within the outer solar system envelope
        const nextCamDistFromOrigin = nextCam.length();
        if (nextCamDistFromOrigin > maxDistance) {
          nextCam.multiplyScalar(maxDistance / nextCamDistFromOrigin);
        }

        const nextTarget = nextTargetRef.current.copy(desiredTarget);
        if (hasMatchedBody) {
          // Smoothly shift orbit pivot onto the body you're flying toward
          const blend = MathUtils.clamp(
            step / Math.max(bestDist, 0.5) * 1.6,
            0.18,
            0.65
          );
          nextTarget.lerp(bestBodyPosRef.current, blend);
        } else {
          // Infinite dolly-through: keep the orbit pivot ahead of the camera along the flight ray
          const remainingPivot = Math.max(3.5, distToTarget - step);
          nextTarget.copy(nextCam).addScaledVector(moveDir, remainingPivot);
        }

        camDeltaRef.current.copy(nextCam).sub(camera.position);
        targetDeltaRef.current.copy(nextTarget).sub(controls.target);
      } else {
        // ZOOM OUT: pull smoothly backward and gently re-center the solar system at overview range
        const backDir = moveDirRef.current.copy(desiredCam).sub(desiredTarget);
        const backLen = backDir.length();
        if (backLen < 1e-4) {
          camera.getWorldDirection(backDir).negate();
        } else {
          backDir.divideScalar(backLen);
        }

        const zoomFraction = Math.min(0.45, (clampedDelta / 420) * 1.15);
        const step = MathUtils.clamp(Math.max(distToTarget, 4.0) * zoomFraction, 0.08, 44);

        const nextCam = nextCamRef.current
          .copy(desiredCam)
          .addScaledVector(backDir, step);
        const distFromOrigin = nextCam.length();
        if (distFromOrigin > maxDistance) {
          nextCam.multiplyScalar(maxDistance / distFromOrigin);
        }

        const nextTarget = nextTargetRef.current.copy(desiredTarget);
        if (distFromOrigin > 55) {
          // As you zoom out into solar-system overview, smoothly pull any stale target back to the Sun (0,0,0)
          const recenterStrength = MathUtils.clamp((distFromOrigin - 55) / 140, 0.06, 0.35);
          nextTarget.lerp(ORIGIN, recenterStrength);
        }

        camDeltaRef.current.copy(nextCam).sub(camera.position);
        targetDeltaRef.current.copy(nextTarget).sub(controls.target);
      }
    };

    domElement.addEventListener("wheel", handleWheel, {
      passive: false,
      capture: true
    });
    return () => {
      domElement.removeEventListener("wheel", handleWheel, { capture: true });
    };
  }, [gl, maxDistance, planetRefs]);

  // Apply damped free-fly zoom deltas smoothly every frame
  useFrame((_, delta) => {
    const controls = localControlsRef.current;
    if (!controls || isInspectingRef.current) return;

    const camSq = camDeltaRef.current.lengthSq();
    const targetSq = targetDeltaRef.current.lengthSq();
    if (camSq < 1e-8 && targetSq < 1e-8) return;

    const ease = 1 - Math.exp(-Math.min(delta, 0.05) * 14);
    const camera = controls.object;

    if (camSq >= 1e-8) {
      stepVecRef.current.copy(camDeltaRef.current).multiplyScalar(ease);
      camera.position.add(stepVecRef.current);
      camDeltaRef.current.sub(stepVecRef.current);
    } else {
      camDeltaRef.current.set(0, 0, 0);
    }

    if (targetSq >= 1e-8) {
      stepVecRef.current.copy(targetDeltaRef.current).multiplyScalar(ease);
      controls.target.add(stepVecRef.current);
      targetDeltaRef.current.sub(stepVecRef.current);
    } else {
      targetDeltaRef.current.set(0, 0, 0);
    }

    controls.update();
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const code = event.code;
      if (!KEYBOARD_CONTROL_KEYS.has(code)) return;

      const controls = localControlsRef.current;
      if (!controls) return;

      event.preventDefault();

      const camera = controls.object;
      const targetPoint = controls.target;
      offsetRef.current.copy(camera.position).sub(targetPoint);
      sphericalRef.current.setFromVector3(offsetRef.current);

      const rotateStep = MathUtils.degToRad(3);
      const zoomStep = Math.max(0.5, sphericalRef.current.radius * 0.08);
      const minDist = Number.isFinite(controls.minDistance)
        ? controls.minDistance
        : minDistance;
      const maxDist = Number.isFinite(controls.maxDistance)
        ? controls.maxDistance
        : maxDistance;

      switch (code) {
        case "ArrowLeft":
          sphericalRef.current.theta += rotateStep;
          break;
        case "ArrowRight":
          sphericalRef.current.theta -= rotateStep;
          break;
        case "ArrowUp":
          sphericalRef.current.phi -= rotateStep;
          break;
        case "ArrowDown":
          sphericalRef.current.phi += rotateStep;
          break;
        case "PageUp":
          if (!isInspectingRef.current && sphericalRef.current.radius - zoomStep < 2.5) {
            // Dolly-through in free-fly mode so keyboard zoom also never stalls
            camera.getWorldDirection(moveDirRef.current);
            camera.position.addScaledVector(moveDirRef.current, zoomStep);
            targetPoint.addScaledVector(moveDirRef.current, zoomStep);
            controls.update();
            return;
          }
          sphericalRef.current.radius = MathUtils.clamp(
            sphericalRef.current.radius - zoomStep,
            minDist,
            maxDist
          );
          break;
        case "PageDown":
          sphericalRef.current.radius = MathUtils.clamp(
            sphericalRef.current.radius + zoomStep,
            minDist,
            maxDist
          );
          if (onZoomOut) onZoomOut();
          break;
        case "Home":
          sphericalRef.current.phi = controls.minPolarAngle;
          break;
        case "End":
          sphericalRef.current.phi = controls.maxPolarAngle;
          break;
        default:
          break;
      }

      sphericalRef.current.phi = MathUtils.clamp(
        sphericalRef.current.phi,
        controls.minPolarAngle,
        controls.maxPolarAngle
      );
      sphericalRef.current.makeSafe();
      offsetRef.current.setFromSpherical(sphericalRef.current);
      camera.position.copy(targetPoint).add(offsetRef.current);
      controls.update();
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [minDistance, maxDistance, onZoomOut]);

  // Prevent browser context menu on the canvas so holding right-click seamlessly pans
  useEffect(() => {
    const domElement = gl.domElement;
    if (!domElement) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    domElement.addEventListener("contextmenu", handleContextMenu);
    return () => {
      domElement.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [gl]);

  return (
    <OrbitControls
      ref={setRefs}
      makeDefault
      enablePan={true}
      screenSpacePanning={true}
      panSpeed={isInspecting ? 0.85 : 1.0}
      enableZoom
      enableDamping
      dampingFactor={0.05}
      rotateSpeed={isInspecting ? 0.65 : 0.6}
      zoomSpeed={isInspecting ? 1.1 : 0.8}
      minDistance={isInspecting ? 0.15 : minDistance}
      maxDistance={isInspecting ? Math.max(maxDistance, 260) : maxDistance}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI - 0.35}
      mouseButtons={{
        LEFT: MOUSE.ROTATE,
        MIDDLE: MOUSE.DOLLY,
        RIGHT: MOUSE.PAN
      }}
      touches={{
        ONE: TOUCH.ROTATE,
        TWO: TOUCH.DOLLY_PAN
      }}
    />
  );
}
