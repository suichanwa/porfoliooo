import React from 'react';
import './LoadingScreen.scss';

interface LoadingScreenProps {
  progress: number;
  currentTask?: string;
  isVisible: boolean;
  onRetry?: () => void;
  error?: string | null;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  progress,
  currentTask = 'Loading assets...',
  isVisible,
  onRetry,
  error
}) => {
  if (!isVisible) return null;

  return (
    <div className="loading-screen">
      <div className="loading-screen__overlay" />
      
      <div className="loading-screen__content">
        {error ? (
          // Error State
          <div className="loading-screen__error">
            <div className="loading-screen__error-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
              </svg>
            </div>
            
            <h2 className="loading-screen__error-title">Loading Failed</h2>
            <p className="loading-screen__error-message">{error}</p>
            
            {onRetry && (
              <button 
                className="loading-screen__retry-btn"
                onClick={onRetry}
              >
                <span>Try Again</span>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
                </svg>
              </button>
            )}
          </div>
        ) : (
          // Loading State
          <div className="loading-screen__loading">
            {/* Mystical Logo/Icon */}
            <div className="loading-screen__logo">
              <div className="loading-screen__rune">
                <svg viewBox="0 0 100 100" className="loading-screen__rune-svg">
                  <circle cx="50" cy="50" r="45" className="loading-screen__rune-circle"/>
                  <path d="M30 30 L70 70 M70 30 L30 70" className="loading-screen__rune-cross"/>
                  <circle cx="50" cy="50" r="20" className="loading-screen__rune-inner"/>
                  <path d="M50 30 L60 50 L50 70 L40 50 Z" className="loading-screen__rune-diamond"/>
                </svg>
              </div>
            </div>
            
            {/* Title */}
            <h1 className="loading-screen__title">
              Mystic Ruins
              <span className="loading-screen__subtitle">Lost Civilization</span>
            </h1>
            
            {/* Current Task */}
            <p className="loading-screen__task">{currentTask}</p>
            
            {/* Progress Bar */}
            <div className="loading-screen__progress">
              <div className="loading-screen__progress-track">
                <div 
                  className="loading-screen__progress-fill"
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                />
                <div className="loading-screen__progress-glow" />
              </div>
              
              <div className="loading-screen__progress-text">
                {Math.round(progress)}%
              </div>
            </div>
            
            {/* Floating Particles */}
            <div className="loading-screen__particles">
              {Array.from({ length: 20 }, (_, i) => (
                <div 
                  key={i} 
                  className="loading-screen__particle"
                  style={{
                    '--delay': `${i * 0.5}s`,
                    '--duration': `${3 + Math.random() * 2}s`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 3}s`
                  } as React.CSSProperties}
                />
              ))}
            </div>
            
            {/* Loading Tips */}
            <div className="loading-screen__tip">
              <span className="loading-screen__tip-label">Tip:</span>
              <span className="loading-screen__tip-text">
                Use arrow keys to navigate and Z to select in battle
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;