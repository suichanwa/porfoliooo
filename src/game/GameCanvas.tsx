import { useEffect, useRef, useState } from "react";
import StatusBar from "./components/StatusBar";
import MessageBox from "./components/MessageBox";
import { MenuSystem } from "./systems/MenuSystem";
import { SettingsSystem } from "./systems/SettingsSystem";
import { BattleSystem, BattleEvent } from "./systems/BattleSystem";
import { Player } from "./entities/Player";
import { EnemyType, GameState } from "./constants";
import { GameIcon } from "./utils/icons";

interface GameStateData {
  playerHP: number;
  maxPlayerHP: number;
  playerMP: number;
  maxPlayerMP: number;
  enemyHP: number;
  maxEnemyHP: number;
  enemyName: string;
  message: string;
  currentState: GameState;
  selectedAction: string | null;
}

// Extend window interface to include our game state updater
declare global {
  interface Window {
    updateGameState: (state: GameStateData) => void;
  }
}

export default function GameCanvas() {
  const container = useRef<HTMLDivElement>(null);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [gameState, setGameState] = useState<GameStateData | null>(null);
  const [menuSystem] = useState(new MenuSystem());
  const [settingsSystem] = useState(new SettingsSystem());

  useEffect(() => {
    // Only import and initialize Phaser on the client side
    const initPhaser = async () => {
      try {
        const Phaser = await import('phaser');
        
        class MysticRuinsBattleScene extends Phaser.Scene {
          private player!: Player;
          private battleSystem!: BattleSystem;
          private currentState: GameState = GameState.PLAYER_TURN;
          private messageBox: any;

          constructor() {
            super({ key: 'MysticRuinsBattleScene' });
          }

          preload() {
            // Load battle assets - updated for Mystic Ruins theme
            this.load.image('battleBg', 'https://i.imgur.com/5dNq8Fm.png'); // Replace with ruins background
            this.load.image('menuBg', 'https://i.imgur.com/VnxLq8Y.png');   // Replace with stone texture
            
            // Character/enemy sprites
            this.load.spritesheet('warrior', 'https://i.imgur.com/NmtfPp2.png', { 
              frameWidth: 64, frameHeight: 64 
            });
            
            // Enemy sprites - replace with themed enemies
            this.load.spritesheet('guardian', 'https://i.imgur.com/6YLlJ0k.png', { // Stone Guardian
              frameWidth: 32, frameHeight: 32 
            });
            this.load.spritesheet('wisp', 'https://i.imgur.com/6YLlJ0k.png', { // Shadow Wisp
              frameWidth: 32, frameHeight: 32 
            });
            this.load.spritesheet('construct', 'https://i.imgur.com/6YLlJ0k.png', { // Rune Construct
              frameWidth: 32, frameHeight: 32 
            });
            
            // UI elements - should be themed stone UI
            this.load.image('frame', 'https://i.imgur.com/g3pwvAs.png');
            this.load.image('cursor', 'https://i.imgur.com/dHhW3AN.png');
            this.load.image('portrait', 'https://i.imgur.com/Z1U1YTy.png');
            
            // Progress bars
            this.load.image('hpBar', 'https://i.imgur.com/c8Bps8Y.png');
            this.load.image('hpFill', 'https://i.imgur.com/QkD5bLa.png');
            this.load.image('mpBar', 'https://i.imgur.com/c8Bps8Y.png');
            this.load.image('mpFill', 'https://i.imgur.com/QkD5bLa.png');
          }

          create() {
            // Setup background
            const bg = this.add.image(400, 300, 'battleBg').setScale(2);
            
            // Create player and battle system
            this.player = new Player(this, 200, 320);
            this.battleSystem = new BattleSystem(this, this.player, 'STONE_GUARDIAN');
            
            // Setup UI frames
            const playerFrame = this.add.image(120, 430, 'frame').setScale(1.5);
            const enemyFrame = this.add.image(680, 180, 'frame').setScale(1.5);
            const playerPortrait = this.add.image(70, 430, 'portrait').setScale(1.2);
            
            // Create message box
            this.createMessageBox();
            
            // Setup key input
            this.setupInput();
            
            // Initialize battle
            this.battleSystem.addEventListener(this.handleBattleEvent.bind(this));
            this.updateGameState();
            
            // Show initial message
            this.battleSystem.resetBattle('STONE_GUARDIAN');
          }
          
          createMessageBox() {
            this.messageBox = this.add.text(250, 500, "", { 
              fontFamily: 'monospace', 
              fontSize: '20px',
              color: '#ffffff',
              stroke: '#000000',
              strokeThickness: 4,
              wordWrap: { width: 300 }
            });
          }
          
          setupInput() {
            const cursors = this.input.keyboard.createCursorKeys();
            
            // Handle menu navigation
            this.input.keyboard.on('keydown-UP', () => {
              if (this.currentState === GameState.PLAYER_TURN) {
                menuSystem.moveUp();
                this.updateGameState();
              }
            });
            
            this.input.keyboard.on('keydown-DOWN', () => {
              if (this.currentState === GameState.PLAYER_TURN) {
                menuSystem.moveDown();
                this.updateGameState();
              }
            });
            
            // Handle selection
            this.input.keyboard.on('keydown-SPACE', () => {
              if (this.currentState === GameState.PLAYER_TURN) {
                this.handleMenuSelection();
              }
            });
            
            this.input.keyboard.on('keydown-Z', () => {
              if (this.currentState === GameState.PLAYER_TURN) {
                this.handleMenuSelection();
              }
            });
            
            // Handle going back in menus
            this.input.keyboard.on('keydown-X', () => {
              if (this.currentState === GameState.PLAYER_TURN) {
                menuSystem.back();
                this.updateGameState();
              }
            });
          }
          
          handleMenuSelection() {
            const menu = menuSystem.getCurrentMenu();
            const selectedIndex = menuSystem.getSelectedIndex();
            const items = menuSystem.getMenuItems();
            
            if (items.length <= selectedIndex) return;
            
            const selectedItem = items[selectedIndex];
            
            if (menu === 'main') {
              switch (selectedItem.id) {
                case 'attack':
                  this.battleSystem.playerAttack();
                  break;
                case 'magic':
                  menuSystem.select(); // Navigate to magic menu
                  this.updateGameState();
                  break;
                case 'item':
                  menuSystem.select(); // Navigate to item menu
                  this.updateGameState();
                  break;
                case 'defend':
                  // TODO: Implement defend logic
                  break;
              }
            } else if (menu === 'magic') {
              if (selectedItem.id === 'back') {
                menuSystem.back();
              } else {
                this.battleSystem.castSpell(selectedItem.id as any);
              }
              this.updateGameState();
            } else if (menu === 'item') {
              if (selectedItem.id === 'back') {
                menuSystem.back();
              } else {
                this.battleSystem.useItem(selectedItem.id as any);
              }
              this.updateGameState();
            }
          }
          
          handleBattleEvent(event: BattleEvent) {
            // Display event message
            this.messageBox.setText(event.message);
            
            // Update current state
            this.currentState = this.battleSystem.getState();
            
            // Update the game state for React components
            this.updateGameState();
          }
          
          updateGameState() {
            const playerStats = this.player.getStats();
            const enemyStats = this.battleSystem.getEnemy().getStats();
            
            if (window.updateGameState) {
              window.updateGameState({
                playerHP: playerStats.hp,
                maxPlayerHP: playerStats.maxHp,
                playerMP: playerStats.mp,
                maxPlayerMP: playerStats.maxMp,
                enemyHP: enemyStats.hp,
                maxEnemyHP: enemyStats.maxHp,
                enemyName: enemyStats.name,
                message: this.messageBox.text,
                currentState: this.currentState,
                selectedAction: menuSystem.getMenuItems()[menuSystem.getSelectedIndex()]?.id || null
              });
            }
          }
        }
        
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
          scene: [MysticRuinsBattleScene],
          pixelArt: true,
        };
        
        // Create the game
        const game = new Phaser.default.Game(config);
        
        // Create a way for the game scene to update React state
        window.updateGameState = (state: GameStateData) => {
          setGameState(state);
        };
        
        setGameLoaded(true);
        
        return () => {
          game.destroy(true);
          delete window.updateGameState;
        };
      } catch (error) {
        console.error("Failed to load Phaser:", error);
      }
    };
    
    initPhaser();
  }, []);

  // Handle action button clicks (connecting React UI to Phaser game)
  const handleActionClick = (actionId: string) => {
    // This would be implemented to forward actions from UI to the Phaser game
    console.log("Action clicked:", actionId);
  };

  return (
    <div className="relative">
      {/* Game Canvas */}
      <div 
        ref={container} 
        className="w-full h-[400px] md:h-[600px] rounded-lg overflow-hidden bg-gray-900"
      ></div>
      
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
          
          {/* Controls Help */}
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
        </div>
      )}
    </div>
  );
}