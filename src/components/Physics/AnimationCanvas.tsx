import FPSCounter from './../FPSCounter';

interface AnimationCanvasProps {
  time: number;
  position: number;
  isAnimating?: boolean;
}

const TRACK_PADDING_PERCENT = 6;

export default function AnimationCanvas({
  time,
  position,
  isAnimating = false,
}: AnimationCanvasProps): JSX.Element {
  const progress = Math.max(0, Math.min(1, position / 600));
  const offsetPercent = TRACK_PADDING_PERCENT + progress * (100 - TRACK_PADDING_PERCENT * 2);

  return (
    <div className="w-full h-48 sm:h-56 lg:h-64 bg-gray-800 rounded-lg mb-4 sm:mb-6 relative overflow-hidden border border-gray-600 shadow-lg">
      <FPSCounter isAnimating={isAnimating} />

      {/* Track */}
      <div className="absolute inset-0 bg-gray-900">
        <div className="absolute top-1/2 left-[6%] right-[6%] h-0.5 bg-blue-500/30 -translate-y-1/2">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-emerald-400 origin-left transition-[transform] duration-150"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
        <div className="absolute left-[6%] top-1/2 w-1.5 h-1.5 bg-blue-300 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute right-[6%] top-1/2 w-1.5 h-1.5 bg-blue-300 rounded-full translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Trail */}
      <div
        className="absolute top-1/2 w-12 h-3 bg-blue-400/20 blur-md rounded-full pointer-events-none transition-transform duration-75 will-change-transform"
        style={{
          left: `${offsetPercent}%`,
          transform: 'translate(-50%, -50%) translateZ(0)',
        }}
        aria-hidden="true"
      />

      {/* Ball */}
      <div
        className="absolute top-1/2 w-5 h-5 bg-gradient-to-br from-blue-300 via-blue-400 to-emerald-300 rounded-full shadow-[0_0_18px_rgba(59,130,246,0.6)] border border-white/20 transition-transform duration-75 will-change-transform"
        style={{
          left: `${offsetPercent}%`,
          transform: 'translate(-50%, -50%) translateZ(0)',
        }}
      />

      {/* Readouts */}
      <div className="absolute top-2 left-2 text-blue-300 text-xs font-mono">
        t: {time.toFixed(1)}s | p: {position.toFixed(0)}px
      </div>
      <div className="absolute bottom-2 left-2 text-blue-300 text-xs font-mono hidden sm:block">
        {isAnimating ? 'Active' : 'Stopped'}
      </div>
      <div className="absolute bottom-2 right-2 text-blue-300 text-xs sm:hidden">
        {isAnimating ? '▶' : '⏸'}
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-gray-400 text-xs sm:hidden">
        Tap controls
      </div>
    </div>
  );
}
