import { AnimatePresence, motion } from "framer-motion";

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
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed top-24 right-4 bg-black/90 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl z-[9999] w-72"
            style={{ pointerEvents: "auto" }}
          >
            <div className="p-4">
              <div className="mb-4">
                <h3 className="text-white font-medium text-base">?? Cosmic Observatory</h3>
                {hideGUI && <p className="text-white/60 text-xs mt-1">Interface hidden</p>}
              </div>

              <div className="space-y-3">
                <button
                  onClick={onToggleConstellations}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    showConstellations
                      ? "bg-blue-500/30 text-blue-300 border border-blue-400/30"
                      : "bg-white/10 text-white/80 hover:bg-white/20 border border-white/10"
                  }`}
                >
                  ? {showConstellations ? "Hide" : "Show"} Constellations
                </button>

                <button
                  onClick={onToggleNebulae}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    enableNebulae
                      ? "bg-pink-500/30 text-pink-300 border border-pink-400/30"
                      : "bg-white/10 text-white/80 hover:bg-white/20 border border-white/10"
                  }`}
                >
                  ?? {enableNebulae ? "Hide" : "Show"} Nebulae
                </button>

                <button
                  onClick={onToggleHideGUI}
                  className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    hideGUI
                      ? "bg-green-500/20 text-green-300 border border-green-400/30"
                      : "bg-red-500/20 text-red-300 border border-red-400/30"
                  }`}
                >
                  ??? {hideGUI ? "Show" : "Hide"} Interface
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-xs text-white/60 text-center leading-relaxed">
                  ? Ultra Optimized
                  <br />
                  ?? 30 FPS Target
                  <br />
                  ?? Minimal Redraws
                  <br />
                  ?? Battery Friendly
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
