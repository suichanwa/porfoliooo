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
    
    // Get difficulty and enemy type from data or use defaults
    if (data && data.enemyType) {
      this.currentEnemyType = data.enemyType;
    } else if (Math.random() > 0.7) {
      // Random enemy selection for variety
      const enemies = ['RUNE_CONSTRUCT', 'SHADOW_WISP', 'STONE_GUARDIAN'];
      this.currentEnemyType = enemies[Math.floor(Math.random() * enemies.length)];
    }
    
    // Setup loading tasks
    const tasks = LoadingManager.createBattleSceneTasks();
    tasks.forEach(task => this.loadingManager.addTask(task));
    
    console.log(`Selected enemy type: ${this.currentEnemyType}`);
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
    
    // Show initial message with delay for dramatic effect
    this.time.delayedCall(1000, () => {
      if (this.messageBox) {
        this.messageBox.setText("A battle begins! Choose your action.");
        this.battleSystem.resetBattle(this.currentEnemyType as EnemyType);
      }
    });
  }

  private setupBackground() {
    // Main background
    const bg = this.add.image(400, 300, 'battleBg');
    bg.setDisplaySize(800, 600);
    bg.setDepth(0);
    
    // Add atmospheric overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x2a2a4a, 0.1);
    overlay.fillRect(0, 0, 800, 600);
    overlay.setDepth(1);
    
    // Create ambient particles
    this.createAmbientParticles();
  }

  private initializeBattleSystem() {
    // Create player and battle system with selected enemy type
    this.player = new Player(this, 200, 320);
    this.battleSystem = new BattleSystem(this, this.player, this.currentEnemyType as EnemyType);
  }

  private setupSprites() {
    // Player sprite
    if (this.textures.exists('player_default')) {
      this.playerSprite = this.add.image(200, 320, 'player_default');
      this.playerSprite.setScale(1.5).setDepth(5);
      
      // Add subtle idle animation
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
    
    // Enemy sprite
    const enemyTextureKey = `${this.getEnemyTexturePrefix()}_default`;
    if (this.textures.exists(enemyTextureKey)) {
      this.enemySprite = this.add.image(600, 200, enemyTextureKey);
      this.enemySprite.setScale(1.5).setDepth(5);
      
      // Add menacing idle animation
      this.tweens.add({
        targets: this.enemySprite,
        scaleX: 1.45,
        scaleY: 1.55,
        duration: 3000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
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
      const particles = this.add.particles(0, 0, 'frame', {
        x: { min: 0, max: 800 },
        y: { min: 0, max: 600 },
        scale: { min: 0.01, max: 0.03 },
        alpha: { min: 0.1, max: 0.3 },
        lifespan: 10000,
        frequency: 1000,
        tint: 0x88ccff
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
    
    // Add screen shake for impactful events
    if (['attack', 'enemyAttack'].includes(event.type)) {
      this.cameras.main.shake(200, 0.01);
    }
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
    
    const enemyTexturePrefix = this.getEnemyTexturePrefix();
    
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
    
    // Enemy lunges forward
    const lungeTween = this.tweens.add({
      targets: this.enemySprite,
      x: this.enemySprite.x - 80,
      scaleX: 1.7,
      scaleY: 1.7,
      duration: 400,
      ease: 'Power2'
    });
    this.animationTweens.push(lungeTween);
    
    this.time.delayedCall(400, () => {
      if (this.enemySprite) {
        const returnTween = this.tweens.add({
          targets: this.enemySprite,
          x: 600,
          scaleX: 1.5,
          scaleY: 1.5,
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
    const enemyTypes: EnemyType[] = ['STONE_GUARDIAN', 'SHADOW_WISP', 'RUNE_CONSTRUCT'];
    const nextEnemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
    
    this.currentEnemyType = nextEnemyType;
    
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.battleSystem.resetBattle(nextEnemyType);
      
      if (this.enemySprite) {
        const enemyTextureKey = `${this.getEnemyTexturePrefix()}_default`;
        if (this.textures.exists(enemyTextureKey)) {
          this.enemySprite.setTexture(enemyTextureKey);
        }
      }
      
      this.player.heal(1000);
      this.updateHealthBars();
      this.updateGameState();
      
      this.messageBox.setText("You venture deeper into the mystical ruins...");
      this.cameras.main.fadeIn(500, 0, 0, 0);
    });
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