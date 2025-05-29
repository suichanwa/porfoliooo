import { generateTextureFromReactComponent } from '../utils/textureGenerator';
import TemplateRuins from '../../assets/images/backgrounds/TemplateRuins';
import Frame from '../assets/ui/Frame';
import Button from '../assets/ui/Button';

export function createMainMenuScene(Phaser: any) {
  return class MainMenuScene extends Phaser.Scene {
    private selectedIndex = 0;
    private menuItems = [
      { id: 'start', text: 'Start Adventure', icon: '⚔️' },
      { id: 'settings', text: 'Settings', icon: '⚙️' },
      { id: 'credits', text: 'Credits', icon: '📜' }
    ];
    private sceneInitialized = false;
    
    // Visual elements
    private backgroundImage!: Phaser.GameObjects.Image;
    private titleText!: Phaser.GameObjects.Text;
    private subtitleText!: Phaser.GameObjects.Text;
    private menuButtons: Phaser.GameObjects.Image[] = [];
    private menuTexts: Phaser.GameObjects.Text[] = [];
    private menuIcons: Phaser.GameObjects.Text[] = [];
    private decorativeFrames: Phaser.GameObjects.Image[] = [];
    private backgroundParticles: Phaser.GameObjects.Graphics[] = [];
    private runeSymbols: Phaser.GameObjects.Graphics[] = [];
    private glowEffect!: Phaser.GameObjects.Graphics;
    
    // Animation tweens
    private titleTween?: Phaser.Tweens.Tween;
    private particleTweens: Phaser.Tweens.Tween[] = [];

    constructor() {
      super({ key: 'MainMenuScene' });
    }

    preload() {
      console.log('MainMenuScene preload started');
      // The assets will be generated in create()
      console.log('MainMenuScene preload completed');
    }

    create() {
      console.log('MainMenuScene create started');
      
      try {
        this.setupScene();
        this.sceneInitialized = true;
        console.log('MainMenuScene created successfully');
      } catch (error) {
        console.error('Error creating main menu scene:', error);
        this.showErrorState();
      }
    }

    private async setupScene() {
      console.log('Setting up main menu scene...');
      
      // Load the background image first
      await this.loadBackgroundAssets();
      
      // Create the background
      this.createBackground();
      
      // Create decorative elements
      this.createDecorations();
      
      // Create mystical particle effects
      this.createParticleEffects();
      
      // Create main UI elements
      await this.createTitle();
      await this.createMenuButtons();
      this.setupInput();
      this.updateMenuSelection();
      
      // Start entrance animations
      this.playEntranceAnimation();
    }

    private async loadBackgroundAssets() {
      console.log('Loading background assets...');
      
      try {
        // Generate the menu background texture
        await generateTextureFromReactComponent(
          TemplateRuins,
          { 
            width: 800, 
            height: 600, 
            isMenuBackground: true 
          },
          'menu_background',
          this
        );
        
        // Generate decorative frames
        await generateTextureFromReactComponent(
          Frame,
          { 
            width: 300, 
            height: 80, 
            variant: 'decorative' 
          },
          'title_frame',
          this
        );
        
        await generateTextureFromReactComponent(
          Frame,
          { 
            width: 120, 
            height: 120, 
            variant: 'default' 
          },
          'corner_frame',
          this
        );
        
        console.log('Background assets loaded successfully');
      } catch (error) {
        console.error('Error loading background assets:', error);
        this.createFallbackBackground();
      }
    }

    private createBackground() {
      console.log('Creating background...');
      
      // Use the generated background texture
      if (this.textures.exists('menu_background')) {
        this.backgroundImage = this.add.image(400, 300, 'menu_background');
        this.backgroundImage.setDepth(0);
        console.log('Menu background created from TemplateRuins');
      } else {
        // Fallback gradient background
        this.createFallbackBackground();
      }
    }

    private createDecorations() {
      console.log('Creating decorative elements...');
      
      // Add decorative frames in corners
      if (this.textures.exists('corner_frame')) {
        const corners = [
          { x: 100, y: 100 },
          { x: 700, y: 100 },
          { x: 100, y: 500 },
          { x: 700, y: 500 }
        ];
        
        corners.forEach((corner, index) => {
          const frame = this.add.image(corner.x, corner.y, 'corner_frame');
          frame.setDepth(2);
          frame.setAlpha(0.7);
          frame.setRotation(index * Math.PI / 2);
          this.decorativeFrames.push(frame);
          
          // Add subtle animation to frames
          this.tweens.add({
            targets: frame,
            alpha: { from: 0.7, to: 0.9 },
            scale: { from: 1, to: 1.05 },
            duration: 3000 + index * 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        });
      }
      
      // Create mystical rune symbols
      this.createRuneDecorations();
    }

    private createRuneDecorations() {
      // Create decorative rune symbols around the screen
      const runePositions = [
        { x: 150, y: 150 }, { x: 650, y: 150 },
        { x: 150, y: 450 }, { x: 650, y: 450 },
        { x: 75, y: 300 }, { x: 725, y: 300 }
      ];
      
      runePositions.forEach((pos, index) => {
        const rune = this.add.graphics();
        rune.setPosition(pos.x, pos.y);
        rune.setDepth(3);
        rune.setAlpha(0.4);
        
        // Draw mystical rune symbol with enhanced design
        rune.lineStyle(2, 0x88ccff, 0.8);
        rune.beginPath();
        rune.arc(0, 0, 20, 0, Math.PI * 2);
        rune.strokePath();
        
        // Inner cross pattern
        rune.beginPath();
        rune.moveTo(-15, -15);
        rune.lineTo(15, 15);
        rune.moveTo(15, -15);
        rune.lineTo(-15, 15);
        rune.moveTo(0, -20);
        rune.lineTo(0, 20);
        rune.moveTo(-20, 0);
        rune.lineTo(20, 0);
        rune.strokePath();
        
        // Add inner circle
        rune.lineStyle(1, 0xaaccff, 0.6);
        rune.strokeCircle(0, 0, 10);
        
        this.runeSymbols.push(rune);
        
        // Animate rune rotation and pulsing
        this.tweens.add({
          targets: rune,
          rotation: Math.PI * 2,
          duration: 20000 + index * 2000,
          repeat: -1,
          ease: 'Linear'
        });
        
        this.tweens.add({
          targets: rune,
          alpha: { from: 0.4, to: 0.8 },
          scale: { from: 1, to: 1.2 },
          duration: 3000 + index * 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      });
    }

    private createParticleEffects() {
      // Create floating magical particles
      for (let i = 0; i < 20; i++) {
        const particle = this.add.graphics();
        particle.fillStyle(0x88ccff, 0.6);
        particle.fillCircle(0, 0, 2);
        particle.setPosition(
          Math.random() * 800,
          Math.random() * 600
        );
        particle.setDepth(4);
        
        this.backgroundParticles.push(particle);
        
        // Create floating animation
        const tween = this.tweens.add({
          targets: particle,
          y: particle.y - 100,
          alpha: { from: 0.6, to: 0 },
          scale: { from: 1, to: 0.3 },
          duration: 4000 + Math.random() * 2000,
          ease: 'Sine.easeOut',
          onComplete: () => {
            // Reset particle position
            particle.setPosition(
              Math.random() * 800,
              600 + Math.random() * 100
            );
            particle.setAlpha(0.6);
            particle.setScale(1);
            tween.restart();
          }
        });
        
        this.particleTweens.push(tween);
      }
    }

    private async createTitle() {
      console.log('Creating title elements...');
      
      // Main title with enhanced styling
      this.titleText = this.add.text(400, 150, 'MYSTIC RUINS', {
        fontFamily: 'serif',
        fontSize: '56px',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#2a2a4a',
        strokeThickness: 6,
        shadow: {
          offsetX: 3,
          offsetY: 3,
          color: '#000000',
          blur: 8,
          stroke: true,
          fill: true
        }
      }).setOrigin(0.5).setDepth(10);
      
      // Subtitle with mystical feel
      this.subtitleText = this.add.text(400, 200, '~ Lost Civilization ~', {
        fontFamily: 'serif',
        fontSize: '18px',
        fontStyle: 'italic',
        color: '#aaccff',
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 4
        }
      }).setOrigin(0.5).setDepth(10);
      
      // Add decorative frame behind title if available
      if (this.textures.exists('title_frame')) {
        const titleFrame = this.add.image(400, 175, 'title_frame');
        titleFrame.setDepth(9);
        titleFrame.setAlpha(0.8);
      }
      
      // Add magical glow effect to title
      this.glowEffect = this.add.graphics();
      this.glowEffect.setDepth(8);
      this.updateTitleGlow();
    }

    private updateTitleGlow() {
      this.glowEffect.clear();
      this.glowEffect.fillGradientStyle(0x88ccff, 0x88ccff, 0x4466bb, 0x4466bb, 0.2, 0.2, 0.05, 0.05);
      this.glowEffect.fillEllipse(400, 175, 350, 80);
    }

    private async createMenuButtons() {
      console.log('Creating menu buttons...');
      
      const startY = 300;
      const buttonSpacing = 70;
      
      for (let index = 0; index < this.menuItems.length; index++) {
        const item = this.menuItems[index];
        const y = startY + (index * buttonSpacing);
        
        try {
          // Generate button texture for each state
          await generateTextureFromReactComponent(
            Button,
            {
              width: 250,
              height: 50,
              text: item.text,
              variant: 'primary',
              state: 'normal'
            },
            `button_${item.id}_normal`,
            this
          );
          
          await generateTextureFromReactComponent(
            Button,
            {
              width: 250,
              height: 50,
              text: item.text,
              variant: 'primary',
              state: 'hover'
            },
            `button_${item.id}_hover`,
            this
          );
          
          // Create button using generated texture
          const button = this.add.image(400, y, `button_${item.id}_normal`);
          button.setDepth(15);
          button.setInteractive();
          
          // Create icon
          const icon = this.add.text(320, y, item.icon, {
            fontSize: '24px'
          }).setOrigin(0.5);
          icon.setDepth(16);
          
          // Store references
          button.setName(`button_${index}`);
          icon.setName(`icon_${index}`);
          
          this.menuButtons.push(button);
          this.menuIcons.push(icon);
          
          // Button interactions
          button.on('pointerover', () => {
            this.selectedIndex = index;
            this.updateMenuSelection();
            this.playHoverSound();
          });
          
          button.on('pointerdown', () => {
            this.playClickSound();
            this.selectMenuItem();
          });
          
          // Set initial state for entrance animation
          button.setAlpha(0);
          icon.setAlpha(0);
          button.setScale(0.8);
          icon.setScale(0.8);
          
        } catch (error) {
          console.error(`Error creating button ${item.id}:`, error);
          // Create fallback button
          this.createFallbackButton(index, item, y);
        }
      }
    }

    private createFallbackButton(index: number, item: any, y: number) {
      // Fallback button creation using graphics
      const button = this.add.graphics();
      button.setPosition(400, y);
      button.setDepth(15);
      
      // Create button text
      const text = this.add.text(400, y, item.text, {
        fontFamily: 'serif',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff',
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 3
        }
      }).setOrigin(0.5);
      text.setDepth(16);
      
      // Create icon
      const icon = this.add.text(320, y, item.icon, {
        fontSize: '24px'
      }).setOrigin(0.5);
      icon.setDepth(16);
      
      // Store references
      button.setName(`button_${index}`);
      text.setName(`text_${index}`);
      icon.setName(`icon_${index}`);
      
      this.menuButtons.push(button as any);
      this.menuTexts.push(text);
      this.menuIcons.push(icon);
      
      // Button interactions
      const buttonArea = this.add.zone(400, y, 250, 50);
      buttonArea.setInteractive();
      buttonArea.setDepth(17);
      
      buttonArea.on('pointerover', () => {
        this.selectedIndex = index;
        this.updateMenuSelection();
        this.playHoverSound();
      });
      
      buttonArea.on('pointerdown', () => {
        this.playClickSound();
        this.selectMenuItem();
      });
      
      // Set initial state
      button.setAlpha(0);
      text.setAlpha(0);
      icon.setAlpha(0);
    }

    private updateMenuSelection() {
      this.menuButtons.forEach((button, index) => {
        const icon = this.menuIcons[index];
        const isSelected = index === this.selectedIndex;
        const item = this.menuItems[index];
        
        // Update button texture if using generated buttons
        if (button instanceof Phaser.GameObjects.Image) {
          const textureKey = `button_${item.id}_${isSelected ? 'hover' : 'normal'}`;
          if (this.textures.exists(textureKey)) {
            button.setTexture(textureKey);
          }
        } else {
          // Fallback graphics button
          this.drawFallbackButton(button as Phaser.GameObjects.Graphics, isSelected);
        }
        
        // Animate selection
        const targetScale = isSelected ? 1.05 : 1.0;
        const targetAlpha = isSelected ? 1.0 : 0.9;
        
        this.tweens.add({
          targets: [button, icon],
          scaleX: targetScale,
          scaleY: targetScale,
          alpha: targetAlpha,
          duration: 200,
          ease: 'Power2'
        });
        
        // Special effects for selected item
        if (isSelected && icon) {
          // Add floating effect to icon
          this.tweens.add({
            targets: icon,
            y: icon.y - 3,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        } else if (icon) {
          // Stop floating effect
          this.tweens.killTweensOf(icon);
          const baseY = 300 + (index * 70);
          icon.y = baseY;
        }
      });
    }

    private drawFallbackButton(button: Phaser.GameObjects.Graphics, isSelected: boolean) {
      button.clear();
      
      const width = 250;
      const height = 50;
      
      if (isSelected) {
        // Selected button - using Frame-like styling
        button.fillGradientStyle(0x4488ff, 0x6699ff, 0x2266dd, 0x4488ff, 1, 1, 1, 1);
        button.fillRoundedRect(-width/2, -height/2, width, height, 8);
        
        // Mystical border like Frame component
        button.lineStyle(2, 0x88ccff, 0.9);
        button.strokeRoundedRect(-width/2, -height/2, width, height, 8);
        
        // Inner highlight
        button.lineStyle(1, 0xaaccff, 0.7);
        button.strokeRoundedRect(-width/2 + 2, -height/2 + 2, width - 4, height - 4, 6);
      } else {
        // Normal button - subtle Frame-like styling
        button.fillGradientStyle(0x334466, 0x445577, 0x223344, 0x334466, 0.8, 0.8, 0.8, 0.8);
        button.fillRoundedRect(-width/2, -height/2, width, height, 8);
        
        // Subtle mystical border
        button.lineStyle(1.5, 0x556688, 0.6);
        button.strokeRoundedRect(-width/2, -height/2, width, height, 8);
      }
    }

    private setupInput() {
      // Keyboard input with smoother handling
      let lastInputTime = 0;
      const inputDelay = 150;
      
      this.input.keyboard.on('keydown-UP', () => {
        const now = Date.now();
        if (now - lastInputTime < inputDelay) return;
        lastInputTime = now;
        
        this.selectedIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : this.menuItems.length - 1;
        this.updateMenuSelection();
        this.playNavigateSound();
      });

      this.input.keyboard.on('keydown-DOWN', () => {
        const now = Date.now();
        if (now - lastInputTime < inputDelay) return;
        lastInputTime = now;
        
        this.selectedIndex = this.selectedIndex < this.menuItems.length - 1 ? this.selectedIndex + 1 : 0;
        this.updateMenuSelection();
        this.playNavigateSound();
      });

      this.input.keyboard.on('keydown-SPACE', () => {
        this.selectMenuItem();
        this.playClickSound();
      });

      this.input.keyboard.on('keydown-ENTER', () => {
        this.selectMenuItem();
        this.playClickSound();
      });
    }

    private selectMenuItem() {
      const selectedItem = this.menuItems[this.selectedIndex];
      
      // Add button press animation
      const button = this.menuButtons[this.selectedIndex];
      const icon = this.menuIcons[this.selectedIndex];
      
      this.tweens.add({
        targets: [button, icon],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 100,
        yoyo: true,
        ease: 'Power2'
      });
      
      // Handle selection after animation
      this.time.delayedCall(150, () => {
        switch (selectedItem.id) {
          case 'start':
            this.startGame();
            break;
          case 'settings':
            console.log('Settings selected - Future feature');
            this.showComingSoon('Settings');
            break;
          case 'credits':
            console.log('Credits selected - Future feature');
            this.showComingSoon('Credits');
            break;
        }
      });
    }

    private startGame() {
      console.log('Starting adventure...');
      
      // Enhanced exit animation
      this.cameras.main.flash(100, 255, 255, 255, false);
      
      // Fade out all elements
      this.tweens.add({
        targets: [this.titleText, this.subtitleText],
        alpha: 0,
        y: '-=50',
        duration: 500,
        ease: 'Power2'
      });
      
      this.menuButtons.forEach((button, index) => {
        this.tweens.add({
          targets: [button, this.menuIcons[index]],
          alpha: 0,
          x: '+=100',
          duration: 300,
          delay: index * 100,
          ease: 'Power2'
        });
      });
      
      // Transition to battle scene
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MysticRuinsBattleScene', {
          enemyType: 'SLIME',
          difficulty: 'Normal'
        });
      });
    }

    private showComingSoon(feature: string) {
      // Create coming soon popup with Frame styling
      const popup = this.add.graphics();
      popup.fillStyle(0x000000, 0.8);
      popup.fillRect(0, 0, 800, 600);
      popup.setDepth(50);
      
      const popupText = this.add.text(400, 300, `${feature}\nComing Soon!`, {
        fontFamily: 'serif',
        fontSize: '32px',
        color: '#ffffff',
        align: 'center',
        shadow: {
          offsetX: 2,
          offsetY: 2,
          color: '#000000',
          blur: 5
        }
      }).setOrigin(0.5).setDepth(51);
      
      const closeText = this.add.text(400, 380, 'Click anywhere to close', {
        fontFamily: 'serif',
        fontSize: '16px',
        color: '#aaccff',
        align: 'center'
      }).setOrigin(0.5).setDepth(51);
      
      // Make popup interactive
      popup.setInteractive();
      popup.on('pointerdown', () => {
        popup.destroy();
        popupText.destroy();
        closeText.destroy();
      });
      
      // Auto close after 3 seconds
      this.time.delayedCall(3000, () => {
        if (popup.active) {
          popup.destroy();
          popupText.destroy();
          closeText.destroy();
        }
      });
    }

    private playEntranceAnimation() {
      // Background fade in
      if (this.backgroundImage) {
        this.backgroundImage.setAlpha(0);
        this.tweens.add({
          targets: this.backgroundImage,
          alpha: 1,
          duration: 1500,
          ease: 'Power2'
        });
      }
      
      // Decorative frames entrance
      this.decorativeFrames.forEach((frame, index) => {
        frame.setAlpha(0);
        frame.setScale(0.5);
        this.tweens.add({
          targets: frame,
          alpha: 0.7,
          scale: 1,
          duration: 800,
          delay: 200 + (index * 100),
          ease: 'Back.easeOut'
        });
      });
      
      // Title entrance
      this.titleText.setAlpha(0);
      this.titleText.y -= 30;
      this.subtitleText.setAlpha(0);
      this.subtitleText.y -= 20;
      
      this.tweens.add({
        targets: this.titleText,
        alpha: 1,
        y: '+=30',
        duration: 1000,
        delay: 400,
        ease: 'Back.easeOut'
      });
      
      this.tweens.add({
        targets: this.subtitleText,
        alpha: 1,
        y: '+=20',
        duration: 800,
        delay: 600,
        ease: 'Power2'
      });
      
      // Menu buttons entrance
      this.menuButtons.forEach((button, index) => {
        const icon = this.menuIcons[index];
        
        this.tweens.add({
          targets: [button, icon],
          alpha: 1,
          scaleX: 1,
          scaleY: 1,
          duration: 600,
          delay: 1000 + (index * 150),
          ease: 'Back.easeOut'
        });
      });
      
      // Start title glow animation
      this.titleTween = this.tweens.add({
        targets: this.glowEffect,
        alpha: { from: 0.2, to: 0.5 },
        scaleX: { from: 1, to: 1.1 },
        scaleY: { from: 1, to: 1.1 },
        duration: 2500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      // Camera fade in
      this.cameras.main.fadeIn(1200, 15, 17, 35);
    }

    private createFallbackBackground() {
      // Fallback gradient background
      const bg = this.add.graphics();
      bg.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x2a2a4e, 0x2a2a4e, 1, 1, 1, 1);
      bg.fillRect(0, 0, 800, 600);
      bg.setDepth(0);
      
      console.log('Created fallback background');
    }

    // Audio feedback methods (placeholder for future audio implementation)
    private playHoverSound() {
      // Future: Play hover sound effect
    }
    
    private playClickSound() {
      // Future: Play click sound effect
    }
    
    private playNavigateSound() {
      // Future: Play navigation sound effect
    }

    private showErrorState() {
      const errorBg = this.add.graphics();
      errorBg.fillStyle(0x000000, 0.9);
      errorBg.fillRect(0, 0, 800, 600);

      const errorText = this.add.text(400, 300, 'Scene Error: Failed to initialize main menu', {
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
      return 100;
    }

    getCurrentLoadingTask(): string {
      return 'Menu ready!';
    }

    getLoadingError(): string | null {
      return null;
    }

    isCurrentlyLoading(): boolean {
      return false;
    }

    destroy() {
      console.log('MainMenuScene cleanup started');
      
      // Clean up animations
      if (this.titleTween) {
        this.titleTween.destroy();
      }
      
      this.particleTweens.forEach(tween => {
        if (tween) tween.destroy();
      });
      
      console.log('MainMenuScene destroyed and cleaned up');
      super.destroy();
    }
  };
}