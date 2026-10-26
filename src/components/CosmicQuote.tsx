import { useEffect, useRef } from "react";

export default function CosmicQuote() {
  const quoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = quoteRef.current;
    if (!el) return;

    const handleEnter = () => {
      window.dispatchEvent(
        new CustomEvent("observatory:starlight-boost", { detail: { active: true } })
      );
    };

    const handleLeave = () => {
      window.dispatchEvent(
        new CustomEvent("observatory:starlight-boost", { detail: { active: false } })
      );
    };

    el.addEventListener("mouseenter", handleEnter);
    el.addEventListener("mouseleave", handleLeave);
    el.addEventListener("pointerenter", handleEnter);
    el.addEventListener("pointerleave", handleLeave);

    return () => {
      el.removeEventListener("mouseenter", handleEnter);
      el.removeEventListener("mouseleave", handleLeave);
      el.removeEventListener("pointerenter", handleEnter);
      el.removeEventListener("pointerleave", handleLeave);
    };
  }, []);

  return (
    <div
      ref={quoteRef}
      className="group relative my-6 inline-flex items-center gap-3 py-1 select-none cursor-default"
    >
      {/* Subtle vertical gradient accent pill */}
      <span className="h-4 w-[2px] rounded-full bg-gradient-to-b from-[#5e9fff] via-[#c792ea] to-transparent opacity-85 transition-all duration-500 group-hover:h-5 group-hover:opacity-100 group-hover:shadow-[0_0_8px_#5e9fff]" />

      <p className="text-xs sm:text-sm tracking-[0.04em] leading-relaxed">
        <span className="text-slate-300/80 font-normal transition-colors duration-500 group-hover:text-slate-200">
          The darkest nights{" "}
        </span>
        <span className="font-medium bg-gradient-to-r from-[#7eb6ff] via-[#e2e8f0] to-[#c792ea] bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(94,159,255,0.28)] transition-all duration-500 group-hover:drop-shadow-[0_0_16px_rgba(199,146,234,0.65)]">
          produce the brightest stars
        </span>
      </p>
    </div>
  );
}
