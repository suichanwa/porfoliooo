import { useMemo } from "react";

export default function useNeptuneBackground(progress: number) {
  return useMemo(() => {
    if (progress <= 0) {
      return `radial-gradient(ellipse 70% 90% at 50% 50%, 
          rgba(8, 10, 20, 0.3) 0%, 
          rgba(4, 5, 12, 0.6) 50%,
          rgba(0, 0, 0, 0.9) 100%)`;
    }

    const spaceOpacity = 1 - progress * 0.7;
    const neptuneOpacity = progress * 0.8;

    return `
      radial-gradient(ellipse 70% 90% at 50% 50%, 
        rgba(8, 10, 20, ${spaceOpacity * 0.3}) 0%, 
        rgba(4, 5, 12, ${spaceOpacity * 0.6}) 50%,
        rgba(15, 20, 25, ${spaceOpacity * 0.9}) 100%),
      radial-gradient(ellipse 60% 80% at 30% 70%, 
        rgba(26, 31, 53, ${neptuneOpacity * 0.4}) 0%, 
        rgba(15, 20, 25, ${neptuneOpacity * 0.6}) 50%,
        rgba(10, 15, 20, ${neptuneOpacity * 0.8}) 100%)`;
  }, [progress]);
}
