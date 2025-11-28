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
    <div className="space-y-4">
      {/* Control buttons */}
      <div className="flex flex-wrap gap-3 items-center justify-center sm:justify-start">
        <motion.button
          onClick={onPlay}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`px-5 py-2.5 ${
            isPlaying 
              ? 'bg-yellow-600 hover:bg-yellow-700' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white rounded-lg transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg`}
        >
          {isPlaying ? '⏸ Pause' : '▶ Play'}
        </motion.button>
        
        <motion.button
          onClick={onStop}
          disabled={!isPlaying}
          whileHover={{ scale: isPlaying ? 1.05 : 1 }}
          whileTap={{ scale: isPlaying ? 0.95 : 1 }}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50 text-white rounded-lg transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg"
        >
          ⏹ Stop
        </motion.button>
        
        <motion.button
          onClick={onReset}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2 font-semibold shadow-lg"
        >
          🔄 Reset
        </motion.button>
      </div>

      {/* Speed control */}
      {showSpeedControl && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-base-300/30 p-4 rounded-lg border border-blue-500/10"
        >
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-blue-300">
                Speed Control
              </label>
              <span className="text-lg font-bold text-blue-400 font-mono bg-blue-500/10 px-3 py-1 rounded">
                {speed} px/s
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-xs text-base-content/50 w-8">10</span>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={speed}
                onChange={(e) => onSpeedChange(Number(e.target.value))}
                className="flex-1 h-2 bg-base-300 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <span className="text-xs text-base-content/50 w-8 text-right">150</span>
            </div>
            
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSpeedChange(30)}
                className="flex-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-xs font-semibold transition-colors"
              >
                Slow
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSpeedChange(70)}
                className="flex-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-xs font-semibold transition-colors"
              >
                Medium
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSpeedChange(120)}
                className="flex-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded text-xs font-semibold transition-colors"
              >
                Fast
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}