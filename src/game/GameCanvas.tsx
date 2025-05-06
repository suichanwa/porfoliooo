import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import StatusBar from "./components/StatusBar";
import MessageBox from "./components/MessageBox";
import { MenuSystem } from "./systems/MenuSystem";
import { SettingsSystem } from "./systems/SettingsSystem";
import MenuSystemUI from "./components/MenuSystem";
import SettingsButton from "./components/SettingsButton";
import { ChevronUp, ChevronDown, Check, X } from "lucide-react";
import { createMainMenuScene } from "./scenes/MainMenuScene";
import { GameStateData } from "./types/gameTypes";
import { GameState } from "./constants";
import { BattleScene } from "./scenes/BattleScene";
import SettingsPanel from "./utils/SettingsPanel";
import ResultModal from "./components/ResultModal"; // Import the new component

export default function GameCanvas() {
  // Component refs and state
  const container = useRef<HTMLDivElement>(null);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [gameState, setGameState] = useState<GameStateData | null>(null);
  const [menuSystem] = useState(() => new MenuSystem());
  const [settingsSystem] = useState(() => new SettingsSystem());
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [gameInstance, setGameInstance] = useState<any>(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Function to handle menu item selection
  const handleMenuItemSelect = useCallback((index: number) => {
    if (window.gameControlEvent) {
      if (index === menuSystem.getSelectedIndex()) {
        // If clicking on already selected item, trigger selection
        window.gameControlEvent("select");
      } else {
        // First update the selection
        const diff = index - menuSystem.getSelectedIndex();
        for (let i = 0; i < Math.abs(diff); i++) {
          if (diff > 0) {
            window.gameControlEvent("down");
          } else {
            window.gameControlEvent("up");
          }
        }
      }
    }
  }, [menuSystem]);

  // Update game state handler
  const updateGameState = useCallback((state: GameStateData) => {
    setGameState(state);
  }, []);

  // Create battle scene dependencies
  const battleSceneDeps = useMemo(() => ({
    menuSystem,
    updateGameState
  }), [menuSystem, updateGameState]);

  // Initialize Phaser and create the game
  useEffect(() => {
    let game: any = null;
    
    const initPhaser = async () => {
      try {
        const Phaser = await import('phaser');
        
        // Create the main menu scene
        const MainMenuScene = createMainMenuScene(Phaser.default);
        
        // Create custom battle scene class instance
        const battleScene = new BattleScene(battleSceneDeps);
        
        // Define game configuration
        const config = {
          type: Phaser.default.AUTO,
          width: 800,
          height: 600,
          parent: container.current!,
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { y: 0 },
              debug: false
            }
          },
          scene: [MainMenuScene, battleScene], // MainMenuScene first
          pixelArt: true,
          backgroundColor: '#000000',
          scale: {
            mode: Phaser.default.Scale.FIT,
            autoCenter: Phaser.default.Scale.CENTER_BOTH
          }
        };
        
        // Create the game
        game = new Phaser.default.Game(config);
        setGameInstance(game);
        
        // Expose updateGameState for scene to call
        window.updateGameState = updateGameState;
        
        setGameLoaded(true);
      } catch (error) {
        console.error("Failed to load Phaser:", error);
      }
    };
    
    initPhaser();
    
    // Cleanup on unmount
    return () => {
      if (game) game.destroy(true);
      delete window.updateGameState;
      delete window.gameControlEvent;
    };
  }, [battleSceneDeps, updateGameState]);

  // Handle touch control button clicks
  const handleControlClick = useCallback((action: string) => {
    if (window.gameControlEvent) {
      window.gameControlEvent(action);
    }
  }, []);

  // Handle settings toggle
  const toggleSettings = useCallback(() => {
    setShowSettings(prev => !prev);
  }, []);

  // Handle continuing to next level after victory
  const handleContinueJourney = useCallback(() => {
    if (window.gameControlEvent && gameInstance) {
      // Reset the battle with a new enemy type (for the "next level")
      window.gameControlEvent("nextLevel");
    }
  }, [gameInstance]);

  // Handle retrying after defeat
  const handleRetry = useCallback(() => {
    if (window.gameControlEvent && gameInstance) {
      // Reset the battle with the same enemy type
      window.gameControlEvent("retry");
    }
  }, [gameInstance]);

  // Determine if menu should be shown
  const shouldShowMenu = useMemo(() => (
    !showSettings && gameState?.currentState === GameState.PLAYER_TURN
  ), [showSettings, gameState?.currentState]);

  return (
    <div className="relative">
      <div className="text-white text-center mb-4">Mystic Ruins: Lost Civilization</div>
      
      {/* Game Canvas Container */}
      <div className="relative">
        {/* Game Canvas */}
        <div 
          ref={container} 
          className="w-full aspect-[4/3] md:h-[600px] rounded-lg overflow-hidden bg-gray-900"
        ></div>
        
        {/* Settings Button */}
        <div className="absolute top-4 right-4 z-20">
          <SettingsButton onClick={toggleSettings} />
        </div>
        
        {/* Settings Panel Component */}
        <SettingsPanel 
          settingsSystem={settingsSystem}
          show={showSettings}
          onClose={() => setShowSettings(false)}
        />
        
        {/* Victory/Defeat Modal */}
        {gameState && (gameState.currentState === GameState.VICTORY || gameState.currentState === GameState.DEFEAT) && (
          <ResultModal
            gameState={gameState.currentState}
            enemyName={gameState.enemyName}
            onContinue={handleContinueJourney}
            onRetry={handleRetry}
            experience={15 + Math.floor(Math.random() * 10)}
            gold={8 + Math.floor(Math.random() * 7)}
          />
        )}
      </div>
      
      {/* Loading State */}
      {!gameLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-base-300 bg-opacity-50">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      )}
      
      {/* Game UI */}
      {gameState && (
        <div className="mt-4 bg-base-300 p-4 rounded-lg border border-base-content/10">
          {/* Status Bars */}
          <StatusBar 
            playerHP={gameState.playerHP}
            maxPlayerHP={gameState.maxPlayerHP}
            playerMP={gameState.playerMP}
            maxPlayerMP={gameState.maxPlayerMP}
            enemyHP={gameState.enemyHP}
            maxEnemyHP={gameState.maxEnemyHP}
            enemyName={gameState.enemyName}
          />
          
          {/* Message Box */}
          <MessageBox message={gameState.message} />
          
          {/* Menu System UI */}
          {shouldShowMenu && (
            <div className="my-4">
              <MenuSystemUI 
                menuItems={menuSystem.getMenuItems()}
                selectedIndex={menuSystem.getSelectedIndex()}
                currentMenu={menuSystem.getCurrentMenu()}
                onSelectItem={handleMenuItemSelect}
              />
            </div>
          )}
          
          {/* Controls */}
          {isMobile ? (
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button 
                className="btn btn-circle btn-outline btn-lg mx-auto"
                onClick={() => handleControlClick('up')}
              >
                <ChevronUp size={24} />
              </button>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  className="btn btn-circle btn-outline btn-success btn-lg"
                  onClick={() => handleControlClick('select')}
                >
                  <Check size={24} />
                </button>
                <button 
                  className="btn btn-circle btn-outline btn-error btn-lg"
                  onClick={() => handleControlClick('back')}
                >
                  <X size={24} />
                </button>
              </div>
              
              <button 
                className="btn btn-circle btn-outline btn-lg mx-auto"
                onClick={() => handleControlClick('down')}
              >
                <ChevronDown size={24} />
              </button>
            </div>
          ) : (
            <div className="mt-4 flex items-center justify-center gap-4 text-sm opacity-70 border-t border-base-content/10 pt-2">
              <div className="flex items-center gap-1">
                <kbd className="kbd kbd-sm">↑</kbd>
                <kbd className="kbd kbd-sm">↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="kbd kbd-sm">Z</kbd>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="kbd kbd-sm">X</kbd>
                <span>Back</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}