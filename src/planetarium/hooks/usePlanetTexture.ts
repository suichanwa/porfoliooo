import { useEffect, useMemo, useState } from "react";
import {
  Color,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  type ColorSpace,
  RGBAFormat,
  SRGBColorSpace,
  Texture,
  type WebGLRenderer
} from "three";

const textureCache = new Map<string, Texture>();
const pendingLoads = new Map<string, Promise<Texture>>();
const uploadedKeys = new Set<string>();
const queuedUploadKeys = new Set<string>();
const uploadQueue: Array<{ key: string; texture: Texture }> = [];
const readyListeners = new Map<string, Set<(texture: Texture) => void>>();
let activeRenderer: WebGLRenderer | null = null;
let uploadRafId: number | null = null;

export interface TexturePreloadDescriptor {
  url: string | null | undefined;
  colorSpace?: ColorSpace;
}

const cacheKey = (url: string, colorSpace: ColorSpace) =>
  `${url}::${colorSpace}`;

const notifyReady = (key: string, texture: Texture) => {
  const listeners = readyListeners.get(key);
  if (!listeners) return;
  listeners.forEach((cb) => cb(texture));
};

const subscribeReady = (key: string, cb: (texture: Texture) => void) => {
  let set = readyListeners.get(key);
  if (!set) {
    set = new Set();
    readyListeners.set(key, set);
  }
  set.add(cb);
  return () => {
    set?.delete(cb);
    if (set && set.size === 0) {
      readyListeners.delete(key);
    }
  };
};

// Drain GPU texture uploads strictly 1 per animation frame so VRAM uploads never spike frame times
const drainUploadQueue = () => {
  uploadRafId = null;
  if (!activeRenderer || uploadQueue.length === 0) return;

  const item = uploadQueue.shift();
  if (item) {
    queuedUploadKeys.delete(item.key);
    if (!uploadedKeys.has(item.key)) {
      try {
        activeRenderer.initTexture(item.texture);
        uploadedKeys.add(item.key);
      } catch {
        // Ignore if WebGL context is temporarily lost
      }
    }
  }

  if (uploadQueue.length > 0 && typeof window !== "undefined") {
    uploadRafId = window.requestAnimationFrame(drainUploadQueue);
  }
};

const enqueueGpuUpload = (key: string, texture: Texture) => {
  if (!activeRenderer || uploadedKeys.has(key) || queuedUploadKeys.has(key)) {
    return;
  }
  queuedUploadKeys.add(key);
  uploadQueue.push({ key, texture });
  if (uploadRafId === null && typeof window !== "undefined") {
    uploadRafId = window.requestAnimationFrame(drainUploadQueue);
  }
};

// Register the active WebGLRenderer so background-loaded textures can be
// pre-uploaded to VRAM (gl.initTexture) one per frame before the user clicks a planet.
export const registerTextureRenderer = (renderer: WebGLRenderer | null) => {
  activeRenderer = renderer;
  if (!renderer) {
    if (uploadRafId !== null && typeof window !== "undefined") {
      window.cancelAnimationFrame(uploadRafId);
      uploadRafId = null;
    }
    uploadQueue.length = 0;
    queuedUploadKeys.clear();
  } else if (uploadQueue.length > 0 && uploadRafId === null) {
    uploadRafId = window.requestAnimationFrame(drainUploadQueue);
  }
};

// Shared 1x1 flat tangent-space normal map (0.5, 0.5, 1.0) so MeshStandardMaterial
// keeps USE_NORMALMAP compiled from frame 0 and never recompiles shaders on swap.
let sharedFlatNormalTexture: DataTexture | null = null;
export const getFlatNormalTexture = () => {
  if (!sharedFlatNormalTexture) {
    const data = new Uint8Array([128, 128, 255, 255]);
    const tex = new DataTexture(data, 1, 1, RGBAFormat);
    tex.needsUpdate = true;
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    tex.colorSpace = NoColorSpace;
    sharedFlatNormalTexture = tex;
  }
  return sharedFlatNormalTexture;
};

let sharedNeutralBumpTexture: DataTexture | null = null;
export const getNeutralBumpTexture = () => {
  if (!sharedNeutralBumpTexture) {
    const data = new Uint8Array([128, 128, 128, 255]);
    const tex = new DataTexture(data, 1, 1, RGBAFormat);
    tex.needsUpdate = true;
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    tex.colorSpace = NoColorSpace;
    sharedNeutralBumpTexture = tex;
  }
  return sharedNeutralBumpTexture;
};

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

// Loads an HTMLImageElement and decodes it asynchronously off the main thread
// before constructing the Three.js Texture so GPU upload doesn't stall frames.
const loadDecodedImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (typeof img.decode === "function") {
        img.decode().then(() => resolve(img)).catch(() => resolve(img));
      } else {
        resolve(img);
      }
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });

const loadTexture = (
  url: string,
  colorSpace: ColorSpace,
  options: { preUploadGpu?: boolean } = {}
) => {
  const key = cacheKey(url, colorSpace);
  const cached = textureCache.get(key);
  if (cached) {
    if (options.preUploadGpu) {
      enqueueGpuUpload(key, cached);
    }
    return Promise.resolve(cached);
  }

  const pending = pendingLoads.get(key);
  if (pending) {
    return options.preUploadGpu
      ? pending.then((tex) => {
          enqueueGpuUpload(key, tex);
          return tex;
        })
      : pending;
  }

  const promise = loadDecodedImage(url)
    .then((img) => {
      const loaded = new Texture(img);
      loaded.colorSpace = colorSpace;
      loaded.generateMipmaps = true;
      loaded.minFilter = LinearMipmapLinearFilter;
      loaded.magFilter = LinearFilter;
      loaded.anisotropy = 2;
      loaded.needsUpdate = true;

      textureCache.set(key, loaded);
      pendingLoads.delete(key);

      if (options.preUploadGpu) {
        enqueueGpuUpload(key, loaded);
      }

      notifyReady(key, loaded);
      return loaded;
    })
    .catch((error) => {
      pendingLoads.delete(key);
      throw error;
    });

  pendingLoads.set(key, promise);
  return promise;
};

export const preloadPlanetTextures = (
  urls: Array<string | null | undefined>
) =>
  preloadTextureAssets(
    urls.map((url) => ({ url, colorSpace: SRGBColorSpace }))
  );

export const preloadTextureAssets = (
  assets: TexturePreloadDescriptor[],
  options: { preUploadGpu?: boolean } = {}
): Promise<void> => {
  const tasks = assets
    .filter(
      (item): item is { url: string; colorSpace?: ColorSpace } =>
        typeof item.url === "string" && item.url.length > 0
    )
    .map(({ url, colorSpace = SRGBColorSpace }) =>
      loadTexture(url, colorSpace, options).catch(() => {})
    );

  return Promise.all(tasks).then(() => undefined);
};

// Two-stage loader:
// 1. First loads all high-priority (first-importance) planet textures with paced 1-per-frame VRAM uploads.
// 2. Immediately after Stage 1 finishes (or after maxStartDelayMs), streams secondary (hidden moon)
//    textures strictly one at a time in the background with async decode + 1-per-frame GPU pre-upload
//    so Uranus & Neptune moons are fully ready in VRAM within ~3-4s before clicking any planet.
export const runTwoStageTexturePreload = (
  primaryAssets: TexturePreloadDescriptor[],
  secondaryAssets: TexturePreloadDescriptor[],
  options: { settleDelayMs?: number; stepDelayMs?: number } = {}
): (() => void) => {
  const { settleDelayMs = 200, stepDelayMs = 150 } = options;
  const secondaryQueue = secondaryAssets.filter(
    (item): item is { url: string; colorSpace?: ColorSpace } =>
      typeof item.url === "string" && item.url.length > 0
  );

  let cancelled = false;
  let secondaryStarted = false;
  let timerId: number | null = null;
  let fallbackTimerId: number | null = null;
  let index = 0;

  const scheduleSecondaryStep = (delayMs: number) => {
    if (cancelled || index >= secondaryQueue.length) return;
    timerId = window.setTimeout(() => {
      if (cancelled || index >= secondaryQueue.length) return;
      const next = secondaryQueue[index];
      index += 1;
      const colorSpace = next.colorSpace ?? SRGBColorSpace;
      const key = cacheKey(next.url, colorSpace);

      if (textureCache.has(key) && uploadedKeys.has(key)) {
        scheduleSecondaryStep(0);
        return;
      }

      // Decode off-thread, then enqueue a single-frame GPU upload
      void loadTexture(next.url, colorSpace, { preUploadGpu: true })
        .catch(() => {})
        .finally(() => {
          scheduleSecondaryStep(stepDelayMs);
        });
    }, delayMs);
  };

  const startSecondary = () => {
    if (cancelled || secondaryStarted) return;
    secondaryStarted = true;
    if (fallbackTimerId !== null) {
      window.clearTimeout(fallbackTimerId);
      fallbackTimerId = null;
    }
    scheduleSecondaryStep(settleDelayMs);
  };

  // Guarantee Stage 2 begins even if a single slow primary texture stalls
  fallbackTimerId = window.setTimeout(startSecondary, 1200);

  // Stage 1: prioritize all first-importance textures first, then stream Stage 2 1-by-1
  void preloadTextureAssets(primaryAssets, { preUploadGpu: true }).finally(
    startSecondary
  );

  return () => {
    cancelled = true;
    if (timerId !== null) window.clearTimeout(timerId);
    if (fallbackTimerId !== null) window.clearTimeout(fallbackTimerId);
  };
};

type TextureOptions = {
  fallbackColor?: string;
  fallbackTexture?: Texture | null;
  colorSpace?: ColorSpace;
  enabled?: boolean;
};

export const useTextureAsset = (
  textureUrl: string | null | undefined,
  options: TextureOptions = {}
) => {
  const {
    fallbackColor,
    fallbackTexture: explicitFallback = null,
    colorSpace = SRGBColorSpace,
    enabled = true
  } = options;

  const fallbackTexture = useMemo(() => {
    if (explicitFallback) return explicitFallback;
    return fallbackColor ? createFallbackTexture(fallbackColor, colorSpace) : null;
  }, [explicitFallback, fallbackColor, colorSpace]);

  const [texture, setTexture] = useState<Texture | null>(() => {
    if (!textureUrl) return fallbackTexture;
    // Always adopt already-cached (and GPU-warmed) textures immediately
    return textureCache.get(cacheKey(textureUrl, colorSpace)) ?? fallbackTexture;
  });

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
      return;
    }

    // Listen for background Stage 2 completion so hidden meshes quietly bind
    // their pre-uploaded VRAM texture BEFORE the user ever clicks the planet.
    const unsubscribe = subscribeReady(key, (loaded) => {
      if (isActive) {
        setTexture(loaded);
      }
    });

    if (enabled) {
      loadTexture(textureUrl, colorSpace, { preUploadGpu: true })
        .then((loaded) => {
          if (!isActive) return;
          setTexture(loaded);
        })
        .catch(() => {
          if (!isActive) return;
          setTexture(fallbackTexture);
        });
    } else {
      setTexture(fallbackTexture);
    }

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [textureUrl, fallbackTexture, colorSpace, enabled]);

  return texture;
};

export const usePlanetTexture = (
  textureUrl: string | null | undefined,
  fallbackColor: string
) => useTextureAsset(textureUrl, { fallbackColor, colorSpace: SRGBColorSpace });
