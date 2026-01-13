import type { PlanetId } from "./types";

import sunTexture from "../../assets/planetarium/2k_sun.jpg";
import mercuryTexture from "../../assets/planetarium/2k_mercury.jpg";
import venusSurfaceTexture from "../../assets/planetarium/2k_venus_surface.jpg";
import venusAtmosphereTexture from "../../assets/planetarium/2k_venus_atmosphere.jpg";
import marsTexture from "../../assets/planetarium/2k_mars.jpg";
import jupiterTexture from "../../assets/planetarium/2k_jupiter.jpg";
import saturnTexture from "../../assets/planetarium/2k_saturn.jpg";
import saturnRingAlpha from "../../assets/planetarium/2k_saturn_ring_alpha.png";
import uranusTexture from "../../assets/planetarium/2k_uranus.jpg";
import neptuneTexture from "../../assets/planetarium/2k_neptune.jpg";
import ceresTexture from "../../assets/planetarium/2k_ceres_fictional.jpg";
import starfieldTexture from "../../assets/planetarium/2k_stars.jpg";
import plutoTexture from "../../assets/planetarium/Pluto-SolarSystemScope.webp";

type TextureAsset = string | { src: string };

const toUrl = (asset: TextureAsset | null | undefined) => {
  if (!asset) return null;
  return typeof asset === "string" ? asset : asset.src;
};

export const PLANET_TEXTURES: Record<PlanetId, string | null> = {
  sun: toUrl(sunTexture),
  mercury: toUrl(mercuryTexture),
  venus: toUrl(venusSurfaceTexture),
  earth: null,
  mars: toUrl(marsTexture),
  jupiter: toUrl(jupiterTexture),
  saturn: toUrl(saturnTexture),
  uranus: toUrl(uranusTexture),
  neptune: toUrl(neptuneTexture),
  ceres: toUrl(ceresTexture),
  pluto: toUrl(plutoTexture)
};

export const VENUS_ATMOSPHERE_TEXTURE = toUrl(venusAtmosphereTexture);
export const SATURN_RING_ALPHA_TEXTURE = toUrl(saturnRingAlpha);
export const STARFIELD_TEXTURE = toUrl(starfieldTexture);