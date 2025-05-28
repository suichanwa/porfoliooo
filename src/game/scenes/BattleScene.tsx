import Phaser from 'phaser';
import { Player } from '../entities/Player';
import { BattleSystem, BattleEvent } from '../systems/BattleSystem';
import { GameState, EnemyType } from '../constants';
import { GameStateData } from '../types/gameTypes';
import { LoadingManager } from '../utils/LoadingManager';
import { AssetLoader } from '../utils/AssetLoader';

// Interface to handle menu system references that would be passed from the parent component
interface BattleSceneDependencies {
  menuSystem: any; // Replace with your actual MenuSystem type
  updateGameState: (state: GameStateData) => void;
}

// Enhanced enemy configuration with all character types
interface EnemyCharacterConfig {
  type: EnemyType;
  texturePrefix: string;
  displayName: string;
  scale: number;
  position: { x: number; y: number };
  idleAnimation?: {
    scaleVariation: number;
    duration: number;
  };
  specialEffects?: string[];
}

const ENEMY_CONFIGS: Record<string, EnemyCharacterConfig> = {
  'RUNE_CONSTRUCT': {
    type: 'RUNE_CONSTRUCT' as EnemyType,
    texturePrefix: 'runeConstruct',
    displayName: 'Ancient Rune Construct',
    scale: 1.6,
    position: { x: 600, y: 200 },
    idleAnimation: {
      scaleVariation: 0.1,
      duration: 4000
    },
    specialEffects: ['runes', 'magical_glow']
  },
  'STONE_GUARDIAN': {
    type: 'STONE_GUARDIAN' as EnemyType,
    texturePrefix: 'stoneGuardian',
    displayName: 'Stone Guardian Sentinel',
    scale: 1.8,
    position: { x: 580, y: 180 },
    idleAnimation: {
      scaleVariation: 0.05,
      duration: 5000
    },
    specialEffects: ['stone_dust', 'heavy_footsteps']
  },
  'SHADOW_WISP': {
    type: 'SHADOW_WISP' as EnemyType,
    texturePrefix: 'shadowWisp',
    displayName: 'Ethereal Shadow Wisp',
    scale: 1.4,
    position: { x: 620, y: 220 },
    idleAnimation: {
      scaleVariation: 0.15,
      duration: 2500
    },
    specialEffects: ['shadow_trail', 'wisp_glow', 'floating']
  }
};

export class BattleScene extends Phaser.Scene {
  private player!: Player;
  private battleSystem!: BattleSystem;
  private currentState: GameState = GameState.PLAYER_TURN;
  private messageBox: any;
  private currentEnemyType: string = 'RUNE_CONSTRUCT';
  private currentEnemyConfig!: EnemyCharacterConfig;
  
  // Store sprite references to control animations
  private playerSprite!: Phaser.GameObjects.Image;
  private enemySprite!: Phaser.GameObjects.Image;
  private enemyNameText!: Phaser.GameObjects.Text;
  
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
  
  // Loading management
  private loadingManager: LoadingManager;
  private assetLoader: AssetLoader;
  private isLoading: boolean = true;
  private loadingError: string | null = null;
  private loadingProgress: number = 0;
  private currentLoadingTask: string = 'Initializing...';
  
  // Scene management
  private sceneInitialized = false;
  private animationTweens: Phaser.Tweens.Tween[] = [];
  
  // Audio management
  private battleMusic?: Phaser.Sound.BaseSound;
  private soundEffects: Record<string, Phaser.Sound.BaseSound> = {};
  
  // Visual effects
  private backgroundParticles?: Phaser.GameObjects.Particles.ParticleEmitter;
  private battleEffects: Phaser.GameObjects.GameObject[] = [];
  private enemySpecialEffects: Phaser.GameObjects.GameObject[] = [];

  constructor(dependencies: BattleSceneDependencies) {
    super({ key: 'MysticRuinsBattleScene' });
    this.deps = dependencies;
    this.loadingManager = new LoadingManager();
    this.assetLoader = new AssetLoader(this, this.loadingManager);
    
    // Setup loading progress tracking
    this.setupLoadingTracking();
  }

  private setupLoadingTracking() {
    // Listen for loading progress updates
    this.loadingManager.onProgress((progress, currentTask) => {
      this.loadingProgress = progress;
      this.currentLoadingTask = currentTask;
      
      // Emit progress for external loading screen
      this.events.emit('loading-progress', { progress, currentTask });
      
      console.log(`Loading: ${progress.toFixed(1)}% - ${currentTask}`);
    });
  }

  init(data: any) {
    console.log('BattleScene init with data:', data);
    
    // Enhanced enemy selection with difficulty consideration
    if (data && data.enemyType) {
      this.currentEnemyType = data.enemyType;
    } else if (data && data.difficulty) {
      // Select enemy based on difficulty
      this.currentEnemyType = this.selectEnemyByDifficulty(data.difficulty);
    } else {
      // Random enemy selection for variety
      const enemies = Object.keys(ENEMY_CONFIGS);
      this.currentEnemyType = enemies[Math.floor(Math.random() * enemies.length)];
    }
    
    // Set current enemy configuration
    this.currentEnemyConfig = ENEMY_CONFIGS[this.currentEnemyType];
    
    // Setup loading tasks
    const tasks = LoadingManager.createBattleSceneTasks();
    tasks.forEach(task => this.loadingManager.addTask(task));
    
    console.log(`Selected enemy: ${this.currentEnemyConfig.displayName} (${this.currentEnemyType})`);
  }

  private selectEnemyByDifficulty(difficulty: string): string {
    const difficultyMappings = {
      'Normal': ['SHADOW_WISP', 'RUNE_CONSTRUCT'],
      'Hard': ['STONE_GUARDIAN', 'RUNE_CONSTRUCT'],
      'Insane': ['STONE_GUARDIAN'] // Hardest enemy
    };
    
    const availableEnemies = difficultyMappings[difficulty] || Object.keys(ENEMY_CONFIGS);
    return availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
  }

  async preload() {
    console.log('BattleScene preload started');
    
    try {
      this.isLoading = true;
      this.loadingError = null;
      
      // Emit loading start event for external loading screen
      this.events.emit('loading-start');
      
      // Load all assets using the modular loader
      await this.assetLoader.loadAllAssets();
      
      console.log('All assets loaded successfully');
      this.isLoading = false;
      
      // Emit loading complete
      this.events.emit('loading-complete');
      
    } catch (error) {
      console.error('Error loading battle scene assets:', error);
      this.loadingError = error instanceof Error ? error.message : 'Unknown loading error';
      this.isLoading = false;
      
      // Emit loading error
      this.events.emit('loading-error', { error: this.loadingError });
    }
  }

  create() {
    console.log('BattleScene create started');
    
    if (this.isLoading) {
      this.time.delayedCall(100, () => this.create());
      return;
    }
    
    if (this.loadingError) {
      this.showErrorState();
      return;
    }
    
    try {
      this.setupScene();
      this.sceneInitialized = true;
      console.log('BattleScene created successfully');
    } catch (error) {
      console.error('Error creating battle scene:', error);
      this.showErrorState();
    }
  }

  private setupScene() {
    // Setup background
    this.setupBackground();
    
    // Initialize battle system
    this.initializeBattleSystem();
    
    // Setup sprites and UI
    this.setupSprites();
    this.setupUI();
    this.setupInput();
    
    // Initialize battle
    this.battleSystem.addEventListener(this.handleBattleEvent.bind(this));
    this.updateGameState();
    
    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
    
    // Show initial message with enemy-specific flavor text
    this.time.delayedCall(1000, () => {
      if (this.messageBox) {
        const flavorText = this.getEnemyFlavorText();
        this.messageBox.setText(flavorText);
        this.battleSystem.resetBattle(this.currentEnemyType as EnemyType);
      }
    });
  }

  private getEnemyFlavorText(): string {
    const flavorTexts = {
      'RUNE_CONSTRUCT': "An ancient construct awakens, its runes glowing with mystical power!",
      'STONE_GUARDIAN': "A massive stone guardian blocks your path, its eyes burning with ancient fury!",
      'SHADOW_WISP': "A shadow wisp materializes from the darkness, crackling with ethereal energy!"
    };
    
    return flavorTexts[this.currentEnemyType] || "A mysterious enemy appears before you!";
  }

  private setupBackground() {
    // Main background
    const bg = this.add.image(400, 300, 'battleBg');
    bg.setDisplaySize(800, 600);
    bg.setDepth(0);
    
    // Add atmospheric overlay based on enemy type
    const overlay = this.add.graphics();
    const overlayColor = this.getEnemyAtmosphereColor();
    overlay.fillStyle(overlayColor, 0.1);
    overlay.fillRect(0, 0, 800, 600);
    overlay.setDepth(1);
    
    // Create ambient particles
    this.createAmbientParticles();
  }

  private getEnemyAtmosphereColor(): number {
    const atmosphereColors = {
      'RUNE_CONSTRUCT': 0x4a4aff, // Blue mystical
      'STONE_GUARDIAN': 0x8b4513, // Brown earthy
      'SHADOW_WISP': 0x4b0082    // Purple dark
    };
    
    return atmosphereColors[this.currentEnemyType] || 0x2a2a4a;
  }

  private initializeBattleSystem() {
    // Create player and battle system with selected enemy type
    this.player = new Player(this, 200, 320);
    this.battleSystem = new BattleSystem(this, this.player, this.currentEnemyType as EnemyType);
  }

  private setupSprites() {
    // Player sprite with enhanced animations
    this.setupPlayerSprite();
    
    // Enemy sprite with character-specific setup
    this.setupEnemySprite();
  }

  private setupPlayerSprite() {
    if (this.textures.exists('player_default')) {
      this.playerSprite = this.add.image(200, 320, 'player_default');
      this.playerSprite.setScale(1.5).setDepth(5);
      
      // Add character-specific idle animation
      this.tweens.add({
        targets: this.playerSprite,
        y: this.playerSprite.y - 5,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Hide default player sprite
      const defaultSprite = this.player.getSprite();
      if (defaultSprite) {
        defaultSprite.setVisible(false);
      }
    }
  }

  private setupEnemySprite() {
    const config = this.currentEnemyConfig;
    const enemyTextureKey = `${config.texturePrefix}_default`;
    
    if (this.textures.exists(enemyTextureKey)) {
      this.enemySprite = this.add.image(config.position.x, config.position.y, enemyTextureKey);
      this.enemySprite.setScale(config.scale).setDepth(5);
      
      // Add character-specific idle animation
      if (config.idleAnimation) {
        const { scaleVariation, duration } = config.idleAnimation;
        this.tweens.add({
          targets: this.enemySprite,
          scaleX: config.scale - scaleVariation,
          scaleY: config.scale + scaleVariation,
          duration: duration,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
      
      // Add special effects for the enemy
      this.createEnemySpecialEffects();
    }
    
    // Add enemy name display
    this.enemyNameText = this.add.text(config.position.x, config.position.y - 80, config.displayName, {
      fontFamily: 'serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5).setDepth(10);
    
    // Add name glow effect
    this.tweens.add({
      targets: this.enemyNameText,
      alpha: 0.7,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createEnemySpecialEffects() {
    const config = this.currentEnemyConfig;
    
    if (!config.specialEffects) return;
    
    config.specialEffects.forEach(effectType => {
      switch (effectType) {
        case 'runes':
          this.createRuneEffect();
          break;
        case 'magical_glow':
          this.createMagicalGlow();
          break;
        case 'stone_dust':
          this.createStoneDustEffect();
          break;
        case 'shadow_trail':
          this.createShadowTrail();
          break;
        case 'wisp_glow':
          this.createWispGlow();
          break;
        case 'floating':
          this.createFloatingEffect();
          break;
      }
    });
  }

  private createRuneEffect() {
    // Create floating runes around Rune Construct
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const radius = 60;
      const x = this.currentEnemyConfig.position.x + Math.cos(angle) * radius;
      const y = this.currentEnemyConfig.position.y + Math.sin(angle) * radius;
      
      const rune = this.add.graphics();
      rune.lineStyle(2, 0x88ccff, 0.8);
      rune.strokeCircle(0, 0, 8);
      rune.lineBetween(-6, 0, 6, 0);
      rune.lineBetween(0, -6, 0, 6);
      rune.setPosition(x, y).setDepth(4);
      
      // Rotate runes
      this.tweens.add({
        targets: rune,
        rotation: Math.PI * 2,
        duration: 8000 + (i * 500),
        repeat: -1,
        ease: 'Linear'
      });
      
      this.enemySpecialEffects.push(rune);
    }
  }

  private createMagicalGlow() {
    const glow = this.add.graphics();
    glow.fillStyle(0x4488ff, 0.3);
    glow.fillCircle(0, 0, 40);
    glow.setPosition(this.currentEnemyConfig.position.x, this.currentEnemyConfig.position.y);
    glow.setDepth(3);
    
    this.tweens.add({
      targets: glow,
      scaleX: { from: 0.8, to: 1.2 },
      scaleY: { from: 0.8, to: 1.2 },
      alpha: { from: 0.2, to: 0.5 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.enemySpecialEffects.push(glow);
  }

  private createStoneDustEffect() {
    // Create particle effect for Stone Guardian
    if (this.textures.exists('frame')) {
      const dustParticles = this.add.particles(this.currentEnemyConfig.position.x, this.currentEnemyConfig.position.y + 50, 'frame', {
        scale: { min: 0.01, max: 0.03 },
        alpha: { min: 0.3, max: 0.6 },
        tint: 0x8b7355,
        lifespan: 3000,
        frequency: 200,
        gravityY: 50,
        speedX: { min: -20, max: 20 },
        speedY: { min: -30, max: -10 }
      });
      dustParticles.setDepth(4);
      this.enemySpecialEffects.push(dustParticles);
    }
  }

  private createShadowTrail() {
    // Create trailing shadow effect for Shadow Wisp
    const trail = this.add.graphics();
    trail.fillStyle(0x220066, 0.4);
    
    let trailPoints: { x: number; y: number }[] = [];
    
    this.time.addEvent({
      delay: 50,
      loop: true,
      callback: () => {
        if (this.enemySprite) {
          trailPoints.push({ x: this.enemySprite.x, y: this.enemySprite.y });
          if (trailPoints.length > 10) {
            trailPoints.shift();
          }
          
          trail.clear();
          trailPoints.forEach((point, index) => {
            const alpha = (index / trailPoints.length) * 0.4;
            const size = (index / trailPoints.length) * 20;
            trail.fillStyle(0x220066, alpha);
            trail.fillCircle(point.x, point.y, size);
          });
        }
      }
    });
    
    this.enemySpecialEffects.push(trail);
  }

  private createWispGlow() {
    const wisp = this.add.graphics();
    wisp.fillStyle(0x8866ff, 0.6);
    wisp.fillCircle(0, 0, 25);
    wisp.setPosition(this.currentEnemyConfig.position.x, this.currentEnemyConfig.position.y);
    wisp.setDepth(6);
    
    this.tweens.add({
      targets: wisp,
      alpha: { from: 0.3, to: 0.8 },
      scaleX: { from: 0.8, to: 1.3 },
      scaleY: { from: 0.8, to: 1.3 },
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
    
    this.enemySpecialEffects.push(wisp);
  }

  private createFloatingEffect() {
    // Make Shadow Wisp float up and down
    this.tweens.add({
      targets: this.enemySprite,
      y: this.currentEnemyConfig.position.y - 15,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private setupUI() {
    // Setup UI frames
    if (this.textures.exists('frame')) {
      const playerFrame = this.add.image(120, 430, 'frame').setScale(1.5).setDepth(8);
      const enemyFrame = this.add.image(680, 180, 'frame').setScale(1.5).setDepth(8);
      playerFrame.setTint(0x88ccff);
      enemyFrame.setTint(0xff8888);
    }
    
    if (this.textures.exists('portrait')) {
      this.add.image(70, 430, 'portrait').setScale(1.2).setDepth(9);
    }
    
    // Setup health bars
    this.setupHealthBars();
    
    // Setup action buttons
    this.setupActionButtons();
    
    // Setup text labels
    this.setupTextLabels();
    
    // Create message box
    this.createMessageBox();
  }

  private setupHealthBars() {
    // Player health bar
    if (this.textures.exists('playerHealthBar')) {
      this.playerHealthBar = this.add.image(180, 400, 'playerHealthBar')
        .setDepth(10).setOrigin(0, 0.5);
      this.playerHealthFill = this.add.image(100, 400, 'playerHealthFill')
        .setDepth(9).setOrigin(0, 0.5);
    }
    
    // Player mana bar
    if (this.textures.exists('playerManaBar')) {
      this.playerManaBar = this.add.image(180, 430, 'playerManaBar')
        .setDepth(10).setOrigin(0, 0.5);
      this.playerManaFill = this.add.image(100, 430, 'playerManaFill')
        .setDepth(9).setOrigin(0, 0.5);
    }
    
    // Enemy health bar
    if (this.textures.exists('enemyHealthBar')) {
      this.enemyHealthBar = this.add.image(680, 140, 'enemyHealthBar')
        .setDepth(10).setOrigin(0, 0.5);
      this.enemyHealthFill = this.add.image(600, 140, 'enemyHealthFill')
        .setDepth(9).setOrigin(0, 0.5);
    }
  }

  private setupActionButtons() {
    const buttonVariants = ['attack', 'magic', 'item', 'defend'];
    const buttonPositions = [
      { x: 350, y: 500 },
      { x: 450, y: 500 },
      { x: 350, y: 550 },
      { x: 450, y: 550 }
    ];
    
    buttonVariants.forEach((variant, i) => {
      const textureKey = `button_${variant}_normal`;
      if (!this.textures.exists(textureKey)) return;
      
      const pos = buttonPositions[i];
      const button = this.add.image(pos.x, pos.y, textureKey);
      button.setInteractive().setDepth(15);
      
      // Enhanced button interactions
      button.on('pointerover', () => {
        const hoverTexture = `button_${variant}_hover`;
        if (this.textures.exists(hoverTexture)) {
          button.setTexture(hoverTexture);
          button.setScale(1.05);
        }
      });
      
      button.on('pointerout', () => {
        button.setTexture(textureKey);
        button.setScale(1.0);
      });
      
      button.on('pointerdown', () => {
        const pressedTexture = `button_${variant}_pressed`;
        if (this.textures.exists(pressedTexture)) {
          button.setTexture(pressedTexture);
          button.setScale(0.95);
        }
      });
      
      button.on('pointerup', () => {
        const hoverTexture = `button_${variant}_hover`;
        if (this.textures.exists(hoverTexture)) {
          button.setTexture(hoverTexture);
          button.setScale(1.05);
        }
        this.handleButtonAction(variant);
      });
      
      this.actionButtons[variant] = button;
    });
  }

  private setupTextLabels() {
    const hpTextStyle = {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2,
      align: 'center'
    };
    
    this.add.text(90, 380, "HP", hpTextStyle).setOrigin(0.5).setDepth(11);
    this.add.text(90, 430, "MP", hpTextStyle).setOrigin(0.5).setDepth(11);
    this.add.text(600, 120, "HP", hpTextStyle).setOrigin(0.5).setDepth(11);
  }

  private createAmbientParticles() {
    if (this.textures.exists('frame')) {
      const atmosphereColor = this.getEnemyAtmosphereColor();
      const particles = this.add.particles(0, 0, 'frame', {
        x: { min: 0, max: 800 },
        y: { min: 0, max: 600 },
        scale: { min: 0.01, max: 0.03 },
        alpha: { min: 0.1, max: 0.3 },
        lifespan: 10000,
        frequency: 1000,
        tint: atmosphereColor
      });
      particles.setDepth(2);
    }
  }

  private createMessageBox() {
    this.messageBox = this.add.text(250, 500, "", { 
      fontFamily: 'monospace', 
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      wordWrap: { width: 350 },
      align: 'center'
    });
    this.messageBox.setDepth(20);
  }

  private setupInput() {
    const keyboardEvents = [
      { key: 'UP', action: 'up' },
      { key: 'DOWN', action: 'down' },
      { key: 'SPACE', action: 'select' },
      { key: 'Z', action: 'select' },
      { key: 'X', action: 'back' },
      { key: 'ESC', action: 'menu' }
    ];
    
    keyboardEvents.forEach(({ key, action }) => {
      this.input.keyboard.on(`keydown-${key}`, () => {
        this.handleInput(action);
      });
    });
    
    // Global control handler for touch/external controls
    window.gameControlEvent = (action: string) => {
      this.handleInput(action);
    };
  }

  private handleInput(action: string) {
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
      if (action === 'nextLevel') {
        this.nextLevel();
      }
    } else if (this.currentState === GameState.DEFEAT) {
      if (action === 'retry') {
        this.retry();
      }
    }
  }

  private handleButtonAction(variant: string) {
    if (this.currentState === GameState.PLAYER_TURN) {
      const items = this.deps.menuSystem.getMenuItems();
      const index = items.findIndex(item => item.id === variant);
      if (index >= 0) {
        this.deps.menuSystem.setSelectedIndex(index);
        this.handleMenuSelection();
      }
    }
  }

  private handleMenuSelection() {
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
          this.deps.menuSystem.select();
          this.updateGameState();
          this.updateButtonHighlights();
          break;
        case 'item':
          this.deps.menuSystem.select();
          this.updateGameState();
          this.updateButtonHighlights();
          break;
        case 'defend':
          this.messageBox.setText("You take a defensive stance!");
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

  private handleBattleEvent(event: BattleEvent) {
    if (!this.sceneInitialized) return;
    
    // Display event message with typing effect
    this.displayMessageWithEffect(event.message);
    
    // Update current state
    this.currentState = this.battleSystem.getState();
    
    // Update battle animations
    this.updateBattleAnimations(event);
    
    // Update health bars for relevant events
    if (['attack', 'magic', 'item', 'enemyAttack'].includes(event.type)) {
      this.updateHealthBars();
    }
    
    // Update game state
    this.updateGameState();
    this.updateButtonHighlights();
    
    // Add character-specific screen effects
    this.addCharacterSpecificEffects(event);
  }

  private addCharacterSpecificEffects(event: BattleEvent) {
    if (['attack', 'enemyAttack'].includes(event.type)) {
      // Different shake intensities based on enemy type
      const shakeIntensity = this.getShakeIntensityForEnemy();
      this.cameras.main.shake(200, shakeIntensity);
    }
    
    // Add character-specific visual effects
    if (event.type === 'enemyAttack') {
      this.addEnemyAttackEffect();
    }
  }

  private getShakeIntensityForEnemy(): number {
    const intensities = {
      'STONE_GUARDIAN': 0.02,   // Heavy shake
      'RUNE_CONSTRUCT': 0.015,  // Medium shake
      'SHADOW_WISP': 0.008      // Light shake
    };
    
    return intensities[this.currentEnemyType] || 0.01;
  }

  private addEnemyAttackEffect() {
    switch (this.currentEnemyType) {
      case 'STONE_GUARDIAN':
        // Create stone impact effect
        this.createStoneImpactEffect();
        break;
      case 'RUNE_CONSTRUCT':
        // Create magical blast effect
        this.createMagicalBlastEffect();
        break;
      case 'SHADOW_WISP':
        // Create shadow energy effect
        this.createShadowEnergyEffect();
        break;
    }
  }

  private createStoneImpactEffect() {
    const impact = this.add.graphics();
    impact.fillStyle(0x8b4513, 0.8);
    impact.fillCircle(this.playerSprite.x, this.playerSprite.y, 5);
    impact.setDepth(7);
    
    this.tweens.add({
      targets: impact,
      scaleX: 8,
      scaleY: 8,
      alpha: 0,
      duration: 300,
      onComplete: () => impact.destroy()
    });
  }

  private createMagicalBlastEffect() {
    const blast = this.add.graphics();
    blast.fillStyle(0x4488ff, 0.7);
    blast.fillCircle(this.playerSprite.x, this.playerSprite.y, 10);
    blast.setDepth(7);
    
    this.tweens.add({
      targets: blast,
      scaleX: 6,
      scaleY: 6,
      alpha: 0,
      duration: 400,
      onComplete: () => blast.destroy()
    });
  }

  private createShadowEnergyEffect() {
    const energy = this.add.graphics();
    energy.fillStyle(0x4b0082, 0.6);
    energy.fillCircle(this.playerSprite.x, this.playerSprite.y, 8);
    energy.setDepth(7);
    
    this.tweens.add({
      targets: energy,
      scaleX: 5,
      scaleY: 5,
      alpha: 0,
      rotation: Math.PI * 2,
      duration: 500,
      onComplete: () => energy.destroy()
    });
  }

  private displayMessageWithEffect(message: string) {
    if (!this.messageBox) return;
    
    this.messageBox.setText('');
    
    let currentChar = 0;
    const typewriterTimer = this.time.addEvent({
      delay: 30,
      callback: () => {
        if (currentChar < message.length) {
          this.messageBox.setText(message.substring(0, currentChar + 1));
          currentChar++;
        } else {
          typewriterTimer.destroy();
        }
      },
      loop: true
    });
  }

  private updateHealthBars() {
    if (!this.sceneInitialized) return;
    
    const playerStats = this.player.getStats();
    const enemyStats = this.battleSystem.getEnemy().getStats();
    
    // Animate health bar changes
    if (this.playerHealthFill) {
      const playerHealthPercent = playerStats.hp / playerStats.maxHp;
      this.tweens.add({
        targets: this.playerHealthFill,
        scaleX: playerHealthPercent,
        duration: 500,
        ease: 'Power2'
      });
      
      // Low health effect
      if (playerHealthPercent <= 0.3 && playerStats.hp > 0) {
        this.addLowHealthEffect('player');
      }
    }
    
    if (this.playerManaFill) {
      const playerManaPercent = playerStats.mp / playerStats.maxMp;
      this.tweens.add({
        targets: this.playerManaFill,
        scaleX: playerManaPercent,
        duration: 500,
        ease: 'Power2'
      });
    }
    
    if (this.enemyHealthFill) {
      const enemyHealthPercent = enemyStats.hp / enemyStats.maxHp;
      this.tweens.add({
        targets: this.enemyHealthFill,
        scaleX: enemyHealthPercent,
        duration: 500,
        ease: 'Power2'
      });
      
      // Low health effect
      if (enemyHealthPercent <= 0.3 && enemyStats.hp > 0) {
        this.addLowHealthEffect('enemy');
      }
    }
  }

  private addLowHealthEffect(type: 'player' | 'enemy') {
    const target = type === 'player' ? this.playerSprite : this.enemySprite;
    if (!target) return;
    
    this.tweens.add({
      targets: target,
      tint: 0xff6666,
      duration: 300,
      yoyo: true,
      repeat: 3
    });
  }

  private updateBattleAnimations(event: BattleEvent) {
    if (!this.sceneInitialized) return;
    
    const enemyTexturePrefix = this.currentEnemyConfig.texturePrefix;
    
    // Clear any existing animation tweens
    this.clearAnimationTweens();
    
    if (event.type === 'attack') {
      this.playPlayerAttackAnimation(enemyTexturePrefix);
    } else if (event.type === 'magic') {
      this.playPlayerMagicAnimation(enemyTexturePrefix);
    } else if (event.type === 'enemyAttack') {
      this.playEnemyAttackAnimation(enemyTexturePrefix);
    }
  }

  private clearAnimationTweens() {
    this.animationTweens.forEach(tween => {
      if (tween && tween.isActive()) {
        tween.destroy();
      }
    });
    this.animationTweens = [];
  }

  private playPlayerAttackAnimation(enemyTexturePrefix: string) {
    if (!this.playerSprite || !this.enemySprite) return;
    
    // Player attacks with enhanced animation
    if (this.textures.exists('player_attack')) {
      this.playerSprite.setTexture('player_attack');
    }
    
    // Player rushes forward
    const rushTween = this.tweens.add({
      targets: this.playerSprite,
      x: this.playerSprite.x + 100,
      duration: 300,
      ease: 'Power2'
    });
    this.animationTweens.push(rushTween);
    
    // Return and switch back
    this.time.delayedCall(300, () => {
      if (this.playerSprite) {
        const returnTween = this.tweens.add({
          targets: this.playerSprite,
          x: 200,
          duration: 200,
          ease: 'Power2'
        });
        this.animationTweens.push(returnTween);
        
        this.time.delayedCall(200, () => {
          if (this.playerSprite && this.textures.exists('player_default')) {
            this.playerSprite.setTexture('player_default');
          }
        });
      }
    });
    
    // Enemy hit reaction
    this.time.delayedCall(250, () => {
      if (this.enemySprite) {
        const hitTexture = `${enemyTexturePrefix}_hit`;
        if (this.textures.exists(hitTexture)) {
          this.enemySprite.setTexture(hitTexture);
        }
        
        const hitTween = this.tweens.add({
          targets: this.enemySprite,
          x: this.enemySprite.x + 20,
          duration: 100,
          yoyo: true,
          repeat: 1
        });
        this.animationTweens.push(hitTween);
        
        this.time.delayedCall(300, () => {
          if (this.enemySprite) {
            const defaultTexture = `${enemyTexturePrefix}_default`;
            if (this.textures.exists(defaultTexture)) {
              this.enemySprite.setTexture(defaultTexture);
            }
          }
        });
      }
    });
  }

  private playPlayerMagicAnimation(enemyTexturePrefix: string) {
    if (!this.playerSprite || !this.enemySprite) return;
    
    // Player casts magic
    if (this.textures.exists('player_cast')) {
      this.playerSprite.setTexture('player_cast');
    }
    
    // Add magical glow effect
    const glowTween = this.tweens.add({
      targets: this.playerSprite,
      alpha: 0.7,
      scaleX: 1.6,
      scaleY: 1.6,
      duration: 400,
      yoyo: true,
      repeat: 1
    });
    this.animationTweens.push(glowTween);
    
    // Create magic projectile
    this.createMagicProjectile();
    
    this.time.delayedCall(800, () => {
      if (this.playerSprite && this.textures.exists('player_default')) {
        this.playerSprite.setTexture('player_default');
      }
    });
    
    // Enemy hit by magic
    this.time.delayedCall(600, () => {
      if (this.enemySprite) {
        const hitTexture = `${enemyTexturePrefix}_hit`;
        if (this.textures.exists(hitTexture)) {
          this.enemySprite.setTexture(hitTexture);
        }
        
        const magicHitTween = this.tweens.add({
          targets: this.enemySprite,
          tint: 0x88ccff,
          duration: 200,
          yoyo: true,
          repeat: 2
        });
        this.animationTweens.push(magicHitTween);
        
        this.time.delayedCall(400, () => {
          if (this.enemySprite) {
            const defaultTexture = `${enemyTexturePrefix}_default`;
            if (this.textures.exists(defaultTexture)) {
              this.enemySprite.setTexture(defaultTexture);
            }
          }
        });
      }
    });
  }

  private playEnemyAttackAnimation(enemyTexturePrefix: string) {
    if (!this.playerSprite || !this.enemySprite) return;
    
    // Enemy attacks
    const attackTexture = `${enemyTexturePrefix}_attack`;
    if (this.textures.exists(attackTexture)) {
      this.enemySprite.setTexture(attackTexture);
    }
    
    // Character-specific attack animation
    const config = this.currentEnemyConfig;
    const attackDistance = this.getEnemyAttackDistance();
    
    const lungeTween = this.tweens.add({
      targets: this.enemySprite,
      x: this.enemySprite.x - attackDistance,
      scaleX: config.scale + 0.2,
      scaleY: config.scale + 0.2,
      duration: 400,
      ease: 'Power2'
    });
    this.animationTweens.push(lungeTween);
    
    this.time.delayedCall(400, () => {
      if (this.enemySprite) {
        const returnTween = this.tweens.add({
          targets: this.enemySprite,
          x: config.position.x,
          scaleX: config.scale,
          scaleY: config.scale,
          duration: 300,
          ease: 'Power2'
        });
        this.animationTweens.push(returnTween);
        
        this.time.delayedCall(100, () => {
          if (this.enemySprite) {
            const defaultTexture = `${enemyTexturePrefix}_default`;
            if (this.textures.exists(defaultTexture)) {
              this.enemySprite.setTexture(defaultTexture);
            }
          }
        });
      }
    });
    
    // Player hit reaction
    this.time.delayedCall(350, () => {
      if (this.playerSprite) {
        if (this.textures.exists('player_hit')) {
          this.playerSprite.setTexture('player_hit');
        }
        
        const playerHitTween = this.tweens.add({
          targets: this.playerSprite,
          x: this.playerSprite.x - 15,
          duration: 100,
          yoyo: true,
          repeat: 1
        });
        this.animationTweens.push(playerHitTween);
        
        this.time.delayedCall(300, () => {
          if (this.playerSprite && this.textures.exists('player_default')) {
            this.playerSprite.setTexture('player_default');
          }
        });
      }
    });
  }

  private getEnemyAttackDistance(): number {
    const distances = {
      'STONE_GUARDIAN': 100,  // Heavy, slow movement
      'RUNE_CONSTRUCT': 80,   // Moderate movement
      'SHADOW_WISP': 60       // Quick, agile movement
    };
    
    return distances[this.currentEnemyType] || 80;
  }

  private createMagicProjectile() {
    const projectile = this.add.graphics();
    projectile.fillStyle(0x88ccff);
    projectile.fillCircle(0, 0, 8);
    projectile.setPosition(250, 320);
    projectile.setDepth(6);
    
    const projectileTween = this.tweens.add({
      targets: projectile,
      x: 550,
      y: 200,
      scaleX: 0.5,
      scaleY: 0.5,
      alpha: 0,
      duration: 400,
      onComplete: () => {
        projectile.destroy();
      }
    });
    this.animationTweens.push(projectileTween);
  }

  private updateButtonHighlights() {
    if (!this.sceneInitialized) return;
    
    if (this.deps.menuSystem.getCurrentMenu() === 'main') {
      const selectedIndex = this.deps.menuSystem.getSelectedIndex();
      const items = this.deps.menuSystem.getMenuItems();
      
      // Reset all buttons
      Object.keys(this.actionButtons).forEach(key => {
        const button = this.actionButtons[key];
        const normalTexture = `button_${key}_normal`;
        if (this.textures.exists(normalTexture)) {
          button.setTexture(normalTexture);
          button.setScale(1.0);
        }
      });
      
      // Highlight selected button
      if (items[selectedIndex]) {
        const selectedId = items[selectedIndex].id;
        if (this.actionButtons[selectedId]) {
          const button = this.actionButtons[selectedId];
          const hoverTexture = `button_${selectedId}_hover`;
          if (this.textures.exists(hoverTexture)) {
            button.setTexture(hoverTexture);
            button.setScale(1.05);
          }
        }
      }
    }
  }

  private nextLevel(): void {
    const enemyTypes = Object.keys(ENEMY_CONFIGS);
    const nextEnemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    this.currentEnemyType = nextEnemyType;
    this.currentEnemyConfig = ENEMY_CONFIGS[nextEnemyType];
    
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Clean up old enemy effects
      this.cleanupEnemyEffects();
      
      this.battleSystem.resetBattle(nextEnemyType as EnemyType);
      
      // Update enemy sprite and setup new effects
      if (this.enemySprite) {
        const enemyTextureKey = `${this.currentEnemyConfig.texturePrefix}_default`;
        if (this.textures.exists(enemyTextureKey)) {
          this.enemySprite.setTexture(enemyTextureKey);
          this.enemySprite.setPosition(this.currentEnemyConfig.position.x, this.currentEnemyConfig.position.y);
          this.enemySprite.setScale(this.currentEnemyConfig.scale);
        }
      }
      
      // Update enemy name
      if (this.enemyNameText) {
        this.enemyNameText.setText(this.currentEnemyConfig.displayName);
        this.enemyNameText.setPosition(this.currentEnemyConfig.position.x, this.currentEnemyConfig.position.y - 80);
      }
      
      // Create new enemy effects
      this.createEnemySpecialEffects();
      
      this.player.heal(1000);
      this.updateHealthBars();
      this.updateGameState();
      
      const progressMessage = `You venture deeper into the ruins and encounter ${this.currentEnemyConfig.displayName}!`;
      this.messageBox.setText(progressMessage);
      this.cameras.main.fadeIn(500, 0, 0, 0);
    });
  }

  private cleanupEnemyEffects() {
    this.enemySpecialEffects.forEach(effect => {
      if (effect && effect.destroy) {
        effect.destroy();
      }
    });
    this.enemySpecialEffects = [];
  }

  private retry(): void {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.battleSystem.resetBattle(this.currentEnemyType as EnemyType);
      this.player.heal(1000);
      
      this.updateHealthBars();
      this.updateGameState();
      
      this.messageBox.setText("You steel yourself for another attempt...");
      this.cameras.main.fadeIn(500, 0, 0, 0);
    });
  }

  private updateGameState() {
    if (!this.sceneInitialized) return;
    
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

  private getEnemyTexturePrefix() {
    return this.currentEnemyConfig.texturePrefix;
  }

  private showErrorState() {
    const errorBg = this.add.graphics();
    errorBg.fillStyle(0x000000, 0.9);
    errorBg.fillRect(0, 0, 800, 600);
    
    const errorText = this.add.text(400, 300, `Scene Error: ${this.loadingError || 'Unknown error'}`, {
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
      this.retryLoading();
    });
  }

  // Public getters for external loading screen integration
  getLoadingProgress(): number {
    return this.loadingProgress;
  }

  getCurrentLoadingTask(): string {
    return this.currentLoadingTask;
  }

  getLoadingError(): string | null {
    return this.loadingError;
  }

  isCurrentlyLoading(): boolean {
    return this.isLoading;
  }

  retryLoading() {
    console.log('Retrying asset loading...');
    this.loadingManager.reset();
    this.isLoading = true;
    this.loadingError = null;
    
    const tasks = LoadingManager.createBattleSceneTasks();
    tasks.forEach(task => this.loadingManager.addTask(task));
    
    this.scene.restart();
  }

  destroy() {
    console.log('BattleScene cleanup started');
    
    // Clean up animation tweens
    this.clearAnimationTweens();
    
    // Clean up enemy special effects
    this.cleanupEnemyEffects();
    
    // Stop and clean up audio
    if (this.battleMusic && this.battleMusic.isPlaying) {
      this.battleMusic.stop();
    }
    
    Object.values(this.soundEffects).forEach(sound => {
      if (sound && sound.isPlaying) {
        sound.stop();
      }
    });
    
    // Clean up global references
    delete window.gameControlEvent;
    
    // Clean up visual effects
    this.battleEffects.forEach(effect => {
      if (effect && effect.destroy) {
        effect.destroy();
      }
    });
    
    // Clean up particles
    if (this.backgroundParticles) {
      this.backgroundParticles.destroy();
    }
    
    // Reset loading manager
    this.loadingManager.reset();
    
    console.log('BattleScene destroyed and cleaned up');
    
    super.destroy();
  }
}