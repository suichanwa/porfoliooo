import { useCallback, useEffect, useRef, useState } from "react";
import { Perf } from "r3f-perf";

interface PerfOverlayProps {
  enabled: boolean;
}

const DEFAULT_POSITION = { x: 16, y: 72 };

export default function PerfOverlay({ enabled }: PerfOverlayProps) {
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const positionRef = useRef(position);
  const isPositionedRef = useRef(false);
  const dragStateRef = useRef({
    active: false,
    pointerId: -1,
    originX: 0,
    originY: 0,
    startX: 0,
    startY: 0
  });

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  const clampPosition = useCallback((x: number, y: number, rect?: DOMRect) => {
    const margin = 8;
    const width = rect?.width ?? 320;
    const height = rect?.height ?? 160;
    const maxX = Math.max(margin, window.innerWidth - width - margin);
    const maxY = Math.max(margin, window.innerHeight - height - margin);
    return {
      x: Math.min(maxX, Math.max(margin, x)),
      y: Math.min(maxY, Math.max(margin, y))
    };
  }, []);

  useEffect(() => {
    if (!enabled || isPositionedRef.current) return;
    const estimatedWidth = 320;
    const initialX = Math.max(8, window.innerWidth - estimatedWidth - 16);
    setPosition({ x: initialX, y: DEFAULT_POSITION.y });
    isPositionedRef.current = true;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    let raf = 0;
    let element: HTMLElement | null = null;

    const handlePointerMove = (event: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state.active || state.pointerId !== event.pointerId) return;
      const nextX = state.startX + (event.clientX - state.originX);
      const nextY = state.startY + (event.clientY - state.originY);
      const rect = element?.getBoundingClientRect();
      setPosition(clampPosition(nextX, nextY, rect ?? undefined));
    };

    const handlePointerUp = (event: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state.active || state.pointerId !== event.pointerId) return;
      dragStateRef.current.active = false;
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0 && event.pointerType === "mouse") return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest("button, a, input, select, textarea") ||
        target?.closest(".__perf_toggle")
      ) {
        return;
      }
      event.preventDefault();
      const current = positionRef.current;
      dragStateRef.current = {
        active: true,
        pointerId: event.pointerId,
        originX: event.clientX,
        originY: event.clientY,
        startX: current.x,
        startY: current.y
      };
      element?.setPointerCapture?.(event.pointerId);
    };

    const attach = () => {
      element = document.querySelector(".planetarium-perf") as HTMLElement | null;
      if (!element) {
        raf = window.requestAnimationFrame(attach);
        return;
      }

      element.addEventListener("pointerdown", handlePointerDown);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    };

    attach();

    return () => {
      window.cancelAnimationFrame(raf);
      element?.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [clampPosition, enabled]);

  if (!enabled) return null;

  return (
    <Perf
      minimal
      position="top-left"
      className="planetarium-perf"
      style={{
        left: 0,
        right: "auto",
        top: 0,
        bottom: "auto",
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        cursor: "grab",
        pointerEvents: "auto",
        touchAction: "none",
        zIndex: 10000
      }}
    />
  );
}
