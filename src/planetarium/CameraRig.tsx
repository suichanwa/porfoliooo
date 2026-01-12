import { OrbitControls } from "@react-three/drei";

export default function CameraRig() {
  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableZoom
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.8}
      minDistance={8}
      maxDistance={140}
      minPolarAngle={0.25}
      maxPolarAngle={Math.PI - 0.35}
    />
  );
}
