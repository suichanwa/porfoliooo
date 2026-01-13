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

const textureCache = new Map<string, Texture>();
const pendingLoads = new Map<string, Promise<Texture>>();
const loader = new TextureLoader();

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

const loadTexture = (url: string) => {
  const cached = textureCache.get(url);
  if (cached) {
    return Promise.resolve(cached);
  }

  const pending = pendingLoads.get(url);
  if (pending) {
    return pending;
  }

  const promise = new Promise<Texture>((resolve, reject) => {
    loader.load(
      url,
      (loaded) => {
        loaded.colorSpace = SRGBColorSpace;
        loaded.needsUpdate = true;
        textureCache.set(url, loaded);
        pendingLoads.delete(url);
        resolve(loaded);
      },
      undefined,
      (error) => {
        pendingLoads.delete(url);
        reject(error);
      }
    );
  });

  pendingLoads.set(url, promise);
  return promise;
};

export const preloadPlanetTextures = (
  urls: Array<string | null | undefined>
) => {
  const validUrls = urls.filter(
    (url): url is string => typeof url === "string" && url.length > 0
  );

  validUrls.forEach((url) => {
    void loadTexture(url);
  });
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

    let isActive = true;

    const cached = textureCache.get(textureUrl);
    if (cached) {
      setTexture(cached);
    } else {
      loadTexture(textureUrl)
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
  }, [textureUrl, fallbackTexture]);

  return texture;
};
