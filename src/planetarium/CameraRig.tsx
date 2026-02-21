import { OrbitControls } from "@react-three/drei";
import { useCallback, useEffect, useRef, type MutableRefObject, type Ref } from "react";
import { MathUtils, Spherical, Vector3 } from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface CameraRigProps {
  controlsRef?: Ref<OrbitControlsImpl>;
  minDistance?: number;
  maxDistance?: number;
  isInspecting?: boolean;
  onZoomOut?: () => void;
}

export default function CameraRig({
  controlsRef,
  minDistance = 8,
  maxDistance = 140,
  isInspecting = false,
  onZoomOut
}: CameraRigProps) {
  const localControlsRef = useRef<OrbitControlsImpl | null>(null);
  const offsetRef = useRef(new Vector3());
  const sphericalRef = useRef(new Spherical());
  const previousRadiusRef = useRef<number>(0);

  const setRefs = useCallback(
    (controls: OrbitControlsImpl | null) => {
      localControlsRef.current = controls;
      if (controls) {
        const camera = controls.object;
        const targetPoint = controls.target;
        const offset = new Vector3().copy(camera.position).sub(targetPoint);
        previousRadiusRef.current = offset.length();
      }
      if (!controlsRef) return;
      if (typeof controlsRef === "function") {
        controlsRef(controls);
      } else {
        (controlsRef as MutableRefObject<OrbitControlsImpl | null>).current = controls;
      }
    },
    [controlsRef]
  );

  useEffect(() => {
    const controls = localControlsRef.current;
    if (!controls || !onZoomOut) return;

    const handleChange = () => {
      const camera = controls.object;
      const targetPoint = controls.target;
      const offset = new Vector3().copy(camera.position).sub(targetPoint);
      const currentRadius = offset.length();

      // Detect zoom out (radius increasing by a meaningful amount)
      if (currentRadius > previousRadiusRef.current + 0.5) {
        onZoomOut();
      }

      previousRadiusRef.current = currentRadius;
    };

    controls.addEventListener("change", handleChange);
    return () => {
      controls.removeEventListener("change", handleChange);
    };
  }, [onZoomOut]);

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
      const handledKeys = [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "PageUp",
        "PageDown",
        "Home",
        "End"
      ];
      if (!handledKeys.includes(code)) return;

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

  return (
    <OrbitControls
      ref={setRefs}
      makeDefault
      enablePan={false}
      enableZoom
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={isInspecting ? 0.65 : 0.6}
      zoomSpeed={isInspecting ? 1.1 : 0.8}
      minDistance={isInspecting ? 0.4 : minDistance}
      maxDistance={isInspecting ? Math.max(maxDistance, 140) : maxDistance}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI - 0.35}
    />
  );
}

