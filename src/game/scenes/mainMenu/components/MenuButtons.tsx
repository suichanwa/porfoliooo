import { MENU_CONFIG } from '../config/MenuConfig';

export class MenuButtons {
  private scene: Phaser.Scene;
  private buttons: Phaser.GameObjects.Image[] = [];
  private selectedIndex = 0;
  private callbacks: Record<string, () => void>;

  constructor(scene: Phaser.Scene, callbacks: Record<string, () => void>) {
    this.scene = scene;
    this.callbacks = callbacks;
  }

  create() {
    MENU_CONFIG.BUTTONS.forEach((buttonConfig, index) => {
      const textureKey = `button_${buttonConfig.id}_normal`;
      
      if (!this.scene.textures.exists(textureKey)) {
        console.warn(`Texture ${textureKey} not found, creating fallback`);
        this.createButtonFallback(buttonConfig.id);
      }
      
      const button = this.scene.add.image(400, buttonConfig.y, textureKey);
      button.setDepth(10).setInteractive();
      
      button.on('pointerover', () => this.selectButton(index));
      button.on('pointerup', () => this.callbacks[buttonConfig.id]?.());
      
      this.buttons.push(button);
    });
  }

  selectButton(index: number) {
    this.selectedIndex = Math.max(0, Math.min(this.buttons.length - 1, index));
    
    this.buttons.forEach((button, i) => {
      const buttonId = MENU_CONFIG.BUTTONS[i].id;
      const texture = `button_${buttonId}_${i === this.selectedIndex ? 'hover' : 'normal'}`;
      
      if (this.scene.textures.exists(texture)) {
        button.setTexture(texture);
      }
      
      if (i === this.selectedIndex) {
        this.scene.tweens.add({
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

  getSelectedIndex() {
    return this.selectedIndex;
  }

  executeSelected() {
    const selectedButton = MENU_CONFIG.BUTTONS[this.selectedIndex];
    this.callbacks[selectedButton.id]?.();
  }

  private createButtonFallback(buttonId: string) {
    // Fallback button creation logic
  }
}