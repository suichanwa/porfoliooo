import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sparkles,
  X,
  Moon,
  CloudFog,
  Waypoints
} from "lucide-react";
import type { ObservatoryConfig } from "./types/starry";

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

  const getAtmosphereTabStyle = (id: "void" | "nebula" | "radiant", isActive: boolean) => {
    if (!isActive) {
      return "text-slate-400 hover:text-slate-200 border border-transparent";
    }

    switch (id) {
      case "void":
        return "bg-white/[0.07] border border-white/[0.12] text-white shadow-sm font-medium";
      case "nebula":
        return "bg-gradient-to-r from-[#5e9fff]/15 to-[#c792ea]/15 border border-[#5e9fff]/30 text-white shadow-[0_0_12px_rgba(94,159,255,0.15)] font-medium";
      case "radiant":
        return "bg-[#5e9fff]/15 border border-[#5e9fff]/35 text-white shadow-[0_0_12px_rgba(94,159,255,0.2)] font-medium";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          style={{ pointerEvents: "auto" }}
          className="fixed top-20 right-4 z-50 w-72 rounded-2xl bg-[#090c15]/95 backdrop-blur-md border border-white/[0.08] p-4 shadow-2xl text-slate-200 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-slate-400" strokeWidth={1.75} />
              <span className="text-sm font-medium text-slate-200">Observatory</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Observatory"
              className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>

          {/* Control 1 — Sky Atmosphere (3-Tab Segmented Switch) */}
          <div className="mt-3.5 space-y-1.5">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
              Atmosphere
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              {([
                { id: "void", label: "Void", Icon: Moon },
                { id: "nebula", label: "Nebula", Icon: CloudFog },
                { id: "radiant", label: "Radiant", Icon: Sparkles }
              ] as const).map(({ id, label, Icon }) => {
                const isActive = config.celestialLens === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onUpdateConfig({ celestialLens: id })}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs transition-all duration-200 ${getAtmosphereTabStyle(
                      id,
                      isActive
                    )}`}
                  >
                    <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Control 2 — Constellations Toggle */}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => onUpdateConfig({ showConstellations: !config.showConstellations })}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.07] transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg transition-colors ${
                    config.showConstellations
                      ? "bg-[#5e9fff]/10 text-[#5e9fff]"
                      : "bg-white/[0.04] text-slate-400 group-hover:text-slate-200"
                  }`}
                >
                  <Waypoints className="w-4 h-4" strokeWidth={1.75} />
                </div>
                <div>
                  <div className="text-xs font-medium text-slate-200">Constellations</div>
                  <div className="text-[11px] text-slate-500">Connect star clusters</div>
                </div>
              </div>
              <div
                className={`w-8 h-4 rounded-full transition-colors relative flex items-center px-0.5 ${
                  config.showConstellations ? "bg-[#5e9fff]/80" : "bg-white/10"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 ${
                    config.showConstellations ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </div>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
