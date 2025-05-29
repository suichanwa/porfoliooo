import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Volume2, VolumeX, Music, VolumeOff } from 'lucide-react';
import { SettingsSystem } from '../systems/SettingsSystem';

interface SettingsPanelProps {
  settingsSystem: SettingsSystem;
  show: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ settingsSystem, show, onClose }: SettingsPanelProps) {
  const settings = useMemo(() => {
    return {
      soundLabel: settingsSystem.getSoundLabel(),
      musicLabel: settingsSystem.getMusicLabel(),
      difficultyLabel: settingsSystem.getDifficultyLabel(),
      sound: settingsSystem.getSoundEnabled(),
      music: settingsSystem.getMusicEnabled(),
      sfxVolume: settingsSystem.getSfxVolume(),
      musicVolume: settingsSystem.getMusicVolume()
    };
  }, [settingsSystem, show]); // Re-compute when show changes to refresh settings

  const handleSoundToggle = () => {
    settingsSystem.toggleSound();
  };

  const handleMusicToggle = () => {
    settingsSystem.toggleMusic();
  };

  const handleDifficultyChange = () => {
    settingsSystem.cycleDifficulty();
  };

  const handleSfxVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(event.target.value);
    settingsSystem.setSfxVolume(volume);
  };

  const handleMusicVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(event.target.value);
    settingsSystem.setMusicVolume(volume);
  };

  const handleReset = () => {
    settingsSystem.resetToDefaults();
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Settings Panel */}
          <motion.div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                       bg-base-200 rounded-lg shadow-2xl z-50 w-96 max-w-[90vw] max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-base-300">
              <h2 className="text-2xl font-bold text-base-content">Game Settings</h2>
              <button
                className="btn btn-ghost btn-sm btn-circle"
                onClick={onClose}
                aria-label="Close settings"
              >
                <X size={20} />
              </button>
            </div>

            {/* Settings Content */}
            <div className="p-6 space-y-6">
              {/* Sound Effects */}
              <div className="form-control">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings.sound ? <Volume2 size={20} /> : <VolumeX size={20} />}
                    <span className="label-text text-base">Sound Effects</span>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.sound}
                    onChange={handleSoundToggle}
                  />
                </div>
                
                {/* SFX Volume Slider */}
                {settings.sound && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-base-content/70 mb-2">
                      <span>SFX Volume</span>
                      <span>{Math.round(settings.sfxVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.sfxVolume}
                      onChange={handleSfxVolumeChange}
                      className="range range-primary range-sm"
                    />
                  </div>
                )}
              </div>

              {/* Background Music */}
              <div className="form-control">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {settings.music ? <Music size={20} /> : <VolumeOff size={20} />}
                    <span className="label-text text-base">Background Music</span>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-primary"
                    checked={settings.music}
                    onChange={handleMusicToggle}
                  />
                </div>
                
                {/* Music Volume Slider */}
                {settings.music && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-base-content/70 mb-2">
                      <span>Music Volume</span>
                      <span>{Math.round(settings.musicVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.musicVolume}
                      onChange={handleMusicVolumeChange}
                      className="range range-primary range-sm"
                    />
                  </div>
                )}
              </div>

              {/* Difficulty */}
              <div className="form-control">
                <div className="flex items-center justify-between">
                  <span className="label-text text-base">Difficulty</span>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={handleDifficultyChange}
                  >
                    {settingsSystem.getDifficulty()}
                  </button>
                </div>
                <div className="text-xs text-base-content/70 mt-1">
                  Click to cycle through difficulty levels
                </div>
              </div>

              {/* Divider */}
              <div className="divider"></div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  className="btn btn-outline flex-1"
                  onClick={handleReset}
                >
                  Reset to Defaults
                </button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={onClose}
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}