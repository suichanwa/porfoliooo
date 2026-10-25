import { useState, useEffect } from "react";

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
    <button
      type="button"
      onClick={onClick}
      data-starry-control
      aria-expanded={isPanelOpen}
      aria-label={isPanelOpen ? "Close Observatory controls" : "Open Observatory controls"}
      className={`starry-control-btn fixed top-20 right-4 z-40 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 outline-none focus:outline-none ${
        hideGUI
          ? "bg-transparent text-white/30 hover:text-white/60 border border-transparent"
          : isPanelOpen
            ? "bg-white/[0.08] hover:bg-white/[0.12] text-white border border-white/20 active:scale-95"
            : "bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 hover:text-white border border-white/10 active:scale-95"
      }`}
      style={{
        pointerEvents: isNavOpen ? "none" : "auto",
        visibility: isNavOpen ? "hidden" : "visible",
        opacity: isNavOpen ? 0 : 1
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`transition-transform duration-300 ${isPanelOpen ? "rotate-180 text-white" : ""}`}
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    </button>
  );
}
