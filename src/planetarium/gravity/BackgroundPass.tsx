import { useEffect, useMemo, type ReactNode } from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import { PerspectiveCamera, Scene } from "three";
import type { GravityBody } from "./gravityField";
import LensingQuad from "./LensingQuad";

interface BackgroundPassProps {
  children: ReactNode;
  bodies: GravityBody[];
  strength: number;
  softening: number;
  maxInfluence: number;
  resolutionScale?: number;
  debug?: boolean;
}

export default function BackgroundPass({
  children,
  bodies,
  strength,
  softening,
  maxInfluence,
  resolutionScale = 0.8,
  debug = false
}: BackgroundPassProps) {
  const { size, camera, gl } = useThree();
  const scene = useMemo(() => new Scene(), []);
  const virtualCamera = useMemo(() => new PerspectiveCamera(), []);
  const renderTarget = useFBO(
    Math.max(1, Math.floor(size.width * resolutionScale)),
    Math.max(1, Math.floor(size.height * resolutionScale)),
    { depthBuffer: false, stencilBuffer: false }
  );

  useEffect(() => {
    renderTarget.setSize(
      Math.max(1, Math.floor(size.width * resolutionScale)),
      Math.max(1, Math.floor(size.height * resolutionScale))
    );
  }, [renderTarget, resolutionScale, size.width, size.height]);

  useFrame(() => {
    if (!camera || !(camera instanceof PerspectiveCamera)) return;

    virtualCamera.position.copy(camera.position);
    virtualCamera.quaternion.copy(camera.quaternion);
    virtualCamera.fov = camera.fov;
    virtualCamera.near = camera.near;
    virtualCamera.far = camera.far;
    virtualCamera.aspect = size.width / size.height;
    virtualCamera.updateProjectionMatrix();

    gl.setRenderTarget(renderTarget);
    gl.clear();
    gl.render(scene, virtualCamera);
    gl.setRenderTarget(null);
  }, 1);

  return (
    <>
      {createPortal(children, scene)}
      <LensingQuad
        texture={renderTarget.texture}
        bodies={bodies}
        strength={strength}
        softening={softening}
        maxInfluence={maxInfluence}
        debug={debug}
      />
    </>
  );
}
