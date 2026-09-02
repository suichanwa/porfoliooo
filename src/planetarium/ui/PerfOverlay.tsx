import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Activity, GripHorizontal, X } from "lucide-react";
import { useSettings } from "../context/SettingsContext";

interface PerfOverlayProps {
  enabled?: boolean;
}

export default function PerfOverlay({ enabled = false }: PerfOverlayProps) {
  const { updateSetting } = useSettings();
  const [mounted, setMounted] = useState(false);

  const [position, setPosition] = useState(() => ({
    x: typeof window !== "undefined" ? Math.max(16, window.innerWidth - 300) : 700,
    y: 80
  }));

  const dragStateRef = useRef({
    active: false,
    pointerId: -1,
    originX: 0,
    originY: 0,
    startX: 0,
    startY: 0
  });

  const statsRef = useRef({
    fps: 60,
    frameMs: 16.6,
    memoryMb: 0,
    history: Array(24).fill(60),
    lastTime: 0,
    framesCount: 0,
    accumTime: 0
  });

  const [displayStats, setDisplayStats] = useState({
    fps: 60,
    frameMs: 16.6,
    memoryMb: 0,
    dpr: 1,
    history: Array(24).fill(60)
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handleResize = () => {
      setPosition((pos) => ({
        x: Math.max(8, Math.min(window.innerWidth - 290, pos.x)),
        y: Math.max(8, Math.min(window.innerHeight - 150, pos.y))
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [mounted]);

  // High precision FPS and frame-latency loop
  useEffect(() => {
    if (!enabled) return;

    let animId = 0;
    statsRef.current.lastTime = performance.now();
    statsRef.current.framesCount = 0;
    statsRef.current.accumTime = 0;

    const loop = (now: number) => {
      const st = statsRef.current;
      const delta = now - st.lastTime;
      st.lastTime = now;
      st.framesCount++;
      st.accumTime += delta;

      // Sample every 120ms for smooth, jitter-free UI telemetry
      if (st.accumTime >= 120) {
        const currentFps = Math.min(
          165,
          Math.max(1, Math.round((st.framesCount / st.accumTime) * 1000))
        );
        const frameMs = Number((st.accumTime / st.framesCount).toFixed(1));
        const nextHistory = [...st.history.slice(1), currentFps];

        // Memory usage if available in browser
        let mem = 0;
        const perfWithMem = window.performance as unknown as {
          memory?: { usedJSHeapSize?: number };
        };
        if (perfWithMem?.memory?.usedJSHeapSize) {
          mem = Math.round(perfWithMem.memory.usedJSHeapSize / (1024 * 1024));
        }

        st.fps = currentFps;
        st.frameMs = frameMs;
        st.memoryMb = mem;
        st.history = nextHistory;
        st.framesCount = 0;
        st.accumTime = 0;

        setDisplayStats({
          fps: currentFps,
          frameMs,
          memoryMb: mem,
          dpr: window.devicePixelRatio || 1,
          history: nextHistory
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [enabled]);

  const handleDragStart = useCallback(
    (event: ReactPointerEvent<HTMLButtonElement>) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      event.preventDefault();
      event.stopPropagation();
      dragStateRef.current = {
        active: true,
        pointerId: event.pointerId,
        originX: event.clientX,
        originY: event.clientY,
        startX: position.x,
        startY: position.y
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [position]
  );

  const handleDragMove = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const state = dragStateRef.current;
    if (!state.active || state.pointerId !== event.pointerId) return;
    const nextX = Math.max(8, Math.min(window.innerWidth - 290, state.startX + (event.clientX - state.originX)));
    const nextY = Math.max(8, Math.min(window.innerHeight - 150, state.startY + (event.clientY - state.originY)));
    setPosition({ x: nextX, y: nextY });
  }, []);

  const handleDragEnd = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    const state = dragStateRef.current;
    if (!state.active || state.pointerId !== event.pointerId) return;
    dragStateRef.current.active = false;
  }, []);

  if (!mounted || !enabled) return null;

  const minFps = 15;
  const maxFps = Math.max(65, ...displayStats.history);
  const sparkPoints = displayStats.history
    .map((v, i) => {
      const x = (i / (displayStats.history.length - 1)) * 96;
      const y = 24 - ((Math.min(maxFps, Math.max(minFps, v)) - minFps) / (maxFps - minFps)) * 20;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const fpsColor =
    displayStats.fps >= 55
      ? "text-emerald-400"
      : displayStats.fps >= 35
        ? "text-amber-400"
        : "text-rose-400";

  return (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      className="pointer-events-auto fixed z-50 flex w-72 flex-col gap-2 rounded-2xl border border-slate-700/50 bg-[linear-gradient(165deg,rgba(var(--primary-bg-rgb),0.88),rgba(20,28,40,0.76))] p-3 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_24px_rgba(99,102,241,0.2)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 select-none"
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        left: 0,
        top: 0
      }}
    >
      {/* Title / Drag Bar */}
      <div className="flex items-center justify-between border-b border-slate-700/40 pb-2">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-primary-accent" />
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-accent">
            Telemetry
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
            className="flex items-center gap-1 rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.3)] px-2 py-0.5 text-[9px] uppercase tracking-wider text-slate-300 transition hover:border-primary-accent/40 hover:text-white cursor-grab active:cursor-grabbing select-none"
            title="Drag telemetry"
          >
            <GripHorizontal className="h-3 w-3" />
            <span>Move</span>
          </button>

          <button
            type="button"
            onClick={() => updateSetting("showPerf", false)}
            className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.3)] text-slate-300 transition hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.6)] hover:text-white active:scale-95"
            title="Close telemetry"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Main FPS & Sparkline */}
      <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-700/40 bg-[rgba(var(--primary-bg-rgb),0.3)] px-3 py-2">
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-extrabold tabular-nums tracking-tight ${fpsColor}`}>
              {displayStats.fps}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">FPS</span>
          </div>
          <span className="mt-1 text-[10px] font-medium text-slate-400 tabular-nums">
            {displayStats.frameMs} ms
          </span>
        </div>

        {/* Real-time SVG Frame Graph */}
        <div className="relative h-6 w-24 overflow-hidden rounded bg-slate-900/60 p-0.5">
          <svg className="h-full w-full overflow-visible" viewBox="0 0 96 24">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={fpsColor}
              points={sparkPoints}
            />
          </svg>
        </div>
      </div>

      {/* Hardware & Runtime Stats */}
      <div className="grid grid-cols-3 gap-1.5 text-center">
        <div className="rounded-lg border border-slate-700/40 bg-[rgba(var(--primary-bg-rgb),0.25)] py-1.5 px-1">
          <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">Latency</div>
          <div className="mt-0.5 text-[11px] font-bold text-white tabular-nums">
            {displayStats.frameMs} ms
          </div>
        </div>

        <div className="rounded-lg border border-slate-700/40 bg-[rgba(var(--primary-bg-rgb),0.25)] py-1.5 px-1">
          <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">DPR</div>
          <div className="mt-0.5 text-[11px] font-bold text-white tabular-nums">
            {displayStats.dpr.toFixed(1)}x
          </div>
        </div>

        <div className="rounded-lg border border-slate-700/40 bg-[rgba(var(--primary-bg-rgb),0.25)] py-1.5 px-1">
          <div className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">Memory</div>
          <div className="mt-0.5 text-[11px] font-bold text-white tabular-nums">
            {displayStats.memoryMb ? `${displayStats.memoryMb} MB` : "Normal"}
          </div>
        </div>
      </div>
    </div>
  );
}

