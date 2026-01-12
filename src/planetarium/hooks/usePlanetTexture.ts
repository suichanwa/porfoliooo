import { useEffect, useMemo, useState } from "react";
import {
  Color,
  DataTexture,
  LinearFilter,
  RGBAFormat,
  SRGBColorSpace,
  Texture,
  TextureLoader
} from "three";

const createFallbackTexture = (hex: string) => {
  const color = new Color(hex);
  const data = new Uint8Array([
    Math.round(color.r * 255),
    Math.round(color.g * 255),
    Math.round(color.b * 255),
    255
  ]);
  const texture = new DataTexture(data, 1, 1, RGBAFormat);
  texture.needsUpdate = true;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  return texture;
};

export const usePlanetTexture = (
  textureUrl: string | null | undefined,
  fallbackColor: string
) => {
  const fallbackTexture = useMemo(
    () => createFallbackTexture(fallbackColor),
    [fallbackColor]
  );
  const [texture, setTexture] = useState<Texture>(fallbackTexture);

  useEffect(() => {
    if (!textureUrl) {
      setTexture(fallbackTexture);
      return;
    }

    const loader = new TextureLoader();
    let isActive = true;

    loader.load(
      textureUrl,
      (loaded) => {
        if (!isActive) return;
        loaded.colorSpace = SRGBColorSpace;
        setTexture(loaded);
      },
      undefined,
      () => {
        if (!isActive) return;
        setTexture(fallbackTexture);
      }
    );

    return () => {
      isActive = false;
    };
  }, [textureUrl, fallbackTexture]);

  return texture;
};
