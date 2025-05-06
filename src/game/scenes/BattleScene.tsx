import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { BattleSystem, BattleEvent } from '../systems/BattleSystem';
import { GameState, EnemyType } from '../constants';
import { generateTextureFromReactComponent } from '../utils/textureGenerator';
import { GameStateData } from '../types/gameTypes';

// Import all the components needed for texture generation
import { TemplateRuins } from '../../assets/images/backgrounds/TemplateRuins';
import { HealthBar } from '../assets/ui/HealthBar';
import { HealthBarFill } from '../assets/ui/HealthBarFill';
import { ManaBar } from '../assets/ui/ManaBar';
import { ManaBarFill } from '../assets/ui/ManaBarFill';
import { Player as PlayerComponent } from '../assets/characters/Player';
import { RuneConstruct } from '../assets/characters/RuneConstruct';
import { ShadowWisp } from '../assets/characters/ShadowWisp';
import { StoneGuardian } from '../assets/characters/StoneGuardian';
import { Button } from '../assets/ui/Button';

// Interface to handle menu system references that would be passed from the parent component
interface BattleSceneDependencies {
  menuSystem: any; // Replace with your actual MenuSystem type
  updateGameState: (state: GameStateData) => void;
}

export class BattleScene extends Phaser.Scene {
  private player!: Player;
  private battleSystem!: BattleSystem;
  private currentState: GameState = GameState.PLAYER_TURN;
  private messageBox: any;
  private currentEnemyType: string = 'RUNE_CONSTRUCT';
  
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
  
  // Dependencies
  private deps: BattleSceneDependencies;

  constructor(dependencies: BattleSceneDependencies) {
    super({ key: 'MysticRuinsBattleScene' }); // Must match what's used in MainMenuScene
    this.deps = dependencies;
  }

  init(data: any) {
    // Get difficulty and enemy type from data or use defaults
    if (data && data.enemyType) {
      this.currentEnemyType = data.enemyType;
    } else if (Math.random() > 0.7) {
      // Random enemy selection for variety
      const enemies = ['RUNE_CONSTRUCT', 'SHADOW_WISP', 'STONE_GUARDIAN'];
      this.currentEnemyType = enemies[Math.floor(Math.random() * enemies.length)];
    }
  }

  async preload() {
    // Load the background using our React component
    await generateTextureFromReactComponent(
      TemplateRuins,
      { width: 800, height: 600 },
      'battleBg',
      this
    );
    
    // Generate health bar textures
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
    
    // Generate character textures
    await this.loadCharacterTextures();
    
    // Generate button textures
    await this.loadButtonTextures();
    
    // Load other game assets
    this.load.image('menuBg', 'https://i.imgur.com/VnxLq8Y.png');
    this.load.image('frame', 'https://i.imgur.com/g3pwvAs.png');
    this.load.image('cursor', 'https://i.imgur.com/dHhW3AN.png');
    this.load.image('portrait', 'https://i.imgur.com/Z1U1YTy.png');
  }

  async loadCharacterTextures() {
    // Player character variants
    const playerVariants = ['default', 'attack', 'hit', 'cast'];
    for (const variant of playerVariants) {
      await generateTextureFromReactComponent(
        PlayerComponent,
        { width: 128, height: 128, variant },
        `player_${variant}`,
        this
      );
    }
    
    // Enemy character variants
    const enemyTypes = [
      { component: RuneConstruct, prefix: 'runeConstruct' },
      { component: ShadowWisp, prefix: 'shadowWisp' },
      { component: StoneGuardian, prefix: 'stoneGuardian' }
    ];
    
    const enemyVariants = ['default', 'attack', 'hit'];
    
    for (const enemy of enemyTypes) {
      for (const variant of enemyVariants) {
        await generateTextureFromReactComponent(
          enemy.component,
          { width: 128, height: 128, variant },
          `${enemy.prefix}_${variant}`,
          this
        );
      }
    }
  }

  async loadButtonTextures() {
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
  }

  create() {
    // Setup background
    const bg = this.add.image(400, 300, 'battleBg');
    bg.setDisplaySize(800, 600);
    
    // Create player and battle system with selected enemy type
    this.player = new Player(this, 200, 320);
    this.battleSystem = new BattleSystem(this, this.player, this.currentEnemyType as EnemyType);
    
    this.setupPlayerAndEnemySprites();
    this.setupUIFrames();
    this.setupHealthBars();
    this.setupActionButtons();
    this.setupTextLabels();
    
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
      this.battleSystem.resetBattle(this.currentEnemyType as EnemyType);
    });
  }

  setupPlayerAndEnemySprites() {
    // Add player character sprite using our custom texture
    this.playerSprite = this.add.image(200, 320, 'player_default');
    this.playerSprite.setScale(1.5);
    this.playerSprite.setDepth(5);
    this.playerSprite.setVisible(true);
    
    // Hide the default sprite from the Player class
    const defaultSprite = this.player.getSprite();
    if (defaultSprite) {
      defaultSprite.setVisible(false);
    }
    
    // Determine which enemy texture to use based on the enemy type
    const enemyTextureKey = `${this.getEnemyTexturePrefix()}_default`;
    
    // Add enemy sprite using the appropriate texture
    this.enemySprite = this.add.image(600, 200, enemyTextureKey);
    this.enemySprite.setScale(1.5);
    this.enemySprite.setDepth(5);
    this.enemySprite.setVisible(true);
  }

  setupUIFrames() {
    // Setup UI frames
    this.add.image(120, 430, 'frame').setScale(1.5);
    this.add.image(680, 180, 'frame').setScale(1.5);
    this.add.image(70, 430, 'portrait').setScale(1.2);
  }

  setupHealthBars() {
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
  }

  setupActionButtons() {
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
          const items = this.deps.menuSystem.getMenuItems();
          const index = items.findIndex(item => item.id === variant);
          if (index >= 0) {
            this.deps.menuSystem.setSelectedIndex(index);
            this.handleMenuSelection();
          }
        }
      });
      
      this.actionButtons[variant] = button;
    });
  }

  setupTextLabels() {
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

  // Get texture prefix based on current enemy type
  getEnemyTexturePrefix() {
    switch(this.currentEnemyType) {
      case 'SHADOW_WISP':
        return 'shadowWisp';
      case 'STONE_GUARDIAN':
        return 'stoneGuardian';
      case 'RUNE_CONSTRUCT':
      default:
        return 'runeConstruct';
    }
  }

  // Update battle animations based on events
  updateBattleAnimations(event: BattleEvent) {
    const enemyTexturePrefix = this.getEnemyTexturePrefix();
    
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
          this.enemySprite.setTexture(`${enemyTexturePrefix}_hit`);
          
          // And then return to default
          this.time.delayedCall(300, () => {
            if (this.enemySprite) {
              this.enemySprite.setTexture(`${enemyTexturePrefix}_default`);
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
          this.enemySprite.setTexture(`${enemyTexturePrefix}_hit`);
          
          // And then return to default
          this.time.delayedCall(300, () => {
            if (this.enemySprite) {
              this.enemySprite.setTexture(`${enemyTexturePrefix}_default`);
            }
          });
        }
      });
    } else if (event.type === 'enemyAttack') {
      // Enemy attacks
      this.enemySprite.setTexture(`${enemyTexturePrefix}_attack`);
      
      // After a delay, enemy returns to default
      this.time.delayedCall(500, () => {
        if (this.enemySprite) {
          this.enemySprite.setTexture(`${enemyTexturePrefix}_default`);
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
    // Handle menu navigation
    this.input.keyboard.on('keydown-UP', () => {
      if (this.currentState === GameState.PLAYER_TURN) {
        this.deps.menuSystem.moveUp();
        this.updateGameState();
        this.updateButtonHighlights();
      }
    });
    
    this.input.keyboard.on('keydown-DOWN', () => {
      if (this.currentState === GameState.PLAYER_TURN) {
        this.deps.menuSystem.moveDown();
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
        this.deps.menuSystem.back();
        this.updateGameState();
        this.updateButtonHighlights();
      }
    });
    
    // Create a global handler for touch/button controls
    window.gameControlEvent = (action: string) => {
      if (this.currentState === GameState.PLAYER_TURN) {
        switch(action) {
          case 'up':
            this.deps.menuSystem.moveUp();
            this.updateGameState();
            this.updateButtonHighlights();
            break;
          case 'down':
            this.deps.menuSystem.moveDown();
            this.updateGameState();
            this.updateButtonHighlights();
            break;
          case 'select':
            this.handleMenuSelection();
            break;
          case 'back':
            this.deps.menuSystem.back();
            this.updateGameState();
            this.updateButtonHighlights();
            break;
        }
      } else if (this.currentState === GameState.VICTORY) {
        // Handle victory modal actions
        if (action === 'nextLevel') {
          this.nextLevel();
        }
      } else if (this.currentState === GameState.DEFEAT) {
        // Handle defeat modal actions
        if (action === 'retry') {
          this.retry();
        }
      }
    };
  }

  /**
   * Handle next level progression after victory
   */
  nextLevel(): void {
    // Choose a random enemy type for the next battle
    const enemyTypes: EnemyType[] = ['STONE_GUARDIAN', 'SHADOW_WISP', 'RUNE_CONSTRUCT'];
    const nextEnemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    // Update the current enemy type
    this.currentEnemyType = nextEnemyType;
    
    // Reset the battle with the new enemy type
    this.battleSystem.resetBattle(nextEnemyType);
    
    // Update enemy sprite
    const enemyTextureKey = `${this.getEnemyTexturePrefix()}_default`;
    this.enemySprite.setTexture(enemyTextureKey);
    
    // Update the message
    this.messageBox.setText("You continue deeper into the ruins...");
    
    // Reset player to full health for the next battle
    this.player.heal(1000); // Large enough to fully heal
    
    // Update the health bars
    this.updateHealthBars();
    
    // Update the game state
    this.updateGameState();
  }

  /**
   * Handle retry after defeat
   */
  retry(): void {
    // Reset the battle with the same enemy type
    this.battleSystem.resetBattle(this.currentEnemyType as EnemyType);
    
    // Reset player to full health
    this.player.heal(1000); // Large enough to fully heal
    
    // Update the message
    this.messageBox.setText("You gather your strength and try again...");
    
    // Update the health bars
    this.updateHealthBars();
    
    // Update the game state
    this.updateGameState();
  }

  updateButtonHighlights() {
    // Only highlight buttons in the main menu
    if (this.deps.menuSystem.getCurrentMenu() === 'main') {
      const selectedIndex = this.deps.menuSystem.getSelectedIndex();
      const items = this.deps.menuSystem.getMenuItems();
      
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
    const menu = this.deps.menuSystem.getCurrentMenu();
    const selectedIndex = this.deps.menuSystem.getSelectedIndex();
    const items = this.deps.menuSystem.getMenuItems();
    
    if (items.length <= selectedIndex) return;
    
    const selectedItem = items[selectedIndex];
    
    if (menu === 'main') {
      switch (selectedItem.id) {
        case 'attack':
          this.battleSystem.playerAttack();
          break;
        case 'magic':
          this.deps.menuSystem.select(); // Navigate to magic menu
          this.updateGameState();
          this.updateButtonHighlights();
          break;
        case 'item':
          this.deps.menuSystem.select(); // Navigate to item menu
          this.updateGameState();
          this.updateButtonHighlights();
          break;
        case 'defend':
          // TODO: Implement defend logic
          break;
      }
    } else if (menu === 'magic') {
      if (selectedItem.id === 'back') {
        this.deps.menuSystem.back();
        this.updateButtonHighlights();
      } else {
        this.battleSystem.castSpell(selectedItem.id as any);
      }
      this.updateGameState();
    } else if (menu === 'item') {
      if (selectedItem.id === 'back') {
        this.deps.menuSystem.back();
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
    
    this.deps.updateGameState({
      playerHP: playerStats.hp,
      maxPlayerHP: playerStats.maxHp,
      playerMP: playerStats.mp,
      maxPlayerMP: playerStats.maxMp,
      enemyHP: enemyStats.hp,
      maxEnemyHP: enemyStats.maxHp,
      enemyName: enemyStats.name,
      message: this.messageBox?.text || "",
      currentState: this.currentState,
      selectedAction: this.deps.menuSystem.getMenuItems()[this.deps.menuSystem.getSelectedIndex()]?.id || null
    });
  }
}