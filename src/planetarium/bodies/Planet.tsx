import type { ComponentProps } from "react";
import BodyMesh from "./BodyMesh";

type PlanetProps = ComponentProps<typeof BodyMesh>;

export default function Planet(props: PlanetProps) {
  return <BodyMesh {...props} />;
}
