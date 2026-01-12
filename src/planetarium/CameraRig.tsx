import { OrbitControls } from "@react-three/drei";
import type { Ref } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

interface CameraRigProps {
  controlsRef?: Ref<OrbitControlsImpl>;
  minDistance?: number;
  maxDistance?: number;
}

export default function CameraRig({
  controlsRef,
  minDistance = 8,
  maxDistance = 140
}: CameraRigProps) {
  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableZoom
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      minDistance={minDistance}
      maxDistance={maxDistance}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI - 0.35}
    />
  );
}
