import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, GripVertical, Maximize2, Minimize2, X } from "lucide-react";
import { kmToAu } from "../utils/units";
import { PLANET_BY_ID } from "../data/planetRegistry";
import { usePlanetSelection } from "../context/SelectionContext";
import type { BodyData, BodyId } from "../data/types";

interface ParentOrbitPillProps {
  targetBody: BodyData;
  relationLabel: string;
  onSelect: (id: BodyId) => void;
  compact?: boolean;
}

function ParentOrbitPill({
  targetBody,
  relationLabel,
  onSelect,
  compact = false
}: ParentOrbitPillProps) {
  const accentColor = targetBody.render.colorFallback ?? "#5e9fff";

  return (
    <button
      type="button"
      onClick={() => onSelect(targetBody.id)}
      aria-label={`${relationLabel} ${targetBody.name} — focus ${targetBody.name}`}
      title={`Focus ${targetBody.name}`}
      className={`group inline-flex items-center gap-1.5 rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.26)] font-medium text-slate-300 backdrop-blur-md transition-all duration-200 hover:border-primary-accent/55 hover:bg-[rgba(var(--primary-bg-rgb),0.48)] hover:text-white hover:shadow-[0_0_12px_rgba(94,159,255,0.18)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent/70 cursor-pointer ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[10px]"
      }`}
    >
      <span
        aria-hidden="true"
        className="h-2 w-2 rounded-full flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{
          backgroundColor: accentColor,
          boxShadow: `0 0 8px ${accentColor}`
        }}
      />
      <span>
        {relationLabel}{" "}
        <span className="font-semibold text-white">{targetBody.name}</span>
      </span>
      <ArrowRight className="h-2.5 w-2.5 text-primary-accent transition-transform duration-200 group-hover:translate-x-0.5" />
    </button>
  );
}

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  compact?: boolean;
  centered?: boolean;
  className?: string;
}

function StatTile({
  label,
  value,
  compact = false,
  centered = false,
  className = ""
}: StatTileProps) {
  return (
    <div
      className={`rounded-xl border border-slate-700/45 bg-[rgba(var(--primary-bg-rgb),0.25)] backdrop-blur-md transition-all duration-200 hover:border-primary-accent/35 hover:bg-[rgba(var(--primary-bg-rgb),0.4)] ${
        compact ? "px-2 py-1.5" : "p-2.5"
      } ${centered ? "text-center" : ""} ${className}`}
    >
      <div
        className={`font-semibold uppercase text-slate-400 ${
          compact ? "text-[9px] tracking-wider" : "text-[10px] tracking-[0.15em]"
        }`}
      >
        {label}
      </div>
      <div
        className={`font-semibold text-white ${
          compact
            ? "mt-0.5 text-xs font-bold tabular-nums truncate"
            : "mt-0.5 text-sm"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function BodyHighlights({
  facts,
  compact = false
}: {
  facts: string[];
  compact?: boolean;
}) {
  if (facts.length === 0) return null;
  return (
    <div className={compact ? "flex flex-col gap-1.5" : "mt-3"}>
      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-secondary-accent">
        {compact ? "Key Highlights" : "Highlights"}
      </div>
      <ul
        className={`${compact ? "space-y-1.5 text-[11px]" : "mt-1.5 space-y-1.5 text-xs"} text-slate-300`}
      >
        {facts.map((fact) => (
          <li
            key={fact}
            className={`border-l-2 pl-2.5 ${
              compact
                ? "border-primary-accent/60 leading-relaxed"
                : "border-primary-accent/50 leading-snug"
            }`}
          >
            {fact}
          </li>
        ))}
      </ul>
    </div>
  );
}

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(Math.round(value));

const formatMass = (massKg?: number) => {
  if (!massKg) return "-";
  const expStr = massKg.toExponential(3);
  const [mantissa, exp] = expStr.split(/e\+?/i);
  const cleanExp = exp ? Number.parseInt(exp, 10) : "";
  return (
    <span>
      {mantissa} &times; 10<sup>{cleanExp}</sup> kg
    </span>
  );
};

export default function PlanetInfoPanel() {
  const {
    selectedPlanet: planet,
    selectedInfo: info,
    isInfoVisible,
    infoHidden,
    setInfoHidden,
    closeInfo,
    selectPlanet
  } = usePlanetSelection();

  // Mobile sheet expand/collapse state (default compact peek on phones)
  const [isExpanded, setIsExpanded] = useState(false);

  // Dragging support for minimized "Show Details" pill
  const pillRef = useRef<HTMLDivElement | null>(null);
  const [pillPos, setPillPos] = useState<{ x: number; y: number } | null>(null);
  const [isPillDragging, setIsPillDragging] = useState(false);
  const isDraggingPillRef = useRef(false);
  const pillDragState = useRef({
    active: false,
    pointerId: -1,
    originX: 0,
    originY: 0,
    startX: 0,
    startY: 0
  });

  const getPillDefaultPos = useCallback(() => {
    if (typeof window === "undefined") return { x: 16, y: 96 };
    const width = pillRef.current?.offsetWidth || 200;
    return {
      x: Math.max(16, window.innerWidth - width - 16),
      y: 96
    };
  }, []);

  const clampPillPosition = useCallback((x: number, y: number) => {
    const margin = 12;
    const width = pillRef.current?.offsetWidth || 200;
    const height = pillRef.current?.offsetHeight || 40;
    const maxX = Math.max(margin, window.innerWidth - width - margin);
    const maxY = Math.max(margin, window.innerHeight - height - 70); // Keep above bottom timeline controls
    const minY = 70; // Keep below top navigation
    return {
      x: Math.min(maxX, Math.max(margin, x)),
      y: Math.min(maxY, Math.max(minY, y))
    };
  }, []);

  // Update position on window resize
  useEffect(() => {
    const handleResize = () => {
      setPillPos((current) => {
        if (!current) return null;
        return clampPillPosition(current.x, current.y);
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [clampPillPosition]);

  // Global pointer listeners for smooth dragging anywhere on the screen
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const state = pillDragState.current;
      if (!state.active || state.pointerId !== e.pointerId) return;
      const dist = Math.hypot(e.clientX - state.originX, e.clientY - state.originY);
      if (dist > 4) {
        isDraggingPillRef.current = true;
        setIsPillDragging(true);
      }
      const nextX = state.startX + (e.clientX - state.originX);
      const nextY = state.startY + (e.clientY - state.originY);
      setPillPos(clampPillPosition(nextX, nextY));
    };

    const handlePointerUp = (e: PointerEvent) => {
      const state = pillDragState.current;
      if (!state.active || state.pointerId !== e.pointerId) return;
      state.active = false;
      setIsPillDragging(false);
      if (isDraggingPillRef.current) {
        setTimeout(() => {
          isDraggingPillRef.current = false;
        }, 80);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [clampPillPosition]);

  const handlePillPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const current = pillPos ?? getPillDefaultPos();
    pillDragState.current = {
      active: true,
      pointerId: e.pointerId,
      originX: e.clientX,
      originY: e.clientY,
      startX: current.x,
      startY: current.y
    };
    isDraggingPillRef.current = false;
  };

  const handlePillDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPillPos(getPillDefaultPos());
  };

  // Reset mobile sheet expansion when switching planets, but preserve user's hidden/visible choice
  useEffect(() => {
    setIsExpanded(false);
  }, [planet?.id]);

  if (!planet) return null;

  const distanceText = planet.orbit
    ? planet.parentId && planet.parentId !== "sun"
      ? `${formatNumber(planet.orbit.semiMajorAxisKm)} km`
      : `${kmToAu(planet.orbit.semiMajorAxisKm).toFixed(2)} AU`
    : "-";

  const isMoon = Boolean(planet.parentId && planet.parentId !== "sun");
  const parentPlanet = isMoon && planet.parentId ? PLANET_BY_ID[planet.parentId] ?? null : null;
  const relatedLink =
    planet.id === "pluto" && PLANET_BY_ID.charon
      ? { targetBody: PLANET_BY_ID.charon, relationLabel: "Binary Companion" }
      : isMoon && parentPlanet
        ? {
            targetBody: parentPlanet,
            relationLabel: planet.id === "charon" ? "Orbiting Binary" : "Orbiting"
          }
        : null;
  const categoryLabel =
    planet.kind === "dwarf"
      ? "Dwarf planet details"
      : isMoon
        ? "Moon details"
        : "Planet details";
  const radiusValue = `${formatNumber(planet.render.radiusKm)} km`;
  const periodDays = planet.orbit ? Math.round(planet.orbit.orbitalPeriodDays) : null;
  const tiltValue = `${planet.rotation.axialTiltDeg.toFixed(1)}\u00B0`;
  const massValue = formatMass(planet.massKg);

  return (
    <>
      {/* ============================================================ */}
      {/* 1. MOBILE PHONE UI: Sleek Glance Card / Expandable Peek Sheet */}
      {/* ============================================================ */}
      <div className="sm:hidden">
        {isInfoVisible && (
          <div className="pointer-events-none fixed left-3 right-3 bottom-[4.75rem] bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 flex justify-center max-w-[90vw] mx-auto">
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              role="region"
              aria-label="Planet info card"
              tabIndex={-1}
              className="pointer-events-auto w-full rounded-2xl border border-slate-700/60 bg-[linear-gradient(165deg,rgba(15,23,42,0.92),rgba(20,28,40,0.86))] p-3 text-[12px] text-slate-200 shadow-[0_16px_40px_rgba(0,0,0,0.8),0_0_24px_rgba(99,102,241,0.2)] backdrop-blur-2xl transition-all duration-300 ease-out"
            >
              {/* Drag / Tap Handle Pill */}
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="w-full flex items-center justify-center pt-0.5 pb-2 -mt-1 cursor-pointer focus:outline-none"
                aria-label={isExpanded ? "Collapse info sheet" : "Expand info sheet"}
              >
                <div className="h-1 w-10 rounded-full bg-slate-500/50 hover:bg-primary-accent/80 transition-colors" />
              </button>

              {/* Header Row */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0 shadow-[0_0_8px_currentColor]"
                    style={{
                      backgroundColor: planet.render.colorFallback ?? "#5e9fff",
                      color: planet.render.colorFallback ?? "#5e9fff"
                    }}
                  />
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="text-base font-bold text-white tracking-wide truncate">
                      {planet.name}
                    </span>
                    <span className="rounded-full bg-primary-accent/20 border border-primary-accent/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-primary-accent">
                      {planet.kind === "dwarf" ? "Dwarf Planet" : isMoon ? "Moon" : "Planet"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    className="flex items-center gap-1 rounded-full border border-slate-700/60 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/[0.1] active:scale-95 transition"
                    title={isExpanded ? "Show compact view" : "Show full details"}
                  >
                    <span>{isExpanded ? "Less" : "Details"}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronUp className="h-3 w-3" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInfoHidden(true)}
                    className="rounded-full border border-slate-700/60 bg-white/[0.05] p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.1] active:scale-95 transition"
                    title="Minimize card"
                    aria-label="Minimize card"
                  >
                    <Minimize2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={closeInfo}
                    className="rounded-full border border-slate-700/60 bg-white/[0.05] p-1.5 text-slate-400 hover:text-white hover:bg-white/[0.1] active:scale-95 transition"
                    title="Close details and zoom out"
                    aria-label="Close details and zoom out"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Parent Planet / Binary Companion Quick Navigation (inline header pill) */}
              {relatedLink && (
                <div className="mt-1.5 flex items-center">
                  <ParentOrbitPill
                    targetBody={relatedLink.targetBody}
                    relationLabel={relatedLink.relationLabel}
                    onSelect={selectPlanet}
                    compact
                  />
                </div>
              )}

              {/* Compact Quick Stats (Shared tiles across planets & moons) */}
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                <StatTile
                  label={isMoon ? "Orbit" : "Distance"}
                  value={distanceText}
                  compact
                  centered
                />
                <StatTile label="Radius" value={radiusValue} compact centered />
                <StatTile
                  label="Period"
                  value={periodDays !== null ? `${periodDays}d` : "-"}
                  compact
                  centered
                />
              </div>

              {/* Collapsed Peek Summary Teaser */}
              {!isExpanded && info?.summary && (
                <p className="mt-1.5 line-clamp-1 text-[11px] text-slate-400 leading-snug">
                  {info.summary}
                </p>
              )}

              {/* Expanded Content (Scrollable, takes up max ~35vh, leaves upper 65% open for 3D planet) */}
              {isExpanded && (
                <div className="mt-3 flex flex-col gap-3 max-h-[35vh] overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden border-t border-slate-700/40 pt-2.5 animate-in fade-in duration-200">
                  {info?.summary && (
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {info.summary}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <StatTile label="Axial Tilt" value={tiltValue} />
                    <StatTile label="Mass" value={massValue} />
                  </div>

                  {info && <BodyHighlights facts={info.facts} compact />}

                  <button
                    type="button"
                    onClick={() => setIsExpanded(false)}
                    className="mt-1 w-full rounded-xl border border-slate-700/50 bg-white/[0.05] py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-white/[0.1] active:scale-98 transition"
                  >
                    Collapse to glance card
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 2. DESKTOP / TABLET UI: Side Info Panel                       */}
      {/* ============================================================ */}
      <div className="hidden sm:flex pointer-events-none fixed right-4 top-20 z-40 justify-end">
        <div
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="region"
          aria-label="Planet details panel"
          tabIndex={-1}
          className={`pointer-events-auto w-[min(24.5rem,33vw)] rounded-2xl border border-slate-700/50 bg-[linear-gradient(165deg,rgba(var(--primary-bg-rgb),0.85),rgba(20,28,40,0.72))] p-4 text-sm text-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.7),0_0_24px_rgba(99,102,241,0.15)] backdrop-blur-2xl transition-all duration-500 ease-out max-h-[calc(100vh-10.5rem)] overflow-y-auto [scrollbar-width:thin] [scrollbar-color:rgba(148,163,184,0.3)_transparent] ${
            isInfoVisible
              ? "translate-x-0 opacity-100"
              : "translate-x-6 opacity-0 pointer-events-none hidden"
          }`}
          style={{ pointerEvents: isInfoVisible ? "auto" : "none" }}
          aria-hidden={!isInfoVisible}
        >
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary-accent">
                  {categoryLabel}
                </span>
                {relatedLink && (
                  <ParentOrbitPill
                    targetBody={relatedLink.targetBody}
                    relationLabel={relatedLink.relationLabel}
                    onSelect={selectPlanet}
                  />
                )}
              </div>
              <div className="mt-1 text-lg font-bold text-white tracking-wide">
                {planet.name}
              </div>
              {info?.summary && (
                <p className="mt-1.5 text-xs text-slate-300 leading-snug">
                  {info.summary}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1.5 sm:flex-col sm:items-end flex-shrink-0">
              <button
                type="button"
                onClick={() => setInfoHidden(true)}
                className="rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.22)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-300 transition-all duration-200 hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.42)] hover:text-white active:scale-95"
              >
                Hide
              </button>
              <button
                type="button"
                onClick={closeInfo}
                title="Close details and zoom out"
                aria-label="Close details and zoom out"
                className="rounded-full border border-slate-700/55 bg-[rgba(var(--primary-bg-rgb),0.22)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-300 transition-all duration-200 hover:border-primary-accent/45 hover:bg-[rgba(var(--primary-bg-rgb),0.42)] hover:text-white active:scale-95"
              >
                Close
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5 text-[11px]">
            <StatTile label={isMoon ? "Orbit Radius" : "Distance"} value={distanceText} />
            <StatTile label="Radius" value={radiusValue} />
            <StatTile
              label="Period"
              value={periodDays !== null ? `${periodDays} days` : "-"}
            />
            <StatTile label="Tilt" value={tiltValue} />
            <StatTile label="Mass" value={massValue} className="col-span-2" />
          </div>

          {info && <BodyHighlights facts={info.facts} />}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MOVABLE "SHOW DETAILS" PILL (Draggable across the canvas) */}
      {/* ============================================================ */}
      {(() => {
        const currentPos = pillPos ?? getPillDefaultPos();
        return (
          <div
            ref={pillRef}
            onPointerDown={handlePillPointerDown}
            onClick={(e) => {
              if (isDraggingPillRef.current) {
                e.stopPropagation();
                return;
              }
              setInfoHidden(false);
            }}
            onDoubleClick={handlePillDoubleClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setInfoHidden(false);
              }
            }}
            role="button"
            tabIndex={infoHidden ? 0 : -1}
            aria-label={`Show ${planet.name} details (draggable)`}
            title="Drag to move anywhere • Click to show details • Double-click to reset"
            style={{
              transform: `translate3d(${currentPos.x}px, ${currentPos.y}px, 0)`,
              left: 0,
              top: 0
            }}
            className={`fixed z-40 group flex items-center gap-2.5 rounded-full border border-slate-700/60 bg-[linear-gradient(165deg,rgba(15,23,42,0.92),rgba(20,28,40,0.85))] px-3.5 py-2 text-xs text-white shadow-[0_12px_32px_rgba(0,0,0,0.7),0_0_16px_rgba(94,159,255,0.25)] backdrop-blur-2xl cursor-grab active:cursor-grabbing select-none touch-none transition-[border-color,box-shadow,opacity] duration-200 hover:border-primary-accent/60 hover:shadow-[0_14px_36px_rgba(0,0,0,0.85),0_0_24px_rgba(94,159,255,0.45)] ${
              isPillDragging ? "cursor-grabbing shadow-[0_16px_40px_rgba(0,0,0,0.9),0_0_24px_rgba(94,159,255,0.5)] border-primary-accent scale-[1.04]" : ""
            } ${
              infoHidden
                ? "pointer-events-auto opacity-100"
                : "pointer-events-none opacity-0 invisible"
            }`}
          >
            <span
              className="flex items-center text-slate-400 group-hover:text-primary-accent transition-colors cursor-grab active:cursor-grabbing"
              title="Drag handle"
            >
              <GripVertical className="h-3.5 w-3.5" />
            </span>

            <span
              className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-[0_0_8px_currentColor]"
              style={{
                backgroundColor: planet.render.colorFallback ?? "#5e9fff",
                color: planet.render.colorFallback ?? "#5e9fff"
              }}
            />

            <span className="font-semibold text-slate-200 group-hover:text-white tracking-wide truncate max-w-[120px] sm:max-w-none">
              {planet.name}
            </span>

            <span className="text-slate-600 font-light">•</span>

            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary-accent">
              Show details
            </span>

            <Maximize2 className="h-3 w-3 text-primary-accent/70 group-hover:text-primary-accent transition-colors flex-shrink-0" />
          </div>
        );
      })()}
    </>
  );
}
