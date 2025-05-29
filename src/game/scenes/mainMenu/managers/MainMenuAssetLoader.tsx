import { LoadingManager } from '../../../utils/LoadingManager';
import { generateTextureFromReactComponent } from '../../../utils/textureGenerator';
import { Button } from '../../../assets/ui/Button';
import { TemplateRuins } from '../../../../assets/images/backgrounds/TemplateRuins';
import { MENU_CONFIG } from '../config/MenuConfig';

export class MainMenuAssetLoader {
  private scene: Phaser.Scene;
  private loadingManager: LoadingManager;

  constructor(scene: Phaser.Scene, loadingManager: LoadingManager) {
    this.scene = scene;
    this.loadingManager = loadingManager;
  }

  async loadAllAssets() {
    try {
      console.log('MainMenuAssetLoader: Starting asset loading process');
      
      await this.loadBackgroundAssets();
      await this.loadButtonAssets();
      await this.loadUIAssets();
      await this.loadExternalAssets();
      
      this.loadingManager.completeTask('finalize');
      console.log('MainMenuAssetLoader: All assets loaded successfully');
    } catch (error) {
      console.error('MainMenuAssetLoader: Asset loading failed:', error);
      throw error;
    }
  }

  private async loadBackgroundAssets() {
    this.loadingManager.setCurrentTask('background');
    console.log('MainMenuAssetLoader: Loading background assets');
    
    try {
      await generateTextureFromReactComponent(
        TemplateRuins,
        { width: 800, height: 600, isMenuBackground: true },
        'menuBg',
        this.scene
      );
    } catch (error) {
      console.error('MainMenuAssetLoader: Failed to load background assets:', error);
      this.createFallbackBackground();
    }
    
    this.loadingManager.completeTask('background');
  }

  private async loadButtonAssets() {
    this.loadingManager.setCurrentTask('buttons');
    
    // Load cycle button
    await this.loadCycleButton();
    
    // Load menu buttons
    for (const item of MENU_CONFIG.BUTTONS) {
      await this.loadMenuButton(item);
    }
    
    this.loadingManager.completeTask('buttons');
  }

  private async loadCycleButton() {
    try {
      await generateTextureFromReactComponent(
        Button,
        { width: 220, height: 50, text: "Difficulty", variant: "danger", state: 'normal' },
        'button_cycle_normal',
        this.scene
      );
      
      await generateTextureFromReactComponent(
        Button,
        { width: 220, height: 50, text: "Difficulty", variant: "danger", state: 'hover' },
        'button_cycle_hover',
        this.scene
      );
    } catch (error) {
      console.warn('Failed to load cycle buttons, creating fallbacks:', error);
      this.createFallbackButton('button_cycle_normal', 'cycle', 'normal');
      this.createFallbackButton('button_cycle_hover', 'cycle', 'hover');
    }
  }

  private async loadMenuButton(item: any) {
    try {
      await generateTextureFromReactComponent(
        Button,
        { width: 220, height: 50, text: item.text, variant: item.variant, state: 'normal' },
        `button_${item.id}_normal`,
        this.scene
      );
      
      await generateTextureFromReactComponent(
        Button,
        { width: 220, height: 50, text: item.text, variant: item.variant, state: 'hover' },
        `button_${item.id}_hover`,
        this.scene
      );
    } catch (error) {
      console.warn(`Failed to load button ${item.id}, creating fallbacks:`, error);
      this.createFallbackButton(`button_${item.id}_normal`, item.id, 'normal');
      this.createFallbackButton(`button_${item.id}_hover`, item.id, 'hover');
    }
  }

  private async loadUIAssets() {
    this.loadingManager.setCurrentTask('ui');
    
    try {
      const particleGraphic = this.scene.make.graphics({ x: 0, y: 0 });
      particleGraphic.fillStyle(0xffffff);
      particleGraphic.fillCircle(8, 8, 2);
      particleGraphic.generateTexture('particle', 16, 16);
      particleGraphic.destroy();
    } catch (error) {
      console.warn('Failed to create particle texture:', error);
      this.createFallbackParticle();
    }
    
    this.loadingManager.completeTask('ui');
  }

  private async loadExternalAssets() {
    this.loadingManager.setCurrentTask('external');
    
    this.createFallbackLogo();
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
    graphics.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a3a, 0x2a2a5a, 1);
    graphics.fillRect(0, 0, 800, 600);
    
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 600;
      const size = Math.random() * 2 + 1;
      graphics.fillStyle(0xffffff, Math.random() * 0.8 + 0.2);
      graphics.fillCircle(x, y, size);
    }
    
    graphics.generateTexture('menuBg', 800, 600);
    graphics.destroy();
  }

  private createFallbackButton(key: string, variant: string, state: string) {
    const graphics = this.scene.add.graphics();
    
    let bgColor = 0x4a5568;
    let borderColor = 0x718096;
    
    if (variant === 'primary') {
      bgColor = state === 'hover' ? 0x3182ce : 0x2b6cb0;
      borderColor = 0x63b3ed;
    } else if (variant === 'danger') {
      bgColor = state === 'hover' ? 0xe53e3e : 0xc53030;
      borderColor = 0xfc8181;
    }
    
    graphics.fillStyle(bgColor);
    graphics.fillRoundedRect(0, 0, 220, 50, 8);
    graphics.lineStyle(2, borderColor);
    graphics.strokeRoundedRect(0, 0, 220, 50, 8);
    graphics.generateTexture(key, 220, 50);
    graphics.destroy();
  }

  private createFallbackParticle() {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(8, 8, 2);
    graphics.generateTexture('particle', 16, 16);
    graphics.destroy();
  }

  private createFallbackLogo() {
    const graphics = this.scene.add.graphics();
    graphics.fillStyle(0x88ccff);
    graphics.fillCircle(64, 64, 30);
    graphics.lineStyle(3, 0xffffff);
    graphics.strokeCircle(64, 64, 30);
    graphics.lineBetween(64 - 15, 64 - 15, 64 + 15, 64 + 15);
    graphics.lineBetween(64 - 15, 64 + 15, 64 + 15, 64 - 15);
    graphics.lineBetween(64, 64 - 20, 64, 64 + 20);
    graphics.lineBetween(64 - 20, 64, 64 + 20, 64);
    graphics.generateTexture('logo', 128, 128);
    graphics.destroy();
  }
}