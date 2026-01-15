import { useEffect, useMemo, useState } from "react";
import {
  Color,
  DataTexture,
  LinearFilter,
  type ColorSpace,
  RGBAFormat,
  SRGBColorSpace,
  Texture,
  TextureLoader
} from "three";

const textureCache = new Map<string, Texture>();
const pendingLoads = new Map<string, Promise<Texture>>();
const loader = new TextureLoader();

const cacheKey = (url: string, colorSpace: ColorSpace) =>
  `${url}::${colorSpace}`;

const createFallbackTexture = (hex: string, colorSpace: ColorSpace) => {
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
  texture.colorSpace = colorSpace;
  return texture;
};

const loadTexture = (url: string, colorSpace: ColorSpace) => {
  const key = cacheKey(url, colorSpace);
  const cached = textureCache.get(key);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = pendingLoads.get(key);
  if (pending) {
    return pending;
  }

  const promise = new Promise<Texture>((resolve, reject) => {
    loader.load(
      url,
      (loaded) => {
        loaded.colorSpace = colorSpace;
        loaded.needsUpdate = true;
        textureCache.set(key, loaded);
        pendingLoads.delete(key);
        resolve(loaded);
      },
      undefined,
      (error) => {
        pendingLoads.delete(key);
        reject(error);
      }
    );
  });

  pendingLoads.set(key, promise);
  return promise;
};

const preloadTextures = (
  urls: Array<string | null | undefined>,
  colorSpace: ColorSpace
) => {
  const validUrls = urls.filter(
    (url): url is string => typeof url === "string" && url.length > 0
  );

  validUrls.forEach((url) => {
    void loadTexture(url, colorSpace);
  });
};

export const preloadPlanetTextures = (
  urls: Array<string | null | undefined>
) => preloadTextures(urls, SRGBColorSpace);

type TextureOptions = {
  fallbackColor?: string;
  colorSpace?: ColorSpace;
};

export const useTextureAsset = (
  textureUrl: string | null | undefined,
  options: TextureOptions = {}
) => {
  const { fallbackColor, colorSpace = SRGBColorSpace } = options;
  const fallbackTexture = useMemo(
    () => (fallbackColor ? createFallbackTexture(fallbackColor, colorSpace) : null),
    [fallbackColor, colorSpace]
  );
  const [texture, setTexture] = useState<Texture | null>(fallbackTexture);

  useEffect(() => {
    if (!textureUrl) {
      setTexture(fallbackTexture);
      return;
    }

    let isActive = true;

    const key = cacheKey(textureUrl, colorSpace);
    const cached = textureCache.get(key);
    if (cached) {
      setTexture(cached);
    } else {
      loadTexture(textureUrl, colorSpace)
        .then((loaded) => {
          if (!isActive) return;
          setTexture(loaded);
        })
        .catch(() => {
          if (!isActive) return;
          setTexture(fallbackTexture);
        });
    }

    return () => {
      isActive = false;
    };
  }, [textureUrl, fallbackTexture, colorSpace]);

  return texture;
};

export const usePlanetTexture = (
  textureUrl: string | null | undefined,
  fallbackColor: string
) => useTextureAsset(textureUrl, { fallbackColor, colorSpace: SRGBColorSpace });
