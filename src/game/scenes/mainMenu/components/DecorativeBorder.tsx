export class DecorativeBorder {
  private scene: Phaser.Scene;
  private borderElements: Phaser.GameObjects.Graphics[] = [];
  private animationTweens: Phaser.Tweens.Tween[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create() {
    this.createCornerElements();
    this.createBorderLines();
    this.startAnimations();
  }

  private createCornerElements() {
    const corners = [
      { x: 50, y: 50, rotation: 0 },           // Top-left
      { x: 750, y: 50, rotation: Math.PI / 2 }, // Top-right
      { x: 750, y: 550, rotation: Math.PI },    // Bottom-right
      { x: 50, y: 550, rotation: -Math.PI / 2 } // Bottom-left
    ];

    corners.forEach(corner => {
      const element = this.scene.add.graphics();
      element.setPosition(corner.x, corner.y);
      element.setRotation(corner.rotation);
      element.setDepth(15);

      // Draw decorative corner pattern
      this.drawCornerPattern(element);
      
      this.borderElements.push(element);
    });
  }

  private drawCornerPattern(graphics: Phaser.GameObjects.Graphics) {
    graphics.lineStyle(2, 0x88ccff, 0.8);
    
    // Outer arc
    graphics.beginPath();
    graphics.arc(0, 0, 30, -Math.PI / 2, 0);
    graphics.stroke();
    
    // Inner decorative lines
    graphics.lineStyle(1, 0xaaccff, 0.6);
    
    // Radial lines
    for (let i = 0; i < 3; i++) {
      const angle = (-Math.PI / 2) + (i * Math.PI / 8);
      const startRadius = 15;
      const endRadius = 25;
      
      const startX = Math.cos(angle) * startRadius;
      const startY = Math.sin(angle) * startRadius;
      const endX = Math.cos(angle) * endRadius;
      const endY = Math.sin(angle) * endRadius;
      
      graphics.lineBetween(startX, startY, endX, endY);
    }
    
    // Central ornament
    graphics.fillStyle(0x88ccff, 0.3);
    graphics.fillCircle(0, 0, 4);
    
    graphics.lineStyle(1, 0xffffff, 0.8);
    graphics.strokeCircle(0, 0, 4);
  }

  private createBorderLines() {
    // Top border
    this.createBorderLine(100, 30, 600, 30);
    
    // Bottom border
    this.createBorderLine(100, 570, 600, 570);
    
    // Left border
    this.createBorderLine(30, 100, 30, 500);
    
    // Right border
    this.createBorderLine(770, 100, 770, 500);
  }

  private createBorderLine(x1: number, y1: number, x2: number, y2: number) {
    const line = this.scene.add.graphics();
    line.setDepth(14);
    
    // Main border line
    line.lineStyle(2, 0x88ccff, 0.4);
    line.lineBetween(x1, y1, x2, y2);
    
    // Decorative dots along the line
    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const segments = Math.floor(distance / 50);
    
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      
      line.fillStyle(0xaaccff, 0.6);
      line.fillCircle(x, y, 2);
    }
    
    this.borderElements.push(line);
  }

  private startAnimations() {
    // Gentle pulsing animation for corner elements
    this.borderElements.slice(0, 4).forEach((element, index) => {
      const tween = this.scene.tweens.add({
        targets: element,
        alpha: { from: 0.8, to: 0.4 },
        duration: 2000 + (index * 200),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
      
      this.animationTweens.push(tween);
    });
    
    // Subtle glow animation for border lines
    this.borderElements.slice(4).forEach((element, index) => {
      const tween = this.scene.tweens.add({
        targets: element,
        alpha: { from: 0.6, to: 0.3 },
        duration: 3000 + (index * 300),
        yoyo: true,
        repeat: -1,
        ease: 'Power2'
      });
      
      this.animationTweens.push(tween);
    });
  }

  pauseAnimations() {
    this.animationTweens.forEach(tween => {
      if (tween && tween.isActive()) {
        tween.pause();
      }
    });
  }

  resumeAnimations() {
    this.animationTweens.forEach(tween => {
      if (tween && tween.isPaused()) {
        tween.resume();
      }
    });
  }

  destroy() {
    // Stop all animations
    this.animationTweens.forEach(tween => {
      if (tween && tween.isActive()) {
        tween.destroy();
      }
    });
    
    // Destroy all graphics elements
    this.borderElements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    
    this.animationTweens = [];
    this.borderElements = [];
  }

  setVisible(visible: boolean) {
    this.borderElements.forEach(element => {
      if (element) {
        element.setVisible(visible);
      }
    });
  }

  setAlpha(alpha: number) {
    this.borderElements.forEach(element => {
      if (element) {
        element.setAlpha(alpha);
      }
    });
  }
}