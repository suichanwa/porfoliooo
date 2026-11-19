import {
  usePlutoBarycenterVisuals,
  type UsePlutoBarycenterVisualsOptions
} from "../hooks/usePlutoBarycenterVisuals";

export type PlutoBarycenterVisualsProps = UsePlutoBarycenterVisualsOptions;

export default function PlutoBarycenterVisuals(props: PlutoBarycenterVisualsProps) {
  const {
    groupRef,
    tiltRad,
    innerRingLine,
    outerRingLine,
    tetherLine,
    crosshairSegments
  } = usePlutoBarycenterVisuals(props);

  return (
    <group ref={groupRef} rotation={[0, 0, tiltRad]}>
      <primitive object={innerRingLine} />
      <primitive object={outerRingLine} />
      <primitive object={tetherLine} />
      <primitive object={crosshairSegments} />
    </group>
  );
}
