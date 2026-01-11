import { AnimatePresence, motion } from "framer-motion";
import { Telescope, Star, Sparkles, Zap, Target, RefreshCw, Battery } from "lucide-react";

interface StarryControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  showConstellations: boolean;
  enableNebulae: boolean;
  hideGUI: boolean;
  onToggleConstellations: () => void;
  onToggleNebulae: () => void;
  onToggleHideGUI: () => void;
}

export default function StarryControlPanel({
  isOpen,
  onClose,
  showConstellations,
  enableNebulae,
  hideGUI,
  onToggleConstellations,
  onToggleNebulae,
  onToggleHideGUI
}: StarryControlPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
            onClick={onClose}
            style={{ pointerEvents: "auto" }}
          />

          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed top-20 right-4 bg-black/90 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-[9999] w-72 max-w-[calc(100vw-2rem)]"
            style={{ pointerEvents: "auto" }}
          >
            <div className="p-4">
              <div className="mb-4 flex items-center gap-2">
                <Telescope className="w-5 h-5 text-white" />
                <h3 className="text-white font-medium text-base">Cosmic Observatory</h3>
              </div>

              <div className="space-y-3">
                <button
                  onClick={onToggleConstellations}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    showConstellations
                      ? "bg-blue-500/30 text-blue-300 border border-blue-400/30"
                      : "bg-white/10 text-white/80 hover:bg-white/20 border border-white/10"
                  }`}
                >
                  <Star className="w-4 h-4" />
                  {showConstellations ? "Hide" : "Show"} Constellations
                </button>

                <button
                  onClick={onToggleNebulae}
                  className={`w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                    enableNebulae
                      ? "bg-pink-500/30 text-pink-300 border border-pink-400/30"
                      : "bg-white/10 text-white/80 hover:bg-white/20 border border-white/10"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  {enableNebulae ? "Hide" : "Show"} Nebulae
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="text-xs text-white/60 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3" />
                    <span>Ultra Optimized</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-3 h-3" />
                    <span>30 FPS Target</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" />
                    <span>Minimal Redraws</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Battery className="w-3 h-3" />
                    <span>Battery Friendly</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
