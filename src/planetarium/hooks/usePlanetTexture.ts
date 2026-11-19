import { useEffect, useMemo, useState } from "react";
import {
  Color,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  type ColorSpace,
  RGBAFormat,
  SRGBColorSpace,
  Texture,
  TextureLoader
} from "three";

const textureCache = new Map<string, Texture>();
const pendingLoads = new Map<string, Promise<Texture>>();
const loader = new TextureLoader();

export interface TexturePreloadDescriptor {
  url: string | null | undefined;
  colorSpace?: ColorSpace;
}

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
        loaded.generateMipmaps = true;
        loaded.minFilter = LinearMipmapLinearFilter;
        loaded.magFilter = LinearFilter;
        loaded.anisotropy = 4;
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
    void loadTexture(url, colorSpace).catch(() => {});
  });
};

export const preloadPlanetTextures = (
  urls: Array<string | null | undefined>
) => preloadTextures(urls, SRGBColorSpace);

export const preloadTextureAssets = (assets: TexturePreloadDescriptor[]) => {
  assets.forEach(({ url, colorSpace = SRGBColorSpace }) => {
    if (typeof url === "string" && url.length > 0) {
      void loadTexture(url, colorSpace).catch(() => {});
    }
  });
};

// Gently preloads deferred textures (such as hidden moon albedo/normal maps) one by one
// during browser idle slices so initial scene startup stays fast and stutter-free.
export const preloadTextureAssetsInBackground = (
  assets: TexturePreloadDescriptor[],
  options: { initialDelayMs?: number; stepDelayMs?: number } = {}
): (() => void) => {
  const { initialDelayMs = 1400, stepDelayMs = 140 } = options;
  const queue = assets.filter(
    (item): item is { url: string; colorSpace?: ColorSpace } =>
      typeof item.url === "string" && item.url.length > 0
  );

  let cancelled = false;
  let timerId: number | null = null;
  let idleId: number | null = null;
  let index = 0;

  const scheduleNext = (delayMs: number) => {
    if (cancelled || index >= queue.length) return;
    timerId = window.setTimeout(() => {
      if (cancelled) return;
      const runStep = () => {
        if (cancelled || index >= queue.length) return;
        const next = queue[index];
        index += 1;
        const colorSpace = next.colorSpace ?? SRGBColorSpace;
        const key = cacheKey(next.url, colorSpace);

        // Skip already-cached textures immediately without waiting
        if (textureCache.has(key)) {
          scheduleNext(0);
          return;
        }

        void loadTexture(next.url, colorSpace)
          .catch(() => {})
          .finally(() => {
            scheduleNext(stepDelayMs);
          });
      };

      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(runStep, { timeout: 1500 });
      } else {
        runStep();
      }
    }, delayMs);
  };

  scheduleNext(initialDelayMs);

  return () => {
    cancelled = true;
    if (timerId !== null) window.clearTimeout(timerId);
    if (idleId !== null && typeof window.cancelIdleCallback === "function") {
      window.cancelIdleCallback(idleId);
    }
  };
};

type TextureOptions = {
  fallbackColor?: string;
  colorSpace?: ColorSpace;
  enabled?: boolean;
};

export const useTextureAsset = (
  textureUrl: string | null | undefined,
  options: TextureOptions = {}
) => {
  const { fallbackColor, colorSpace = SRGBColorSpace, enabled = true } = options;
  const fallbackTexture = useMemo(
    () => (fallbackColor ? createFallbackTexture(fallbackColor, colorSpace) : null),
    [fallbackColor, colorSpace]
  );

  const [texture, setTexture] = useState<Texture | null>(() => {
    if (!enabled || !textureUrl) return fallbackTexture;
    return textureCache.get(cacheKey(textureUrl, colorSpace)) ?? fallbackTexture;
  });

  useEffect(() => {
    if (!enabled || !textureUrl) {
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
  }, [textureUrl, fallbackTexture, colorSpace, enabled]);

  return texture;
};

export const usePlanetTexture = (
  textureUrl: string | null | undefined,
  fallbackColor: string
) => useTextureAsset(textureUrl, { fallbackColor, colorSpace: SRGBColorSpace });
