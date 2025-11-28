import { motion } from 'motion/react';

interface ControlPanelProps {
  isPlaying: boolean;
  speed: number;
  showSpeedControl: boolean;
  onPlay: () => void;
  onStop: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
}

export default function ControlPanel({
  isPlaying,
  speed,
  showSpeedControl,
  onPlay,
  onStop,
  onReset,
  onSpeedChange,
}: ControlPanelProps): JSX.Element {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Control buttons - mobile optimized */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-center">
        <motion.button
          onClick={onPlay}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`w-full sm:w-auto px-6 py-3 sm:px-5 sm:py-2.5 min-h-[48px] text-base sm:text-sm ${
            isPlaying 
              ? 'bg-yellow-600 hover:bg-yellow-700 active:bg-yellow-800' 
              : 'bg-green-600 hover:bg-green-700 active:bg-green-800'
          } text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg touch-manipulation`}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </motion.button>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <motion.button
            onClick={onStop}
            disabled={!isPlaying}
            whileHover={{ scale: isPlaying ? 1.02 : 1 }}
            whileTap={{ scale: isPlaying ? 0.98 : 1 }}
            className="flex-1 sm:flex-none px-4 py-3 sm:px-5 sm:py-2.5 min-h-[48px] bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg touch-manipulation"
          >
            ⏹ Stop
          </motion.button>
          
          <motion.button
            onClick={onReset}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex-1 sm:flex-none px-4 py-3 sm:px-5 sm:py-2.5 min-h-[48px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg touch-manipulation"
          >
            🔄 Reset
          </motion.button>
        </div>
      </div>

      {/* Speed control - mobile optimized */}
      {showSpeedControl && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-base-300/30 p-3 sm:p-4 rounded-lg border border-blue-500/10"
        >
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-blue-300">
                Speed Control
              </label>
              <span className="text-base sm:text-lg font-bold text-blue-400 font-mono bg-blue-500/10 px-3 py-1 rounded">
                {speed} px/s
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-base-content/50 w-6 sm:w-8">10</span>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={speed}
                onChange={(e) => onSpeedChange(Number(e.target.value))}
                className="flex-1 h-3 sm:h-2 bg-base-300 rounded-lg appearance-none cursor-pointer accent-blue-500 touch-manipulation"
                style={{ 
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((speed - 10) / 140) * 100}%, #374151 ${((speed - 10) / 140) * 100}%, #374151 100%)` 
                }}
              />
              <span className="text-xs text-base-content/50 w-6 sm:w-8 text-right">150</span>
            </div>
            
            {/* Mobile-friendly preset buttons */}
            <div className="grid grid-cols-3 gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSpeedChange(30)}
                className="px-2 sm:px-3 py-2 sm:py-1.5 min-h-[44px] bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 text-blue-300 rounded text-sm font-semibold transition-colors touch-manipulation"
              >
                🐌<br /><span className="text-xs">Slow</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSpeedChange(70)}
                className="px-2 sm:px-3 py-2 sm:py-1.5 min-h-[44px] bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 text-blue-300 rounded text-sm font-semibold transition-colors touch-manipulation"
              >
                🚶<br /><span className="text-xs">Medium</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSpeedChange(120)}
                className="px-2 sm:px-3 py-2 sm:py-1.5 min-h-[44px] bg-blue-500/20 hover:bg-blue-500/30 active:bg-blue-500/40 text-blue-300 rounded text-sm font-semibold transition-colors touch-manipulation"
              >
                🏃<br /><span className="text-xs">Fast</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
