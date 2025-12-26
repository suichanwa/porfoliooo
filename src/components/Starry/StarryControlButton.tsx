import { motion } from "framer-motion";

interface StarryControlButtonProps {
  hideGUI: boolean;
  isPanelOpen: boolean;
  onClick: () => void;
}

export default function StarryControlButton({
  hideGUI,
  isPanelOpen,
  onClick
}: StarryControlButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`fixed top-20 right-4 z-[9999] p-3 rounded-full border border-white/20 shadow-lg transition-all duration-300 ${
        hideGUI
          ? "bg-transparent text-white/30 hover:text-white/60"
          : "bg-black/70 backdrop-blur-sm text-white hover:text-blue-300"
      }`}
      style={{ pointerEvents: "auto" }}
      whileHover={{ scale: hideGUI ? 1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={{ opacity: hideGUI ? 0.3 : 1, rotate: isPanelOpen ? 180 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </motion.button>
  );
}
