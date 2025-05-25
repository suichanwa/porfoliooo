import { generateTextureFromReactComponent } from './textureGenerator';
import { LoadingManager } from './LoadingManager';

// Import components - adjust paths as needed
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

export class AssetLoader {
  private scene: Phaser.Scene;
  private loadingManager: LoadingManager;

  constructor(scene: Phaser.Scene, loadingManager: LoadingManager) {
    this.scene = scene;
    this.loadingManager = loadingManager;
  }

  async loadAllAssets() {
    try {
      console.log('AssetLoader: Starting asset loading process');
      
      await this.loadBackgroundAssets();
      await this.loadUIAssets();
      await this.loadCharacterAssets();
      await this.loadButtonAssets();
      await this.loadExternalAssets();
      
      this.loadingManager.completeTask('finalize');
      console.log('AssetLoader: All assets loaded successfully');
    } catch (error) {
      console.error('AssetLoader: Asset loading failed:', error);
      throw error;
    }
  }

  private async loadBackgroundAssets() {
    this.loadingManager.setCurrentTask('background');
    console.log('AssetLoader: Loading background assets');
    
    try {
      await generateTextureFromReactComponent(
        TemplateRuins,
        { width: 800, height: 600, isMenuBackground: false },
        'battleBg',
        this.scene
      );
      console.log('AssetLoader: Background assets loaded');
    } catch (error) {
      console.error('AssetLoader: Failed to load background assets:', error);
      // Create a fallback background
      this.createFallbackBackground();
    }
    
    this.loadingManager.completeTask('background');
  }

  private async loadUIAssets() {
    this.loadingManager.setCurrentTask('ui');
    console.log('AssetLoader: Loading UI assets');
    
    const uiAssets = [
      { component: HealthBar, props: { width: 160, height: 24, isPlayerBar: true }, key: 'playerHealthBar' },
      { component: HealthBar, props: { width: 160, height: 24, isPlayerBar: false }, key: 'enemyHealthBar' },
      { component: HealthBarFill, props: { width: 160, height: 24, fillPercentage: 1, isPlayerBar: true }, key: 'playerHealthFill' },
      { component: HealthBarFill, props: { width: 160, height: 24, fillPercentage: 1, isPlayerBar: false }, key: 'enemyHealthFill' },
      { component: ManaBar, props: { width: 160, height: 16, isPlayerBar: true }, key: 'playerManaBar' },
      { component: ManaBarFill, props: { width: 160, height: 16, fillPercentage: 1, isPlayerBar: true }, key: 'playerManaFill' }
    ];

    for (const asset of uiAssets) {
      try {
        await generateTextureFromReactComponent(
          asset.component,
          asset.props,
          asset.key,
          this.scene
        );
      } catch (error) {
        console.warn(`AssetLoader: Failed to load UI asset ${asset.key}, creating fallback:`, error);
        this.createFallbackUIAsset(asset.key, asset.props.width, asset.props.height);
      }
    }
    
    console.log('AssetLoader: UI assets loaded');
    this.loadingManager.completeTask('ui');
  }

  private async loadCharacterAssets() {
    // Load player assets
    this.loadingManager.setCurrentTask('player');
    console.log('AssetLoader: Loading player assets');
    
    const playerVariants = ['default', 'attack', 'hit', 'cast'];
    for (const variant of playerVariants) {
      try {
        await generateTextureFromReactComponent(
          PlayerComponent,
          { width: 128, height: 128, variant },
          `player_${variant}`,
          this.scene
        );
      } catch (error) {
        console.warn(`AssetLoader: Failed to load player ${variant}, creating fallback:`, error);
        this.createFallbackPlayerSprite(`player_${variant}`, variant);
      }
    }
    
    this.loadingManager.completeTask('player');
    
    // Load enemy assets
    this.loadingManager.setCurrentTask('enemies');
    console.log('AssetLoader: Loading enemy assets');
    
    const enemyTypes = [
      { component: RuneConstruct, prefix: 'runeConstruct' },
      { component: ShadowWisp, prefix: 'shadowWisp' },
      { component: StoneGuardian, prefix: 'stoneGuardian' }
    ];
    
    const enemyVariants = ['default', 'attack', 'hit'];
    
    for (const enemy of enemyTypes) {
      for (const variant of enemyVariants) {
        try {
          await generateTextureFromReactComponent(
            enemy.component,
            { width: 128, height: 128, variant },
            `${enemy.prefix}_${variant}`,
            this.scene
          );
        } catch (error) {
          console.warn(`AssetLoader: Failed to load ${enemy.prefix} ${variant}, creating fallback:`, error);
          this.createFallbackEnemySprite(`${enemy.prefix}_${variant}`, enemy.prefix, variant);
        }
      }
    }
    
    console.log('AssetLoader: Enemy assets loaded');
    this.loadingManager.completeTask('enemies');
  }

  private async loadButtonAssets() {
    this.loadingManager.setCurrentTask('buttons');
    console.log('AssetLoader: Loading button assets');
    
    const buttonVariants = ['attack', 'magic', 'item', 'defend'];
    const buttonStates = ['normal', 'hover', 'pressed', 'disabled'];
    
    for (const variant of buttonVariants) {
      for (const state of buttonStates) {
        try {
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
            this.scene
          );
        } catch (error) {
          console.warn(`AssetLoader: Failed to load button ${variant}_${state}, creating fallback:`, error);
          this.createFallbackButton(`button_${variant}_${state}`, variant, state);
        }
      }
    }
    
    console.log('AssetLoader: Button assets loaded');
    this.loadingManager.completeTask('buttons');
  }

  private async loadExternalAssets() {
    this.loadingManager.setCurrentTask('external');
    console.log('AssetLoader: Loading external assets');
    
    const externalAssets = [
      { key: 'menuBg', url: 'https://i.imgur.com/VnxLq8Y.png' },
      { key: 'frame', url: 'https://i.imgur.com/g3pwvAs.png' },
      { key: 'cursor', url: 'https://i.imgur.com/dHhW3AN.png' },
      { key: 'portrait', url: 'https://i.imgur.com/Z1U1YTy.png' }
    ];
    
    // Create fallback textures first
    externalAssets.forEach(asset => {
      this.createFallbackExternalAsset(asset.key);
    });
    
    // Try to load external assets
    externalAssets.forEach(asset => {
      this.scene.load.image(asset.key, asset.url);
    });
    
    this.scene.load.start();
    
    return new Promise<void>((resolve) => {
      this.scene.load.once('complete', () => {
        console.log('AssetLoader: External assets loaded');
        this.loadingManager.completeTask('external');
        resolve();
      });
      
      // Add timeout fallback
      setTimeout(() => {
        console.warn('AssetLoader: External asset loading timed out, using fallbacks');
        this.loadingManager.completeTask('external');
        resolve();
      }, 10000); // 10 second timeout
    });
  }

  // Fallback asset creation methods
  private createFallbackBackground() {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x2a2a4a);
    graphics.fillRect(0, 0, 800, 600);
    
    // Add some mystical atmosphere
    graphics.fillStyle(0x4a4a6a, 0.3);
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 600;
      const size = Math.random() * 3 + 1;
      graphics.fillCircle(x, y, size);
    }
    
    graphics.generateTexture('battleBg', 800, 600);
    graphics.destroy();
  }

  private createFallbackUIAsset(key: string, width: number, height: number) {
    const graphics = this.scene.add.graphics();
    
    if (key.includes('Health')) {
      graphics.fillStyle(key.includes('Fill') ? 0xff3333 : 0x444444);
    } else if (key.includes('Mana')) {
      graphics.fillStyle(key.includes('Fill') ? 0x3333ff : 0x444444);
    } else {
      graphics.fillStyle(0x666666);
    }
    
    graphics.fillRoundedRect(0, 0, width, height, 4);
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }

  private createFallbackPlayerSprite(key: string, variant: string) {
    const graphics = this.scene.add.graphics();
    
    // Base color
    const baseColor = variant === 'attack' ? 0xffaa00 : 
                     variant === 'hit' ? 0xff6666 : 
                     variant === 'cast' ? 0x6666ff : 0x66aa66;
    
    graphics.fillStyle(baseColor);
    graphics.fillCircle(64, 64, 40);
    
    // Add simple features
    graphics.fillStyle(0x333333);
    graphics.fillCircle(54, 54, 4); // Left eye
    graphics.fillCircle(74, 54, 4); // Right eye
    
    graphics.generateTexture(key, 128, 128);
    graphics.destroy();
  }

  private createFallbackEnemySprite(key: string, prefix: string, variant: string) {
    const graphics = this.scene.add.graphics();
    
    // Different colors for different enemies
    let baseColor = 0x666666;
    if (prefix.includes('rune')) baseColor = 0x888888;
    if (prefix.includes('shadow')) baseColor = 0x333333;
    if (prefix.includes('stone')) baseColor = 0x999999;
    
    if (variant === 'attack') baseColor = (baseColor & 0xfefefe) >> 1 | 0xff0000;
    if (variant === 'hit') baseColor = 0xff6666;
    
    graphics.fillStyle(baseColor);
    graphics.fillRect(24, 24, 80, 80);
    
    // Add simple menacing features
    graphics.fillStyle(0xff0000);
    graphics.fillCircle(44, 44, 6); // Left eye
    graphics.fillCircle(84, 44, 6); // Right eye
    
    graphics.generateTexture(key, 128, 128);
    graphics.destroy();
  }

  private createFallbackButton(key: string, variant: string, state: string) {
    const graphics = this.scene.add.graphics();
    
    // Button colors based on variant and state
    let color = 0x666666;
    if (variant === 'attack') color = 0x992222;
    if (variant === 'magic') color = 0x222299;
    if (variant === 'item') color = 0x229922;
    if (variant === 'defend') color = 0x999922;
    
    if (state === 'hover') color = (color & 0xfefefe) >> 1 | 0x808080;
    if (state === 'pressed') color = (color & 0xfcfcfc) >> 2;
    if (state === 'disabled') color = 0x444444;
    
    graphics.fillStyle(color);
    graphics.fillRoundedRect(0, 0, 120, 40, 8);
    
    // Border
    graphics.lineStyle(2, 0xffffff, 0.5);
    graphics.strokeRoundedRect(0, 0, 120, 40, 8);
    
    graphics.generateTexture(key, 120, 40);
    graphics.destroy();
  }

  private createFallbackExternalAsset(key: string) {
    const graphics = this.scene.add.graphics();
    
    if (key === 'frame') {
      graphics.lineStyle(4, 0x888888);
      graphics.strokeRect(0, 0, 100, 100);
      graphics.generateTexture(key, 100, 100);
    } else if (key === 'cursor') {
      graphics.fillStyle(0xffffff);
      graphics.fillTriangle(0, 0, 0, 20, 12, 12);
      graphics.generateTexture(key, 16, 16);
    } else if (key === 'portrait') {
      graphics.fillStyle(0x666666);
      graphics.fillCircle(32, 32, 30);
      graphics.generateTexture(key, 64, 64);
    } else {
      // Generic fallback
      graphics.fillStyle(0x333333);
      graphics.fillRect(0, 0, 64, 64);
      graphics.generateTexture(key, 64, 64);
    }
    
    graphics.destroy();
  }

  // Utility methods
  isTextureLoaded(key: string): boolean {
    return this.scene.textures.exists(key);
  }

  getLoadedTextures(): string[] {
    return Object.keys(this.scene.textures.list);
  }

  getFailedAssets(): string[] {
    // This could be expanded to track failed assets
    return [];
  }
}