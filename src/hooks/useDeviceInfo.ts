import { useMemo } from "react";

export interface DeviceInfo {
  isMobile: boolean;
  isLowEnd: boolean;
  isIntegratedGpu: boolean;
  prefersReducedMotion: boolean;
}

const INTEGRATED_GPU_PATTERN =
  /(intel|iris|uhd graphics|hd graphics|swiftshader|llvmpipe|software|mali|powervr|adreno\s*[345])/i;

function detectIntegratedGpu(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    if (!gl || !("getExtension" in gl)) return false;
    const ext = (gl as WebGLRenderingContext).getExtension(
      "WEBGL_debug_renderer_info"
    );
    if (!ext) return false;
    const renderer = String(
      (gl as WebGLRenderingContext).getParameter(ext.UNMASKED_RENDERER_WEBGL) || ""
    );
    return INTEGRATED_GPU_PATTERN.test(renderer);
  } catch {
    return false;
  }
}

export default function useDeviceInfo(isClient: boolean): DeviceInfo {
  return useMemo(() => {
    if (!isClient || typeof window === "undefined") {
      return {
        isMobile: false,
        isLowEnd: false,
        isIntegratedGpu: false,
        prefersReducedMotion: false
      };
    }

    const cores = navigator?.hardwareConcurrency || 4;
    const deviceMemory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;
    const isIntegratedGpu = detectIntegratedGpu();
    const isLowEnd =
      cores <= 2 || (typeof deviceMemory === "number" && deviceMemory <= 4);

    return {
      isMobile: window.innerWidth < 768,
      isLowEnd,
      isIntegratedGpu,
      prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
    };
  }, [isClient]);
}
