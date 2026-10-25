import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface StarryControlButtonProps {
  hideGUI: boolean;
  isPanelOpen: boolean;
  isActive?: boolean;
  onClick: () => void;
}

export default function StarryControlButton({
  hideGUI,
  isPanelOpen,
  isActive = false,
  onClick
}: StarryControlButtonProps) {
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    const checkNav = () => {
      setIsNavOpen(document.body.classList.contains("menu-open-active"));
    };
    checkNav();
    const observer = new MutationObserver(checkNav);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="fixed top-20 right-4 z-40 pointer-events-none"
      style={{
        visibility: isNavOpen ? "hidden" : "visible"
      }}
    >
      {/* Outer Rotating Dashed Orbital Ring */}
      <motion.div
        aria-hidden="true"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
        className={`absolute -inset-1.5 rounded-full pointer-events-none transition-opacity duration-500 ${
          isPanelOpen || isActive ? "opacity-100" : "opacity-30 group-hover:opacity-75"
        }`}
      >
        <svg viewBox="0 0 48 48" className="w-full h-full">
          <circle
            cx="24"
            cy="24"
            r="22"
            fill="none"
            stroke={isPanelOpen || isActive ? "rgba(94, 159, 255, 0.7)" : "rgba(255, 255, 255, 0.25)"}
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />
        </svg>
      </motion.div>

      {/* Main Starry Button */}
      <motion.button
        onClick={onClick}
        data-starry-control
        aria-label={isPanelOpen ? "Close Observatory controls" : "Open Observatory controls"}
        className={`starry-control-btn relative pointer-events-auto p-3 rounded-full border transition-all duration-300 flex items-center justify-center ${
          hideGUI
            ? "bg-transparent text-white/30 hover:text-white/60 border-white/10"
            : isPanelOpen || isActive
              ? "bg-[#070913]/90 text-primary-accent border-primary-accent/60 shadow-[0_0_20px_rgba(94,159,255,0.45)] backdrop-blur-md"
              : "bg-black/75 backdrop-blur-md text-white border-white/20 hover:text-primary-accent hover:border-primary-accent/40 shadow-lg"
        }`}
        style={{
          pointerEvents: isNavOpen ? "none" : "auto"
        }}
        whileHover={{ scale: isNavOpen ? 0.6 : hideGUI ? 1 : 1.08 }}
        whileTap={{ scale: 0.94 }}
        animate={{
          opacity: isNavOpen ? 0 : hideGUI ? 0.3 : 1,
          scale: isNavOpen ? 0.6 : 1,
          rotate: isPanelOpen ? 180 : 0
        }}
        transition={{ duration: 0.25 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="transition-transform duration-300"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>

        {/* Luminous Active Pip Indicator */}
        {isActive && !isPanelOpen && (
          <span
            aria-hidden="true"
            className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-secondary-accent border-2 border-[#070913] shadow-[0_0_8px_#c792ea] animate-pulse"
          />
        )}
      </motion.button>
    </div>
  );
}
