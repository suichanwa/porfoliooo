import { PLANETS } from "./planets";
import type { BodyData, BodyId } from "./types";

export const PLANET_IDS = PLANETS.map((planet) => planet.id) as BodyId[];

export const ORBITING_PLANETS = PLANETS.filter(
  (planet): planet is BodyData & { parentId: "sun" } => planet.parentId === "sun"
);

export const PLANET_BY_ID = Object.fromEntries(
  PLANETS.map((planet) => [planet.id, planet])
) as Record<BodyId, BodyData>;

export const createBodyRefStore = <T>(initialValue: T) =>
  Object.fromEntries(PLANET_IDS.map((id) => [id, initialValue])) as Record<
    BodyId,
    T
  >;
