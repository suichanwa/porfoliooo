import type { BodyId } from "./types";

import sunTexture from "../../assets/planetarium/2k_sun.webp";
import mercuryTexture from "../../assets/planetarium/2k_mercury.webp";
import venusSurfaceTexture from "../../assets/planetarium/2k_venus_surface.webp";
import venusAtmosphereTexture from "../../assets/planetarium/2k_venus_atmosphere.webp";
import marsTexture from "../../assets/planetarium/2k_mars.webp";
import jupiterTexture from "../../assets/planetarium/2k_jupiter.webp";
import saturnTexture from "../../assets/planetarium/2k_saturn.webp";
import saturnRingAlpha from "../../assets/planetarium/2k_saturn_ring_alpha.png";
import uranusTexture from "../../assets/planetarium/2k_uranus.webp";
import neptuneTexture from "../../assets/planetarium/2k_neptune.webp";
import ceresTexture from "../../assets/planetarium/2k_ceres_fictional.webp";
import starfieldTexture from "../../assets/planetarium/2k_stars.webp";
import milkyWayTexture from "../../assets/planetarium/BG_stars_milky_way.jpg";
import plutoTexture from "../../assets/planetarium/Pluto-SolarSystemScope.webp";
import earthTexture from "../../assets/planetarium/2k_earth_daymap.webp";
import moonTexture from "../../assets/planetarium/2k_moon.webp";

type TextureAsset = string | { src: string };

const toUrl = (asset: TextureAsset | null | undefined) => {
  if (!asset) return null;
  return typeof asset === "string" ? asset : asset.src;
};

export const PLANET_TEXTURES: Record<BodyId, string | null> = {
  sun: toUrl(sunTexture),
  mercury: toUrl(mercuryTexture),
  venus: toUrl(venusSurfaceTexture),
  earth: toUrl(earthTexture),
  moon: toUrl(moonTexture),
  mars: toUrl(marsTexture),
  jupiter: toUrl(jupiterTexture),
  saturn: toUrl(saturnTexture),
  uranus: toUrl(uranusTexture),
  neptune: toUrl(neptuneTexture),
  ceres: toUrl(ceresTexture),
  pluto: toUrl(plutoTexture),
  voyager1: null
};

export const VENUS_ATMOSPHERE_TEXTURE = toUrl(venusAtmosphereTexture);
export const SATURN_RING_ALPHA_TEXTURE = toUrl(saturnRingAlpha);
export const STARFIELD_TEXTURE = toUrl(starfieldTexture);
export const MILKY_WAY_TEXTURE = toUrl(milkyWayTexture);
