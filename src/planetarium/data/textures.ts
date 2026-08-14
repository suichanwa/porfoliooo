import type { BodyId } from "./types";

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
import milkyWayTexture from "../../assets/planetarium/BG_stars_milky_way.jpg";
import plutoTexture from "../../assets/planetarium/Pluto-SolarSystemScope.webp";
import earthTexture from "../../assets/planetarium/8k_earth_daymap.jpg";
import moonTexture from "../../assets/planetarium/Solarsystemscope_texture_8k_moon.jpg";
import earthNightTexture from "../../assets/planetarium/8k_earth_nightmap.jpg";

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
  pluto: toUrl(plutoTexture)
};

export const EARTH_NIGHT_TEXTURE = toUrl(earthNightTexture);
export const VENUS_ATMOSPHERE_TEXTURE = toUrl(venusAtmosphereTexture);
export const SATURN_RING_ALPHA_TEXTURE = toUrl(saturnRingAlpha);
export const STARFIELD_TEXTURE = toUrl(starfieldTexture);
export const MILKY_WAY_TEXTURE = toUrl(milkyWayTexture);
