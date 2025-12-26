import { useMemo } from "react";

export interface DeviceInfo {
  isMobile: boolean;
  isLowEnd: boolean;
  prefersReducedMotion: boolean;
}

export default function useDeviceInfo(isClient: boolean): DeviceInfo {
  return useMemo(() => {
    if (!isClient || typeof window === "undefined") {
      return { isMobile: false, isLowEnd: false, prefersReducedMotion: false };
    }

    return {
      isMobile: window.innerWidth < 768,
      isLowEnd:
        (navigator?.hardwareConcurrency || 4) <= 2 ||
        (window.devicePixelRatio > 2 && window.innerWidth < 1024),
      prefersReducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
    };
  }, [isClient]);
}
