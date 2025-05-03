import { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom/client";
import StatusBar from "./components/StatusBar";
import MessageBox from "./components/MessageBox";
import { MenuSystem } from "./systems/MenuSystem";
import { SettingsSystem } from "./systems/SettingsSystem";
import { BattleSystem, BattleEvent } from "./systems/BattleSystem";
import { Player } from "./entities/Player";
import { EnemyType, GameState } from "./constants.ts";
import { GameIcon } from "./utils/icons";
import { TemplateRuins } from "../assets/images/backgrounds/TemplateRuins";
import { HealthBar } from "./assets/ui/HealthBar";
import { HealthBarFill } from "./assets/ui/HealthBarFill";
import { ManaBar } from "./assets/ui/ManaBar";
import { ManaBarFill } from "./assets/ui/ManaBarFill";
import { Player as PlayerComponent } from "./assets/characters/Player";
import { RuneConstruct } from "./assets/characters/RuneConstruct";
import { Button } from "./assets/ui/Button"; 
import MenuSystemUI from "./components/MenuSystem";
import SettingsButton from "./components/SettingsButton";
import { ChevronUp, ChevronDown, Check, X, Settings } from "lucide-react";
import { createMainMenuScene } from "./scenes/MainMenuScene";

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
    gameControlEvent: (action: string) => void;
  }
}

const generateTextureFromReactComponent = (
  Component: React.ComponentType<any>,
  props: any,
  textureKey: string,
  scene: Phaser.Scene
): Promise<void> => {
  return new Promise((resolve) => {
    // Create a temporary container for rendering the component
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.opacity = '0';
    tempContainer.style.pointerEvents = 'none';
    document.body.appendChild(tempContainer);
    
    // Use requestAnimationFrame to avoid React rendering conflicts
    requestAnimationFrame(() => {
      const root = ReactDOM.createRoot(tempContainer);
      root.render(
        <Component 
          {...props}
          onRender={(imageData: string) => {
            // Once rendered, add the imageData as a texture to Phaser
            scene.textures.addBase64(textureKey, imageData);
            
            // Clean up with requestAnimationFrame to avoid React warnings
            requestAnimationFrame(() => {
              root.unmount();
              if (document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
              }
              resolve();
            });
          }}
        />
      );
    });
  });
};

export default function GameCanvas() {
  const container = useRef<HTMLDivElement>(null);
  const [gameLoaded, setGameLoaded] = useState(false);
  const [gameState, setGameState] = useState<GameStateData | null>(null);
  const [menuSystem] = useState(new MenuSystem());
  const [settingsSystem] = useState(new SettingsSystem());
  const [isMobile, setIsMobile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

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
  const handleMenuItemSelect = (index: number) => {
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
  };

  useEffect(() => {
    // Only import and initialize Phaser on the client side
    const initPhaser = async () => {
      try {
        const Phaser = await import('phaser');
        
        // Create the scenes using the imported Phaser
        const MainMenuScene = createMainMenuScene(Phaser.default);
        
        class MysticRuinsBattleScene extends Phaser.default.Scene {
          private player!: Player;
          private battleSystem!: BattleSystem;
          private currentState: GameState = GameState.PLAYER_TURN;
          private messageBox: any;
          
          // Store sprite references to control animations
          private playerSprite!: Phaser.GameObjects.Image;
          private enemySprite!: Phaser.GameObjects.Image;
          
          // Health bar properties
          private playerHealthBar!: Phaser.GameObjects.Image;
          private playerHealthFill!: Phaser.GameObjects.Image;
          private playerManaBar!: Phaser.GameObjects.Image;
          private playerManaFill!: Phaser.GameObjects.Image;
          private enemyHealthBar!: Phaser.GameObjects.Image;
          private enemyHealthFill!: Phaser.GameObjects.Image;
          
          // Button properties
          private actionButtons: Record<string, Phaser.GameObjects.Image> = {};

          constructor() {
            super({ key: 'MysticRuinsBattleScene' });
          }

          async preload() {
            // Load the background using our React component
            await generateTextureFromReactComponent(
              TemplateRuins,
              { width: 800, height: 600 },
              'battleBg',
              this
            );
            
            // Generate health bar textures using our React components
            await generateTextureFromReactComponent(
              HealthBar,
              { width: 160, height: 24, isPlayerBar: true },
              'playerHealthBar',
              this
            );
            
            await generateTextureFromReactComponent(
              HealthBar,
              { width: 160, height: 24, isPlayerBar: false },
              'enemyHealthBar',
              this
            );
            
            // Generate health bar fill textures
            await generateTextureFromReactComponent(
              HealthBarFill,
              { width: 160, height: 24, fillPercentage: 1, isPlayerBar: true },
              'playerHealthFill',
              this
            );
            
            await generateTextureFromReactComponent(
              HealthBarFill,
              { width: 160, height: 24, fillPercentage: 1, isPlayerBar: false },
              'enemyHealthFill',
              this
            );
            
            // Generate mana bar textures
            await generateTextureFromReactComponent(
              ManaBar,
              { width: 160, height: 16, isPlayerBar: true },
              'playerManaBar',
              this
            );
            
            await generateTextureFromReactComponent(
              ManaBarFill,
              { width: 160, height: 16, fillPercentage: 1, isPlayerBar: true },
              'playerManaFill',
              this
            );
            
            // Generate Player character textures with all variants
            await generateTextureFromReactComponent(
              PlayerComponent,
              { width: 128, height: 128, variant: 'default' },
              'player_default',
              this
            );
            
            await generateTextureFromReactComponent(
              PlayerComponent,
              { width: 128, height: 128, variant: 'attack' },
              'player_attack',
              this
            );
            
            await generateTextureFromReactComponent(
              PlayerComponent,
              { width: 128, height: 128, variant: 'hit' },
              'player_hit',
              this
            );
            
            await generateTextureFromReactComponent(
              PlayerComponent,
              { width: 128, height: 128, variant: 'cast' },
              'player_cast',
              this
            );
            
            // Generate RuneConstruct enemy textures with all variants
            await generateTextureFromReactComponent(
              RuneConstruct,
              { width: 128, height: 128, variant: 'default' },
              'runeConstruct_default',
              this
            );
            
            await generateTextureFromReactComponent(
              RuneConstruct,
              { width: 128, height: 128, variant: 'attack' },
              'runeConstruct_attack',
              this
            );
            
            await generateTextureFromReactComponent(
              RuneConstruct,
              { width: 128, height: 128, variant: 'hit' },
              'runeConstruct_hit',
              this
            );
            
            // Generate button textures using our Button component
            const buttonVariants = ['attack', 'magic', 'item', 'defend'];
            const buttonStates = ['normal', 'hover', 'pressed', 'disabled'];
            
            for (const variant of buttonVariants) {
              for (const state of buttonStates) {
                await generateTextureFromReactComponent(
                  Button,
                  { 
                    width: 120, 
                    height: 40, 
                    text: variant.charAt(0).toUpperCase() + variant.slice(1), 
                    variant: variant === 'attack' ? 'primary' : 
                            variant === 'magic' ? 'secondary' : 
                            variant === 'item' ? 'success' : 'danger',
                    state: state as 'normal' | 'hover' | 'pressed' | 'disabled'
                  },
                  `button_${variant}_${state}`,
                  this
                );
              }
            }
            
            // Load other game assets as normal or replace with React components later
            this.load.image('menuBg', 'https://i.imgur.com/VnxLq8Y.png');
            
            // UI elements
            this.load.image('frame', 'https://i.imgur.com/g3pwvAs.png');
            this.load.image('cursor', 'https://i.imgur.com/dHhW3AN.png');
            this.load.image('portrait', 'https://i.imgur.com/Z1U1YTy.png');
          }

          create() {
            // Setup background - now using our React-generated background
            const bg = this.add.image(400, 300, 'battleBg');
            bg.setDisplaySize(800, 600);
            
            // Create player and battle system with themed enemy
            this.player = new Player(this, 200, 320);
            this.battleSystem = new BattleSystem(this, this.player, 'RUNE_CONSTRUCT');
            
            // Add player character sprite using our custom texture - store reference
            this.playerSprite = this.add.image(200, 320, 'player_default');
            this.playerSprite.setScale(1.5);
            this.playerSprite.setDepth(5); // Set higher depth to ensure visibility
            this.playerSprite.setVisible(true); // Explicitly set visible
            this.playerSprite.setAlpha(1); // Ensure full opacity
            
            // Hide the default sprite from the Player class
            const defaultSprite = this.player.getSprite();
            if (defaultSprite) {
              defaultSprite.setVisible(false);
            }
            
            // Add enemy sprite using our custom texture - store reference
            this.enemySprite = this.add.image(600, 200, 'runeConstruct_default');
            this.enemySprite.setScale(1.5);
            this.enemySprite.setDepth(5); // Set higher depth to ensure visibility
            this.enemySprite.setVisible(true); // Explicitly set visible
            this.enemySprite.setAlpha(1); // Ensure full opacity
            
            // Setup UI frames
            const playerFrame = this.add.image(120, 430, 'frame').setScale(1.5);
            const enemyFrame = this.add.image(680, 180, 'frame').setScale(1.5);
            const playerPortrait = this.add.image(70, 430, 'portrait').setScale(1.2);
            
            // Setup health bars with depth to ensure they appear above other elements
            // Player health bar
            this.playerHealthBar = this.add.image(180, 400, 'playerHealthBar');
            this.playerHealthFill = this.add.image(100, 400, 'playerHealthFill');
            this.playerHealthBar.setDepth(10);
            this.playerHealthFill.setDepth(9);
            this.playerHealthFill.setOrigin(0, 0.5);
            this.playerHealthBar.setOrigin(0, 0.5);
            
            // Player mana bar (positioned below health bar)
            this.playerManaBar = this.add.image(180, 430, 'playerManaBar');
            this.playerManaFill = this.add.image(100, 430, 'playerManaFill');
            this.playerManaBar.setDepth(10);
            this.playerManaFill.setDepth(9);
            this.playerManaFill.setOrigin(0, 0.5);
            this.playerManaBar.setOrigin(0, 0.5);
            
            // Enemy health bar
            this.enemyHealthBar = this.add.image(680, 140, 'enemyHealthBar');
            this.enemyHealthFill = this.add.image(600, 140, 'enemyHealthFill');
            this.enemyHealthBar.setDepth(10);
            this.enemyHealthFill.setDepth(9);
            this.enemyHealthFill.setOrigin(0, 0.5);
            this.enemyHealthBar.setOrigin(0, 0.5);
            
            // Setup action buttons (positioned at the bottom)
            const buttonVariants = ['attack', 'magic', 'item', 'defend'];
            const buttonX = [400, 400, 550, 550];
            const buttonY = [500, 550, 500, 550];
            
            buttonVariants.forEach((variant, i) => {
              const button = this.add.image(buttonX[i], buttonY[i], `button_${variant}_normal`);
              button.setInteractive();
              button.setDepth(15);
              
              // Add hover and click effects
              button.on('pointerover', () => {
                button.setTexture(`button_${variant}_hover`);
              });
              
              button.on('pointerout', () => {
                button.setTexture(`button_${variant}_normal`);
              });
              
              button.on('pointerdown', () => {
                button.setTexture(`button_${variant}_pressed`);
              });
              
              button.on('pointerup', () => {
                button.setTexture(`button_${variant}_hover`);
                // Simulate menu selection
                if (this.currentState === GameState.PLAYER_TURN) {
                  // Select this item in the menu system
                  const items = menuSystem.getMenuItems();
                  const index = items.findIndex(item => item.id === variant);
                  if (index >= 0) {
                    menuSystem.setSelectedIndex(index);
                    this.handleMenuSelection();
                  }
                }
              });
              
              this.actionButtons[variant] = button;
            });
            
            // Add health text labels
            const hpTextStyle = {
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#ffffff',
              stroke: '#000',
              strokeThickness: 2,
              align: 'center'
            };
            
            this.add.text(90, 380, "HP", hpTextStyle).setOrigin(0.5);
            this.add.text(90, 430, "MP", hpTextStyle).setOrigin(0.5);
            this.add.text(600, 120, "HP", hpTextStyle).setOrigin(0.5);
            
            // Initialize health bars with current values
            this.updateHealthBars();
            
            // Create message box
            this.createMessageBox();
            
            // Setup key input
            this.setupInput();
            
            // Initialize battle
            this.battleSystem.addEventListener(this.handleBattleEvent.bind(this));
            this.updateGameState();
            
            // Show initial message after a short delay to ensure everything is rendered
            this.time.delayedCall(100, () => {
              this.battleSystem.resetBattle('RUNE_CONSTRUCT');
            });
          }
          
          updateHealthBars() {
            const playerStats = this.player.getStats();
            const enemyStats = this.battleSystem.getEnemy().getStats();
            
            // Update player health bar fill
            const playerHealthPercent = playerStats.hp / playerStats.maxHp;
            this.playerHealthFill.scaleX = playerHealthPercent;
            
            // Update player mana bar fill
            const playerManaPercent = playerStats.mp / playerStats.maxMp;
            this.playerManaFill.scaleX = playerManaPercent;
            
            // Update enemy health bar fill
            const enemyHealthPercent = enemyStats.hp / enemyStats.maxHp;
            this.enemyHealthFill.scaleX = enemyHealthPercent;
            
            // Generate low health textures if needed
            if (playerHealthPercent <= 0.3 && playerStats.hp > 0) {
              this.generateLowHealthFill('player', playerHealthPercent);
            }
            
            if (enemyHealthPercent <= 0.3 && enemyStats.hp > 0) {
              this.generateLowHealthFill('enemy', enemyHealthPercent);
            }
          }
          
          // Update battle animations based on events
          updateBattleAnimations(event: BattleEvent) {
            if (event.type === 'attack') {
              // Player attacks
              this.playerSprite.setTexture('player_attack');
              
              // After a delay, set back to default
              this.time.delayedCall(500, () => {
                if (this.playerSprite) {
                  this.playerSprite.setTexture('player_default');
                }
              });
              
              // Enemy gets hit after a short delay
              this.time.delayedCall(300, () => {
                if (this.enemySprite) {
                  this.enemySprite.setTexture('runeConstruct_hit');
                  
                  // And then return to default
                  this.time.delayedCall(300, () => {
                    if (this.enemySprite) {
                      this.enemySprite.setTexture('runeConstruct_default');
                    }
                  });
                }
              });
            } else if (event.type === 'magic') {
              // Player casts magic
              this.playerSprite.setTexture('player_cast');
              
              // After a delay, set back to default
              this.time.delayedCall(800, () => {
                if (this.playerSprite) {
                  this.playerSprite.setTexture('player_default');
                }
              });
              
              // Enemy gets hit after a short delay
              this.time.delayedCall(500, () => {
                if (this.enemySprite) {
                  this.enemySprite.setTexture('runeConstruct_hit');
                  
                  // And then return to default
                  this.time.delayedCall(300, () => {
                    if (this.enemySprite) {
                      this.enemySprite.setTexture('runeConstruct_default');
                    }
                  });
                }
              });
            } else if (event.type === 'enemyAttack') {
              // Enemy attacks
              this.enemySprite.setTexture('runeConstruct_attack');
              
              // After a delay, enemy returns to default
              this.time.delayedCall(500, () => {
                if (this.enemySprite) {
                  this.enemySprite.setTexture('runeConstruct_default');
                }
              });
              
              // Player gets hit after a short delay
              this.time.delayedCall(300, () => {
                if (this.playerSprite) {
                  this.playerSprite.setTexture('player_hit');
                  
                  // And then return to default
                  this.time.delayedCall(300, () => {
                    if (this.playerSprite) {
                      this.playerSprite.setTexture('player_default');
                    }
                  });
                }
              });
            }
          }
          
          async generateLowHealthFill(type: 'player' | 'enemy', fillPercentage: number) {
            const isPlayer = type === 'player';
            const textureKey = `${type}HealthFillLow`;
            
            // Check if we already generated this texture
            if (this.textures.exists(textureKey)) {
              return;
            }
            
            await generateTextureFromReactComponent(
              HealthBarFill,
              { 
                width: 160, 
                height: 24, 
                fillPercentage, 
                isPlayerBar: isPlayer,
                lowHealth: true 
              },
              textureKey,
              this
            );
            
            if (isPlayer) {
              this.playerHealthFill.setTexture(textureKey);
            } else {
              this.enemyHealthFill.setTexture(textureKey);
            }
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
                this.updateButtonHighlights();
              }
            });
            
            this.input.keyboard.on('keydown-DOWN', () => {
              if (this.currentState === GameState.PLAYER_TURN) {
                menuSystem.moveDown();
                this.updateGameState();
                this.updateButtonHighlights();
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
                this.updateButtonHighlights();
              }
            });
            
            // Create a global handler for touch/button controls
            window.gameControlEvent = (action: string) => {
              if (this.currentState === GameState.PLAYER_TURN) {
                switch(action) {
                  case 'up':
                    menuSystem.moveUp();
                    this.updateGameState();
                    this.updateButtonHighlights();
                    break;
                  case 'down':
                    menuSystem.moveDown();
                    this.updateGameState();
                    this.updateButtonHighlights();
                    break;
                  case 'select':
                    this.handleMenuSelection();
                    break;
                  case 'back':
                    menuSystem.back();
                    this.updateGameState();
                    this.updateButtonHighlights();
                    break;
                }
              }
            };
          }
          
          updateButtonHighlights() {
            // Only highlight buttons in the main menu
            if (menuSystem.getCurrentMenu() === 'main') {
              const selectedIndex = menuSystem.getSelectedIndex();
              const items = menuSystem.getMenuItems();
              
              // Reset all buttons to normal state
              Object.keys(this.actionButtons).forEach(key => {
                this.actionButtons[key].setTexture(`button_${key}_normal`);
              });
              
              // Highlight the selected button
              if (items[selectedIndex]) {
                const selectedId = items[selectedIndex].id;
                if (this.actionButtons[selectedId]) {
                  this.actionButtons[selectedId].setTexture(`button_${selectedId}_hover`);
                }
              }
            }
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
                  this.updateButtonHighlights();
                  break;
                case 'item':
                  menuSystem.select(); // Navigate to item menu
                  this.updateGameState();
                  this.updateButtonHighlights();
                  break;
                case 'defend':
                  // TODO: Implement defend logic
                  break;
              }
            } else if (menu === 'magic') {
              if (selectedItem.id === 'back') {
                menuSystem.back();
                this.updateButtonHighlights();
              } else {
                this.battleSystem.castSpell(selectedItem.id as any);
              }
              this.updateGameState();
            } else if (menu === 'item') {
              if (selectedItem.id === 'back') {
                menuSystem.back();
                this.updateButtonHighlights();
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
            
            // Update battle animations
            this.updateBattleAnimations(event);
            
            // Update health bars when relevant events happen
            if (['attack', 'magic', 'item', 'enemyAttack'].includes(event.type)) {
              this.updateHealthBars();
            }
            
            // Update the game state for React components
            this.updateGameState();
            
            // Update button highlights
            this.updateButtonHighlights();
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
          scene: [MainMenuScene, MysticRuinsBattleScene], // MainMenuScene first
          pixelArt: true,
          backgroundColor: '#000000',
          // Make the canvas scale properly on all devices
          scale: {
            mode: Phaser.default.Scale.FIT,
            autoCenter: Phaser.default.Scale.CENTER_BOTH
          }
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
          delete window.gameControlEvent;
        };
      } catch (error) {
        console.error("Failed to load Phaser:", error);
      }
    };
    
    initPhaser();
  }, []);

  // Handle touch control button clicks
  const handleControlClick = (action: string) => {
    if (window.gameControlEvent) {
      window.gameControlEvent(action);
    }
  };

  return (
    <div className="relative">
      <div className="text-white text-center mb-4">Mystic Ruins: Lost Civilization</div>
      
      {/* Game Canvas */}
      <div 
        ref={container} 
        className="w-full aspect-[4/3] md:h-[600px] rounded-lg overflow-hidden bg-gray-900"
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
          {/* Settings Button */}
          <SettingsButton onClick={() => setShowSettings(!showSettings)} />
          
          {/* Menu System (when in settings mode) */}
          {showSettings && (
            <div className="mb-4">
              <MenuSystemUI 
                menuItems={[
                  { id: 'sound', label: settingsSystem.getSoundLabel(), color: '#ffffff' },
                  { id: 'music', label: settingsSystem.getMusicLabel(), color: '#ffffff' },
                  { id: 'difficulty', label: settingsSystem.getDifficultyLabel(), color: '#ffffff' },
                  { id: 'back', label: 'Back to Game', color: '#ff9999' }
                ]}
                selectedIndex={0}
                currentMenu="settings"
                onSelectItem={(index) => {
                  if (index === 0) settingsSystem.toggleSound();
                  else if (index === 1) settingsSystem.toggleMusic();
                  else if (index === 2) settingsSystem.cycleDifficulty();
                  else if (index === 3) setShowSettings(false);
                }}
              />
            </div>
          )}
          
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
          {!showSettings && gameState.currentState === GameState.PLAYER_TURN && (
            <div className="my-4">
              <MenuSystemUI 
                menuItems={menuSystem.getMenuItems()}
                selectedIndex={menuSystem.getSelectedIndex()}
                currentMenu={menuSystem.getCurrentMenu()}
                onSelectItem={handleMenuItemSelect}
              />
            </div>
          )}
          
          {/* Mobile Touch Controls */}
          {isMobile && (
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
          )}
          
          {/* Desktop Controls Help */}
          {!isMobile && (
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