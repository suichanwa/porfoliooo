import { motion } from 'motion/react';
import IconButton, {
  BreezeIcon,
  GaugeIcon,
  PauseIcon,
  PlayIcon,
  ResetIcon,
  RocketIcon,
  StopIcon,
} from './IconButton';

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
        <IconButton
          fullWidth
          onClick={onPlay}
          variant={isPlaying ? 'subtle' : 'accent'}
          label={isPlaying ? 'Pause' : 'Play'}
          icon={isPlaying ? <PauseIcon /> : <PlayIcon />}
        />

        <div className="flex gap-2 w-full sm:w-auto">
          <IconButton
            fullWidth
            onClick={onStop}
            disabled={!isPlaying}
            variant="danger"
            label="Stop"
            icon={<StopIcon />}
          />

          <IconButton
            fullWidth
            onClick={onReset}
            variant="primary"
            label="Reset"
            icon={<ResetIcon />}
          />
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
                <span className="inline-flex items-center gap-2">
                  <GaugeIcon />
                  Speed Control
                </span>
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
                  background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((speed - 10) / 140) * 100}%, #374151 ${((speed - 10) / 140) * 100}%, #374151 100%)`,
                }}
              />
              <span className="text-xs text-base-content/50 w-6 sm:w-8 text-right">150</span>
            </div>

            {/* Mobile-friendly preset buttons */}
            <div className="grid grid-cols-3 gap-2">
              <IconButton
                size="sm"
                fullWidth
                onClick={() => onSpeedChange(30)}
                variant="ghost"
                label="Slow"
                icon={<BreezeIcon />}
              />
              <IconButton
                size="sm"
                fullWidth
                onClick={() => onSpeedChange(70)}
                variant="ghost"
                label="Medium"
                icon={<GaugeIcon />}
              />
              <IconButton
                size="sm"
                fullWidth
                onClick={() => onSpeedChange(120)}
                variant="ghost"
                label="Fast"
                icon={<RocketIcon />}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
