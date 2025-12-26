import { useEffect, useState } from "react";

interface NeptuneTransitionOptions {
  enabled: boolean;
  sectionId: string;
  isClient: boolean;
}

export default function useNeptuneTransition({
  enabled,
  sectionId,
  isClient
}: NeptuneTransitionOptions) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!enabled || !isClient) return;

    const handleScroll = () => {
      const neptuneSection = document.getElementById(sectionId);
      if (!neptuneSection) return;

      const rect = neptuneSection.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const sectionTop = rect.top;

      let nextProgress = 0;
      if (sectionTop < viewportHeight) {
        const fadeStartDistance = viewportHeight * 1.0;
        const fadeEndDistance = viewportHeight * 0.3;
        const distanceFromSection = Math.max(0, viewportHeight - sectionTop);

        if (distanceFromSection <= fadeStartDistance) {
          nextProgress = Math.min(
            Math.max(
              (fadeStartDistance - distanceFromSection) /
                (fadeStartDistance - fadeEndDistance),
              0
            ),
            1
          );
        } else {
          nextProgress = 0;
        }
      }

      setProgress(nextProgress);
    };

    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", throttledScroll);
  }, [enabled, sectionId, isClient]);

  return progress;
}
