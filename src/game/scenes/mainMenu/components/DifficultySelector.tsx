import { MENU_CONFIG } from '../config/MenuConfig';

export class DifficultySelector {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  private cycleText!: Phaser.GameObjects.Text;
  private currentIndex = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.loadSavedDifficulty();
  }

  create() {
    this.container = this.scene.add.container(400, MENU_CONFIG.LAYOUT.DIFFICULTY_Y);
    this.container.setDepth(10);

    const buttonBg = this.createBackground();
    const labelText = this.createLabel();
    const separator = this.createSeparator();
    this.cycleText = this.createCycleText();
    const indicator = this.createIndicator();

    this.setupInteractions(buttonBg);
    this.container.add([buttonBg, labelText, separator, this.cycleText, indicator]);
    
    this.createInstructionText();
  }

  private createBackground() {
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x2a2a4a, 0.9);
    bg.fillRoundedRect(-140, -25, 280, 50, 8);
    bg.lineStyle(2, 0x88ccff, 0.5);
    bg.strokeRoundedRect(-140, -25, 280, 50, 8);
    bg.setInteractive(new Phaser.Geom.Rectangle(-140, -25, 280, 50), Phaser.Geom.Rectangle.Contains);
    return bg;
  }

  private createLabel() {
    return this.scene.add.text(-120, 0, "Difficulty:", {
      fontFamily: 'serif',
      fontSize: '16px',
      color: '#ffffff',
      fontWeight: 'bold'
    }).setOrigin(0, 0.5);
  }

  private createSeparator() {
    return this.scene.add.text(-20, 0, "►", {
      fontFamily: 'serif',
      fontSize: '14px',
      color: '#88ccff',
    }).setOrigin(0.5, 0.5);
  }

  private createCycleText() {
    return this.scene.add.text(40, 0, MENU_CONFIG.DIFFICULTY_OPTIONS[this.currentIndex], {
      fontFamily: 'serif',
      fontSize: '18px',
      color: '#ffcc00',
      fontStyle: 'bold',
      stroke: '#2a2a4a',
      strokeThickness: 2
    }).setOrigin(0.5, 0.5);
  }

  private createIndicator() {
    const indicator = this.scene.add.graphics();
    this.updateIndicator(indicator);
    this.container.setData('difficultyIndicator', indicator);
    return indicator;
  }

  private updateIndicator(indicator: Phaser.GameObjects.Graphics) {
    const currentDifficulty = MENU_CONFIG.DIFFICULTY_OPTIONS[this.currentIndex];
    const color = MENU_CONFIG.DIFFICULTY_COLORS[currentDifficulty];
    
    indicator.clear();
    indicator.fillStyle(Phaser.Display.Color.HexStringToColor(color).color);
    indicator.fillCircle(100, 0, 8);
    indicator.lineStyle(2, 0xffffff, 0.8);
    indicator.strokeCircle(100, 0, 8);
    
    if (currentDifficulty === 'Insane') {
      indicator.lineStyle(3, 0xff0000, 0.6);
      indicator.strokeCircle(100, 0, 12);
    }
  }

  private setupInteractions(buttonBg: Phaser.GameObjects.Graphics) {
    buttonBg.on('pointerdown', () => this.cycleDifficulty());
    // Add hover effects here
  }

  private createInstructionText() {
    this.scene.add.text(400, MENU_CONFIG.LAYOUT.INSTRUCTION_Y, 'Click to change difficulty', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#888888',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0.7);
  }

  cycleDifficulty() {
    this.currentIndex = (this.currentIndex + 1) % MENU_CONFIG.DIFFICULTY_OPTIONS.length;
    
    this.scene.tweens.add({
      targets: this.cycleText,
      alpha: 0,
      scaleX: 0.8,
      duration: 100,
      ease: 'Power2',
      onComplete: () => {
        this.cycleText.setText(MENU_CONFIG.DIFFICULTY_OPTIONS[this.currentIndex]);
        
        const indicator = this.container.getData('difficultyIndicator');
        if (indicator) {
          this.updateIndicator(indicator);
        }
        
        this.scene.tweens.add({
          targets: this.cycleText,
          alpha: 1,
          scaleX: 1,
          duration: 150,
          ease: 'Back.easeOut'
        });
      }
    });

    if (MENU_CONFIG.DIFFICULTY_OPTIONS[this.currentIndex] === 'Insane') {
      this.scene.cameras.main.shake(100, 0.01);
    }

    this.saveDifficulty();
  }

  getCurrentDifficulty() {
    return MENU_CONFIG.DIFFICULTY_OPTIONS[this.currentIndex];
  }

  private saveDifficulty() {
    try {
      const difficulty = MENU_CONFIG.DIFFICULTY_OPTIONS[this.currentIndex];
      localStorage.setItem('mysticRuins_difficulty', difficulty);
    } catch (error) {
      console.warn('Could not save difficulty setting:', error);
    }
  }

  private loadSavedDifficulty() {
    try {
      const saved = localStorage.getItem('mysticRuins_difficulty');
      if (saved && MENU_CONFIG.DIFFICULTY_OPTIONS.includes(saved)) {
        this.currentIndex = MENU_CONFIG.DIFFICULTY_OPTIONS.indexOf(saved);
      }
    } catch (error) {
      console.warn('Could not load saved difficulty:', error);
    }
  }
}