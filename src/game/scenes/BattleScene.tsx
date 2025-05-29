import Phaser from 'phaser';
import { GameState, EnemyType } from '../constants';
import { GameStateData } from '../types/gameTypes';

// Simple interfaces for the battle scene
interface BattleSceneDependencies {
  menuSystem: {
    getCurrentMenu: () => string;
    getSelectedIndex: () => number;
    getMenuItems: () => Array<{ id: string; text: string }>;
    moveUp: () => void;
    moveDown: () => void;
    select: () => void;
    back: () => void;
    setSelectedIndex: (index: number) => void;
  };
  updateGameState: (state: GameStateData) => void;
}

interface EnemyConfig {
  name: string;
  maxHp: number;
  attack: number;
  defense: number;
  color: number;
  scale: number;
  position: { x: number; y: number };
}

// Enemy configurations
const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  'RUNE_CONSTRUCT': {
    name: 'Ancient Rune Construct',
    maxHp: 120,
    attack: 25,
    defense: 15,
    color: 0x4488ff,
    scale: 1.6,
    position: { x: 600, y: 250 }
  },
  'STONE_GUARDIAN': {
    name: 'Stone Guardian',
    maxHp: 150,
    attack: 30,
    defense: 20,
    color: 0x8b4513,
    scale: 1.8,
    position: { x: 580, y: 230 }
  },
  'SHADOW_WISP': {
    name: 'Shadow Wisp',
    maxHp: 80,
    attack: 35,
    defense: 5,
    color: 0x4b0082,
    scale: 1.4,
    position: { x: 620, y: 270 }
  },
  'SLIME': {
    name: 'Slime',
    maxHp: 60,
    attack: 15,
    defense: 5,
    color: 0x32cd32,
    scale: 1.2,
    position: { x: 600, y: 280 }
  },
  'BAT': {
    name: 'Giant Bat',
    maxHp: 40,
    attack: 20,
    defense: 8,
    color: 0x2f4f4f,
    scale: 1.3,
    position: { x: 610, y: 240 }
  },
  'SKELETON': {
    name: 'Skeleton Warrior',
    maxHp: 90,
    attack: 22,
    defense: 12,
    color: 0xf5f5dc,
    scale: 1.5,
    position: { x: 590, y: 250 }
  }
};

// Simple entity classes
class Player {
  public hp: number = 100;
  public maxHp: number = 100;
  public mp: number = 50;
  public maxMp: number = 50;
  public attack: number = 25;
  public defense: number = 10;
  public sprite: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    // Create player sprite using graphics
    this.sprite = scene.add.graphics();
    this.sprite.fillStyle(0x4488ff);
    this.sprite.fillCircle(0, 0, 20);
    this.sprite.lineStyle(2, 0xffffff);
    this.sprite.strokeCircle(0, 0, 20);
    this.sprite.setPosition(x, y);
    this.sprite.setDepth(5);
  }

  takeDamage(amount: number): number {
    const actualDamage = Math.max(1, amount - this.defense);
    this.hp = Math.max(0, this.hp - actualDamage);
    return actualDamage;
  }

  heal(amount: number): number {
    const actualHeal = Math.min(amount, this.maxHp - this.hp);
    this.hp += actualHeal;
    return actualHeal;
  }

  restoreMp(amount: number): number {
    const actualRestore = Math.min(amount, this.maxMp - this.mp);
    this.mp += actualRestore;
    return actualRestore;
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  getStats() {
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      mp: this.mp,
      maxMp: this.maxMp
    };
  }
}

class Enemy {
  public hp: number;
  public maxHp: number;
  public attack: number;
  public defense: number;
  public name: string;
  public sprite: Phaser.GameObjects.Graphics;
  public type: EnemyType;

  constructor(scene: Phaser.Scene, type: EnemyType) {
    this.type = type;
    const config = ENEMY_CONFIGS[type];
    
    this.name = config.name;
    this.maxHp = config.maxHp;
    this.hp = this.maxHp;
    this.attack = config.attack;
    this.defense = config.defense;

    // Create enemy sprite using graphics
    this.sprite = scene.add.graphics();
    this.sprite.fillStyle(config.color);
    this.sprite.fillRect(-25, -25, 50, 50);
    this.sprite.lineStyle(2, 0xffffff);
    this.sprite.strokeRect(-25, -25, 50, 50);
    this.sprite.setPosition(config.position.x, config.position.y);
    this.sprite.setScale(config.scale);
    this.sprite.setDepth(5);
  }

  takeDamage(amount: number): number {
    const actualDamage = Math.max(1, amount - this.defense);
    this.hp = Math.max(0, this.hp - actualDamage);
    return actualDamage;
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  getStats() {
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      name: this.name
    };
  }
}

class BattleScene extends Phaser.Scene {
  // Core game objects
  private player!: Player;
  private enemy!: Enemy;
  private currentState: GameState = GameState.PLAYER_TURN;
  private currentEnemyType: EnemyType = 'RUNE_CONSTRUCT';
  
  // UI elements
  private messageBox!: Phaser.GameObjects.Text;
  private playerHealthBar!: Phaser.GameObjects.Graphics;
  private playerHealthFill!: Phaser.GameObjects.Graphics;
  private playerManaBar!: Phaser.GameObjects.Graphics;
  private playerManaFill!: Phaser.GameObjects.Graphics;
  private enemyHealthBar!: Phaser.GameObjects.Graphics;
  private enemyHealthFill!: Phaser.GameObjects.Graphics;
  private enemyNameText!: Phaser.GameObjects.Text;
  
  // Action buttons
  private actionButtons: Record<string, Phaser.GameObjects.Graphics> = {};
  private buttonTexts: Record<string, Phaser.GameObjects.Text> = {};
  
  // Dependencies and state
  private deps: BattleSceneDependencies;
  private sceneInitialized = false;
  private isProcessingAction = false;

  constructor(dependencies: BattleSceneDependencies) {
    super({ key: 'MysticRuinsBattleScene' });
    this.deps = dependencies;
  }

  init(data: any) {
    console.log('BattleScene init with data:', data);
    
    // Select enemy type
    if (data && data.enemyType) {
      this.currentEnemyType = data.enemyType;
    } else if (data && data.difficulty) {
      this.currentEnemyType = this.selectEnemyByDifficulty(data.difficulty);
    } else {
      // Random enemy selection
      const enemies: EnemyType[] = ['RUNE_CONSTRUCT', 'STONE_GUARDIAN', 'SHADOW_WISP', 'SLIME', 'BAT', 'SKELETON'];
      this.currentEnemyType = enemies[Math.floor(Math.random() * enemies.length)];
    }
    
    console.log(`Selected enemy: ${this.currentEnemyType}`);
  }

  private selectEnemyByDifficulty(difficulty: string): EnemyType {
    const difficultyMappings = {
      'Normal': ['SLIME', 'BAT', 'SHADOW_WISP'],
      'Hard': ['SKELETON', 'RUNE_CONSTRUCT'],
      'Insane': ['STONE_GUARDIAN']
    };
    
    const availableEnemies = difficultyMappings[difficulty] || ['SLIME'];
    return availableEnemies[Math.floor(Math.random() * availableEnemies.length)] as EnemyType;
  }

  preload() {
    console.log('BattleScene preload started');
    // No external assets to load, everything uses graphics
    console.log('BattleScene preload completed');
  }

  create() {
    console.log('BattleScene create started');
    
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
    
    // Create entities
    this.player = new Player(this, 200, 320);
    this.enemy = new Enemy(this, this.currentEnemyType);
    
    // Setup UI
    this.setupUI();
    this.setupInput();
    
    // Initialize state
    this.updateGameState();
    
    // Show initial message
    this.showMessage(this.getEnemyFlavorText());
    
    // Fade in
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

  private setupBackground() {
    // Main background
    const bg = this.add.graphics();
    bg.fillStyle(0x1a1a2e, 1);
    bg.fillRect(0, 0, 800, 600);
    bg.setDepth(0);
    
    // Atmospheric overlay
    const overlay = this.add.graphics();
    const overlayColor = this.getEnemyAtmosphereColor();
    overlay.fillStyle(overlayColor, 0.1);
    overlay.fillRect(0, 0, 800, 600);
    overlay.setDepth(1);
    
    // Simple particles
    this.createAmbientParticles();
  }

  private getEnemyAtmosphereColor(): number {
    const atmosphereColors = {
      'RUNE_CONSTRUCT': 0x4a4aff,
      'STONE_GUARDIAN': 0x8b4513,
      'SHADOW_WISP': 0x4b0082,
      'SLIME': 0x32cd32,
      'BAT': 0x2f4f4f,
      'SKELETON': 0xf5f5dc
    };
    
    return atmosphereColors[this.currentEnemyType] || 0x2a2a4a;
  }

  private getEnemyFlavorText(): string {
    const flavorTexts = {
      'RUNE_CONSTRUCT': "An ancient construct awakens, its runes glowing with mystical power!",
      'STONE_GUARDIAN': "A massive stone guardian blocks your path, its eyes burning with ancient fury!",
      'SHADOW_WISP': "A shadow wisp materializes from the darkness, crackling with ethereal energy!",
      'SLIME': "A gelatinous slime oozes towards you, bubbling menacingly!",
      'BAT': "A giant bat swoops down from the shadows, screeching loudly!",
      'SKELETON': "A skeleton warrior emerges, its bones rattling as it prepares to fight!"
    };
    
    return flavorTexts[this.currentEnemyType] || "A mysterious enemy appears before you!";
  }

  private createAmbientParticles() {
    for (let i = 0; i < 15; i++) {
      const particle = this.add.graphics();
      const atmosphereColor = this.getEnemyAtmosphereColor();
      particle.fillStyle(atmosphereColor, 0.3);
      particle.fillCircle(0, 0, 1);
      particle.setPosition(Math.random() * 800, Math.random() * 600);
      particle.setDepth(2);
      
      this.tweens.add({
        targets: particle,
        y: particle.y - 100,
        alpha: 0,
        duration: 3000 + Math.random() * 2000,
        repeat: -1,
        delay: Math.random() * 3000
      });
    }
  }

  private setupUI() {
    // Enemy name
    this.enemyNameText = this.add.text(
      this.enemy.sprite.x,
      this.enemy.sprite.y - 60,
      this.enemy.name,
      {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3,
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(10);

    // Setup health bars
    this.setupHealthBars();
    
    // Setup action buttons
    this.setupActionButtons();
    
    // Create message box
    this.messageBox = this.add.text(400, 450, "", {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
      wordWrap: { width: 350 },
      align: 'center'
    }).setOrigin(0.5).setDepth(20);
  }

  private setupHealthBars() {
    // Player health bar background
    this.playerHealthBar = this.add.graphics();
    this.playerHealthBar.fillStyle(0x333333, 1);
    this.playerHealthBar.fillRoundedRect(180, 400, 120, 12, 6);
    this.playerHealthBar.setDepth(9);

    // Player health fill
    this.playerHealthFill = this.add.graphics();
    this.playerHealthFill.setDepth(10);

    // Player mana bar background
    this.playerManaBar = this.add.graphics();
    this.playerManaBar.fillStyle(0x333333, 1);
    this.playerManaBar.fillRoundedRect(180, 420, 120, 12, 6);
    this.playerManaBar.setDepth(9);

    // Player mana fill
    this.playerManaFill = this.add.graphics();
    this.playerManaFill.setDepth(10);

    // Enemy health bar background
    this.enemyHealthBar = this.add.graphics();
    this.enemyHealthBar.fillStyle(0x333333, 1);
    this.enemyHealthBar.fillRoundedRect(500, 140, 120, 12, 6);
    this.enemyHealthBar.setDepth(9);

    // Enemy health fill
    this.enemyHealthFill = this.add.graphics();
    this.enemyHealthFill.setDepth(10);

    // Labels
    const hpTextStyle = {
      fontFamily: 'Arial',
      fontSize: '14px',
      color: '#ffffff',
      stroke: '#000',
      strokeThickness: 2
    };

    this.add.text(150, 406, "HP", hpTextStyle).setOrigin(0.5).setDepth(11);
    this.add.text(150, 426, "MP", hpTextStyle).setOrigin(0.5).setDepth(11);
    this.add.text(470, 146, "HP", hpTextStyle).setOrigin(0.5).setDepth(11);

    // Update bars initially
    this.updateHealthBars();
  }

  private setupActionButtons() {
    const buttonData = [
      { id: 'attack', text: 'ATTACK', x: 350, y: 500 },
      { id: 'magic', text: 'MAGIC', x: 450, y: 500 },
      { id: 'item', text: 'ITEM', x: 350, y: 550 },
      { id: 'defend', text: 'DEFEND', x: 450, y: 550 }
    ];

    buttonData.forEach(buttonInfo => {
      // Create button background
      const button = this.add.graphics();
      button.setPosition(buttonInfo.x, buttonInfo.y);
      button.setDepth(15);
      button.setInteractive(new Phaser.Geom.Rectangle(-40, -15, 80, 30), Phaser.Geom.Rectangle.Contains);

      // Create button text
      const buttonText = this.add.text(buttonInfo.x, buttonInfo.y, buttonInfo.text, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#ffffff'
      }).setOrigin(0.5).setDepth(16);

      // Draw button in normal state
      this.drawButton(button, false);

      // Button interactions
      button.on('pointerover', () => {
        this.drawButton(button, true);
        button.setScale(1.05);
        buttonText.setScale(1.05);
      });

      button.on('pointerout', () => {
        this.drawButton(button, false);
        button.setScale(1.0);
        buttonText.setScale(1.0);
      });

      button.on('pointerdown', () => {
        button.setScale(0.95);
        buttonText.setScale(0.95);
      });

      button.on('pointerup', () => {
        button.setScale(1.05);
        buttonText.setScale(1.05);
        this.handleButtonAction(buttonInfo.id);
      });

      this.actionButtons[buttonInfo.id] = button;
      this.buttonTexts[buttonInfo.id] = buttonText;
    });

    // Highlight first button
    this.updateButtonHighlights();
  }

  private drawButton(button: Phaser.GameObjects.Graphics, isHover: boolean) {
    button.clear();
    const color = isHover ? 0x66aaff : 0x4488ff;
    button.fillStyle(color, 1);
    button.fillRoundedRect(-40, -15, 80, 30, 5);
    button.lineStyle(2, 0xffffff, 1);
    button.strokeRoundedRect(-40, -15, 80, 30, 5);
  }

  private setupInput() {
    // Keyboard input
    this.input.keyboard.on('keydown-UP', () => this.handleInput('up'));
    this.input.keyboard.on('keydown-DOWN', () => this.handleInput('down'));
    this.input.keyboard.on('keydown-SPACE', () => this.handleInput('select'));
    this.input.keyboard.on('keydown-Z', () => this.handleInput('select'));
    this.input.keyboard.on('keydown-X', () => this.handleInput('back'));
    this.input.keyboard.on('keydown-ESC', () => this.handleInput('menu'));

    // Global control handler for external controls
    (window as any).gameControlEvent = (action: string) => {
      this.handleInput(action);
    };
  }

  private handleInput(action: string) {
    if (this.isProcessingAction) return;

    if (this.currentState === GameState.PLAYER_TURN) {
      switch(action) {
        case 'up':
          this.deps.menuSystem.moveUp();
          this.updateButtonHighlights();
          break;
        case 'down':
          this.deps.menuSystem.moveDown();
          this.updateButtonHighlights();
          break;
        case 'select':
          this.handleMenuSelection();
          break;
        case 'back':
          this.deps.menuSystem.back();
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

  private handleButtonAction(buttonId: string) {
    if (this.isProcessingAction) return;

    const items = this.deps.menuSystem.getMenuItems();
    const index = items.findIndex(item => item.id === buttonId);
    if (index >= 0) {
      this.deps.menuSystem.setSelectedIndex(index);
      this.handleMenuSelection();
    }
  }

  private async handleMenuSelection() {
    if (this.isProcessingAction) return;

    const menu = this.deps.menuSystem.getCurrentMenu();
    const selectedIndex = this.deps.menuSystem.getSelectedIndex();
    const items = this.deps.menuSystem.getMenuItems();

    if (items.length <= selectedIndex) return;

    const selectedItem = items[selectedIndex];
    this.isProcessingAction = true;

    try {
      if (menu === 'main') {
        switch (selectedItem.id) {
          case 'attack':
            await this.playerAttack();
            break;
          case 'magic':
            await this.playerMagic();
            break;
          case 'item':
            await this.playerItem();
            break;
          case 'defend':
            await this.playerDefend();
            break;
        }
      }
    } finally {
      this.isProcessingAction = false;
    }
  }

  private async playerAttack() {
    const damage = Math.floor(Math.random() * 15) + this.player.attack;
    const actualDamage = this.enemy.takeDamage(damage);
    
    this.showMessage(`You attack for ${actualDamage} damage!`);
    this.playAttackAnimation();
    
    await this.delay(1000);
    this.updateHealthBars();
    
    if (this.enemy.isDead()) {
      this.handleVictory();
    } else {
      await this.enemyTurn();
    }
  }

  private async playerMagic() {
    if (this.player.mp < 10) {
      this.showMessage("Not enough MP!");
      await this.delay(1000);
      return;
    }

    this.player.mp -= 10;
    const damage = Math.floor(Math.random() * 20) + 15;
    const actualDamage = this.enemy.takeDamage(damage);
    
    this.showMessage(`You cast a spell for ${actualDamage} damage!`);
    this.playMagicAnimation();
    
    await this.delay(1000);
    this.updateHealthBars();
    
    if (this.enemy.isDead()) {
      this.handleVictory();
    } else {
      await this.enemyTurn();
    }
  }

  private async playerItem() {
    const healAmount = this.player.heal(30);
    this.showMessage(`You use a potion and heal for ${healAmount} HP!`);
    
    await this.delay(1000);
    this.updateHealthBars();
    
    if (!this.enemy.isDead()) {
      await this.enemyTurn();
    }
  }

  private async playerDefend() {
    this.showMessage("You take a defensive stance!");
    
    await this.delay(1000);
    
    if (!this.enemy.isDead()) {
      await this.enemyTurn();
    }
  }

  private async enemyTurn() {
    await this.delay(500);
    
    const damage = Math.floor(Math.random() * 10) + this.enemy.attack;
    const actualDamage = this.player.takeDamage(damage);
    
    this.showMessage(`${this.enemy.name} attacks for ${actualDamage} damage!`);
    this.playEnemyAttackAnimation();
    
    await this.delay(1000);
    this.updateHealthBars();
    
    if (this.player.isDead()) {
      this.handleDefeat();
    } else {
      this.currentState = GameState.PLAYER_TURN;
      this.updateGameState();
    }
  }

  private playAttackAnimation() {
    // Simple attack animation
    this.tweens.add({
      targets: this.player.sprite,
      x: this.player.sprite.x + 50,
      duration: 200,
      yoyo: true,
      ease: 'Power2'
    });

    // Enemy hit reaction
    this.time.delayedCall(200, () => {
      this.tweens.add({
        targets: this.enemy.sprite,
        x: this.enemy.sprite.x + 10,
        duration: 100,
        yoyo: true,
        repeat: 1
      });
    });
  }

  private playMagicAnimation() {
    // Magic glow effect
    this.tweens.add({
      targets: this.player.sprite,
      alpha: 0.5,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 300,
      yoyo: true,
      ease: 'Power2'
    });

    // Create magic projectile
    const projectile = this.add.graphics();
    projectile.fillStyle(0x88ccff);
    projectile.fillCircle(0, 0, 5);
    projectile.setPosition(this.player.sprite.x, this.player.sprite.y);
    projectile.setDepth(6);

    this.tweens.add({
      targets: projectile,
      x: this.enemy.sprite.x,
      y: this.enemy.sprite.y,
      duration: 400,
      onComplete: () => {
        projectile.destroy();
        // Enemy magic hit effect
        this.tweens.add({
          targets: this.enemy.sprite,
          tint: 0x88ccff,
          duration: 200,
          yoyo: true
        });
      }
    });
  }

  private playEnemyAttackAnimation() {
    const originalX = this.enemy.sprite.x;
    
    this.tweens.add({
      targets: this.enemy.sprite,
      x: originalX - 50,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        this.tweens.add({
          targets: this.enemy.sprite,
          x: originalX,
          duration: 200,
          ease: 'Power2'
        });
      }
    });

    // Player hit reaction
    this.time.delayedCall(250, () => {
      this.tweens.add({
        targets: this.player.sprite,
        x: this.player.sprite.x - 10,
        duration: 100,
        yoyo: true,
        repeat: 1
      });
    });
  }

  private updateHealthBars() {
    // Player health bar
    const playerHealthPercent = this.player.hp / this.player.maxHp;
    this.playerHealthFill.clear();
    this.playerHealthFill.fillStyle(0x44ff44, 1);
    this.playerHealthFill.fillRoundedRect(180, 400, 120 * playerHealthPercent, 12, 6);

    // Player mana bar
    const playerManaPercent = this.player.mp / this.player.maxMp;
    this.playerManaFill.clear();
    this.playerManaFill.fillStyle(0x4444ff, 1);
    this.playerManaFill.fillRoundedRect(180, 420, 120 * playerManaPercent, 12, 6);

    // Enemy health bar
    const enemyHealthPercent = this.enemy.hp / this.enemy.maxHp;
    this.enemyHealthFill.clear();
    this.enemyHealthFill.fillStyle(0xff4444, 1);
    this.enemyHealthFill.fillRoundedRect(500, 140, 120 * enemyHealthPercent, 12, 6);
  }

  private updateButtonHighlights() {
    if (!this.sceneInitialized) return;

    if (this.deps.menuSystem.getCurrentMenu() === 'main') {
      const selectedIndex = this.deps.menuSystem.getSelectedIndex();
      const items = this.deps.menuSystem.getMenuItems();

      // Reset all buttons
      Object.values(this.actionButtons).forEach(button => {
        this.drawButton(button, false);
        button.setScale(1.0);
      });

      Object.values(this.buttonTexts).forEach(text => {
        text.setScale(1.0);
      });

      // Highlight selected button
      if (items[selectedIndex]) {
        const selectedId = items[selectedIndex].id;
        if (this.actionButtons[selectedId]) {
          this.drawButton(this.actionButtons[selectedId], true);
          this.actionButtons[selectedId].setScale(1.05);
          this.buttonTexts[selectedId].setScale(1.05);
        }
      }
    }
  }

  private handleVictory() {
    this.currentState = GameState.VICTORY;
    this.showMessage("Victory! You have defeated the enemy!");
    
    // Victory animation
    this.tweens.add({
      targets: this.enemy.sprite,
      alpha: 0,
      scaleX: 0.5,
      scaleY: 0.5,
      duration: 1000,
      ease: 'Power2'
    });

    this.updateGameState();
  }

  private handleDefeat() {
    this.currentState = GameState.DEFEAT;
    this.showMessage("Defeat! You have been overcome...");
    
    // Defeat animation
    this.tweens.add({
      targets: this.player.sprite,
      alpha: 0.5,
      duration: 1000,
      ease: 'Power2'
    });

    this.updateGameState();
  }

  private nextLevel() {
    // Select new random enemy
    const enemies: EnemyType[] = ['RUNE_CONSTRUCT', 'STONE_GUARDIAN', 'SHADOW_WISP', 'SLIME', 'BAT', 'SKELETON'];
    this.currentEnemyType = enemies[Math.floor(Math.random() * enemies.length)];
    
    this.cameras.main.fadeOut(500, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      // Reset for new battle
      this.resetBattle();
      this.cameras.main.fadeIn(500, 0, 0, 0);
    });
  }

  private retry() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.resetBattle();
      this.cameras.main.fadeIn(500, 0, 0, 0);
    });
  }

  private resetBattle() {
    // Reset player
    this.player.hp = this.player.maxHp;
    this.player.mp = this.player.maxMp;
    this.player.sprite.setAlpha(1);
    this.player.sprite.setPosition(200, 320);

    // Create new enemy
    if (this.enemy && this.enemy.sprite) {
      this.enemy.sprite.destroy();
    }
    this.enemy = new Enemy(this, this.currentEnemyType);

    // Update enemy name
    this.enemyNameText.setText(this.enemy.name);
    this.enemyNameText.setPosition(this.enemy.sprite.x, this.enemy.sprite.y - 60);

    // Reset state
    this.currentState = GameState.PLAYER_TURN;
    this.isProcessingAction = false;

    // Update UI
    this.updateHealthBars();
    this.updateGameState();
    this.showMessage(this.getEnemyFlavorText());
  }

  private showMessage(text: string) {
    this.messageBox.setText(text);
  }

  private updateGameState() {
    if (!this.sceneInitialized) return;

    const playerStats = this.player.getStats();
    const enemyStats = this.enemy.getStats();

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

  private showErrorState() {
    const errorBg = this.add.graphics();
    errorBg.fillStyle(0x000000, 0.9);
    errorBg.fillRect(0, 0, 800, 600);

    const errorText = this.add.text(400, 300, 'Scene Error: Failed to initialize battle', {
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
      this.scene.restart();
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => this.time.delayedCall(ms, resolve));
  }

  // Public getters for external loading screen integration
  getLoadingProgress(): number {
    return 100;
  }

  getCurrentLoadingTask(): string {
    return 'Battle ready!';
  }

  getLoadingError(): string | null {
    return null;
  }

  isCurrentlyLoading(): boolean {
    return false;
  }

  destroy() {
    console.log('BattleScene cleanup started');

    // Clean up global references
    delete (window as any).gameControlEvent;

    console.log('BattleScene destroyed and cleaned up');
    super.destroy();
  }
}

// Export the factory function to match the pattern used in other scenes
export function createBattleScene(Phaser: any, dependencies: BattleSceneDependencies) {
  return class extends BattleScene {
    constructor() {
      super(dependencies);
    }
  };
}

// Also export the class directly for backward compatibility
export { BattleScene };