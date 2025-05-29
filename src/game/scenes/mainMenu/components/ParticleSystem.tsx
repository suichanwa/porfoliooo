export class ParticleSystem {
  private scene: Phaser.Scene;
  private emitters: Phaser.GameObjects.Particles.ParticleEmitter[] = [];
  private graphics: Phaser.GameObjects.Graphics[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  create() {
    this.createFloatingMotes();
    this.createMysticalAura();
    this.createEnergyStreams();
  }

  private createFloatingMotes() {
    // Create texture for motes if it doesn't exist
    if (!this.scene.textures.exists('mote')) {
      const moteGraphic = this.scene.make.graphics({ x: 0, y: 0 });
      moteGraphic.fillStyle(0x88ccff);
      moteGraphic.fillCircle(4, 4, 2);
      moteGraphic.generateTexture('mote', 8, 8);
      moteGraphic.destroy();
    }

    // Floating particles from bottom to top
    const floatingMotes = this.scene.add.particles(0, 0, 'mote', {
      x: { min: 100, max: 700 },
      y: 650,
      lifespan: { min: 8000, max: 12000 },
      speedY: { min: -20, max: -5 },
      speedX: { min: -10, max: 10 },
      scale: { min: 0.3, max: 0.8 },
      alpha: { min: 0.2, max: 0.6 },
      tint: [0x88ccff, 0xaaccff, 0x66aaff],
      frequency: 300,
      blendMode: 'ADD'
    });
    
    floatingMotes.setDepth(3);
    this.emitters.push(floatingMotes);
  }

  private createMysticalAura() {
    // Subtle aura around the screen edges
    const positions = [
      { x: 50, y: 300 },   // Left
      { x: 750, y: 300 },  // Right
      { x: 400, y: 50 },   // Top
      { x: 400, y: 550 }   // Bottom
    ];

    positions.forEach(pos => {
      if (!this.scene.textures.exists('aura')) {
        const auraGraphic = this.scene.make.graphics({ x: 0, y: 0 });
        auraGraphic.fillGradientStyle(0x88ccff, 0x88ccff, 0x88ccff, 0x88ccff, 0.8, 0.8, 0, 0);
        auraGraphic.fillCircle(6, 6, 6);
        auraGraphic.generateTexture('aura', 12, 12);
        auraGraphic.destroy();
      }

      const aura = this.scene.add.particles(pos.x, pos.y, 'aura', {
        lifespan: 4000,
        speed: { min: 5, max: 15 },
        scale: { start: 0.1, end: 0.8 },
        alpha: { start: 0.6, end: 0 },
        tint: [0x88ccff, 0x66aaff, 0xaaccff],
        frequency: 400,
        radial: true,
        blendMode: 'ADD'
      });
      
      aura.setDepth(2);
      this.emitters.push(aura);
    });
  }

  private createEnergyStreams() {
    // Create subtle energy streams that flow along the borders
    this.createEnergyStream({ x: 50, y: 50 }, { x: 750, y: 50 }); // Top
    this.createEnergyStream({ x: 750, y: 50 }, { x: 750, y: 550 }); // Right
    this.createEnergyStream({ x: 750, y: 550 }, { x: 50, y: 550 }); // Bottom
    this.createEnergyStream({ x: 50, y: 550 }, { x: 50, y: 50 }); // Left
  }

  private createEnergyStream(start: { x: number, y: number }, end: { x: number, y: number }) {
    const stream = this.scene.add.graphics();
    stream.setDepth(1);
    
    let progress = 0;
    const segments: { x: number, y: number, alpha: number }[] = [];
    
    this.scene.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        progress += 0.02;
        if (progress > 1) progress = 0;
        
        // Calculate current position
        const currentX = start.x + (end.x - start.x) * progress;
        const currentY = start.y + (end.y - start.y) * progress;
        
        // Add new segment
        segments.push({ x: currentX, y: currentY, alpha: 1 });
        
        // Remove old segments
        if (segments.length > 15) {
          segments.shift();
        }
        
        // Draw stream
        stream.clear();
        segments.forEach((segment, index) => {
          const alpha = (index / segments.length) * 0.4;
          const size = (index / segments.length) * 3;
          
          stream.fillStyle(0x88ccff, alpha);
          stream.fillCircle(segment.x, segment.y, size);
        });
      }
    });
    
    this.graphics.push(stream);
  }

  // Control methods
  pauseSystem() {
    this.emitters.forEach(emitter => {
      if (emitter.active) {
        emitter.pause();
      }
    });
  }

  resumeSystem() {
    this.emitters.forEach(emitter => {
      if (emitter.active) {
        emitter.resume();
      }
    });
  }

  stopSystem() {
    this.emitters.forEach(emitter => {
      if (emitter.active) {
        emitter.stop();
      }
    });
  }

  destroy() {
    this.emitters.forEach(emitter => {
      if (emitter) {
        emitter.destroy();
      }
    });
    
    this.graphics.forEach(graphic => {
      if (graphic) {
        graphic.destroy();
      }
    });
    
    this.emitters = [];
    this.graphics = [];
  }

  setVisible(visible: boolean) {
    this.emitters.forEach(emitter => {
      if (emitter) {
        emitter.setVisible(visible);
      }
    });
    
    this.graphics.forEach(graphic => {
      if (graphic) {
        graphic.setVisible(visible);
      }
    });
  }

  setAlpha(alpha: number) {
    this.emitters.forEach(emitter => {
      if (emitter) {
        emitter.setAlpha(alpha);
      }
    });
    
    this.graphics.forEach(graphic => {
      if (graphic) {
        graphic.setAlpha(alpha);
      }
    });
  }
}