import Phaser from 'phaser';
import { SettingsSystem } from '../systems/SettingsSystem';
import { LoadingManager } from '../utils/LoadingManager';
import { generateTextureFromReactComponent } from '../utils/textureGenerator';
import { Button } from '../assets/ui/Button';

// Settings Asset Loader
class SettingsAssetLoader {
  private scene: Phaser.Scene;
  private loadingManager: LoadingManager;

  constructor(scene: Phaser.Scene, loadingManager: LoadingManager) {
    this.scene = scene;
    this.loadingManager = loadingManager;
  }

  async loadAllAssets() {
    try {
      console.log('SettingsAssetLoader: Starting asset loading process');
      
      await this.loadButtonAssets();
      await this.loadUIAssets();
      
      this.loadingManager.completeTask('finalize');
      console.log('SettingsAssetLoader: All assets loaded successfully');
    } catch (error) {
      console.error('SettingsAssetLoader: Asset loading failed:', error);
      throw error;
    }
  }

  private async loadButtonAssets() {
    this.loadingManager.setCurrentTask('buttons');
    console.log('SettingsAssetLoader: Loading button assets');
    
    const buttonTypes = [
      { id: 'sound', variant: 'secondary' },
      { id: 'music', variant: 'secondary' },
      { id: 'difficulty', variant: 'danger' },
      { id: 'back', variant: 'primary' },
      { id: 'apply', variant: 'success' }
    ];

    for (const button of buttonTypes) {
      try {
        // Normal state
        await generateTextureFromReactComponent(
          Button,
          { 
            width: 300, 
            height: 50, 
            text: button.id.charAt(0).toUpperCase() + button.id.slice(1), 
            variant: button.variant as any, 
            state: 'normal' 
          },
          `settings_button_${button.id}_normal`,
          this.scene
        );
        
        // Hover state
        await generateTextureFromReactComponent(
          Button,
          { 
            width: 300, 
            height: 50, 
            text: button.id.charAt(0).toUpperCase() + button.id.slice(1), 
            variant: button.variant as any, 
            state: 'hover' 
          },
          `settings_button_${button.id}_hover`,
          this.scene
        );
        
        // Selected state
        await generateTextureFromReactComponent(
          Button,
          { 
            width: 300, 
            height: 50, 
            text: button.id.charAt(0).toUpperCase() + button.id.slice(1), 
            variant: button.variant as any, 
            state: 'pressed' 
          },
          `settings_button_${button.id}_selected`,
          this.scene
        );
      } catch (error) {
        console.warn(`SettingsAssetLoader: Failed to load button ${button.id}, creating fallbacks:`, error);
        this.createFallbackButton(button.id, button.variant);
      }
    }
    
    console.log('SettingsAssetLoader: Button assets loaded');
    this.loadingManager.completeTask('buttons');
  }

  private async loadUIAssets() {
    this.loadingManager.setCurrentTask('ui');
    console.log('SettingsAssetLoader: Loading UI assets');
    
    // Create slider components and other UI elements
    try {
      this.createSliderTextures();
      this.createPanelTextures();
    } catch (error) {
      console.warn('SettingsAssetLoader: Failed to create UI assets:', error);
    }
    
    console.log('SettingsAssetLoader: UI assets loaded');
    this.loadingManager.completeTask('ui');
  }

  private createFallbackButton(buttonId: string, variant: string) {
    const graphics = this.scene.add.graphics();
    
    // Button colors based on variant
    let color = 0x666666;
    if (variant === 'secondary') color = 0x6c757d;
    else if (variant === 'danger') color = 0xdc3545;
    else if (variant === 'primary') color = 0x4a9eff;
    else if (variant === 'success') color = 0x28a745;
    
    const states = ['normal', 'hover', 'selected'];
    states.forEach((state, index) => {
      graphics.clear();
      
      let stateColor = color;
      if (state === 'hover') stateColor = (color & 0xfefefe) >> 1 | 0x808080;
      else if (state === 'selected') stateColor = (color & 0xfcfcfc) >> 2 | 0x404040;
      
      graphics.fillStyle(stateColor);
      graphics.fillRoundedRect(0, 0, 300, 50, 8);
      graphics.lineStyle(2, 0xffffff, 0.3);
      graphics.strokeRoundedRect(0, 0, 300, 50, 8);
      graphics.generateTexture(`settings_button_${buttonId}_${state}`, 300, 50);
    });
    
    graphics.destroy();
  }

  private createSliderTextures() {
    const graphics = this.scene.add.graphics();
    
    // Slider track
    graphics.fillStyle(0x444444);
    graphics.fillRoundedRect(0, 0, 200, 8, 4);
    graphics.lineStyle(1, 0x666666);
    graphics.strokeRoundedRect(0, 0, 200, 8, 4);
    graphics.generateTexture('slider_track', 200, 8);
    
    // Slider handle
    graphics.clear();
    graphics.fillStyle(0x88ccff);
    graphics.fillCircle(8, 8, 8);
    graphics.lineStyle(2, 0xffffff, 0.8);
    graphics.strokeCircle(8, 8, 8);
    graphics.generateTexture('slider_handle', 16, 16);
    
    graphics.destroy();
  }

  private createPanelTextures() {
    const graphics = this.scene.add.graphics();
    
    // Settings panel background
    graphics.fillStyle(0x1a1a3a, 0.9);
    graphics.fillRoundedRect(0, 0, 600, 500, 16);
    graphics.lineStyle(2, 0x88ccff, 0.5);
    graphics.strokeRoundedRect(0, 0, 600, 500, 16);
    graphics.generateTexture('settings_panel', 600, 500);
    
    // Option panel background
    graphics.clear();
    graphics.fillStyle(0x2a2a4a, 0.8);
    graphics.fillRoundedRect(0, 0, 550, 60, 8);
    graphics.lineStyle(1, 0x6a6a8a, 0.5);
    graphics.strokeRoundedRect(0, 0, 550, 60, 8);
    graphics.generateTexture('option_panel', 550, 60);
    
    graphics.destroy();
  }
}

export function createSettingsScene(Phaser: any, settingsSystem: SettingsSystem) {
  return class SettingsScene extends Phaser.Scene {
    private settingsSystem: SettingsSystem;
    private selectedIndex = 0;
    private settingsOptions: any[] = [];
    private optionContainers: Phaser.GameObjects.Container[] = [];
    private backButton!: Phaser.GameObjects.Image;
    private applyButton!: Phaser.GameObjects.Image;
    private titleText!: Phaser.GameObjects.Text;
    private animating = false;
    
    // Loading management
    private loadingManager: LoadingManager;
    private assetLoader: SettingsAssetLoader;
    private isLoading: boolean = true;
    private loadingError: string | null = null;
    
    // Temporary settings (applied on confirm)
    private tempSettings: any = {};

    constructor() {
      super({ key: 'SettingsScene' });
      this.settingsSystem = settingsSystem;
      this.loadingManager = new LoadingManager();
      this.assetLoader = new SettingsAssetLoader(this, this.loadingManager);
      
      // Setup loading progress tracking
      this.setupLoadingTracking();
    }

    private setupLoadingTracking() {
      this.loadingManager.onProgress((progress, currentTask) => {
        this.events.emit('loading-progress', { progress, currentTask });
        console.log(`Settings Loading: ${progress.toFixed(1)}% - ${currentTask}`);
      });
    }

    init() {
      // Setup loading tasks
      const tasks = [
        { id: 'buttons', name: 'Loading settings controls...', weight: 4 },
        { id: 'ui', name: 'Creating interface elements...', weight: 2 },
        { id: 'finalize', name: 'Finalizing settings...', weight: 1 }
      ];
      tasks.forEach(task => this.loadingManager.addTask(task));
      
      // Initialize temp settings with current values
      this.tempSettings = { ...this.settingsSystem.getSettings() };
    }

    async preload() {
      console.log('SettingsScene preload started');
      
      try {
        this.isLoading = true;
        this.loadingError = null;
        
        this.events.emit('loading-start');
        await this.assetLoader.loadAllAssets();
        
        console.log('Settings: All assets loaded successfully');
        this.isLoading = false;
        this.events.emit('loading-complete');
        
      } catch (error) {
        console.error('Error loading settings assets:', error);
        this.loadingError = error instanceof Error ? error.message : 'Unknown loading error';
        this.isLoading = false;
        this.events.emit('loading-error', { error: this.loadingError });
      }
    }

    create() {
      console.log('SettingsScene create started');
      
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
        console.log('SettingsScene created successfully');
      } catch (error) {
        console.error('Error creating settings scene:', error);
        this.showErrorState();
      }
    }

    private setupScene() {
      // Add background (reuse main menu background or create new one)
      this.createBackground();
      
      // Add settings panel
      this.createSettingsPanel();
      
      // Setup settings options
      this.setupSettingsOptions();
      
      // Setup input handlers
      this.setupInput();
      
      // Initial selection
      this.updateSelection();
      
      // Fade in
      this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    private createBackground() {
      // Create a darker version of the main menu background
      const graphics = this.add.graphics();
      graphics.fillGradientStyle(0x0a0a2a, 0x0a0a2a, 0x1a1a3a, 0x1a1a3a, 1);
      graphics.fillRect(0, 0, 800, 600);
      
      // Add mystical particles
      graphics.fillStyle(0x6a6a9a, 0.2);
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * 800;
        const y = Math.random() * 600;
        const size = Math.random() * 2 + 0.5;
        graphics.fillCircle(x, y, size);
      }
    }

    private createSettingsPanel() {
      // Main panel background
      const panelBg = this.add.image(400, 300, 'settings_panel');
      if (!this.textures.exists('settings_panel')) {
        // Fallback panel
        const graphics = this.add.graphics();
        graphics.fillStyle(0x1a1a3a, 0.9);
        graphics.fillRoundedRect(100, 50, 600, 500, 16);
        graphics.lineStyle(2, 0x88ccff, 0.5);
        graphics.strokeRoundedRect(100, 50, 600, 500, 16);
      }
      
      // Title
      this.titleText = this.add.text(400, 120, 'Game Settings', {
        fontFamily: 'serif',
        fontSize: '32px',
        color: '#ffffff',
        stroke: '#2a2a4a',
        strokeThickness: 4,
        align: 'center'
      }).setOrigin(0.5);
      
      // Subtitle
      this.add.text(400, 160, 'Configure your game experience', {
        fontFamily: 'serif',
        fontSize: '16px',
        color: '#aaccff',
        align: 'center'
      }).setOrigin(0.5);
    }

    private setupSettingsOptions() {
      const startY = 220;
      const spacing = 80;
      
      this.settingsOptions = [
        {
          id: 'sound',
          label: 'Sound Effects',
          type: 'toggle',
          getValue: () => this.tempSettings.sound,
          setValue: (value: boolean) => { this.tempSettings.sound = value; }
        },
        {
          id: 'music',
          label: 'Background Music',
          type: 'toggle',
          getValue: () => this.tempSettings.music,
          setValue: (value: boolean) => { this.tempSettings.music = value; }
        },
        {
          id: 'difficulty',
          label: 'Difficulty Level',
          type: 'cycle',
          options: ['easy', 'normal', 'hard'],
          getValue: () => this.tempSettings.difficulty,
          setValue: (value: string) => { this.tempSettings.difficulty = value; }
        }
      ];

      this.settingsOptions.forEach((option, index) => {
        const y = startY + (index * spacing);
        const container = this.createOptionContainer(option, y);
        this.optionContainers.push(container);
      });

      // Add action buttons
      this.createActionButtons();
    }

    private createOptionContainer(option: any, y: number): Phaser.GameObjects.Container {
      const container = this.add.container(400, y);
      
      // Option background panel
      const bg = this.add.image(0, 0, 'option_panel');
      if (!this.textures.exists('option_panel')) {
        // Fallback
        const graphics = this.add.graphics();
        graphics.fillStyle(0x2a2a4a, 0.8);
        graphics.fillRoundedRect(-275, -30, 550, 60, 8);
        bg.setTexture('__DEFAULT');
      }
      
      // Label text
      const label = this.add.text(-200, 0, option.label, {
        fontFamily: 'serif',
        fontSize: '20px',
        color: '#ffffff'
      }).setOrigin(0, 0.5);
      
      // Value control based on type
      let valueControl: Phaser.GameObjects.GameObject;
      
      if (option.type === 'toggle') {
        valueControl = this.createToggleControl(option);
      } else if (option.type === 'cycle') {
        valueControl = this.createCycleControl(option);
      } else {
        valueControl = this.add.text(150, 0, 'Unknown', {
          fontFamily: 'serif',
          fontSize: '18px',
          color: '#ffcc00'
        }).setOrigin(0, 0.5);
      }
      
      container.add([bg, label, valueControl]);
      container.setData('option', option);
      container.setData('valueControl', valueControl);
      
      return container;
    }

    private createToggleControl(option: any): Phaser.GameObjects.Container {
      const toggleContainer = this.add.container(150, 0);
      
      // Toggle background
      const toggleBg = this.add.graphics();
      const isOn = option.getValue();
      
      toggleBg.fillStyle(isOn ? 0x28a745 : 0x6c757d);
      toggleBg.fillRoundedRect(-30, -12, 60, 24, 12);
      
      // Toggle handle
      const handle = this.add.graphics();
      handle.fillStyle(0xffffff);
      handle.fillCircle(isOn ? 18 : -18, 0, 10);
      
      // Toggle text
      const text = this.add.text(80, 0, isOn ? 'ON' : 'OFF', {
        fontFamily: 'serif',
        fontSize: '18px',
        color: isOn ? '#28a745' : '#6c757d',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      
      toggleContainer.add([toggleBg, handle, text]);
      toggleContainer.setData('updateToggle', (newValue: boolean) => {
        toggleBg.clear();
        toggleBg.fillStyle(newValue ? 0x28a745 : 0x6c757d);
        toggleBg.fillRoundedRect(-30, -12, 60, 24, 12);
        
        handle.clear();
        handle.fillStyle(0xffffff);
        handle.fillCircle(newValue ? 18 : -18, 0, 10);
        
        text.setText(newValue ? 'ON' : 'OFF');
        text.setColor(newValue ? '#28a745' : '#6c757d');
      });
      
      return toggleContainer;
    }

    private createCycleControl(option: any): Phaser.GameObjects.Container {
      const cycleContainer = this.add.container(150, 0);
      
      // Previous button
      const prevBtn = this.add.text(-50, 0, '◀', {
        fontFamily: 'serif',
        fontSize: '20px',
        color: '#88ccff'
      }).setOrigin(0.5).setInteractive();
      
      // Current value text
      const currentValue = option.getValue();
      const valueText = this.add.text(0, 0, currentValue.charAt(0).toUpperCase() + currentValue.slice(1), {
        fontFamily: 'serif',
        fontSize: '18px',
        color: '#ffcc00',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      // Next button
      const nextBtn = this.add.text(50, 0, '▶', {
        fontFamily: 'serif',
        fontSize: '20px',
        color: '#88ccff'
      }).setOrigin(0.5).setInteractive();
      
      // Button interactions
      prevBtn.on('pointerdown', () => {
        const currentIndex = option.options.indexOf(option.getValue());
        const newIndex = (currentIndex - 1 + option.options.length) % option.options.length;
        const newValue = option.options[newIndex];
        option.setValue(newValue);
        valueText.setText(newValue.charAt(0).toUpperCase() + newValue.slice(1));
      });
      
      nextBtn.on('pointerdown', () => {
        const currentIndex = option.options.indexOf(option.getValue());
        const newIndex = (currentIndex + 1) % option.options.length;
        const newValue = option.options[newIndex];
        option.setValue(newValue);
        valueText.setText(newValue.charAt(0).toUpperCase() + newValue.slice(1));
      });
      
      cycleContainer.add([prevBtn, valueText, nextBtn]);
      cycleContainer.setData('updateCycle', (newValue: string) => {
        valueText.setText(newValue.charAt(0).toUpperCase() + newValue.slice(1));
      });
      
      return cycleContainer;
    }

    private createActionButtons() {
      // Apply button
      const applyKey = 'settings_button_apply_normal';
      if (!this.textures.exists(applyKey)) {
        this.createFallbackActionButton('apply', 0x28a745);
      }
      
      this.applyButton = this.add.image(300, 480, applyKey)
        .setInteractive()
        .setDepth(10);
      
      this.applyButton.on('pointerover', () => {
        const hoverKey = 'settings_button_apply_hover';
        if (this.textures.exists(hoverKey)) {
          this.applyButton.setTexture(hoverKey);
        }
      });
      
      this.applyButton.on('pointerout', () => {
        this.applyButton.setTexture(applyKey);
      });
      
      this.applyButton.on('pointerdown', () => {
        this.applySettings();
      });
      
      // Back button
      const backKey = 'settings_button_back_normal';
      if (!this.textures.exists(backKey)) {
        this.createFallbackActionButton('back', 0x4a9eff);
      }
      
      this.backButton = this.add.image(500, 480, backKey)
        .setInteractive()
        .setDepth(10);
      
      this.backButton.on('pointerover', () => {
        const hoverKey = 'settings_button_back_hover';
        if (this.textures.exists(hoverKey)) {
          this.backButton.setTexture(hoverKey);
        }
      });
      
      this.backButton.on('pointerout', () => {
        this.backButton.setTexture(backKey);
      });
      
      this.backButton.on('pointerdown', () => {
        this.goBack();
      });
      
      // Add button labels
      this.add.text(300, 480, 'Apply & Save', {
        fontFamily: 'serif',
        fontSize: '16px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      this.add.text(500, 480, 'Back', {
        fontFamily: 'serif',
        fontSize: '16px',
        color: '#ffffff'
      }).setOrigin(0.5);
    }

    private createFallbackActionButton(type: string, color: number) {
      const graphics = this.add.graphics();
      
      const states = ['normal', 'hover'];
      states.forEach(state => {
        graphics.clear();
        
        let stateColor = color;
        if (state === 'hover') stateColor = (color & 0xfefefe) >> 1 | 0x808080;
        
        graphics.fillStyle(stateColor);
        graphics.fillRoundedRect(0, 0, 100, 40, 8);
        graphics.lineStyle(2, 0xffffff, 0.3);
        graphics.strokeRoundedRect(0, 0, 100, 40, 8);
        graphics.generateTexture(`settings_button_${type}_${state}`, 100, 40);
      });
      
      graphics.destroy();
    }

    private setupInput() {
      // Keyboard navigation
      this.input.keyboard.on('keydown-UP', () => {
        this.moveSelection(-1);
      });
      
      this.input.keyboard.on('keydown-DOWN', () => {
        this.moveSelection(1);
      });
      
      this.input.keyboard.on('keydown-LEFT', () => {
        this.adjustSelectedOption(-1);
      });
      
      this.input.keyboard.on('keydown-RIGHT', () => {
        this.adjustSelectedOption(1);
      });
      
      this.input.keyboard.on('keydown-ENTER', () => {
        this.confirmSelectedOption();
      });
      
      this.input.keyboard.on('keydown-SPACE', () => {
        this.confirmSelectedOption();
      });
      
      this.input.keyboard.on('keydown-ESC', () => {
        this.goBack();
      });
      
      this.input.keyboard.on('keydown-A', () => {
        this.applySettings();
      });
    }

    private moveSelection(direction: number) {
      const totalOptions = this.settingsOptions.length + 2; // +2 for action buttons
      this.selectedIndex = (this.selectedIndex + direction + totalOptions) % totalOptions;
      this.updateSelection();
    }

    private adjustSelectedOption(direction: number) {
      if (this.selectedIndex >= this.settingsOptions.length) return;
      
      const option = this.settingsOptions[this.selectedIndex];
      
      if (option.type === 'toggle') {
        option.setValue(!option.getValue());
        this.updateOptionDisplay(this.selectedIndex);
      } else if (option.type === 'cycle') {
        const currentIndex = option.options.indexOf(option.getValue());
        const newIndex = (currentIndex + direction + option.options.length) % option.options.length;
        option.setValue(option.options[newIndex]);
        this.updateOptionDisplay(this.selectedIndex);
      }
    }

    private confirmSelectedOption() {
      if (this.selectedIndex === this.settingsOptions.length) {
        // Apply button selected
        this.applySettings();
      } else if (this.selectedIndex === this.settingsOptions.length + 1) {
        // Back button selected
        this.goBack();
      } else {
        // Toggle/cycle option
        this.adjustSelectedOption(1);
      }
    }

    private updateSelection() {
      // Reset all highlights
      this.optionContainers.forEach((container, index) => {
        const bg = container.getFirst() as Phaser.GameObjects.Image;
        if (bg) {
          bg.setTint(index === this.selectedIndex ? 0xffff88 : 0xffffff);
          bg.setAlpha(index === this.selectedIndex ? 1 : 0.8);
        }
      });
      
      // Highlight action buttons
      if (this.selectedIndex === this.settingsOptions.length) {
        this.applyButton.setTint(0xffff88);
        this.backButton.clearTint();
      } else if (this.selectedIndex === this.settingsOptions.length + 1) {
        this.backButton.setTint(0xffff88);
        this.applyButton.clearTint();
      } else {
        this.applyButton.clearTint();
        this.backButton.clearTint();
      }
    }

    private updateOptionDisplay(index: number) {
      const container = this.optionContainers[index];
      const option = this.settingsOptions[index];
      const valueControl = container.getData('valueControl');
      
      if (option.type === 'toggle') {
        const updateToggle = valueControl.getData('updateToggle');
        if (updateToggle) {
          updateToggle(option.getValue());
        }
      } else if (option.type === 'cycle') {
        const updateCycle = valueControl.getData('updateCycle');
        if (updateCycle) {
          updateCycle(option.getValue());
        }
      }
    }

    private applySettings() {
      if (this.animating) return;
      this.animating = true;
      
      // Apply all temporary settings to the settings system
      Object.keys(this.tempSettings).forEach(key => {
        if (key === 'sound') {
          if (this.settingsSystem.getSettings().sound !== this.tempSettings.sound) {
            this.settingsSystem.toggleSound();
          }
        } else if (key === 'music') {
          if (this.settingsSystem.getSettings().music !== this.tempSettings.music) {
            this.settingsSystem.toggleMusic();
          }
        } else if (key === 'difficulty') {
          while (this.settingsSystem.getSettings().difficulty !== this.tempSettings.difficulty) {
            this.settingsSystem.cycleDifficulty();
          }
        }
      });
      
      // Show confirmation
      this.titleText.setText('Settings Applied!');
      this.titleText.setColor('#28a745');
      
      // Return to main menu after delay
      this.time.delayedCall(1000, () => {
        this.goBack();
      });
    }

    private goBack() {
      if (this.animating) return;
      this.animating = true;
      
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenuScene');
      });
    }

    private showErrorState() {
      const errorBg = this.add.graphics();
      errorBg.fillStyle(0x000000, 0.9);
      errorBg.fillRect(0, 0, 800, 600);
      
      const errorText = this.add.text(400, 300, `Settings Error: ${this.loadingError || 'Unknown error'}`, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ff0000',
        align: 'center',
        wordWrap: { width: 600 }
      }).setOrigin(0.5);
      
      const restartText = this.add.text(400, 400, 'Click to restart', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5).setInteractive();
      
      restartText.on('pointerdown', () => {
        this.scene.restart();
      });
    }

    // Public getters
    getLoadingProgress(): number {
      return this.loadingManager.getProgress();
    }

    getCurrentLoadingTask(): string {
      return this.loadingManager.getCurrentTask();
    }

    getLoadingError(): string | null {
      return this.loadingError;
    }
  };
}