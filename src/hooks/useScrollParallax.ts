import { useEffect, useState } from "react";

interface ScrollParallaxOptions {
  isClient: boolean;
  disabled?: boolean;
  strength?: number;
  maxOffset?: number;
}

export default function useScrollParallax({
  isClient,
  disabled = false,
  strength = 0.08,
  maxOffset = 36
}: ScrollParallaxOptions) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!isClient || disabled) {
      setOffset(0);
      return;
    }

    let ticking = false;

    const updateOffset = () => {
      const nextOffset = Math.min(window.scrollY * strength, maxOffset);
      setOffset(nextOffset);
      ticking = false;
    };

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(updateOffset);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateOffset();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [disabled, isClient, maxOffset, strength]);

  return offset;
}
