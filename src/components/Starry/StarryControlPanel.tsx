import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Telescope,
  X,
  Orbit,
  Sparkles,
  Flame,
  Wand2,
  Check
} from "lucide-react";
import {
  triggerWishStar,
  type CelestialLens,
  type ObservatoryConfig
} from "./types/starry";

interface StarryControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  config: ObservatoryConfig;
  onUpdateConfig: (
    patch: Partial<ObservatoryConfig> | ((prev: ObservatoryConfig) => ObservatoryConfig)
  ) => void;
  hideGUI: boolean;
  onToggleHideGUI: () => void;
}

export default function StarryControlPanel({
  isOpen,
  onClose,
  config,
  onUpdateConfig
}: StarryControlPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [showWishToast, setShowWishToast] = useState(false);
  const wishTimerRef = useRef<number>();
  const [telemetry, setTelemetry] = useState({
    ra: "04h 29m",
    dec: "+62° 18'"
  });

  // Invisible click-outside listener: Closes HUD without blurring the night sky
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        !target?.closest?.("[data-starry-control]")
      ) {
        onClose();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen, onClose]);

  // Live celestial coordinate tracking (shifts slightly on mouse movement)
  useEffect(() => {
    if (!isOpen) return;

    const updateCoords = (e: MouseEvent) => {
      const xRatio = e.clientX / (window.innerWidth || 1);
      const yRatio = e.clientY / (window.innerHeight || 1);
      const hours = String(Math.floor(xRatio * 24)).padStart(2, "0");
      const mins = String(Math.floor(yRatio * 60)).padStart(2, "0");
      const degVal = Math.floor(yRatio * 90) - 28;
      const degSign = degVal >= 0 ? "+" : "";
      const degMins = String(Math.floor(xRatio * 60)).padStart(2, "0");

      setTelemetry({
        ra: `${hours}h ${mins}m`,
        dec: `${degSign}${degVal}° ${degMins}'`
      });
    };

    window.addEventListener("mousemove", updateCoords, { passive: true });
    return () => window.removeEventListener("mousemove", updateCoords);
  }, [isOpen]);

  const handleMakeWish = () => {
    triggerWishStar();
    onUpdateConfig((prev) => ({
      ...prev,
      wishCount: (prev.wishCount || 0) + 1
    }));
    setShowWishToast(true);

    if (wishTimerRef.current) window.clearTimeout(wishTimerRef.current);
    wishTimerRef.current = window.setTimeout(() => {
      setShowWishToast(false);
    }, 2400);
  };

  const setLens = (lens: CelestialLens) => {
    onUpdateConfig({ celestialLens: lens });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={{ pointerEvents: "auto" }}
          className="fixed top-24 right-4 sm:right-6 z-50 w-[20.5rem] sm:w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl bg-[#070913]/92 backdrop-blur-2xl border border-primary-accent/30 shadow-[0_0_40px_-10px_rgba(94,159,255,0.35),0_20px_40px_rgba(0,0,0,0.85)] text-slate-100 overflow-hidden"
        >
          {/* Top Cosmic Accent Gradient Border */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary-accent to-secondary-accent" />

          <div className="p-4 sm:p-4.5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-primary-accent/15 border border-primary-accent/30 text-primary-accent flex-shrink-0">
                  <Telescope className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-white font-bold text-sm tracking-wide truncate">
                    Cosmic Observatory
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Celestial Astrolabe HUD
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span
                  title="30 FPS target locked with minimal redraws"
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-mono font-semibold text-emerald-400"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  30Hz ECO
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close Observatory HUD"
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Section 1: Celestial Optics (3-Way Segmented Control) */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Celestial Optics
              </div>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/10">
                {(
                  [
                    { id: "void", label: "Void", icon: "🌑", title: "Crisp night sky" },
                    { id: "nebula", label: "Nebula", icon: "🌌", title: "Drifting aurora wash" },
                    { id: "supernova", label: "Supernova", icon: "✨", title: "Cross spikes & glow" }
                  ] as const
                ).map((opt) => {
                  const isActive = config.celestialLens === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setLens(opt.id)}
                      title={opt.title}
                      className={`relative flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r from-primary-accent/30 to-secondary-accent/30 text-white border border-primary-accent/50 shadow-[0_0_12px_rgba(94,159,255,0.3)]"
                          : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
                      }`}
                    >
                      <span className="text-xs">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Astrolabe Matrix (2x2 Interactive Grid) */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                Stargazer Instruments
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* 1. Constellations Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConfig((prev) => ({
                      ...prev,
                      showConstellations: !prev.showConstellations
                    }))
                  }
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all duration-200 ${
                    config.showConstellations
                      ? "bg-primary-accent/15 border-primary-accent/55 text-white shadow-[0_0_14px_rgba(94,159,255,0.25)]"
                      : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Orbit
                      className={`w-4 h-4 ${
                        config.showConstellations ? "text-primary-accent" : "text-slate-400"
                      }`}
                    />
                    <span
                      className={`w-2 h-2 rounded-full ${
                        config.showConstellations
                          ? "bg-primary-accent shadow-[0_0_6px_#5e9fff]"
                          : "bg-white/20"
                      }`}
                    />
                  </div>
                  <span className="text-xs font-bold">Constellations</span>
                  <span className="text-[10px] text-slate-400">Glowing astral links</span>
                </button>

                {/* 2. Astral Cursor Tether Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConfig((prev) => ({
                      ...prev,
                      cursorTether: !prev.cursorTether
                    }))
                  }
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all duration-200 ${
                    config.cursorTether
                      ? "bg-secondary-accent/15 border-secondary-accent/55 text-white shadow-[0_0_14px_rgba(199,146,234,0.25)]"
                      : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Sparkles
                      className={`w-4 h-4 ${
                        config.cursorTether ? "text-secondary-accent" : "text-slate-400"
                      }`}
                    />
                    <span
                      className={`w-2 h-2 rounded-full ${
                        config.cursorTether
                          ? "bg-secondary-accent shadow-[0_0_6px_#c792ea]"
                          : "bg-white/20"
                      }`}
                    />
                  </div>
                  <span className="text-xs font-bold">Astral Tether</span>
                  <span className="text-[10px] text-slate-400">Cursor gravity wand</span>
                </button>

                {/* 3. Meteor Shower Toggle */}
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConfig((prev) => ({
                      ...prev,
                      meteorFrequency: prev.meteorFrequency === "shower" ? "normal" : "shower"
                    }))
                  }
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all duration-200 ${
                    config.meteorFrequency === "shower"
                      ? "bg-amber-500/15 border-amber-400/50 text-white shadow-[0_0_14px_rgba(245,158,11,0.25)]"
                      : "bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.07] hover:text-white"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Flame
                      className={`w-4 h-4 ${
                        config.meteorFrequency === "shower"
                          ? "text-amber-400"
                          : "text-slate-400"
                      }`}
                    />
                    <span
                      className={`w-2 h-2 rounded-full ${
                        config.meteorFrequency === "shower"
                          ? "bg-amber-400 shadow-[0_0_6px_#f59e0b]"
                          : "bg-white/20"
                      }`}
                    />
                  </div>
                  <span className="text-xs font-bold">Meteor Shower</span>
                  <span className="text-[10px] text-slate-400">
                    {config.meteorFrequency === "shower" ? "Perseid flux active" : "Calm night sky"}
                  </span>
                </button>

                {/* 4. Make a Wish (Instant Comet Trigger) */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={handleMakeWish}
                  className="flex flex-col items-start p-2.5 rounded-xl border border-secondary-accent/40 bg-gradient-to-br from-secondary-accent/20 to-primary-accent/15 text-white hover:border-secondary-accent hover:shadow-[0_0_16px_rgba(199,146,234,0.35)] transition-all duration-200"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Wand2 className="w-4 h-4 text-secondary-accent" />
                    <span className="text-[10px] font-mono font-bold text-secondary-accent">
                      ☄️
                    </span>
                  </div>
                  <span className="text-xs font-bold">Make a Wish</span>
                  <span className="text-[10px] text-slate-300">Launch flagship comet</span>
                </motion.button>
              </div>
            </div>

            {/* Wish Cast Micro-Toast */}
            {showWishToast && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-1.5 py-1 px-2.5 rounded-lg bg-secondary-accent/20 border border-secondary-accent/40 text-[11px] font-semibold text-secondary-accent"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Wish cast into the cosmic ocean...</span>
              </motion.div>
            )}

            {/* Section 3: Live Astronomical Telemetry Footer */}
            <div className="pt-2 border-t border-white/10">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 font-mono text-[10.5px] text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">COORDS:</span>
                  <span className="text-slate-200 font-semibold tracking-wide">
                    α {telemetry.ra} · δ {telemetry.dec}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">ENGINE:</span>
                  <span className="text-emerald-400">30FPS ECO-LOCKED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">WISHES:</span>
                  <span className="text-secondary-accent font-bold">
                    {String(config.wishCount || 0).padStart(2, "0")} CAST
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
