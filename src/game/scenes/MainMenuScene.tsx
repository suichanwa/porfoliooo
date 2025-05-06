import { Button } from "../assets/ui/Button";
import { generateTextureFromReactComponent } from "../utils/textureGenerator";
import { TemplateRuins } from "../../assets/images/backgrounds/TemplateRuins";

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
      
      // Generate cycle button texture
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
        this
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
        this
      );
      
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
      
      // Add the cycling button
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
        });
        
        // Add click effect
        buttonImage.on('pointerup', () => {
          button.callback();
        });
        
        this.menuButtons.push(buttonImage);
      });
    }
    
    // Add the cycling difficulty button
    addCycleButton() {
      // Create a container for the button and text
      this.cycleButton = this.add.container(400, 540);
      this.cycleButton.setDepth(10);
      
      // Add the button background
      const buttonBg = this.add.image(0, 0, 'button_cycle_normal');
      
      // Add the label text
      const labelText = this.add.text(-80, 0, "Difficulty:", {
        fontFamily: 'serif',
        fontSize: '18px',
        color: '#ffffff',
      }).setOrigin(0, 0.5);
      
      // Add the cycling text that will change
      this.cycleText = this.add.text(10, 0, this.cycleOptions[this.currentCycleIndex], {
        fontFamily: 'serif',
        fontSize: '18px',
        color: '#ffcc00',
        fontStyle: 'bold'
      }).setOrigin(0, 0.5);
      
      // Make button interactive
      buttonBg.setInteractive();
      buttonBg.on('pointerover', () => {
        buttonBg.setTexture('button_cycle_hover');
      });
      
      buttonBg.on('pointerout', () => {
        buttonBg.setTexture('button_cycle_normal');
      });
      
      buttonBg.on('pointerdown', () => {
        this.cycleDifficulty();
      });
      
      // Add all elements to the container
      this.cycleButton.add([buttonBg, labelText, this.cycleText]);
      
      // Add a pulsing effect to draw attention
      this.tweens.add({
        targets: this.cycleText,
        scale: { from: 1, to: 1.1 },
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
    
    cycleDifficulty() {
      // Increment the index and wrap around if needed
      this.currentCycleIndex = (this.currentCycleIndex + 1) % this.cycleOptions.length;
      
      // Update the text
      this.cycleText.setText(this.cycleOptions[this.currentCycleIndex]);
      
      // Flash effect on change
      this.tweens.add({
        targets: this.cycleText,
        alpha: { from: 0.5, to: 1 },
        duration: 200,
        ease: 'Sine.easeOut'
      });
      
      // Save the selected difficulty (you could store this in a game config)
      this.saveDifficulty(this.cycleOptions[this.currentCycleIndex]);
    }
    
    saveDifficulty(difficulty: string) {
      // You can implement saving to localStorage or a game config object
      console.log(`Difficulty set to: ${difficulty}`);
      
      // Example of saving to localStorage
      localStorage.setItem('mysticRuins_difficulty', difficulty);
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
      // Make sure the particle texture exists
      if (!this.textures.exists('particle')) {
        const particleGraphic = this.make.graphics({ x: 0, y: 0 });
        particleGraphic.fillStyle(0xffffff);
        particleGraphic.fillCircle(8, 8, 2);
        particleGraphic.generateTexture('particle', 16, 16);
      }
      
      // Create a particle emitter manager
      const particles = this.add.particles('particle');
      particles.setDepth(5);
      
      // Create simple particle effects instead of using emitter
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
      } catch (error) {
        console.warn("Could not create particles:", error);
        
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
  };
}