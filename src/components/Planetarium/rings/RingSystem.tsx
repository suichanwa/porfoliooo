import { useMemo } from "react";
import type { RingPreset } from "../../../planetarium/data/types";
import RingBand from "./RingBand";

interface RingSystemProps {
  planetRadiusKm: number;
  renderRadius: number;
  rings: RingPreset[];
}

interface ScaledRing {
  key: string;
  innerRadius: number;
  outerRadius: number;
  textureUrl?: string | null;
  color?: string;
  opacity?: number;
  patternSeed?: number;
  bandDensity?: number;
}

const toKey = (ring: RingPreset, index: number) =>
  ring.name ?? `ring-${index}`;

export default function RingSystem({
  planetRadiusKm,
  renderRadius,
  rings
}: RingSystemProps) {
  const scaled = useMemo<ScaledRing[]>(() => {
    if (!Number.isFinite(planetRadiusKm) || planetRadiusKm <= 0) return [];
    if (!Number.isFinite(renderRadius) || renderRadius <= 0) return [];

    return rings
      .map((ring, index) => {
        const innerRatio = ring.innerRadiusKm / planetRadiusKm;
        const outerRatio = ring.outerRadiusKm / planetRadiusKm;
        if (!Number.isFinite(innerRatio) || !Number.isFinite(outerRatio)) {
          return null;
        }
        const innerRadius = renderRadius * innerRatio;
        const outerRadius = renderRadius * outerRatio;
        if (outerRadius <= innerRadius) return null;
        return {
          key: toKey(ring, index),
          innerRadius,
          outerRadius,
          textureUrl: ring.textureUrl ?? null,
          color: ring.color,
          opacity: ring.opacity,
          patternSeed: ring.patternSeed,
          bandDensity: ring.bandDensity
        };
      })
      .filter((ring): ring is ScaledRing => Boolean(ring));
  }, [planetRadiusKm, renderRadius, rings]);

  if (scaled.length === 0) return null;

  return (
    <>
      {scaled.map((ring, index) => (
        <RingBand
          key={ring.key}
          innerRadius={ring.innerRadius}
          outerRadius={ring.outerRadius}
          textureUrl={ring.textureUrl}
          color={ring.color}
          opacity={ring.opacity}
          patternSeed={ring.patternSeed}
          bandDensity={ring.bandDensity}
          renderOrder={index}
        />
      ))}
    </>
  );
}
