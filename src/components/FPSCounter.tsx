import { useState, useEffect, useRef } from 'react';

interface FPSCounterProps {
  isAnimating?: boolean;
}

export default function FPSCounter({ isAnimating = true }: FPSCounterProps): JSX.Element {
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const lastFrameTimeRef = useRef<number>(performance.now());
  const intervalRef = useRef<number>();
  const targetFpsRef = useRef<number>(60);

  useEffect(() => {
    targetFpsRef.current = isAnimating ? 30 : 1; // Reduced from 60 to 30 FPS for better performance
    
    let frameCount = 0;
    let lastUpdate = performance.now();
    
    const updateFPS = () => {
      const currentTime = performance.now();
      frameCount++;

      // Update every 500ms for better performance (reduced from 100ms)
      if (currentTime - lastUpdate >= 500) {
        const elapsed = currentTime - lastUpdate;
        const calculatedFps = Math.round((frameCount * 1000) / elapsed);
        setFps(Math.min(calculatedFps, targetFpsRef.current));
        
        frameCount = 0;
        lastUpdate = currentTime;
      }
    };

    // Use setTimeout instead of setInterval for better performance
    const checkFrame = () => {
      updateFPS();
      const nextDelay = targetFpsRef.current === 1 ? 1000 : 33; // 30 FPS = 33ms
      intervalRef.current = window.setTimeout(checkFrame, nextDelay);
    };
    
    checkFrame();

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isAnimating]);

  // Visual indicator for FPS state
  const getFpsColor = () => {
    if (targetFpsRef.current === 1) return 'text-yellow-400';
    if (fps >= 50) return 'text-green-400';
    if (fps >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  const getBorderColor = () => {
    if (targetFpsRef.current === 1) return 'border-yellow-500/30';
    if (fps >= 50) return 'border-green-500/30';
    if (fps >= 30) return 'border-orange-500/30';
    return 'border-red-500/30';
  };

  return (
    <div className={`absolute top-2 right-2 bg-black/70 px-3 py-1.5 rounded-lg backdrop-blur-sm border ${getBorderColor()}`}>
      <div className="flex items-center gap-2">
        <span className={`font-mono text-xs font-bold ${getFpsColor()}`}>
          FPS:
        </span>
        <span className={`font-mono text-sm font-bold tabular-nums ${getFpsColor()}`}>
          {fps}
        </span>
        {targetFpsRef.current === 1 && (
          <span className="text-yellow-300 text-xs" title="Low power mode">⚡</span>
        )}
      </div>
    </div>
  );
}
