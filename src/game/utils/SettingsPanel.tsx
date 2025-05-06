import React, { useState, useEffect, useMemo } from 'react';
import { X, Volume2, Music, Shield } from "lucide-react";
import { SettingsSystem } from "../systems/SettingsSystem";

interface SettingsPanelProps {
  settingsSystem: SettingsSystem;
  show: boolean;
  onClose: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settingsSystem,
  show,
  onClose
}) => {
  const [selectedSettingsIndex, setSelectedSettingsIndex] = useState(0);
  
  // Reset selected index when panel opens/closes
  useEffect(() => {
    if (show) {
      setSelectedSettingsIndex(0);
    }
  }, [show]);
  
  // Handle settings item selection
  const handleSettingsSelect = (index: number) => {
    setSelectedSettingsIndex(index);
    
    if (index === 0) {
      settingsSystem.toggleSound();
    } else if (index === 1) {
      settingsSystem.toggleMusic();
    } else if (index === 2) {
      settingsSystem.cycleDifficulty();
    } else if (index === 3) {
      onClose();
    }
  };
  
  // Settings menu items with current states
  const settingsMenuItems = useMemo(() => [
    { id: 'sound', label: settingsSystem.getSoundLabel(), color: '#ffffff', icon: <Volume2 size={16} /> },
    { id: 'music', label: settingsSystem.getMusicLabel(), color: '#ffffff', icon: <Music size={16} /> },
    { id: 'difficulty', label: settingsSystem.getDifficultyLabel(), color: '#ffffff', icon: <Shield size={16} /> },
    { id: 'back', label: 'Back to Game', color: '#ff9999', icon: <X size={16} /> }
  ], [settingsSystem]);
  
  // Handle keyboard navigation in settings
  useEffect(() => {
    if (!show) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        setSelectedSettingsIndex(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowDown') {
        setSelectedSettingsIndex(prev => Math.min(settingsMenuItems.length - 1, prev + 1));
      } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z' || e.key === 'Z') {
        handleSettingsSelect(selectedSettingsIndex);
      } else if (e.key === 'Escape' || e.key === 'x' || e.key === 'X') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, selectedSettingsIndex, settingsMenuItems.length, onClose]);
  
  if (!show) return null;
  
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-30">
      <div className="bg-base-300 p-6 rounded-lg shadow-2xl max-w-md w-full border-2 border-primary/30 transform transition-all duration-300">
        <div className="flex justify-between items-center mb-6 border-b border-base-content/20 pb-3">
          <h3 className="text-xl font-medium text-primary">Game Settings</h3>
          <button 
            className="btn btn-sm btn-circle btn-ghost hover:bg-error/20" 
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Custom settings UI */}
        <div className="space-y-4 mb-6">
          {settingsMenuItems.map((item, index) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                index === selectedSettingsIndex
                  ? 'bg-primary/20 border border-primary/30'
                  : 'hover:bg-base-200 border border-transparent'
              }`}
              onClick={() => handleSettingsSelect(index)}
            >
              <div className={`p-2 rounded-full ${index === selectedSettingsIndex ? 'bg-primary/20' : 'bg-base-200'}`}>
                {item.icon}
              </div>
              <span className={`flex-1 text-left ${index === 3 ? 'text-accent' : ''}`}>{item.label}</span>
              {index !== 3 && (
                <div className="badge badge-sm badge-outline">
                  {item.id === 'sound' ? (settingsSystem.getSettings().sound ? 'ON' : 'OFF') :
                   item.id === 'music' ? (settingsSystem.getSettings().music ? 'ON' : 'OFF') :
                   settingsSystem.getSettings().difficulty}
                </div>
              )}
            </button>
          ))}
        </div>
        
        <div className="text-xs opacity-60 text-center border-t border-base-content/20 pt-3">
          Use arrow keys to navigate, Enter to select, Esc to close
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;