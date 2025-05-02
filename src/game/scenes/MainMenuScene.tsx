import { Button } from "../assets/ui/Button";
import { generateTextureFromReactComponent } from "../utils/textureGenerator";
import { TemplateRuins } from "../assets/backgrounds/TemplateRuins";

// Instead of direct extension, we'll create a factory function that accepts the Phaser instance
export function createMainMenuScene(Phaser: any) {
  return class MainMenuScene extends Phaser.Scene {
    private gameTitle!: Phaser.GameObjects.Text;
    private menuButtons: Phaser.GameObjects.Image[] = [];
    private selectedButtonIndex: number = 0;
    private buttonCount: number = 3;
    private menuMusic!: Phaser.Sound.BaseSound;
    private animating: boolean = false;
    
    constructor() {
      super({ key: 'MainMenuScene' });
    }
    
    async preload() {
      // Load background
      await generateTextureFromReactComponent(
        TemplateRuins,
        { width: 800, height: 600, isMenuBackground: true },
        'menuBg',
        this
      );
      
      // Generate button textures
      const menuItems = [
        { id: 'start', text: 'Start Game', variant: 'primary' },
        { id: 'settings', text: 'Settings', variant: 'secondary' },
        { id: 'credits', text: 'Credits', variant: 'secondary' }
      ];
      
      for (const item of menuItems) {
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
          this
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
          this
        );
      }
      
      // Create particle texture
      const particleGraphic = this.make.graphics({ x: 0, y: 0 });
      particleGraphic.fillStyle(0xffffff);
      particleGraphic.fillCircle(8, 8, 2);
      particleGraphic.generateTexture('particle', 16, 16);
      
      // Load additional assets
      this.load.image('logo', 'https://i.imgur.com/Z1U1YTy.png'); // Replace with your actual logo
      this.load.audio('menuMusic', 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_28d9e8eb2e.mp3?filename=magic-in-the-air-43862.mp3');
      this.load.audio('buttonHover', 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_12b0c7443c.mp3?filename=interface-124464.mp3');
      this.load.audio('buttonClick', 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_c8c8a73b4a.mp3?filename=interface-124465.mp3');
    }
    
    create() {
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
      const logo = this.add.image(400, 140, 'logo').setScale(1.5);
      logo.setDepth(10);
      
      // Add title text with glow
      this.gameTitle = this.add.text(400, 220, 'Mystic Ruins', {
        fontFamily: 'serif',
        fontSize: '48px',
        color: '#ffffff',
        stroke: '#2a2a4a',
        strokeThickness: 6,
        align: 'center'
      }).setOrigin(0.5);
      this.gameTitle.setDepth(10);
      
      // Add subtitle
      const subtitle = this.add.text(400, 270, 'Lost Civilization', {
        fontFamily: 'serif',
        fontSize: '24px',
        color: '#aaccff',
        align: 'center'
      }).setOrigin(0.5);
      subtitle.setDepth(10);
      
      // Add menu buttons
      this.addMenuButtons();
      
      // Add decorative runes around the border
      this.addDecorativeBorder();
      
      // Add version number
      this.add.text(10, 580, 'v0.1.0', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        align: 'left'
      }).setAlpha(0.6);
      
      // Add copyright
      this.add.text(790, 580, '© 2023', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#ffffff',
        align: 'right'
      }).setOrigin(1, 0).setAlpha(0.6);
      
      // Setup input
      this.setupInput();
      
      // Play menu music
      this.menuMusic = this.sound.add('menuMusic', { loop: true, volume: 0.5 });
      this.menuMusic.play();
      
      // Initial button highlight
      this.selectButton(0);
      
      // Add fade-in effect
      this.cameras.main.fadeIn(1000, 0, 0, 0);
    }
    
    addMenuButtons() {
      const buttonData = [
        { id: 'start', y: 360, callback: this.startGame.bind(this) },
        { id: 'settings', y: 420, callback: this.openSettings.bind(this) },
        { id: 'credits', y: 480, callback: this.showCredits.bind(this) }
      ];
      
      buttonData.forEach((button, index) => {
        const buttonImage = this.add.image(400, button.y, `button_${button.id}_normal`);
        buttonImage.setDepth(10);
        buttonImage.setInteractive();
        
        // Add hover effect
        buttonImage.on('pointerover', () => {
          this.selectButton(index);
          this.sound.play('buttonHover', { volume: 0.2 });
        });
        
        // Add click effect
        buttonImage.on('pointerup', () => {
          this.sound.play('buttonClick', { volume: 0.3 });
          button.callback();
        });
        
        this.menuButtons.push(buttonImage);
      });
    }
    
    selectButton(index: number) {
      // Make sure index is within bounds
      this.selectedButtonIndex = Math.max(0, Math.min(this.buttonCount - 1, index));
      
      // Update button textures
      this.menuButtons.forEach((button, i) => {
        const buttonId = ['start', 'settings', 'credits'][i];
        button.setTexture(`button_${buttonId}_${i === this.selectedButtonIndex ? 'hover' : 'normal'}`);
        
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
        this.sound.play('buttonHover', { volume: 0.2 });
      });
      
      this.input.keyboard.on('keydown-DOWN', () => {
        this.selectButton(this.selectedButtonIndex + 1);
        this.sound.play('buttonHover', { volume: 0.2 });
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
      
      this.sound.play('buttonClick', { volume: 0.3 });
      
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
      
      // Fade out menu music
      this.tweens.add({
        targets: this.menuMusic,
        volume: 0,
        duration: 1000
      });
      
      // Fade to black and start the game
      this.cameras.main.fadeOut(1000, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.menuMusic.stop();
        this.scene.start('MysticRuinsBattleScene');
      });
    }
    
    openSettings() {
      // Placeholder for settings menu
      // In a full implementation, this could open a settings overlay or scene
      this.gameTitle.setText('Settings\nComing Soon');
      setTimeout(() => {
        this.gameTitle.setText('Mystic Ruins');
      }, 1500);
    }
    
    showCredits() {
      // Placeholder for credits screen
      // In a full implementation, this could open a credits overlay or scene
      this.gameTitle.setText('Credits\nComing Soon');
      setTimeout(() => {
        this.gameTitle.setText('Mystic Ruins');
      }, 1500);
    }
    
    createParticles() {
      // Add mystical particles floating upward
      const particles = this.add.particles('particle');
      particles.setDepth(5);
      
      // Emit particles from bottom of screen
      particles.createEmitter({
        frame: 'particle',
        x: { min: 0, max: 800 },
        y: 600,
        lifespan: { min: 8000, max: 12000 },
        speedY: { min: -20, max: -50 },
        scale: { start: 0.1, end: 0 },
        alpha: { start: 0, end: 0.3, ease: 'Sine.easeInOut' },
        tint: [0x96f2ff, 0xf0d8ff, 0xc4f0ff],
        frequency: 200,
        blendMode: 'ADD'
      });
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
  };
}