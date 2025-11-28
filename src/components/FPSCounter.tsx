import { useState, useEffect, useRef } from 'react';

export default function FPSCounter(): JSX.Element {
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const intervalRef = useRef<number>();

  useEffect(() => {
    // Update FPS every 500ms instead of every frame (more efficient)
    const updateFPS = () => {
      const currentTime = performance.now();
      const elapsed = currentTime - lastTimeRef.current;

      if (elapsed >= 500) {
        // Check every 500ms instead of every frame
        const calculatedFps = Math.round((frameCountRef.current * 1000) / elapsed);
        // Cap at 60 FPS
        setFps(Math.min(calculatedFps, 60));
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      frameCountRef.current++;
    };

    intervalRef.current = window.setInterval(updateFPS, 16.67); // ~60fps

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="absolute top-2 right-2 bg-black/70 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-green-500/30">
      <div className="flex items-center gap-2">
        <span className="text-green-400 font-mono text-xs font-bold">FPS:</span>
        <span className="text-green-300 font-mono text-sm font-bold tabular-nums">{fps}</span>
      </div>
    </div>
  );
}