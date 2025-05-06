import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState } from '../constants';

interface ResultModalProps {
  gameState: GameState;
  enemyName: string;
  onContinue: () => void;
  onRetry: () => void;
  experience?: number;
  gold?: number;
}

export default function ResultModal({
  gameState,
  enemyName,
  onContinue,
  onRetry,
  experience = 15,
  gold = 10
}: ResultModalProps) {
  const [animateItems, setAnimateItems] = useState(false);
  
  // Start item animation after modal appears
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateItems(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  const isVictory = gameState === GameState.VICTORY;
  
  return (
    <AnimatePresence>
      {(gameState === GameState.VICTORY || gameState === GameState.DEFEAT) && (
        <motion.div 
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="bg-base-200 border-2 border-primary/30 rounded-lg p-6 max-w-md w-full text-center"
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", damping: 15 }}
          >
            <div className="relative">
              {/* Decorative background symbol */}
              <div className="absolute inset-0 flex justify-center items-center opacity-5 pointer-events-none">
                <svg viewBox="0 0 100 100" className={`w-full h-full ${isVictory ? 'text-primary' : 'text-error'}`}>
                  <circle cx="50" cy="50" r="45" fill="currentColor" stroke="currentColor" strokeWidth="2" />
                  {isVictory ? (
                    <>
                      <path d="M30 50l15 15l25-25" stroke="white" strokeWidth="8" fill="none" />
                    </>
                  ) : (
                    <>
                      <path d="M35 35l30 30M65 35l-30 30" stroke="white" strokeWidth="8" />
                    </>
                  )}
                </svg>
              </div>
              
              {/* Title */}
              <motion.h2 
                className={`text-2xl font-bold mb-6 ${isVictory ? 'text-primary' : 'text-error'}`}
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
              >
                {isVictory ? 'Victory!' : 'Defeat'}
              </motion.h2>
              
              {/* Message */}
              <motion.p 
                className="mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {isVictory 
                  ? `You defeated the ${enemyName}!` 
                  : 'You have been defeated...'}
              </motion.p>
              
              {/* Rewards (for victory) */}
              {isVictory && (
                <motion.div 
                  className="mb-6 bg-base-300 rounded-lg p-4 border border-base-content/10"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: 'auto', 
                    opacity: 1,
                    transition: { delay: 0.3 }
                  }}
                >
                  <h3 className="text-sm uppercase tracking-wider mb-3 opacity-70">Rewards</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ 
                        x: 0, 
                        opacity: 1,
                        transition: { delay: animateItems ? 0.5 : 2 }
                      }}
                    >
                      <div className="text-xs opacity-70">Experience</div>
                      <div className="text-lg font-medium text-cyan-400">+{experience} XP</div>
                    </motion.div>
                    <motion.div
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ 
                        x: 0, 
                        opacity: 1, 
                        transition: { delay: animateItems ? 0.7 : 2 }
                      }}
                    >
                      <div className="text-xs opacity-70">Gold</div>
                      <div className="text-lg font-medium text-amber-400">+{gold} G</div>
                    </motion.div>
                  </div>
                </motion.div>
              )}
              
              {/* Action buttons */}
              <div className="flex flex-col gap-3">
                <motion.button
                  className={`btn ${isVictory ? 'btn-primary' : 'btn-error'}`}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ 
                    y: 0, 
                    opacity: 1,
                    transition: { delay: 0.9 }
                  }}
                  onClick={isVictory ? onContinue : onRetry}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isVictory ? 'Continue Journey' : 'Try Again'}
                </motion.button>
                
                {isVictory && (
                  <motion.div
                    className="mt-2 text-xs opacity-70"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: 1,
                      transition: { delay: 1.1 }
                    }}
                  >
                    New areas have been unlocked!
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}