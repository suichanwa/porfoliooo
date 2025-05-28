import { Button } from "../assets/ui/Button";
import { generateTextureFromReactComponent } from "../utils/textureGenerator";
import { TemplateRuins } from "../../assets/images/backgrounds/TemplateRuins";
import { LoadingManager } from "../utils/LoadingManager";
import { AssetLoader } from "../utils/AssetLoader";

// Custom Asset Loader for Main Menu
class MainMenuAssetLoader {
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
      console.log('MainMenuAssetLoader: Background assets loaded');
    } catch (error) {
      console.error('MainMenuAssetLoader: Failed to load background assets:', error);
      this.createFallbackBackground();
    }
    
    this.loadingManager.completeTask('background');
  }

  private async loadButtonAssets() {
    this.loadingManager.setCurrentTask('buttons');
    console.log('MainMenuAssetLoader: Loading button assets');
    
    const menuItems = [
      { id: 'start', text: 'Start Game', variant: 'primary' },
      { id: 'settings', text: 'Settings', variant: 'secondary' },
      { id: 'credits', text: 'Credits', variant: 'secondary' }
    ];

    // Load cycle button first
    try {
      await generateTextureFromReactComponent(
        Button,
        { 
          width: 220, 
          height: 50, 
          text: "Difficulty", 
          variant: "danger", 
          state: 'normal' 
        },
        `button_cycle_normal`,
        this.scene
      );

      await generateTextureFromReactComponent(
        Button,
        { 
          width: 220, 
          height: 50, 
          text: "Difficulty", 
          variant: "danger", 
          state: 'hover' 
        },
        `button_cycle_hover`,
        this.scene
      );
    } catch (error) {
      console.warn('MainMenuAssetLoader: Failed to load cycle buttons, creating fallbacks:', error);
      this.createFallbackButton('button_cycle_normal', 'cycle', 'normal');
      this.createFallbackButton('button_cycle_hover', 'cycle', 'hover');
    }

    // Load menu buttons
    for (const item of menuItems) {
      try {
        // Normal state
        await generateTextureFromReactComponent(
          Button,
          { 
            width: 220, 
            height: 50, 
            text: item.text, 
            variant: item.variant as any, 
            state: 'normal' 
          },
          `button_${item.id}_normal`,
          this.scene
        );
        
        // Hover state
        await generateTextureFromReactComponent(
          Button,
          { 
            width: 220, 
            height: 50, 
            text: item.text, 
            variant: item.variant as any, 
            state: 'hover' 
          },
          `button_${item.id}_hover`,
          this.scene
        );
      } catch (error) {
        console.warn(`MainMenuAssetLoader: Failed to load button ${item.id}, creating fallbacks:`, error);
        this.createFallbackButton(`button_${item.id}_normal`, item.id, 'normal');
        this.createFallbackButton(`button_${item.id}_hover`, item.id, 'hover');
      }
    }
    
    console.log('MainMenuAssetLoader: Button assets loaded');
    this.loadingManager.completeTask('buttons');
  }

  private async loadUIAssets() {
    this.loadingManager.setCurrentTask('ui');
    console.log('MainMenuAssetLoader: Loading UI assets');
    
    // Create particle texture
    try {
      const particleGraphic = this.scene.make.graphics({ x: 0, y: 0 });
      particleGraphic.fillStyle(0xffffff);
      particleGraphic.fillCircle(8, 8, 2);
      particleGraphic.generateTexture('particle', 16, 16);
      particleGraphic.destroy();
    } catch (error) {
      console.warn('MainMenuAssetLoader: Failed to create particle texture:', error);
      this.createFallbackParticle();
    }
    
    console.log('MainMenuAssetLoader: UI assets loaded');
    this.loadingManager.completeTask('ui');
  }

  private async loadExternalAssets() {
    this.loadingManager.setCurrentTask('external');
    console.log('MainMenuAssetLoader: Loading external assets');
    
    // Create fallback logo first
    this.createFallbackLogo();
    
    // Try to load external logo
    this.scene.load.image('logo', 'https://i.imgur.com/Z1U1YTy.png');
    this.scene.load.start();
    
    return new Promise<void>((resolve) => {
      this.scene.load.once('complete', () => {
        console.log('MainMenuAssetLoader: External assets loaded');
        this.loadingManager.completeTask('external');
        resolve();
      });
      
      // Add timeout fallback
      setTimeout(() => {
        console.warn('MainMenuAssetLoader: External asset loading timed out, using fallbacks');
        this.loadingManager.completeTask('external');
        resolve();
      }, 5000); // 5 second timeout
    });
  }

  // Fallback asset creation methods
  private createFallbackBackground() {
    const graphics = this.scene.add.graphics();
    
    // Create mystical gradient background
    graphics.fillGradientStyle(0x1a1a3a, 0x1a1a3a, 0x2a2a5a, 0x2a2a5a, 1);
    graphics.fillRect(0, 0, 800, 600);
    
    // Add some mystical atmosphere
    graphics.fillStyle(0x4a4a8a, 0.3);
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * 800;
      const y = Math.random() * 600;
      const size = Math.random() * 2 + 0.5;
      graphics.fillCircle(x, y, size);
    }
    
    // Add mystical ruins silhouettes
    graphics.fillStyle(0x0a0a2a, 0.6);
    graphics.fillRect(50, 400, 100, 200);
    graphics.fillRect(650, 350, 120, 250);
    graphics.fillTriangle(100, 400, 50, 400, 75, 350);
    graphics.fillTriangle(710, 350, 650, 350, 680, 300);
    
    graphics.generateTexture('menuBg', 800, 600);
    graphics.destroy();
  }

  private createFallbackButton(key: string, variant: string, state: string) {
    const graphics = this.scene.add.graphics();
    
    // Button colors based on variant and state
    let color = 0x666666;
    let textColor = '#ffffff';
    
    if (variant === 'start' || variant === 'primary') {
      color = 0x4a9eff;
      textColor = '#ffffff';
    } else if (variant === 'settings' || variant === 'secondary') {
      color = 0x6c757d;
      textColor = '#ffffff';
    } else if (variant === 'credits') {
      color = 0x6c757d;
      textColor = '#ffffff';
    } else if (variant === 'cycle' || variant === 'danger') {
      color = 0xdc3545;
      textColor = '#ffffff';
    }
    
    if (state === 'hover') {
      color = (color & 0xfefefe) >> 1 | 0x808080;
    }
    
    // Draw button background
    graphics.fillStyle(color);
    graphics.fillRoundedRect(0, 0, 220, 50, 8);
    
    // Border
    graphics.lineStyle(2, 0xffffff, 0.3);
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
    
    // Create a simple mystical logo
    graphics.fillStyle(0x88ccff);
    graphics.fillCircle(32, 32, 30);
    
    graphics.fillStyle(0x4a9eff);
    graphics.fillCircle(32, 32, 20);
    
    graphics.fillStyle(0x2a6eff);
    graphics.fillCircle(32, 32, 10);
    
    graphics.generateTexture('logo', 64, 64);
    graphics.destroy();
  }
}

// Instead of direct extension, we'll create a factory function that accepts the Phaser instance
export function createMainMenuScene(Phaser: any) {
  return class MainMenuScene extends Phaser.Scene {
    private gameTitle!: Phaser.GameObjects.Text;
    private menuButtons: Phaser.GameObjects.Image[] = [];
    private selectedButtonIndex = 0;
    private buttonCount = 3;
    private animating = false;
    
    // Add properties for cycling button
    private cycleOptions: string[] = ['Normal', 'Hard', 'Insane'];
    private currentCycleIndex = 0;
    private cycleText!: Phaser.GameObjects.Text;
    private cycleButton!: Phaser.GameObjects.Container;
    
    // Loading management
    private loadingManager: LoadingManager;
    private assetLoader: MainMenuAssetLoader;
    private isLoading: boolean = true;
    private loadingError: string | null = null;
    
    constructor() {
      super({ key: 'MainMenuScene' });
      this.loadingManager = new LoadingManager();
      this.assetLoader = new MainMenuAssetLoader(this, this.loadingManager);
      
      // Setup loading progress tracking
      this.setupLoadingTracking();
    }

    private setupLoadingTracking() {
      // Listen for loading progress updates
      this.loadingManager.onProgress((progress, currentTask) => {
        // Emit progress for external loading screen
        this.events.emit('loading-progress', { progress, currentTask });
        console.log(`MainMenu Loading: ${progress.toFixed(1)}% - ${currentTask}`);
      });
    }

    init() {
      // Setup loading tasks
      const tasks = LoadingManager.createMainMenuTasks();
      tasks.forEach(task => this.loadingManager.addTask(task));
    }
    
    async preload() {
      console.log('MainMenuScene preload started');
      
      try {
        this.isLoading = true;
        this.loadingError = null;
        
        // Emit loading start event for external loading screen
        this.events.emit('loading-start');
        
        // Load all assets using the modular loader
        await this.assetLoader.loadAllAssets();
        
        console.log('MainMenu: All assets loaded successfully');
        this.isLoading = false;
        
        // Emit loading complete
        this.events.emit('loading-complete');
        
      } catch (error) {
        console.error('Error loading main menu assets:', error);
        this.loadingError = error instanceof Error ? error.message : 'Unknown loading error';
        this.isLoading = false;
        
        // Emit loading error
        this.events.emit('loading-error', { error: this.loadingError });
      }
    }
    
    create() {
      console.log('MainMenuScene create started');
      
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
        console.log('MainMenuScene created successfully');
      } catch (error) {
        console.error('Error creating main menu scene:', error);
        this.showErrorState();
      }
    }

    private setupScene() {
      // Add background with parallax effect
      const bg = this.add.image(400, 300, 'menuBg');
      bg.setDepth(0);
      
      // Create a subtle fog overlay
      const fog = this.add.graphics();
      fog.fillStyle(0xaaccff, 0.05);
      fog.fillRect(0, 0, 800, 600);
      fog.setDepth(1);
      
      // Create animated particles for mystical atmosphere
      this.createParticles();
      
      // Add game logo/title
      if (this.textures.exists('logo')) {
        const logo = this.add.image(400, 120, 'logo').setScale(1.5); // Moved up slightly
        logo.setDepth(10);
      }
      
      // Add title text with glow
      this.gameTitle = this.add.text(400, 200, 'Mystic Ruins', { // Moved up
        fontFamily: 'serif',
        fontSize: '48px',
        color: '#ffffff',
        stroke: '#2a2a4a',
        strokeThickness: 6,
        align: 'center'
      }).setOrigin(0.5);
      this.gameTitle.setDepth(10);
      
      // Add subtitle
      const subtitle = this.add.text(400, 250, 'Lost Civilization', { // Moved up
        fontFamily: 'serif',
        fontSize: '24px',
        color: '#aaccff',
        align: 'center'
      }).setOrigin(0.5);
      subtitle.setDepth(10);
      
      // Add menu buttons (adjusted positions)
      this.addMenuButtons();
      
      // Add the cycling button with more space
      this.addCycleButton();
      
      // Add decorative runes around the border
      this.addDecorativeBorder();
      
      // Add version number
      this.add.text(10, 580, 'v0.1.1', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        align: 'left'
      }).setAlpha(0.6);
      
      // Add copyright
      this.add.text(790, 580, '© 2024', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        align: 'right'
      }).setOrigin(1, 0).setAlpha(0.6);
      
      // Setup input
      this.setupInput();
      
      // Initial button highlight
      this.selectButton(0);
      
      // Add fade-in effect
      this.cameras.main.fadeIn(1000, 0, 0, 0);
    }
    
    addMenuButtons() {
      const buttonData = [
        { id: 'start', y: 320, callback: this.startGame.bind(this) },    // Moved up
        { id: 'settings', y: 380, callback: this.openSettings.bind(this) }, // Moved up
        { id: 'credits', y: 440, callback: this.showCredits.bind(this) }     // Moved up
      ];
      
      buttonData.forEach((button, index) => {
        const textureKey = `button_${button.id}_normal`;
        
        // Check if texture exists, use fallback if not
        if (!this.textures.exists(textureKey)) {
          console.warn(`Texture ${textureKey} not found, creating fallback`);
          this.createButtonFallback(button.id);
        }
        
        const buttonImage = this.add.image(400, button.y, textureKey);
        buttonImage.setDepth(10);
        buttonImage.setInteractive();
        
        // Add hover effect
        buttonImage.on('pointerover', () => {
          this.selectButton(index);
        });
        
        // Add click effect
        buttonImage.on('pointerup', () => {
          button.callback();
        });
        
        this.menuButtons.push(buttonImage);
      });
    }

    private createButtonFallback(buttonId: string) {
      const graphics = this.add.graphics();
      
      // Different colors for different buttons
      let color = 0x666666;
      if (buttonId === 'start') color = 0x4a9eff;
      else if (buttonId === 'settings') color = 0x6c757d;
      else if (buttonId === 'credits') color = 0x6c757d;
      
      graphics.fillStyle(color);
      graphics.fillRoundedRect(0, 0, 220, 50, 8);
      graphics.lineStyle(2, 0xffffff, 0.3);
      graphics.strokeRoundedRect(0, 0, 220, 50, 8);
      graphics.generateTexture(`button_${buttonId}_normal`, 220, 50);
      
      // Hover version
      graphics.clear();
      graphics.fillStyle((color & 0xfefefe) >> 1 | 0x808080);
      graphics.fillRoundedRect(0, 0, 220, 50, 8);
      graphics.lineStyle(2, 0xffffff, 0.5);
      graphics.strokeRoundedRect(0, 0, 220, 50, 8);
      graphics.generateTexture(`button_${buttonId}_hover`, 220, 50);
      
      graphics.destroy();
    }
    
    // Add the cycling difficulty button
    addCycleButton() {
      // Create a container for the button and text
      this.cycleButton = this.add.container(400, 540);
      this.cycleButton.setDepth(10);
      
      // Check if cycle button texture exists
      const cycleTextureKey = 'button_cycle_normal';
      if (!this.textures.exists(cycleTextureKey)) {
        console.warn(`Texture ${cycleTextureKey} not found, creating fallback`);
        this.createDifficultyButtonFallback();
      }
      
      // Create a wider background for better spacing
      const buttonBg = this.add.graphics();
      buttonBg.fillStyle(0x2a2a4a, 0.9);
      buttonBg.fillRoundedRect(-140, -25, 280, 50, 8);
      buttonBg.lineStyle(2, 0x88ccff, 0.5);
      buttonBg.strokeRoundedRect(-140, -25, 280, 50, 8);
      buttonBg.setInteractive(new Phaser.Geom.Rectangle(-140, -25, 280, 50), Phaser.Geom.Rectangle.Contains);
      
      // Add the label text on the left
      const labelText = this.add.text(-120, 0, "Difficulty:", {
        fontFamily: 'serif',
        fontSize: '16px',
        color: '#ffffff',
        fontWeight: 'bold'
      }).setOrigin(0, 0.5);
      
      // Add separator
      const separator = this.add.text(-20, 0, "►", {
        fontFamily: 'serif',
        fontSize: '14px',
        color: '#88ccff',
      }).setOrigin(0.5, 0.5);
      
      // Add the cycling text on the right with better positioning
      this.cycleText = this.add.text(40, 0, this.cycleOptions[this.currentCycleIndex], {
        fontFamily: 'serif',
        fontSize: '18px',
        color: '#ffcc00',
        fontStyle: 'bold',
        stroke: '#2a2a4a',
        strokeThickness: 2
      }).setOrigin(0.5, 0.5);
      
      // Add difficulty color indicator
      const difficultyColors = {
        'Normal': '#28a745',  // Green
        'Hard': '#ffc107',    // Yellow
        'Insane': '#dc3545'   // Red
      };
      
      const difficultyIndicator = this.add.graphics();
      const currentDifficulty = this.cycleOptions[this.currentCycleIndex];
      difficultyIndicator.fillStyle(Phaser.Display.Color.HexStringToColor(difficultyColors[currentDifficulty]).color);
      difficultyIndicator.fillCircle(100, 0, 8);
      difficultyIndicator.lineStyle(2, 0xffffff, 0.8);
      difficultyIndicator.strokeCircle(100, 0, 8);
      
      // Store reference for updates
      this.cycleButton.setData('difficultyIndicator', difficultyIndicator);
      
      // Make button interactive with improved hover effects
      buttonBg.on('pointerover', () => {
        // Hover effect - lighten background
        buttonBg.clear();
        buttonBg.fillStyle(0x3a3a5a, 0.9);
        buttonBg.fillRoundedRect(-140, -25, 280, 50, 8);
        buttonBg.lineStyle(2, 0x99ddff, 0.8);
        buttonBg.strokeRoundedRect(-140, -25, 280, 50, 8);
        
        // Scale effect
        this.tweens.add({
          targets: [labelText, separator, this.cycleText, difficultyIndicator],
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 150,
          ease: 'Power2'
        });
      });
      
      buttonBg.on('pointerout', () => {
        // Reset background
        buttonBg.clear();
        buttonBg.fillStyle(0x2a2a4a, 0.9);
        buttonBg.fillRoundedRect(-140, -25, 280, 50, 8);
        buttonBg.lineStyle(2, 0x88ccff, 0.5);
        buttonBg.strokeRoundedRect(-140, -25, 280, 50, 8);
        
        // Reset scale
        this.tweens.add({
          targets: [labelText, separator, this.cycleText, difficultyIndicator],
          scaleX: 1,
          scaleY: 1,
          duration: 150,
          ease: 'Power2'
        });
      });
      
      buttonBg.on('pointerdown', () => {
        this.cycleDifficulty();
      });
      
      // Add all elements to the container
      this.cycleButton.add([buttonBg, labelText, separator, this.cycleText, difficultyIndicator]);
      
      // Add a subtle pulsing effect to draw attention
      this.tweens.add({
        targets: separator,
        alpha: { from: 0.6, to: 1 },
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Add instructional text below
      const instructionText = this.add.text(400, 570, 'Click to change difficulty', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#888888',
        align: 'center'
      }).setOrigin(0.5).setAlpha(0.7);
    }

    // Update the cycleDifficulty method for better visual feedback
    cycleDifficulty() {
      // Increment the index and wrap around if needed
      this.currentCycleIndex = (this.currentCycleIndex + 1) % this.cycleOptions.length;
      
      // Update the text with animation
      this.tweens.add({
        targets: this.cycleText,
        alpha: 0,
        scaleX: 0.8,
        duration: 100,
        ease: 'Power2',
        onComplete: () => {
          this.cycleText.setText(this.cycleOptions[this.currentCycleIndex]);
          
          // Update difficulty indicator color
          const difficultyColors = {
            'Normal': '#28a745',  // Green
            'Hard': '#ffc107',    // Yellow
            'Insane': '#dc3545'   // Red
          };
          
          const difficultyIndicator = this.cycleButton.getData('difficultyIndicator');
          if (difficultyIndicator) {
            const currentDifficulty = this.cycleOptions[this.currentCycleIndex];
            difficultyIndicator.clear();
            difficultyIndicator.fillStyle(Phaser.Display.Color.HexStringToColor(difficultyColors[currentDifficulty]).color);
            difficultyIndicator.fillCircle(100, 0, 8);
            difficultyIndicator.lineStyle(2, 0xffffff, 0.8);
            difficultyIndicator.strokeCircle(100, 0, 8);
            
            // Add glow effect for dramatic difficulties
            if (currentDifficulty === 'Insane') {
              difficultyIndicator.lineStyle(3, 0xff0000, 0.6);
              difficultyIndicator.strokeCircle(100, 0, 12);
            }
          }
          
          // Fade back in with new text
          this.tweens.add({
            targets: this.cycleText,
            alpha: 1,
            scaleX: 1,
            duration: 150,
            ease: 'Back.easeOut'
          });
        }
      });
      
      // Add screen shake for dramatic effect on harder difficulties
      if (this.cycleOptions[this.currentCycleIndex] === 'Insane') {
        this.cameras.main.shake(100, 0.01);
      }
      
      // Save the selected difficulty
      this.saveDifficulty(this.cycleOptions[this.currentCycleIndex]);
      
      // Play a sound effect (if available)
      try {
        this.sound.play('menuSelect', { volume: 0.3 });
      } catch (error) {
        // Fallback if sound doesn't exist
        console.log('Menu sound not available');
      }
    }

    // Add this new method for better button fallbacks
    private createDifficultyButtonFallback() {
      const graphics = this.add.graphics();
      
      // Create a more sophisticated button design
      const buttonWidth = 280;
      const buttonHeight = 50;
      
      // Main button background with gradient effect
      graphics.fillStyle(0x2a2a4a);
      graphics.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 8);
      
      // Add highlight
      graphics.fillStyle(0x3a3a5a);
      graphics.fillRoundedRect(2, 2, buttonWidth - 4, buttonHeight / 3, 6);
      
      // Border
      graphics.lineStyle(2, 0x88ccff, 0.5);
      graphics.strokeRoundedRect(0, 0, buttonWidth, buttonHeight, 8);
      
      graphics.generateTexture('button_cycle_normal', buttonWidth, buttonHeight);
      
      // Hover version
      graphics.clear();
      graphics.fillStyle(0x3a3a5a);
      graphics.fillRoundedRect(0, 0, buttonWidth, buttonHeight, 8);
      graphics.fillStyle(0x4a4a6a);
      graphics.fillRoundedRect(2, 2, buttonWidth - 4, buttonHeight / 3, 6);
      graphics.lineStyle(2, 0x99ddff, 0.8);
      graphics.strokeRoundedRect(0, 0, buttonWidth, buttonHeight, 8);
      graphics.generateTexture('button_cycle_hover', buttonWidth, buttonHeight);
      
      graphics.destroy();
    }
    
    selectButton(index: number) {
      // Make sure index is within bounds
      this.selectedButtonIndex = Math.max(0, Math.min(this.buttonCount - 1, index));
      
      // Update button textures
      this.menuButtons.forEach((button, i) => {
        const buttonId = ['start', 'settings', 'credits'][i];
        const texture = `button_${buttonId}_${i === this.selectedButtonIndex ? 'hover' : 'normal'}`;
        
        if (this.textures.exists(texture)) {
          button.setTexture(texture);
        }
        
        // Add subtle pulse effect to the selected button
        if (i === this.selectedButtonIndex) {
          this.tweens.add({
            targets: button,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 300,
            yoyo: true,
            repeat: 0
          });
        } else {
          button.setScale(1);
        }
      });
    }
    
    setupInput() {
      // Keyboard navigation
      this.input.keyboard.on('keydown-UP', () => {
        this.selectButton(this.selectedButtonIndex - 1);
      });
      
      this.input.keyboard.on('keydown-DOWN', () => {
        this.selectButton(this.selectedButtonIndex + 1);
      });
      
      // Selection with Enter or Space
      this.input.keyboard.on('keydown-ENTER', () => {
        this.confirmSelection();
      });
      
      this.input.keyboard.on('keydown-SPACE', () => {
        this.confirmSelection();
      });
      
      this.input.keyboard.on('keydown-Z', () => {
        this.confirmSelection();
      });
    }
    
    confirmSelection() {
      if (this.animating) return;
      
      switch (this.selectedButtonIndex) {
        case 0: // Start Game
          this.startGame();
          break;
        case 1: // Settings
          this.openSettings();
          break;
        case 2: // Credits
          this.showCredits();
          break;
      }
    }
    
    startGame() {
      if (this.animating) return;
      this.animating = true;
      
      // Pass the selected difficulty to the battle scene if needed
      const difficulty = this.cycleOptions[this.currentCycleIndex];
      
      console.log('Starting game transition with difficulty:', difficulty);
      
      // Fade to black and start the game
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        try {
          console.log('Camera fade complete, checking if BattleScene exists');
          
          // Check if the BattleScene exists in the scene manager
          if (this.scene.get('BattleScene')) {
            console.log('Using scene key: BattleScene');
            this.scene.start('BattleScene', { difficulty });
          } else if (this.scene.get('MysticRuinsBattleScene')) {
            console.log('Using scene key: MysticRuinsBattleScene');
            this.scene.start('MysticRuinsBattleScene', { difficulty });
          } else {
            console.error('Error: Neither BattleScene nor MysticRuinsBattleScene was found!');
            
            // Show an error message and fade back in if no valid scene is found
            this.gameTitle.setText('Error: Battle scene not found\nTry reloading the page');
            this.cameras.main.fadeIn(1000, 0, 0, 0);
            this.animating = false;
            
            // List all available scenes for debugging
            const scenes = this.scene.manager.scenes.map(s => s.scene.key);
            console.log('Available scenes:', scenes);
          }
        } catch (error) {
          console.error('Error during scene transition:', error);
          
          // Return to main menu functionality in case of error
          this.cameras.main.fadeIn(1000, 0, 0, 0);
          this.animating = false;
        }
      });
    }
    
    openSettings() {
      if (this.animating) return;
      this.animating = true;
      
      console.log('Opening settings menu');
      
      // Fade to settings scene
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        try {
          // Check if the SettingsScene exists in the scene manager
          if (this.scene.get('SettingsScene')) {
            console.log('Using scene key: SettingsScene');
            this.scene.start('SettingsScene');
          } else {
            console.warn('SettingsScene not found, showing enhanced placeholder');
            
            // Enhanced fallback settings interface
            this.showSettingsPlaceholder();
            this.cameras.main.fadeIn(500, 0, 0, 0);
            this.animating = false;
          }
        } catch (error) {
          console.error('Error during settings transition:', error);
          
          // Return to main menu functionality in case of error
          this.showSettingsPlaceholder();
          this.cameras.main.fadeIn(500, 0, 0, 0);
          this.animating = false;
        }
      });
    }

    private showSettingsPlaceholder() {
      // Create an enhanced placeholder settings interface
      const settingsOverlay = this.add.graphics();
      settingsOverlay.fillStyle(0x000000, 0.8);
      settingsOverlay.fillRect(0, 0, 800, 600);
      settingsOverlay.setDepth(100);
      
      // Settings panel background
      settingsOverlay.fillStyle(0x1a1a3a, 0.9);
      settingsOverlay.fillRoundedRect(100, 100, 600, 400, 16);
      settingsOverlay.lineStyle(2, 0x88ccff, 0.5);
      settingsOverlay.strokeRoundedRect(100, 100, 600, 400, 16);
      
      // Title
      const settingsTitle = this.add.text(400, 150, 'Game Settings', {
        fontFamily: 'serif',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#2a2a4a',
        strokeThickness: 4,
        align: 'center'
      }).setOrigin(0.5).setDepth(101);
      
      // Settings options (placeholder)
      const settingsText = this.add.text(400, 250, [
        '🔊 Sound Effects: ON',
        '🎵 Background Music: ON', 
        '⚔️ Difficulty: Normal',
        '',
        '⚠️ Full settings menu coming soon!',
        '',
        'Press ESC or click Back to return'
      ].join('\n'), {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#aaccff',
        align: 'center',
        lineSpacing: 10
      }).setOrigin(0.5).setDepth(101);
      
      // Back button
      const backButton = this.add.text(400, 420, '← Back to Main Menu', {
        fontFamily: 'serif',
        fontSize: '20px',
        color: '#ffcc00',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(101).setInteractive();
      
      // Button hover effects
      backButton.on('pointerover', () => {
        backButton.setColor('#ffffff');
        backButton.setScale(1.1);
      });
      
      backButton.on('pointerout', () => {
        backButton.setColor('#ffcc00');
        backButton.setScale(1.0);
      });
      
      // Close settings placeholder
      const closeSettings = () => {
        settingsOverlay.destroy();
        settingsTitle.destroy();
        settingsText.destroy();
        backButton.destroy();
        this.gameTitle.setText('Mystic Ruins');
      };
      
      backButton.on('pointerdown', closeSettings);
      
      // ESC key to close
      const escKey = this.input.keyboard.addKey('ESC');
      escKey.once('down', closeSettings);
      
      // Auto-close after 10 seconds
      this.time.delayedCall(10000, closeSettings);
    }
    
    showCredits() {
      if (this.animating) return;
      this.animating = true;
      
      // Enhanced credits placeholder
      const creditsOverlay = this.add.graphics();
      creditsOverlay.fillStyle(0x000000, 0.8);
      creditsOverlay.fillRect(0, 0, 800, 600);
      creditsOverlay.setDepth(100);
      
      // Credits panel background
      creditsOverlay.fillStyle(0x1a1a3a, 0.9);
      creditsOverlay.fillRoundedRect(100, 50, 600, 500, 16);
      creditsOverlay.lineStyle(2, 0x88ccff, 0.5);
      creditsOverlay.strokeRoundedRect(100, 50, 600, 500, 16);
      
      // Credits content
      const creditsTitle = this.add.text(400, 100, 'Credits', {
        fontFamily: 'serif',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#2a2a4a',
        strokeThickness: 4,
        align: 'center'
      }).setOrigin(0.5).setDepth(101);
      
      const creditsText = this.add.text(400, 300, [
        'Mystic Ruins: Lost Civilization',
        '',
        '🎮 Game Development',
        'Powered by Phaser 3 & React',
        '',
        '🎨 Visual Design',
        'Custom UI Components',
        'Mystical Theme Assets',
        '',
        '⚡ Technology Stack',
        'TypeScript • Astro • Tailwind CSS',
        'Phaser 3 • React • Vite',
        '',
        '🏛️ Special Thanks',
        'Ancient civilizations for inspiration',
        '',
        'Version 0.1.1 - 2024'
      ].join('\n'), {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#aaccff',
        align: 'center',
        lineSpacing: 8
      }).setOrigin(0.5).setDepth(101);
      
      // Back button
      const backButton = this.add.text(400, 480, '← Back to Main Menu', {
        fontFamily: 'serif',
        fontSize: '20px',
        color: '#ffcc00',
        fontStyle: 'bold'
      }).setOrigin(0.5).setDepth(101).setInteractive();
      
      // Button hover effects
      backButton.on('pointerover', () => {
        backButton.setColor('#ffffff');
        backButton.setScale(1.1);
      });
      
      backButton.on('pointerout', () => {
        backButton.setColor('#ffcc00');
        backButton.setScale(1.0);
      });
      
      // Close credits
      const closeCredits = () => {
        creditsOverlay.destroy();
        creditsTitle.destroy();
        creditsText.destroy();
        backButton.destroy();
        this.gameTitle.setText('Mystic Ruins');
        this.animating = false;
      };
      
      backButton.on('pointerdown', closeCredits);
      
      // ESC key to close
      const escKey = this.input.keyboard.addKey('ESC');
      escKey.once('down', closeCredits);
      
      // Auto-close after 15 seconds
      this.time.delayedCall(15000, closeCredits);
    }
    
    createParticles() {
      // Make sure the particle texture exists
      if (!this.textures.exists('particle')) {
        const particleGraphic = this.make.graphics({ x: 0, y: 0 });
        particleGraphic.fillStyle(0xffffff);
        particleGraphic.fillCircle(8, 8, 2);
        particleGraphic.generateTexture('particle', 16, 16);
        particleGraphic.destroy();
      }
      
      // Create simple particle effects with fallback
      try {
        // Create a simple animation as fallback when particles aren't working
        for (let i = 0; i < 30; i++) {
          const x = Math.random() * 800;
          const y = 600 + Math.random() * 50;
          const particle = this.add.image(x, y, 'particle');
          particle.setScale(0.1);
          particle.setAlpha(0.3);
          particle.setTint(0x96f2ff);
          
          this.tweens.add({
            targets: particle,
            y: y - 400 - Math.random() * 200,
            alpha: 0,
            scale: 0,
            duration: 8000 + Math.random() * 4000,
            ease: 'Linear',
            onComplete: () => particle.destroy()
          });
        }
        
        // Add new particles periodically
        this.time.addEvent({
          delay: 200,
          loop: true,
          callback: () => {
            const x = Math.random() * 800;
            const y = 600;
            const particle = this.add.image(x, y, 'particle');
            particle.setScale(0.1);
            particle.setAlpha(0.3);
            particle.setTint(0x96f2ff);
            
            this.tweens.add({
              targets: particle,
              y: y - 400 - Math.random() * 200,
              alpha: 0,
              scale: 0,
              duration: 8000 + Math.random() * 4000,
              ease: 'Linear',
              onComplete: () => particle.destroy()
            });
          }
        });
      } catch (error) {
        console.warn("Could not create particles:", error);
      }
    }
    
    addDecorativeBorder() {
      // Create a decorative border with ancient runes
      const graphics = this.add.graphics();
      graphics.lineStyle(2, 0x6a81a8, 0.5);
      
      // Draw border with slight inset
      const padding = 20;
      graphics.strokeRect(padding, padding, 800 - padding * 2, 600 - padding * 2);
      
      // Add corner decorations
      const cornerSize = 20;
      const corners = [
        [padding, padding], // Top left
        [800 - padding, padding], // Top right
        [800 - padding, 600 - padding], // Bottom right
        [padding, 600 - padding] // Bottom left
      ];
      
      corners.forEach((corner, i) => {
        const [x, y] = corner;
        
        // Draw rune circle at each corner
        graphics.strokeCircle(x, y, cornerSize);
        
        // Add crossed lines inside circle based on corner position
        graphics.lineStyle(1, 0x6a81a8, 0.5);
        if (i === 0) { // Top left
          graphics.lineBetween(x - cornerSize/2, y - cornerSize/2, x + cornerSize/2, y + cornerSize/2);
          graphics.lineBetween(x + cornerSize/2, y - cornerSize/2, x - cornerSize/2, y + cornerSize/2);
        } else if (i === 1) { // Top right
          graphics.lineBetween(x - cornerSize/2, y - cornerSize/2, x + cornerSize/2, y + cornerSize/2);
          graphics.lineBetween(x - cornerSize/2, y + cornerSize/2, x + cornerSize/2, y - cornerSize/2);
        } else if (i === 2) { // Bottom right
          graphics.lineBetween(x - cornerSize/2, y - cornerSize/2, x + cornerSize/2, y + cornerSize/2);
          graphics.lineBetween(x, y - cornerSize, x, y + cornerSize);
        } else { // Bottom left
          graphics.lineBetween(x - cornerSize, y, x + cornerSize, y);
          graphics.lineBetween(x, y - cornerSize, x, y + cornerSize);
        }
      });
    }

    private showErrorState() {
      const errorBg = this.add.graphics();
      errorBg.fillStyle(0x000000, 0.9);
      errorBg.fillRect(0, 0, 800, 600);
      
      const errorText = this.add.text(400, 300, `Main Menu Error: ${this.loadingError || 'Unknown error'}`, {
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

    // Public getters for external loading screen integration
    getLoadingProgress(): number {
      return this.loadingManager.getProgress();
    }

    getCurrentLoadingTask(): string {
      return this.loadingManager.getCurrentTask();
    }

    getLoadingError(): string | null {
      return this.loadingError;
    }

    retryLoading() {
      this.loadingManager.reset();
      const tasks = LoadingManager.createMainMenuTasks();
      tasks.forEach(task => this.loadingManager.addTask(task));
      this.scene.restart();
    }
  };
}