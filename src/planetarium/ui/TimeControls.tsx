interface TimeControlsProps {
  /** Simulation speed in days per real second. 0 = paused. */
  speed: number;
  isPaused: boolean;
  onSlower: () => void;
  onFaster: () => void;
  onTogglePause: () => void;
  onNow: () => void;
  simDateMs: number | null;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "2-digit"
});

const formatSpeed = (speed: number) => {
  const abs = Math.abs(speed);
  if (abs === 0) return "paused";
  if (abs >= 365) return `${(speed / 365).toFixed(abs >= 3650 ? 0 : 1)} yr/s`;
  if (abs >= 1) return `${speed % 1 === 0 ? speed : speed.toFixed(1)} d/s`;
  return `${(speed * 24).toFixed(1)} h/s`;
};

const buttonBase =
  "pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 backdrop-blur-md transition hover:border-white/40 hover:bg-white/15 hover:text-white active:scale-95";

export default function TimeControls({
  speed,
  isPaused,
  onSlower,
  onFaster,
  onTogglePause,
  onNow,
  simDateMs
}: TimeControlsProps) {
  const dateParts =
    simDateMs !== null ? dateFormatter.formatToParts(new Date(simDateMs)) : null;
  const speedStr = formatSpeed(speed);
  return (
    <div className="pointer-events-none fixed bottom-4 sm:bottom-6 left-1/2 z-30 -translate-x-1/2 max-w-[calc(100vw-5.5rem)] sm:max-w-none">
      <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/10 bg-black/45 px-2 sm:px-2.5 py-1.5 sm:py-2 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={onSlower}
          className={buttonBase}
          aria-label="Slow down time"
          title="Slow down"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 5 4 12l7 7zM20 5l-7 7 7 7z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onTogglePause}
          className={buttonBase}
          aria-label={isPaused ? "Resume time" : "Pause time"}
          title={isPaused ? "Resume" : "Pause"}
        >
          {isPaused ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={onFaster}
          className={buttonBase}
          aria-label="Speed up time"
          title="Speed up"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 5l7 7-7 7zM4 5l7 7-7 7z" />
          </svg>
        </button>

        <div className="mx-1 flex min-w-[7.5rem] sm:min-w-[9.5rem] flex-col overflow-hidden leading-tight">
          <style>{`@keyframes ponytailRoll{from{opacity:0;transform:translateY(0.45em)}to{opacity:1;transform:translateY(0)}}`}</style>
          {/* Each part keyed by type:value → only the part whose value changes
              remounts and replays the roll animation (day, then month, etc). */}
          <span className="text-[11px] sm:text-[12px] font-medium text-white/90 tabular-nums">
            {dateParts
              ? dateParts.map((p, i) =>
                  p.type === "literal" ? (
                    <span key={`lit${i}`}>{p.value}</span>
                  ) : (
                    <span
                      key={`${p.type}:${p.value}`}
                      className="inline-block [animation:ponytailRoll_250ms_ease-out]"
                    >
                      {p.value}
                    </span>
                  )
                )
              : "--"}
          </span>
          <span
            key={speedStr}
            className="text-[10px] uppercase tracking-[0.18em] text-white/45 [animation:ponytailRoll_250ms_ease-out]"
          >
            {speedStr}
          </span>
        </div>

        <button
          type="button"
          onClick={onNow}
          className="pointer-events-auto rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur-md transition hover:border-white/40 hover:bg-white/15 hover:text-white active:scale-95"
          title="Jump to the real current date"
        >
          Now
        </button>
      </div>
    </div>
  );
}
