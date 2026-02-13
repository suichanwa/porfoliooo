import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import Phaser from 'phaser';
import { createBattleScene } from './scenes/BattleScene';
import type { GameStateData } from './types/gameTypes';
import type { CharacterCreationData } from './types/characterTypes';
import StatusBar from './components/StatusBar';
import MessageBox from './components/MessageBox';
import ResultModal from './components/ResultModal';
import SettingsButton from './components/SettingsButton';
import SettingsPanel from './utils/SettingsPanel';
import CharacterCreationScene from './scenes/ClassCreation';
import { SettingsSystem } from './systems/SettingsSystem';
import { MenuSystem } from './systems/MenuSystem';

// Debug logging utility
const debugLog = (component: string, message: string, data?: any) => {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] [${component}] ${message}`, data ? data : '');
};

// Simple Main Menu Scene directly in this file
function createMainMenuScene() {
  debugLog('GameCanvas', 'Creating MainMenuScene class');
  
  return class MainMenuScene extends Phaser.Scene {
    private selectedIndex = 0;
    private menuItems = ['Start Game', 'Settings', 'Credits'];
    private sceneInitialized = false;

    constructor() {
      debugLog('MainMenuScene', 'Constructor called');
      super({ key: 'MainMenuScene' });
      debugLog('MainMenuScene', 'Constructor completed');
    }

    preload() {
      debugLog('MainMenuScene', 'Preload started');
      try {
        // Simulate some preload work
        this.load.once('complete', () => {
          debugLog('MainMenuScene', 'Preload complete event fired');
        });
        
        debugLog('MainMenuScene', 'Preload completed successfully');
      } catch (error) {
        debugLog('MainMenuScene', 'Error in preload:', error);
      }
    }

    create() {
      debugLog('MainMenuScene', 'Create started');
      
      try {
        debugLog('MainMenuScene', 'About to call setupScene()');
        this.setupScene();
        this.sceneInitialized = true;
        debugLog('MainMenuScene', 'Scene created successfully');
      } catch (error) {
        debugLog('MainMenuScene', 'Error creating scene:', error);
        this.showErrorState();
      }
    }

    private setupScene() {
      debugLog('MainMenuScene', 'Setting up scene components');
      
      try {
        // Background
        debugLog('MainMenuScene', 'Creating background');
        const bg = this.add.graphics();
        bg.fillStyle(0x1a1a2e, 1);
        bg.fillRect(0, 0, 800, 600);
        debugLog('MainMenuScene', 'Background created');

        // Title
        debugLog('MainMenuScene', 'Creating title text');
        this.add.text(400, 150, 'Mystic Ruins', {
          fontFamily: 'Arial',
          fontSize: '48px',
          color: '#ffffff',
          stroke: '#2a2a4a',
          strokeThickness: 4
        }).setOrigin(0.5);
        debugLog('MainMenuScene', 'Title created');

        // Subtitle
        debugLog('MainMenuScene', 'Creating subtitle');
        this.add.text(400, 200, 'Lost Civilization', {
          fontFamily: 'Arial',
          fontSize: '20px',
          color: '#aaccff'
        }).setOrigin(0.5);
        debugLog('MainMenuScene', 'Subtitle created');

        // Menu buttons
        debugLog('MainMenuScene', 'Creating menu buttons');
        this.createMenuButtons();
        debugLog('MainMenuScene', 'Menu buttons created');
        
        debugLog('MainMenuScene', 'Setting up input');
        this.setupInput();
        debugLog('MainMenuScene', 'Input setup complete');
        
        debugLog('MainMenuScene', 'Updating menu selection');
        this.updateMenuSelection();
        debugLog('MainMenuScene', 'Menu selection updated');

        // Fade in
        debugLog('MainMenuScene', 'Starting fade in');
        this.cameras.main.fadeIn(500, 0, 0, 0);
        debugLog('MainMenuScene', 'Fade in started');
        
        debugLog('MainMenuScene', 'Scene setup completed successfully');
      } catch (error) {
        debugLog('MainMenuScene', 'Error in setupScene:', error);
        throw error;
      }
    }

    private createMenuButtons() {
      debugLog('MainMenuScene', `Creating ${this.menuItems.length} menu buttons`);
      
      this.menuItems.forEach((item, index) => {
        try {
          debugLog('MainMenuScene', `Creating button ${index}: ${item}`);
          const y = 320 + (index * 60);
          
          // Button background
          const button = this.add.graphics();
          button.fillStyle(0x4488ff, 1);
          button.fillRoundedRect(-80, -20, 160, 40, 5);
          button.lineStyle(2, 0xffffff, 1);
          button.strokeRoundedRect(-80, -20, 160, 40, 5);
          button.setPosition(400, y);
          button.setInteractive(new Phaser.Geom.Rectangle(-80, -20, 160, 40), Phaser.Geom.Rectangle.Contains);

          // Button text
          const text = this.add.text(400, y, item, {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ffffff'
          }).setOrigin(0.5);

          // Store references
          button.setName(`button_${index}`);
          text.setName(`text_${index}`);

          // Button interactions
          button.on('pointerover', () => {
            debugLog('MainMenuScene', `Button ${index} hovered`);
            this.selectedIndex = index;
            this.updateMenuSelection();
          });

          button.on('pointerdown', () => {
            debugLog('MainMenuScene', `Button ${index} clicked`);
            this.selectMenuItem();
          });
          
          debugLog('MainMenuScene', `Button ${index} created successfully`);
        } catch (error) {
          debugLog('MainMenuScene', `Error creating button ${index}:`, error);
        }
      });
      
      debugLog('MainMenuScene', 'All menu buttons created');
    }

    private setupInput() {
      debugLog('MainMenuScene', 'Setting up keyboard input');
      
      try {
        this.input.keyboard.on('keydown-UP', () => {
          debugLog('MainMenuScene', 'UP key pressed');
          this.selectedIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : this.menuItems.length - 1;
          this.updateMenuSelection();
        });

        this.input.keyboard.on('keydown-DOWN', () => {
          debugLog('MainMenuScene', 'DOWN key pressed');
          this.selectedIndex = this.selectedIndex < this.menuItems.length - 1 ? this.selectedIndex + 1 : 0;
          this.updateMenuSelection();
        });

        this.input.keyboard.on('keydown-SPACE', () => {
          debugLog('MainMenuScene', 'SPACE key pressed');
          this.selectMenuItem();
        });

        this.input.keyboard.on('keydown-ENTER', () => {
          debugLog('MainMenuScene', 'ENTER key pressed');
          this.selectMenuItem();
        });
        
        debugLog('MainMenuScene', 'Keyboard input setup complete');
      } catch (error) {
        debugLog('MainMenuScene', 'Error setting up input:', error);
      }
    }

    private updateMenuSelection() {
      debugLog('MainMenuScene', `Updating menu selection to index ${this.selectedIndex}`);
      
      try {
        for (let i = 0; i < this.menuItems.length; i++) {
          const button = this.children.getByName(`button_${i}`) as Phaser.GameObjects.Graphics;
          const text = this.children.getByName(`text_${i}`) as Phaser.GameObjects.Text;
          
          if (button && text) {
            button.clear();
            if (i === this.selectedIndex) {
              button.fillStyle(0x66aaff, 1);
              button.fillRoundedRect(-80, -20, 160, 40, 5);
              button.lineStyle(2, 0xffffff, 1);
              button.strokeRoundedRect(-80, -20, 160, 40, 5);
              button.setScale(1.05);
              text.setScale(1.05);
            } else {
              button.fillStyle(0x4488ff, 1);
              button.fillRoundedRect(-80, -20, 160, 40, 5);
              button.lineStyle(2, 0xffffff, 1);
              button.strokeRoundedRect(-80, -20, 160, 40, 5);
              button.setScale(1.0);
              text.setScale(1.0);
            }
          } else {
            debugLog('MainMenuScene', `Warning: Could not find button or text for index ${i}`);
          }
        }
        debugLog('MainMenuScene', 'Menu selection update complete');
      } catch (error) {
        debugLog('MainMenuScene', 'Error updating menu selection:', error);
      }
    }

    private selectMenuItem() {
      debugLog('MainMenuScene', `Selecting menu item ${this.selectedIndex}: ${this.menuItems[this.selectedIndex]}`);
      
      switch (this.selectedIndex) {
        case 0: // Start Game
          this.startGame();
          break;
        case 1: // Settings
          debugLog('MainMenuScene', 'Settings selected');
          break;
        case 2: // Credits
          debugLog('MainMenuScene', 'Credits selected');
          break;
      }
    }

    private startGame() {
      debugLog('MainMenuScene', 'Opening character creation scene');
      
      try {
        this.game.events.emit('open-character-creation');
        this.scene.pause();
      } catch (error) {
        debugLog('MainMenuScene', 'Error starting game:', error);
      }
    }

    private showErrorState() {
      debugLog('MainMenuScene', 'Showing error state');
      
      try {
        const errorBg = this.add.graphics();
        errorBg.fillStyle(0x000000, 0.9);
        errorBg.fillRect(0, 0, 800, 600);

        const errorText = this.add.text(400, 300, 'Scene Error: Failed to initialize main menu', {
          fontFamily: 'Arial',
          fontSize: '24px',
          color: '#ff0000',
          align: 'center',
          wordWrap: { width: 600 }
        }).setOrigin(0.5);

        const restartText = this.add.text(400, 400, 'Click to restart scene', {
          fontFamily: 'Arial',
          fontSize: '18px',
          color: '#ffffff',
          align: 'center'
        }).setOrigin(0.5).setInteractive();

        restartText.on('pointerdown', () => {
          debugLog('MainMenuScene', 'Restart button clicked');
          this.scene.restart();
        });
        
        debugLog('MainMenuScene', 'Error state displayed');
      } catch (error) {
        debugLog('MainMenuScene', 'Error showing error state:', error);
      }
    }

    getLoadingProgress(): number {
      return 100;
    }

    getCurrentLoadingTask(): string {
      return 'Menu ready!';
    }

    getLoadingError(): string | null {
      return null;
    }

    isCurrentlyLoading(): boolean {
      return false;
    }

    destroy() {
      debugLog('MainMenuScene', 'Destroy called');
      super.destroy();
      debugLog('MainMenuScene', 'Destroy complete');
    }
  };
}

export default function GameCanvas() {
  debugLog('GameCanvas', 'Component rendering started');
  
  // Component refs and state
  const container = useRef<HTMLDivElement>(null);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [gameState, setGameState] = useState<GameStateData | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [createdCharacter, setCreatedCharacter] = useState<CharacterCreationData | null>(null);
  const [gameInstance, setGameInstance] = useState<Phaser.Game | null>(null);
  
  // Create systems
  const [menuSystem] = useState(() => {
    debugLog('GameCanvas', 'Creating MenuSystem');
    return new MenuSystem();
  });
  const [settingsSystem] = useState(() => {
    debugLog('GameCanvas', 'Creating SettingsSystem');
    return new SettingsSystem();
  });

  // Update game state handler
  const updateGameState = useCallback((state: GameStateData) => {
    debugLog('GameCanvas', 'Game state updated:', state);
    setGameState(state);
  }, []);

  // Create battle scene dependencies
  const battleSceneDeps = useMemo(() => {
    debugLog('GameCanvas', 'Creating battle scene dependencies');
    return {
      menuSystem,
      updateGameState
    };
  }, [menuSystem, updateGameState]);

  // Initialize Phaser game - SIMPLIFIED APPROACH
  useEffect(() => {
    debugLog('GameCanvas', 'useEffect triggered for game initialization');
    
    if (gameInstance) {
      debugLog('GameCanvas', 'Game instance already exists, skipping initialization');
      return;
    }

    // Use a more aggressive timeout to ensure DOM is ready
    const initTimeout = setTimeout(() => {
      debugLog('GameCanvas', 'Starting Phaser game initialization after delay');

      try {
        // Check container availability
        if (!container.current) {
          debugLog('GameCanvas', 'Container still not available, retrying in 500ms');
          setTimeout(() => {
            if (container.current) {
              debugLog('GameCanvas', 'Container found on retry, initializing game');
              initializeGame();
            } else {
              debugLog('GameCanvas', 'Container never became available, setting loaded anyway');
              setGameLoaded(true);
            }
          }, 500);
          return;
        }

        initializeGame();

      } catch (error) {
        debugLog('GameCanvas', 'Error in initialization timeout:', error);
        setGameLoaded(true);
      }
    }, 250); // Increased delay

    function initializeGame() {
      try {
        debugLog('GameCanvas', 'initializeGame() called');
        
        if (!container.current) {
          debugLog('GameCanvas', 'Container not available in initializeGame');
          setGameLoaded(true);
          return;
        }

        debugLog('GameCanvas', 'Container confirmed available, proceeding with Phaser');

        // Log dependencies
        debugLog('GameCanvas', 'Battle scene dependencies:', battleSceneDeps);
        
        // Create main menu scene
        debugLog('GameCanvas', 'Creating main menu scene');
        const MainMenuScene = createMainMenuScene();
        
        // Create battle scene
        debugLog('GameCanvas', 'Creating battle scene');
        const BattleScene = createBattleScene(Phaser, battleSceneDeps);
        
        debugLog('GameCanvas', 'Both scenes created, setting up Phaser config');

        // Simple Phaser configuration
        const config: Phaser.Types.Core.GameConfig = {
          type: Phaser.AUTO,
          width: 800,
          height: 600,
          parent: container.current,
          backgroundColor: '#1a1a2e',
          physics: {
            default: 'arcade',
            arcade: {
              gravity: { y: 0, x: 0 },
              debug: false
            }
          },
          scene: [
            MainMenuScene,
            BattleScene
          ],
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 800,
            height: 600
          }
        };

        debugLog('GameCanvas', 'Phaser config created:', config);

        debugLog('GameCanvas', 'Creating Phaser game instance');
        const game = new Phaser.Game(config);
        
        // Add game event listeners for debugging
        game.events.once('ready', () => {
          debugLog('GameCanvas', 'Phaser game ready event fired');
          setGameLoaded(true);
        });

        // Fallback timeout in case ready event doesn't fire
        setTimeout(() => {
          if (!gameLoaded) {
            debugLog('GameCanvas', 'Fallback timeout: Setting game loaded to true');
            setGameLoaded(true);
          }
        }, 2000);

        setGameInstance(game);
        debugLog('GameCanvas', 'Game instance set in state');
        
        debugLog('GameCanvas', 'Game initialization completed successfully');

      } catch (error) {
        debugLog('GameCanvas', 'Error in initializeGame:', error);
        debugLog('GameCanvas', 'Error stack:', error.stack);
        setGameLoaded(true);
      }
    }

    // Cleanup timeout if effect is cleaned up
    return () => {
      debugLog('GameCanvas', 'Cleanup timeout');
      clearTimeout(initTimeout);
    };
    
  }, [battleSceneDeps, gameLoaded]); // Added gameLoaded as dependency

  // Cleanup game instance on unmount
  useEffect(() => {
    return () => {
      if (gameInstance) {
        debugLog('GameCanvas', 'Cleaning up Phaser game on unmount');
        gameInstance.destroy(true);
      }
    };
  }, [gameInstance]);

  useEffect(() => {
    if (!gameInstance) {
      return;
    }

    const openCharacterCreation = () => {
      debugLog('GameCanvas', 'Character creation requested from menu scene');
      setGameState(null);
      setShowCharacterCreation(true);
    };

    gameInstance.events.on('open-character-creation', openCharacterCreation);

    return () => {
      gameInstance.events.off('open-character-creation', openCharacterCreation);
    };
  }, [gameInstance]);

  // Handle touch control button clicks
  const handleControlClick = useCallback((action: string) => {
    debugLog('GameCanvas', `Control button clicked: ${action}`);
    if ((window as any).gameControlEvent) {
      (window as any).gameControlEvent(action);
    } else {
      debugLog('GameCanvas', 'Warning: gameControlEvent not found on window');
    }
  }, []);

  // Handle settings toggle
  const toggleSettings = useCallback(() => {
    debugLog('GameCanvas', 'Toggling settings panel');
    setShowSettings(prev => !prev);
  }, []);

  const handleCharacterCreationComplete = useCallback((character: CharacterCreationData) => {
    debugLog('GameCanvas', 'Character creation complete', character);

    setCreatedCharacter(character);
    setShowCharacterCreation(false);
    setGameState(null);

    if (!gameInstance) {
      return;
    }

    try {
      if (gameInstance.scene.isActive('MainMenuScene') || gameInstance.scene.isPaused('MainMenuScene')) {
        gameInstance.scene.stop('MainMenuScene');
      }

      gameInstance.scene.start('MysticRuinsBattleScene', {
        enemyType: 'SLIME',
        difficulty: 'Normal',
        character
      });
    } catch (error) {
      debugLog('GameCanvas', 'Failed to start battle after character creation', error);
    }
  }, [gameInstance]);

  const handleCharacterCreationBack = useCallback(() => {
    debugLog('GameCanvas', 'Character creation canceled, returning to menu');
    setShowCharacterCreation(false);

    if (!gameInstance) {
      return;
    }

    try {
      if (gameInstance.scene.isPaused('MainMenuScene')) {
        gameInstance.scene.resume('MainMenuScene');
      }
    } catch (error) {
      debugLog('GameCanvas', 'Failed to resume menu scene', error);
    }
  }, [gameInstance]);

  // Handle continuing to next level after victory
  const handleContinueJourney = useCallback(() => {
    debugLog('GameCanvas', 'Continue journey requested');
    if (gameInstance && gameState) {
      const battleScene = gameInstance.scene.getScene('MysticRuinsBattleScene');
      if (battleScene) {
        debugLog('GameCanvas', 'Starting new battle scene');
        gameInstance.scene.start('MysticRuinsBattleScene', { 
          difficulty: 'Normal',
          character: createdCharacter
        });
      } else {
        debugLog('GameCanvas', 'Warning: Battle scene not found');
      }
    } else {
      debugLog('GameCanvas', 'Warning: Game instance or state not available for continue');
    }
  }, [createdCharacter, gameInstance, gameState]);

  // Handle retrying after defeat
  const handleRetryBattle = useCallback(() => {
    debugLog('GameCanvas', 'Retry battle requested');
    if (gameInstance) {
      try {
        const currentScene = gameInstance.scene.getScenes(true)[0];
        if (currentScene && currentScene.scene) {
          debugLog('GameCanvas', 'Restarting current scene');
          currentScene.scene.restart();
        } else {
          debugLog('GameCanvas', 'Warning: No active scene found for retry');
        }
      } catch (error) {
        debugLog('GameCanvas', 'Error retrying battle:', error);
      }
    } else {
      debugLog('GameCanvas', 'Warning: Game instance not available for retry');
    }
  }, [gameInstance]);

  debugLog('GameCanvas', `Rendering component - gameLoaded: ${gameLoaded}, gameState: ${gameState ? 'exists' : 'null'}`);

  if (!gameLoaded) {
    debugLog('GameCanvas', 'Rendering loading screen');
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="bg-base-300 rounded-lg p-8 text-center">
          <div className="loading loading-spinner loading-lg mb-4"></div>
          <p className="text-lg">Loading Mystic Ruins...</p>
          <p className="text-sm text-base-content/70 mt-2">
            Initializing game systems...
          </p>
          <div className="text-xs text-base-content/50 mt-4">
            Check console for detailed loading information
          </div>
        </div>
      </div>
    );
  }

  debugLog('GameCanvas', 'Rendering main game interface');
  return (
    <div className="w-full max-w-4xl mx-auto relative">
      {/* Game Container */}
      <div 
        ref={container} 
        className="relative bg-base-300 rounded-lg overflow-hidden shadow-2xl"
        style={{ aspectRatio: '4/3' }}
      >
        {showCharacterCreation && (
          <div className="absolute inset-0 z-20 bg-slate-950/90 p-4">
            <CharacterCreationScene
              width={800}
              height={600}
              onComplete={handleCharacterCreationComplete}
              onBack={handleCharacterCreationBack}
            />
          </div>
        )}
      </div>
      
      {/* Settings Button */}
      <SettingsButton onClick={toggleSettings} />
      
      {/* Settings Panel */}
      <SettingsPanel 
        settingsSystem={settingsSystem}
        show={showSettings}
        onClose={() => setShowSettings(false)}
      />
      
      {/* Game UI Overlay */}
      {gameState && (
        <div className="mt-4 space-y-4">
          {/* Status Bar */}
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
          
          {/* Mobile Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
            <button 
              className="btn btn-sm"
              onClick={() => handleControlClick('attack')}
            >
              Attack
            </button>
            <button 
              className="btn btn-sm"
              onClick={() => handleControlClick('magic')}
            >
              Magic
            </button>
            <button 
              className="btn btn-sm"
              onClick={() => handleControlClick('item')}
            >
              Item
            </button>
            <button 
              className="btn btn-sm"
              onClick={() => handleControlClick('defend')}
            >
              Defend
            </button>
          </div>
          
          {/* Result Modal */}
          <ResultModal
            gameState={gameState.currentState}
            enemyName={gameState.enemyName}
            onContinue={handleContinueJourney}
            onRetry={handleRetryBattle}
          />
        </div>
      )}
      
      {/* Debug Info */}
      <div className="mt-2 text-xs text-base-content/50">
        Game Instance: {gameInstance ? 'Ready' : 'Not Ready'} | 
        Game State: {gameState ? 'Active' : 'Waiting'} | 
        Settings: {showSettings ? 'Open' : 'Closed'} |
        Character: {createdCharacter ? `${createdCharacter.name} (${createdCharacter.class})` : 'Not Created'}
      </div>
    </div>
  );
}
