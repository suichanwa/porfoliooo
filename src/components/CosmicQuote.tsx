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
      className="mt-3 mb-6 text-sm sm:text-base font-normal tracking-wide select-none group cursor-default inline-flex flex-wrap items-center justify-center md:justify-start gap-x-1.5"
    >
      <span className="text-slate-500 transition-colors duration-500 group-hover:text-slate-400">
        &ldquo;The darkest nights
      </span>
      <span className="bg-gradient-to-r from-[#5e9fff] via-[#c7d2fe] to-[#c792ea] bg-clip-text text-transparent transition-all duration-500 group-hover:drop-shadow-[0_0_12px_rgba(94,159,255,0.5)]">
        produce the brightest stars.&rdquo;
      </span>
    </div>
  );
}
