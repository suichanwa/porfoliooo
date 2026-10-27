import { PLANETS } from "./planets";
import { MOONS } from "./moons";
import type { BodyData, BodyId } from "./types";

export const ALL_BODIES: BodyData[] = [...PLANETS, ...MOONS];

export const PLANET_IDS = ALL_BODIES.map((planet) => planet.id) as BodyId[];

export const ORBITING_PLANETS = ALL_BODIES.filter(
  (planet): planet is BodyData & { parentId: BodyId } => Boolean(planet.parentId)
);

export const PLANET_BY_ID = Object.fromEntries(
  ALL_BODIES.map((planet) => [planet.id, planet])
) as Record<BodyId, BodyData>;

export const createBodyRefStore = <T>(initialValue: T) =>
  Object.fromEntries(PLANET_IDS.map((id) => [id, initialValue])) as Record<
    BodyId,
    T
  >;
