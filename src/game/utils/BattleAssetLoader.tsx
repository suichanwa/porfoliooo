import { LoadingManager } from './LoadingManager';
import { generateTextureFromReactComponent } from './textureGenerator';
import { Button } from '../assets/ui/Button';
import { HealthBar } from '../assets/ui/HealthBar';
import { ManaBar } from '../assets/ui/ManaBar';
import { Frame } from '../assets/ui/Frame';
import { Player } from '../assets/characters/Player';
import { RuneConstruct } from '../assets/characters/RuneConstruct';
import { StoneGuardian } from '../assets/characters/StoneGuardian';
import { ShadowWisp } from '../assets/characters/ShadowWisp';
import { TemplateRuins } from '../../assets/images/backgrounds/TemplateRuins';

export class BattleAssetLoader {
  private scene: Phaser.Scene;
  private loadingManager: LoadingManager;

  constructor(scene: Phaser.Scene, loadingManager: LoadingManager) {
    this.scene = scene;
    this.loadingManager = loadingManager;
  }

  async loadAllAssets() {
    try {
      console.log('BattleAssetLoader: Starting asset loading process');
      
      await this.loadBackgroundAssets();
      await this.loadUIAssets();
      await this.loadPlayerAssets();
      await this.loadEnemyAssets();
      await this.loadButtonAssets();
      await this.loadExternalAssets();
      
      this.loadingManager.completeTask('finalize');
      console.log('BattleAssetLoader: All assets loaded successfully');
    } catch (error) {
      console.error('BattleAssetLoader: Asset loading failed:', error);
      throw error;
    }
  }

  private async loadBackgroundAssets() {
    this.loadingManager.setCurrentTask('background');
    console.log('BattleAssetLoader: Loading background assets');
    
    try {
      await generateTextureFromReactComponent(
        TemplateRuins,
        { width: 800, height: 600, isBattleBackground: true },
        'battleBg',
        this.scene
      );
    } catch (error) {
      console.error('BattleAssetLoader: Failed to load background assets:', error);
      this.createFallbackBackground();
    }
    
    this.loadingManager.completeTask('background');
  }

  private async loadUIAssets() {
    this.loadingManager.setCurrentTask('ui');
    console.log('BattleAssetLoader: Loading UI assets');
    
    try {
      // Load health bars
      await generateTextureFromReactComponent(
        HealthBar,
        { width: 160, height: 24, isPlayerBar: true },
        'playerHealthBar',
        this.scene
      );

      await generateTextureFromReactComponent(
        HealthBar,
        { width: 160, height: 24, isPlayerBar: false },
        'enemyHealthBar',
        this.scene
      );

      // Create health fill textures (these will be scaled dynamically)
      this.createHealthFillTextures();

      // Load mana bars
      await generateTextureFromReactComponent(
        ManaBar,
        { width: 160, height: 16, isPlayerBar: true },
        'playerManaBar',
        this.scene
      );

      // Create mana fill texture
      this.createManaFillTexture();

      // Load frames
      await generateTextureFromReactComponent(
        Frame,
        { width: 100, height: 100, variant: 'default' },
        'frame',
        this.scene
      );

      // Create particle texture
      this.createParticleTexture();

    } catch (error) {
      console.warn('BattleAssetLoader: Failed to load some UI assets, creating fallbacks:', error);
      this.createUIFallbacks();
    }
    
    this.loadingManager.completeTask('ui');
  }

  private async loadPlayerAssets() {
    this.loadingManager.setCurrentTask('player');
    console.log('BattleAssetLoader: Loading player assets');
    
    try {
      // Load player states
      const playerStates = ['default', 'attack', 'cast', 'hit'];
      
      for (const state of playerStates) {
        await generateTextureFromReactComponent(
          Player,
          { width: 128, height: 128, variant: state },
          `player_${state}`,
          this.scene
        );
      }

      // Player portrait
      await generateTextureFromReactComponent(
        Player,
        { width: 64, height: 64, variant: 'portrait' },
        'portrait',
        this.scene
      );

    } catch (error) {
      console.warn('BattleAssetLoader: Failed to load player assets, creating fallbacks:', error);
      this.createPlayerFallbacks();
    }
    
    this.loadingManager.completeTask('player');
  }

  private async loadEnemyAssets() {
    this.loadingManager.setCurrentTask('enemies');
    console.log('BattleAssetLoader: Loading enemy assets');
    
    try {
      // Rune Construct
      await this.loadEnemyStates(RuneConstruct, 'runeConstruct');
      
      // Stone Guardian
      await this.loadEnemyStates(StoneGuardian, 'stoneGuardian');
      
      // Shadow Wisp
      await this.loadEnemyStates(ShadowWisp, 'shadowWisp');

    } catch (error) {
      console.warn('BattleAssetLoader: Failed to load enemy assets, creating fallbacks:', error);
      this.createEnemyFallbacks();
    }
    
    this.loadingManager.completeTask('enemies');
  }

  private async loadEnemyStates(EnemyComponent: any, prefix: string) {
    const states = ['default', 'attack', 'hit'];
    
    for (const state of states) {
      try {
        await generateTextureFromReactComponent(
          EnemyComponent,
          { width: 128, height: 128, variant: state },
          `${prefix}_${state}`,
          this.scene
        );
      } catch (error) {
        console.warn(`Failed to load ${prefix}_${state}, creating fallback`);
        this.createEnemyFallback(prefix, state);
      }
    }
  }

  private async loadButtonAssets() {
    this.loadingManager.setCurrentTask('buttons');
    console.log('BattleAssetLoader: Loading button assets');
    
    const buttonTypes = ['attack', 'magic', 'item', 'defend'];
    const buttonStates = ['normal', 'hover', 'pressed'];
    
    for (const type of buttonTypes) {
      for (const state of buttonStates) {
        try {
          await generateTextureFromReactComponent(
            Button,
            { 
              width: 100, 
              height: 40, 
              text: type.charAt(0).toUpperCase() + type.slice(1),
              variant: type === 'attack' ? 'danger' : 'secondary',
              state: state
            },
            `button_${type}_${state}`,
            this.scene
          );
        } catch (error) {
          console.warn(`Failed to load button ${type}_${state}, creating fallback`);
          this.createButtonFallback(`button_${type}_${state}`, type, state);
        }
      }
    }
    
    this.loadingManager.completeTask('buttons');
  }

  private async loadExternalAssets() {
    this.loadingManager.setCurrentTask('external');
    
    // Create fallback logo if external loading fails
    this.createFallbackLogo();
    
    // Try to load external logo
    this.scene.load.image('logo', 'https://i.imgur.com/Z1U1YTy.png');
    this.scene.load.start();
    
    return new Promise<void>((resolve) => {
      this.scene.load.once('complete', () => {
        this.loadingManager.completeTask('external');
        resolve();
      });
      
      setTimeout(() => {
        console.warn('External asset loading timed out, using fallbacks');
        this.loadingManager.completeTask('external');
        resolve();
      }, 5000);
    });
  }

  // Fallback creation methods
  private createFallbackBackground() {
    const graphics = this.scene.add.graphics();
    
    // Create a darker battle background
    graphics.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x2d2d3a, 0x3d3d5a, 1);
    graphics.fillRect(0, 0, 800, 600);
    
    // Add some atmospheric elements
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 600;
      const size = Math.random() * 2 + 1;
      graphics.fillStyle(0xffffff, Math.random() * 0.3 + 0.1);
      graphics.fillCircle(x, y, size);
    }
    
    graphics.generateTexture('battleBg', 800, 600);
    graphics.destroy();
  }

  private createUIFallbacks() {
    // Health bar fallbacks
    this.createHealthBarFallback('playerHealthBar', '#28a745');
    this.createHealthBarFallback('enemyHealthBar', '#dc3545');
    this.createHealthBarFallback('playerManaBar', '#007bff');
    
    // Health fill fallbacks
    this.createHealthFillTextures();
    this.createManaFillTexture();
    
    // Frame fallback
    this.createFrameFallback();
  }

  private createHealthBarFallback(key: string, color: string) {
    const graphics = this.scene.add.graphics();
    const colorHex = Phaser.Display.Color.HexStringToColor(color).color;
    
    graphics.fillStyle(0x333333);
    graphics.fillRoundedRect(0, 0, 160, 24, 4);
    graphics.fillStyle(colorHex);
    graphics.fillRoundedRect(2, 2, 156, 20, 4);
    
    graphics.generateTexture(key, 160, 24);
    graphics.destroy();
  }

  private createHealthFillTextures() {
    const graphics = this.scene.add.graphics();
    
    // Player health fill
    graphics.fillStyle(0x28a745);
    graphics.fillRoundedRect(0, 0, 156, 20, 3);
    graphics.generateTexture('playerHealthFill', 156, 20);
    
    // Enemy health fill
    graphics.clear();
    graphics.fillStyle(0xdc3545);
    graphics.fillRoundedRect(0, 0, 156, 20, 3);
    graphics.generateTexture('enemyHealthFill', 156, 20);
    
    graphics.destroy();
  }

  private createManaFillTexture() {
    const graphics = this.scene.add.graphics();
    
    // Create gradient for mana
    graphics.fillStyle(0x007bff);
    graphics.fillRoundedRect(0, 0, 156, 14, 2);
    graphics.generateTexture('playerManaFill', 156, 14);
    
    graphics.destroy();
  }

  private createFrameFallback() {
    const graphics = this.scene.add.graphics();
    
    graphics.lineStyle(3, 0x88ccff, 0.8);
    graphics.strokeRoundedRect(0, 0, 100, 100, 8);
    graphics.fillStyle(0x88ccff, 0.1);
    graphics.fillRoundedRect(0, 0, 100, 100, 8);
    
    graphics.generateTexture('frame', 100, 100);
    graphics.destroy();
  }

  private createPlayerFallbacks() {
    const states = ['default', 'attack', 'cast', 'hit'];
    const colors = [0x4a90e2, 0xe24a4a, 0x9a4ae2, 0xff6b6b];
    
    states.forEach((state, index) => {
      const graphics = this.scene.add.graphics();
      graphics.fillStyle(colors[index]);
      graphics.fillCircle(64, 64, 50);
      graphics.lineStyle(3, 0xffffff);
      graphics.strokeCircle(64, 64, 50);
      graphics.generateTexture(`player_${state}`, 128, 128);
      graphics.destroy();
    });

    // Portrait fallback
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x4a90e2);
    graphics.fillCircle(32, 32, 25);
    graphics.lineStyle(2, 0xffffff);
    graphics.strokeCircle(32, 32, 25);
    graphics.generateTexture('portrait', 64, 64);
    graphics.destroy();
  }

  private createEnemyFallbacks() {
    const enemies = [
      { prefix: 'runeConstruct', color: 0x88ccff },
      { prefix: 'stoneGuardian', color: 0x8b7355 },
      { prefix: 'shadowWisp', color: 0x8866ff }
    ];
    
    enemies.forEach(enemy => {
      this.createEnemyFallback(enemy.prefix, 'default', enemy.color);
      this.createEnemyFallback(enemy.prefix, 'attack', enemy.color);
      this.createEnemyFallback(enemy.prefix, 'hit', enemy.color);
    });
  }

  private createEnemyFallback(prefix: string, state: string, color: number = 0x666666) {
    const graphics = this.scene.add.graphics();
    
    // Different shapes for different states
    if (state === 'attack') {
      graphics.fillStyle(color);
      graphics.fillRect(32, 32, 64, 64);
      graphics.lineStyle(3, 0xffffff);
      graphics.strokeRect(32, 32, 64, 64);
    } else if (state === 'hit') {
      graphics.fillStyle(0xff6666);
      graphics.fillCircle(64, 64, 40);
      graphics.lineStyle(3, 0xffffff);
      graphics.strokeCircle(64, 64, 40);
    } else {
      graphics.fillStyle(color);
      graphics.fillCircle(64, 64, 45);
      graphics.lineStyle(3, 0xffffff);
      graphics.strokeCircle(64, 64, 45);
    }
    
    graphics.generateTexture(`${prefix}_${state}`, 128, 128);
    graphics.destroy();
  }

  private createButtonFallback(key: string, type: string, state: string) {
    const graphics = this.scene.add.graphics();
    
    let bgColor = 0x4a5568;
    let borderColor = 0x718096;
    
    if (type === 'attack') {
      bgColor = state === 'hover' ? 0xe53e3e : 0xc53030;
      borderColor = 0xfc8181;
    } else if (state === 'hover') {
      bgColor = 0x3182ce;
      borderColor = 0x63b3ed;
    } else if (state === 'pressed') {
      bgColor = 0x2c5282;
      borderColor = 0x4299e1;
    }
    
    graphics.fillStyle(bgColor);
    graphics.fillRoundedRect(0, 0, 100, 40, 6);
    graphics.lineStyle(2, borderColor);
    graphics.strokeRoundedRect(0, 0, 100, 40, 6);
    
    graphics.generateTexture(key, 100, 40);
    graphics.destroy();
  }

  private createParticleTexture() {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(4, 4, 2);
    graphics.generateTexture('particle', 8, 8);
    graphics.destroy();
  }

  private createFallbackLogo() {
    const graphics = this.scene.add.graphics();
    
    graphics.fillStyle(0x88ccff);
    graphics.fillCircle(64, 64, 30);
    graphics.lineStyle(3, 0xffffff);
    graphics.strokeCircle(64, 64, 30);
    
    // Add mystical symbol
    graphics.lineBetween(64 - 15, 64 - 15, 64 + 15, 64 + 15);
    graphics.lineBetween(64 - 15, 64 + 15, 64 + 15, 64 - 15);
    graphics.lineBetween(64, 64 - 20, 64, 64 + 20);
    graphics.lineBetween(64 - 20, 64, 64 + 20, 64);
    
    graphics.generateTexture('logo', 128, 128);
    graphics.destroy();
  }
}