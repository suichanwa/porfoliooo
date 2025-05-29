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
      // Don't throw error, just create fallbacks
      this.createAllFallbacks();
    }
  }

  private async loadButtonAssets() {
    this.loadingManager.setCurrentTask('buttons');
    console.log('SettingsAssetLoader: Loading button assets');
    
    const buttonConfigs = [
      { id: 'apply', text: 'Apply & Save', variant: 'primary' },
      { id: 'back', text: 'Back to Menu', variant: 'secondary' },
      { id: 'reset', text: 'Reset to Default', variant: 'danger' }
    ];

    for (const config of buttonConfigs) {
      for (const state of ['normal', 'hover', 'pressed']) {
        try {
          await generateTextureFromReactComponent(
            Button,
            { 
              width: 180, 
              height: 45, 
              text: config.text,
              variant: config.variant as any,
              state: state as any
            },
            `settings_${config.id}_${state}`,
            this.scene
          );
        } catch (error) {
          console.warn(`Failed to load ${config.id}_${state}, creating fallback`);
          this.createButtonFallback(config.id, config.variant, state);
        }
      }
    }
    
    this.loadingManager.completeTask('buttons');
  }

  private async loadUIAssets() {
    this.loadingManager.setCurrentTask('ui');
    console.log('SettingsAssetLoader: Loading UI assets');
    
    this.createPanelTextures();
    this.createToggleTextures();
    
    this.loadingManager.completeTask('ui');
  }

  private createButtonFallback(id: string, variant: string, state: string) {
    if (this.scene.textures.exists(`settings_${id}_${state}`)) return;

    const graphics = this.scene.add.graphics();
    
    let baseColor = 0x4a5568; // default
    if (variant === 'primary') baseColor = 0x3182ce;
    else if (variant === 'secondary') baseColor = 0x6c757d;
    else if (variant === 'danger') baseColor = 0xe53e3e;
    
    let stateColor = baseColor;
    if (state === 'hover') stateColor = Phaser.Display.Color.GetColor32(Phaser.Display.Color.IntegerToColor(baseColor).brighten(20));
    else if (state === 'pressed') stateColor = Phaser.Display.Color.GetColor32(Phaser.Display.Color.IntegerToColor(baseColor).darken(20));
    
    graphics.fillStyle(stateColor);
    graphics.fillRoundedRect(0, 0, 180, 45, 8);
    graphics.lineStyle(2, 0xffffff, 0.3);
    graphics.strokeRoundedRect(0, 0, 180, 45, 8);
    graphics.generateTexture(`settings_${id}_${state}`, 180, 45);
    graphics.destroy();
  }

  private createPanelTextures() {
    if (!this.scene.textures.exists('settings_panel')) {
      const graphics = this.scene.add.graphics();
      
      // Main panel
      graphics.fillStyle(0x1a1a3a, 0.95);
      graphics.fillRoundedRect(0, 0, 600, 450, 16);
      graphics.lineStyle(3, 0x88ccff, 0.8);
      graphics.strokeRoundedRect(0, 0, 600, 450, 16);
      graphics.generateTexture('settings_panel', 600, 450);
      
      graphics.destroy();
    }
  }

  private createToggleTextures() {
    const graphics = this.scene.add.graphics();
    
    // Toggle ON state
    graphics.fillStyle(0x28a745);
    graphics.fillRoundedRect(0, 0, 60, 30, 15);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(45, 15, 12);
    graphics.generateTexture('toggle_on', 60, 30);
    
    // Toggle OFF state
    graphics.clear();
    graphics.fillStyle(0x6c757d);
    graphics.fillRoundedRect(0, 0, 60, 30, 15);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(15, 15, 12);
    graphics.generateTexture('toggle_off', 60, 30);
    
    graphics.destroy();
  }

  private createAllFallbacks() {
    this.createButtonFallback('apply', 'primary', 'normal');
    this.createButtonFallback('apply', 'primary', 'hover');
    this.createButtonFallback('back', 'secondary', 'normal');
    this.createButtonFallback('back', 'secondary', 'hover');
    this.createButtonFallback('reset', 'danger', 'normal');
    this.createButtonFallback('reset', 'danger', 'hover');
    this.createPanelTextures();
    this.createToggleTextures();
  }
}

export function createSettingsScene(Phaser: any, settingsSystem: SettingsSystem) {
  return class SettingsScene extends Phaser.Scene {
    private settingsSystem: SettingsSystem;
    private selectedIndex = 0;
    private settingsOptions: any[] = [];
    private optionElements: Phaser.GameObjects.GameObject[] = [];
    private buttons: { [key: string]: Phaser.GameObjects.Image } = {};
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
        { id: 'buttons', name: 'Loading settings controls...', weight: 3 },
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
      // Create background
      this.createBackground();
      
      // Create main panel
      this.createMainPanel();
      
      // Setup settings options
      this.setupSettingsOptions();
      
      // Create action buttons
      this.createActionButtons();
      
      // Setup input handlers
      this.setupInput();
      
      // Initial selection
      this.updateSelection();
      
      // Fade in
      this.cameras.main.fadeIn(500, 0, 0, 0);
    }

    private createBackground() {
      // Reuse main menu background if it exists, otherwise create fallback
      if (this.textures.exists('menuBg')) {
        const bg = this.add.image(400, 300, 'menuBg').setDepth(0);
        
        // Add darker overlay for settings
        const overlay = this.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, 800, 600);
        overlay.setDepth(1);
      } else {
        // Fallback background
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
    }

    private createMainPanel() {
      // Main panel background
      const panel = this.add.image(400, 300, 'settings_panel').setDepth(10);
      
      // Title
      this.titleText = this.add.text(400, 150, 'Game Settings', {
        fontFamily: 'serif',
        fontSize: '36px',
        color: '#ffffff',
        stroke: '#2a2a4a',
        strokeThickness: 4,
        align: 'center'
      }).setOrigin(0.5).setDepth(11);
      
      // Subtitle
      this.add.text(400, 190, 'Configure your game experience', {
        fontFamily: 'serif',
        fontSize: '18px',
        color: '#aaccff',
        align: 'center'
      }).setOrigin(0.5).setDepth(11);
    }

    private setupSettingsOptions() {
      const startY = 250;
      const spacing = 60;
      
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
        this.createSettingOption(option, y, index);
      });
    }

    private createSettingOption(option: any, y: number, index: number) {
      // Option label
      const label = this.add.text(200, y, option.label, {
        fontFamily: 'serif',
        fontSize: '22px',
        color: '#ffffff'
      }).setOrigin(0, 0.5).setDepth(11);
      
      // Option value/control
      if (option.type === 'toggle') {
        const toggle = this.createToggleControl(option, 550, y);
        this.optionElements.push(toggle);
      } else if (option.type === 'cycle') {
        const cycle = this.createCycleControl(option, 550, y);
        this.optionElements.push(cycle.container);
      }
      
      // Store label as selectable element
      this.optionElements.push(label);
    }

    private createToggleControl(option: any, x: number, y: number): Phaser.GameObjects.Image {
      const isOn = option.getValue();
      const toggle = this.add.image(x, y, isOn ? 'toggle_on' : 'toggle_off')
        .setDepth(11)
        .setInteractive();
      
      toggle.on('pointerdown', () => {
        const newValue = !option.getValue();
        option.setValue(newValue);
        toggle.setTexture(newValue ? 'toggle_on' : 'toggle_off');
      });
      
      // Store update function for keyboard control
      (toggle as any).updateValue = () => {
        const newValue = !option.getValue();
        option.setValue(newValue);
        toggle.setTexture(newValue ? 'toggle_on' : 'toggle_off');
      };
      
      return toggle;
    }

    private createCycleControl(option: any, x: number, y: number) {
      const container = this.add.container(x, y).setDepth(11);
      
      // Previous button
      const prevBtn = this.add.text(-60, 0, '◀', {
        fontFamily: 'serif',
        fontSize: '24px',
        color: '#88ccff'
      }).setOrigin(0.5).setInteractive();
      
      // Current value text
      const currentValue = option.getValue();
      const valueText = this.add.text(0, 0, currentValue.charAt(0).toUpperCase() + currentValue.slice(1), {
        fontFamily: 'serif',
        fontSize: '20px',
        color: '#ffcc00',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      
      // Next button
      const nextBtn = this.add.text(60, 0, '▶', {
        fontFamily: 'serif',
        fontSize: '24px',
        color: '#88ccff'
      }).setOrigin(0.5).setInteractive();
      
      // Button interactions
      const updateValue = (direction: number) => {
        const currentIndex = option.options.indexOf(option.getValue());
        const newIndex = (currentIndex + direction + option.options.length) % option.options.length;
        const newValue = option.options[newIndex];
        option.setValue(newValue);
        valueText.setText(newValue.charAt(0).toUpperCase() + newValue.slice(1));
      };
      
      prevBtn.on('pointerdown', () => updateValue(-1));
      nextBtn.on('pointerdown', () => updateValue(1));
      
      container.add([prevBtn, valueText, nextBtn]);
      
      // Store update function for keyboard control
      (container as any).updateValue = () => updateValue(1);
      
      return { container, valueText };
    }

    private createActionButtons() {
      const buttonY = 450;
      const buttonSpacing = 200;
      
      // Apply button
      this.buttons.apply = this.add.image(300, buttonY, 'settings_apply_normal')
        .setDepth(11)
        .setInteractive();
      
      this.buttons.apply.on('pointerover', () => {
        if (this.textures.exists('settings_apply_hover')) {
          this.buttons.apply.setTexture('settings_apply_hover');
        }
      });
      
      this.buttons.apply.on('pointerout', () => {
        this.buttons.apply.setTexture('settings_apply_normal');
      });
      
      this.buttons.apply.on('pointerdown', () => {
        this.applySettings();
      });
      
      // Back button
      this.buttons.back = this.add.image(500, buttonY, 'settings_back_normal')
        .setDepth(11)
        .setInteractive();
      
      this.buttons.back.on('pointerover', () => {
        if (this.textures.exists('settings_back_hover')) {
          this.buttons.back.setTexture('settings_back_hover');
        }
      });
      
      this.buttons.back.on('pointerout', () => {
        this.buttons.back.setTexture('settings_back_normal');
      });
      
      this.buttons.back.on('pointerdown', () => {
        this.goBack();
      });
      
      // Add buttons to selectable elements
      this.optionElements.push(this.buttons.apply);
      this.optionElements.push(this.buttons.back);
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
    }

    private moveSelection(direction: number) {
      // Move between settings options + apply + back buttons
      const totalOptions = this.settingsOptions.length + 2;
      this.selectedIndex = (this.selectedIndex + direction + totalOptions) % totalOptions;
      this.updateSelection();
    }

    private adjustSelectedOption(direction: number) {
      if (this.selectedIndex >= this.settingsOptions.length) return;
      
      const option = this.settingsOptions[this.selectedIndex];
      const element = this.optionElements[this.selectedIndex];
      
      if (option.type === 'toggle' && (element as any).updateValue) {
        (element as any).updateValue();
      } else if (option.type === 'cycle' && (element as any).updateValue) {
        (element as any).updateValue();
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
        // Adjust the selected option
        this.adjustSelectedOption(1);
      }
    }

    private updateSelection() {
      // Reset all highlights
      this.optionElements.forEach((element, index) => {
        if (element && element.clearTint) {
          element.clearTint();
          element.setAlpha(0.8);
        }
      });
      
      // Reset button highlights
      Object.values(this.buttons).forEach(button => {
        button.clearTint();
        button.setAlpha(0.8);
      });
      
      // Highlight selected element
      if (this.selectedIndex < this.settingsOptions.length) {
        // Highlight settings option
        const selectedElement = this.optionElements[this.selectedIndex];
        if (selectedElement && selectedElement.setTint) {
          selectedElement.setTint(0xffff88);
          selectedElement.setAlpha(1);
        }
      } else if (this.selectedIndex === this.settingsOptions.length) {
        // Highlight apply button
        this.buttons.apply.setTint(0xffff88);
        this.buttons.apply.setAlpha(1);
      } else if (this.selectedIndex === this.settingsOptions.length + 1) {
        // Highlight back button
        this.buttons.back.setTint(0xffff88);
        this.buttons.back.setAlpha(1);
      }
    }

    private applySettings() {
      if (this.animating) return;
      this.animating = true;
      
      // Apply all temporary settings to the settings system
      Object.keys(this.tempSettings).forEach(key => {
        const currentSettings = this.settingsSystem.getSettings();
        
        if (key === 'sound' && currentSettings.sound !== this.tempSettings.sound) {
          this.settingsSystem.toggleSound();
        } else if (key === 'music' && currentSettings.music !== this.tempSettings.music) {
          this.settingsSystem.toggleMusic();
        } else if (key === 'difficulty' && currentSettings.difficulty !== this.tempSettings.difficulty) {
          // Cycle through difficulty until we reach the desired setting
          while (this.settingsSystem.getSettings().difficulty !== this.tempSettings.difficulty) {
            this.settingsSystem.cycleDifficulty();
          }
        }
      });
      
      // Show confirmation
      this.titleText.setText('Settings Applied!');
      this.titleText.setColor('#28a745');
      
      // Return to main menu after delay
      this.time.delayedCall(1500, () => {
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