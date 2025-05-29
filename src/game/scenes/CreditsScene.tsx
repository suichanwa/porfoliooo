import { LoadingManager } from '../utils/LoadingManager';
import { AssetLoader } from '../utils/AssetLoader';
import { generateTextureFromReactComponent } from '../utils/textureGenerator';
import { Button } from '../assets/ui/Button';

// Credits Asset Loader
class CreditsAssetLoader {
  private scene: Phaser.Scene;
  private loadingManager: LoadingManager;

  constructor(scene: Phaser.Scene, loadingManager: LoadingManager) {
    this.scene = scene;
    this.loadingManager = loadingManager;
  }

  async loadAllAssets() {
    try {
      console.log('CreditsAssetLoader: Starting asset loading process');
      
      await this.loadBackgroundAssets();
      await this.loadUIAssets();
      await this.loadButtonAssets();
      
      this.loadingManager.completeTask('finalize');
      console.log('CreditsAssetLoader: All assets loaded successfully');
    } catch (error) {
      console.error('CreditsAssetLoader: Asset loading failed:', error);
      throw error;
    }
  }

  private async loadBackgroundAssets() {
    this.loadingManager.setCurrentTask('background');
    console.log('CreditsAssetLoader: Loading background assets');
    
    try {
      this.createCreditsBackground();
      this.createParticleTextures();
    } catch (error) {
      console.warn('CreditsAssetLoader: Failed to create background assets:', error);
    }
    
    this.loadingManager.completeTask('background');
  }

  private async loadUIAssets() {
    this.loadingManager.setCurrentTask('ui');
    console.log('CreditsAssetLoader: Loading UI assets');
    
    try {
      this.createScrollPanelTextures();
      this.createDecorativeElements();
    } catch (error) {
      console.warn('CreditsAssetLoader: Failed to create UI assets:', error);
    }
    
    this.loadingManager.completeTask('ui');
  }

  private async loadButtonAssets() {
    this.loadingManager.setCurrentTask('buttons');
    console.log('CreditsAssetLoader: Loading button assets');
    
    try {
      await generateTextureFromReactComponent(
        Button,
        { 
          width: 200, 
          height: 50, 
          text: "Back to Menu", 
          variant: "secondary", 
          state: 'normal' 
        },
        'credits_button_back_normal',
        this.scene
      );

      await generateTextureFromReactComponent(
        Button,
        { 
          width: 200, 
          height: 50, 
          text: "Back to Menu", 
          variant: "secondary", 
          state: 'hover' 
        },
        'credits_button_back_hover',
        this.scene
      );
    } catch (error) {
      console.warn('CreditsAssetLoader: Failed to load button assets, creating fallbacks:', error);
      this.createFallbackButton();
    }
    
    this.loadingManager.completeTask('buttons');
  }

  private createCreditsBackground() {
    const graphics = this.scene.add.graphics();
    
    // Create mystical starfield background
    graphics.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a3a, 0x2a2a5a, 1);
    graphics.fillRect(0, 0, 800, 600);
    
    // Add constellation pattern
    graphics.fillStyle(0x88ccff, 0.6);
    const stars = [
      { x: 100, y: 80 }, { x: 150, y: 120 }, { x: 200, y: 100 },
      { x: 600, y: 90 }, { x: 650, y: 130 }, { x: 700, y: 110 },
      { x: 120, y: 500 }, { x: 180, y: 480 }, { x: 220, y: 520 },
      { x: 580, y: 490 }, { x: 620, y: 510 }, { x: 680, y: 470 }
    ];
    
    stars.forEach(star => {
      graphics.fillCircle(star.x, star.y, 2);
    });
    
    // Connect stars with constellation lines
    graphics.lineStyle(1, 0x88ccff, 0.3);
    graphics.lineBetween(100, 80, 150, 120);
    graphics.lineBetween(150, 120, 200, 100);
    graphics.lineBetween(600, 90, 650, 130);
    graphics.lineBetween(650, 130, 700, 110);
    
    graphics.generateTexture('creditsBackground', 800, 600);
    graphics.destroy();
  }

  private createParticleTextures() {
    // Mystical orb particle
    const orbGraphics = this.scene.add.graphics();
    orbGraphics.fillGradientStyle(0x88ccff, 0x4488ff, 0x2266cc, 0x1144aa, 1);
    orbGraphics.fillCircle(8, 8, 6);
    orbGraphics.lineStyle(1, 0xaaddff, 0.8);
    orbGraphics.strokeCircle(8, 8, 6);
    orbGraphics.generateTexture('mysticalOrb', 16, 16);
    orbGraphics.destroy();

    // Sparkle particle
    const sparkleGraphics = this.scene.add.graphics();
    sparkleGraphics.fillStyle(0xffffff, 0.8);
    sparkleGraphics.fillStar(8, 8, 4, 6, 2);
    sparkleGraphics.generateTexture('sparkle', 16, 16);
    sparkleGraphics.destroy();

    // Rune particle
    const runeGraphics = this.scene.add.graphics();
    runeGraphics.lineStyle(2, 0x88ccff, 0.9);
    runeGraphics.strokeCircle(8, 8, 6);
    runeGraphics.lineBetween(4, 8, 12, 8);
    runeGraphics.lineBetween(8, 4, 8, 12);
    runeGraphics.generateTexture('runeParticle', 16, 16);
    runeGraphics.destroy();
  }

  private createScrollPanelTextures() {
    const graphics = this.scene.add.graphics();
    
    // Main scroll panel
    graphics.fillStyle(0x1a1a3a, 0.95);
    graphics.fillRoundedRect(0, 0, 700, 480, 20);
    graphics.lineStyle(3, 0x88ccff, 0.8);
    graphics.strokeRoundedRect(0, 0, 700, 480, 20);
    
    // Inner glow effect
    graphics.lineStyle(1, 0xaaddff, 0.4);
    graphics.strokeRoundedRect(5, 5, 690, 470, 18);
    
    graphics.generateTexture('scrollPanel', 700, 480);
    graphics.destroy();

    // Section divider
    const dividerGraphics = this.scene.add.graphics();
    dividerGraphics.fillGradientStyle(0x88ccff, 0x4488ff, 0x88ccff, 0x4488ff, 0);
    dividerGraphics.fillRect(0, 0, 600, 2);
    dividerGraphics.generateTexture('sectionDivider', 600, 2);
    dividerGraphics.destroy();
  }

  private createDecorativeElements() {
    // Mystical border corner
    const cornerGraphics = this.scene.add.graphics();
    cornerGraphics.lineStyle(3, 0x88ccff, 0.8);
    
    // Draw ornate corner design
    cornerGraphics.strokeCircle(0, 0, 25);
    cornerGraphics.strokeCircle(0, 0, 15);
    cornerGraphics.lineBetween(-20, -20, 20, 20);
    cornerGraphics.lineBetween(-20, 20, 20, -20);
    
    // Add small decorative elements
    cornerGraphics.fillStyle(0x88ccff, 0.6);
    cornerGraphics.fillCircle(-15, 0, 3);
    cornerGraphics.fillCircle(15, 0, 3);
    cornerGraphics.fillCircle(0, -15, 3);
    cornerGraphics.fillCircle(0, 15, 3);
    
    cornerGraphics.generateTexture('mysticalCorner', 50, 50);
    cornerGraphics.destroy();

    // Tech icon
    const techGraphics = this.scene.add.graphics();
    techGraphics.lineStyle(2, 0x4ade80, 0.8);
    techGraphics.strokeRect(0, 0, 20, 20);
    techGraphics.lineBetween(5, 5, 15, 15);
    techGraphics.lineBetween(5, 15, 15, 5);
    techGraphics.fillStyle(0x4ade80, 0.3);
    techGraphics.fillCircle(10, 10, 4);
    techGraphics.generateTexture('techIcon', 20, 20);
    techGraphics.destroy();
  }

  private createFallbackButton() {
    const graphics = this.scene.add.graphics();
    
    // Normal state
    graphics.fillStyle(0x6c757d);
    graphics.fillRoundedRect(0, 0, 200, 50, 8);
    graphics.lineStyle(2, 0xffffff, 0.3);
    graphics.strokeRoundedRect(0, 0, 200, 50, 8);
    graphics.generateTexture('credits_button_back_normal', 200, 50);
    
    // Hover state
    graphics.clear();
    graphics.fillStyle(0x8c959d);
    graphics.fillRoundedRect(0, 0, 200, 50, 8);
    graphics.lineStyle(2, 0xffffff, 0.5);
    graphics.strokeRoundedRect(0, 0, 200, 50, 8);
    graphics.generateTexture('credits_button_back_hover', 200, 50);
    
    graphics.destroy();
  }
}

export function createCreditsScene(Phaser: any) {
  return class CreditsScene extends Phaser.Scene {
    // Loading management
    private loadingManager: LoadingManager;
    private assetLoader: CreditsAssetLoader;
    private isLoading: boolean = true;
    private loadingError: string | null = null;

    // UI elements
    private scrollContainer!: Phaser.GameObjects.Container;
    private backButton!: Phaser.GameObjects.Image;
    private scrollY: number = 0;
    private maxScrollY: number = 0;
    private isScrolling: boolean = false;
    
    // Visual effects
    private particles: Phaser.GameObjects.GameObject[] = [];
    private decorativeElements: Phaser.GameObjects.GameObject[] = [];
    
    // Animation tweens
    private animationTweens: Phaser.Tweens.Tween[] = [];

    constructor() {
      super({ key: 'CreditsScene' });
      this.loadingManager = new LoadingManager();
      this.assetLoader = new CreditsAssetLoader(this, this.loadingManager);
      
      this.setupLoadingTracking();
    }

    private setupLoadingTracking() {
      this.loadingManager.onProgress((progress, currentTask) => {
        this.events.emit('loading-progress', { progress, currentTask });
        console.log(`Credits Loading: ${progress.toFixed(1)}% - ${currentTask}`);
      });
    }

    init() {
      const tasks = LoadingManager.createCreditsSceneTasks();
      tasks.forEach(task => this.loadingManager.addTask(task));
    }

    async preload() {
      console.log('CreditsScene preload started');
      
      try {
        this.isLoading = true;
        this.loadingError = null;
        
        this.events.emit('loading-start');
        await this.assetLoader.loadAllAssets();
        
        this.isLoading = false;
        this.events.emit('loading-complete');
        
      } catch (error) {
        console.error('Error loading credits scene assets:', error);
        this.loadingError = error instanceof Error ? error.message : 'Unknown loading error';
        this.isLoading = false;
        this.events.emit('loading-error', { error: this.loadingError });
      }
    }

    create() {
      console.log('CreditsScene create started');
      
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
        console.log('CreditsScene created successfully');
      } catch (error) {
        console.error('Error creating credits scene:', error);
        this.showErrorState();
      }
    }

    private setupScene() {
      // Setup background
      this.setupBackground();
      
      // Create mystical atmosphere
      this.createMysticalParticles();
      
      // Setup scroll panel
      this.setupScrollPanel();
      
      // Create credits content
      this.createCreditsContent();
      
      // Setup navigation
      this.setupNavigation();
      
      // Setup input handling
      this.setupInput();
      
      // Add entrance animation
      this.addEntranceAnimation();
    }

    private setupBackground() {
      // Main background
      if (this.textures.exists('creditsBackground')) {
        const bg = this.add.image(400, 300, 'creditsBackground');
        bg.setDepth(0);
      } else {
        // Fallback background
        const fallbackBg = this.add.graphics();
        fallbackBg.fillGradientStyle(0x0a0a1a, 0x0a0a1a, 0x1a1a3a, 0x2a2a5a, 1);
        fallbackBg.fillRect(0, 0, 800, 600);
        fallbackBg.setDepth(0);
      }

      // Add mystical corner decorations
      if (this.textures.exists('mysticalCorner')) {
        const corners = [
          { x: 50, y: 50, rotation: 0 },
          { x: 750, y: 50, rotation: Math.PI / 2 },
          { x: 750, y: 550, rotation: Math.PI },
          { x: 50, y: 550, rotation: (3 * Math.PI) / 2 }
        ];

        corners.forEach(corner => {
          const decoration = this.add.image(corner.x, corner.y, 'mysticalCorner');
          decoration.setRotation(corner.rotation);
          decoration.setDepth(1);
          this.decorativeElements.push(decoration);
        });
      }
    }

    private createMysticalParticles() {
      const particleTypes = ['mysticalOrb', 'sparkle', 'runeParticle'];
      
      // Create floating particles
      for (let i = 0; i < 25; i++) {
        const type = particleTypes[Math.floor(Math.random() * particleTypes.length)];
        
        if (this.textures.exists(type)) {
          const particle = this.add.image(
            Math.random() * 800,
            Math.random() * 600,
            type
          );
          
          particle.setAlpha(0.3 + Math.random() * 0.4);
          particle.setScale(0.5 + Math.random() * 0.5);
          particle.setDepth(2);
          
          // Floating animation
          this.tweens.add({
            targets: particle,
            y: particle.y - 20 - Math.random() * 40,
            alpha: particle.alpha * 0.5,
            duration: 8000 + Math.random() * 4000,
            ease: 'Sine.easeInOut',
            repeat: -1,
            yoyo: true
          });
          
          // Rotation animation for runes
          if (type === 'runeParticle') {
            this.tweens.add({
              targets: particle,
              rotation: Math.PI * 2,
              duration: 10000 + Math.random() * 5000,
              ease: 'Linear',
              repeat: -1
            });
          }
          
          this.particles.push(particle);
        }
      }
    }

    private setupScrollPanel() {
      // Main scroll panel background
      if (this.textures.exists('scrollPanel')) {
        const panel = this.add.image(400, 300, 'scrollPanel');
        panel.setDepth(5);
      } else {
        // Fallback panel
        const fallbackPanel = this.add.graphics();
        fallbackPanel.fillStyle(0x1a1a3a, 0.95);
        fallbackPanel.fillRoundedRect(50, 60, 700, 480, 20);
        fallbackPanel.lineStyle(3, 0x88ccff, 0.8);
        fallbackPanel.strokeRoundedRect(50, 60, 700, 480, 20);
        fallbackPanel.setDepth(5);
      }

      // Create scroll container - positioned properly within the panel
      this.scrollContainer = this.add.container(400, 320); // Moved down slightly
      this.scrollContainer.setDepth(10);

      // Add scroll mask - properly sized and positioned
      const mask = this.add.graphics();
      mask.fillStyle(0xffffff);
      mask.fillRoundedRect(70, 80, 660, 440, 15); // Adjusted to match panel interior
      this.scrollContainer.setMask(mask.createGeometryMask());
    }

    private createCreditsContent() {
      let currentY = -200; // Adjusted start position to be higher

      // Title Section - positioned at the very top of scrollable content
      const title = this.add.text(0, currentY, 'MYSTIC RUINS', {
        fontFamily: 'serif',
        fontSize: '42px', // Slightly smaller to fit better
        color: '#88ccff',
        fontStyle: 'bold',
        stroke: '#2a2a4a',
        strokeThickness: 3,
        align: 'center'
      }).setOrigin(0.5);
      
      const subtitle = this.add.text(0, currentY + 50, 'Lost Civilization', {
        fontFamily: 'serif',
        fontSize: '20px',
        color: '#aaccff',
        fontStyle: 'italic',
        align: 'center'
      }).setOrigin(0.5);

      this.scrollContainer.add([title, subtitle]);
      currentY += 120; // Reduced spacing

      // Add section divider
      currentY = this.addSectionDivider(currentY);

      // Game Development Section
      currentY = this.addSection(currentY, '🎮 GAME DEVELOPMENT', [
        'Lead Developer: Your Name',
        'Game Engine: Phaser 3.70.0',
        'Framework: React 18.2.0',
        'Build Tool: Vite 4.4.0',
        'Language: TypeScript 5.0.0',
        'Deployment: Firebase Hosting'
      ]);

      // Technology Stack Section
      currentY = this.addSection(currentY, '⚡ TECHNOLOGY STACK', [
        'Frontend Technologies:',
        '• React 18 with TypeScript',
        '• Astro 3.0 Static Site Generator',
        '• Tailwind CSS 3.3 for Styling',
        '• Framer Motion for Animations',
        '',
        'Game Engine:',
        '• Phaser 3.70.0 WebGL Renderer',
        '• Custom React Integration',
        '• Advanced Particle Systems',
        '• Dynamic Asset Loading',
        '',
        'Build & Development:',
        '• Vite 4.4 Lightning Fast HMR',
        '• ESLint + Prettier Code Quality',
        '• TypeScript Strict Mode',
        '• Hot Module Replacement'
      ]);

      // Cloud Infrastructure Section
      currentY = this.addSection(currentY, '☁️ CLOUD INFRASTRUCTURE', [
        'Hosting & Deployment:',
        '• Firebase Hosting (Blaze Plan)',
        '• Firebase Functions (Node.js)',
        '• Firestore Database',
        '• Firebase Authentication',
        '',
        'Performance & Analytics:',
        '• Firebase Performance Monitoring',
        '• Google Analytics 4',
        '• Lighthouse CI Integration',
        '• Web Vitals Tracking'
      ]);

      // Art & Design Section
      currentY = this.addSection(currentY, '🎨 ART & DESIGN', [
        'Visual Design:',
        '• Custom React UI Components',
        '• Procedural Background Generation',
        '• Dynamic Texture Creation',
        '• CSS3 Animations & Transitions',
        '',
        'Character Design:',
        '• Ancient Rune Construct',
        '• Stone Guardian Sentinel',
        '• Ethereal Shadow Wisp',
        '• Mystical Player Avatar',
        '',
        'Theme & Atmosphere:',
        '• Ancient Civilization Aesthetic',
        '• Mystical Rune Patterns',
        '• Atmospheric Particle Effects',
        '• Dynamic Lighting Systems'
      ]);

      // Audio & Music Section
      currentY = this.addSection(currentY, '🎵 AUDIO & MUSIC', [
        'Sound Design:',
        '• Web Audio API Integration',
        '• Dynamic Audio Context',
        '• Positional Audio Effects',
        '• Interactive Sound Feedback',
        '',
        'Music System:',
        '• Procedural Ambient Tracks',
        '• Dynamic Music Transitions',
        '• Battle Music Layers',
        '• Environmental Audio Cues'
      ]);

      // Development Tools Section
      currentY = this.addSection(currentY, '🛠️ DEVELOPMENT TOOLS', [
        'Code Quality:',
        '• ESLint with TypeScript Rules',
        '• Prettier Code Formatting',
        '• Husky Git Hooks',
        '• Conventional Commits',
        '',
        'Testing & Quality Assurance:',
        '• Vitest Unit Testing',
        '• Playwright E2E Testing',
        '• Jest DOM Testing',
        '• Cypress Component Testing',
        '',
        'Development Environment:',
        '• Visual Studio Code',
        '• GitHub Copilot AI Assistant',
        '• GitLens Version Control',
        '• Thunder Client API Testing'
      ]);

      // Performance Optimizations Section
      currentY = this.addSection(currentY, '⚡ PERFORMANCE OPTIMIZATIONS', [
        'Frontend Optimizations:',
        '• Code Splitting with Dynamic Imports',
        '• Tree Shaking for Bundle Size',
        '• Image Optimization & WebP',
        '• Service Worker Caching',
        '',
        'Game Performance:',
        '• Object Pooling for Particles',
        '• Texture Atlas Optimization',
        '• Memory Management',
        '• 60 FPS Target Optimization',
        '',
        'Loading Optimizations:',
        '• Progressive Asset Loading',
        '• Lazy Component Loading',
        '• Resource Preloading',
        '• Efficient Asset Bundling'
      ]);

      // Architecture & Patterns Section
      currentY = this.addSection(currentY, '🏗️ ARCHITECTURE & PATTERNS', [
        'Design Patterns:',
        '• Component-Based Architecture',
        '• Observer Pattern for Events',
        '• Factory Pattern for Scenes',
        '• State Management with Context',
        '',
        'Code Organization:',
        '• Modular Scene Architecture',
        '• Separation of Concerns',
        '• Dependency Injection',
        '• Configuration-Driven Development',
        '',
        'Asset Management:',
        '• Dynamic Texture Generation',
        '• Fallback Asset System',
        '• Loading Manager Pattern',
        '• Progressive Enhancement'
      ]);

      // Accessibility & UX Section
      currentY = this.addSection(currentY, '♿ ACCESSIBILITY & UX', [
        'Accessibility Features:',
        '• Keyboard Navigation Support',
        '• Screen Reader Compatibility',
        '• High Contrast Mode',
        '• Reduced Motion Support',
        '',
        'User Experience:',
        '• Responsive Design (Mobile-First)',
        '• Touch Controls for Mobile',
        '• Progressive Web App Features',
        '• Offline Functionality',
        '',
        'Performance Metrics:',
        '• Lighthouse Score: 95+',
        '• First Contentful Paint < 1.5s',
        '• Largest Contentful Paint < 2.5s',
        '• Cumulative Layout Shift < 0.1'
      ]);

      // Special Thanks Section
      currentY = this.addSection(currentY, '🏛️ SPECIAL THANKS', [
        'Inspiration:',
        '• Ancient Mesopotamian Civilizations',
        '• Egyptian Hieroglyphic Systems',
        '• Celtic Runic Traditions',
        '• Archaeological Discoveries',
        '',
        'Community & Support:',
        '• Phaser.js Community',
        '• React Developer Community',
        '• TypeScript Contributors',
        '• Open Source Maintainers',
        '',
        'Learning Resources:',
        '• MDN Web Docs',
        '• React Documentation',
        '• Phaser Labs Examples',
        '• Stack Overflow Community'
      ]);

      // Version & Copyright Section
      currentY = this.addSection(currentY, '📄 VERSION & COPYRIGHT', [
        'Version Information:',
        '• Game Version: 0.1.1 Beta',
        '• Build Date: ' + new Date().toLocaleDateString(),
        '• Engine Build: Phaser 3.70.0',
        '• TypeScript Version: 5.0.0',
        '',
        'Copyright & License:',
        '• © 2024 Mystic Ruins Development',
        '• Built with Open Source Technologies',
        '• Educational Project',
        '• MIT Licensed Components'
      ]);

      // Set max scroll based on content height with proper padding
      this.maxScrollY = Math.max(0, currentY + 200);
    }

    private addSection(startY: number, title: string, items: string[]): number {
      let currentY = startY + 30; // Reduced spacing

      // Section title with icon
      const sectionTitle = this.add.text(0, currentY, title, {
        fontFamily: 'serif',
        fontSize: '24px', // Slightly smaller
        color: '#88ccff',
        fontStyle: 'bold',
        stroke: '#1a1a3a',
        strokeThickness: 2,
        align: 'center'
      }).setOrigin(0.5);

      this.scrollContainer.add(sectionTitle);
      currentY += 40; // Reduced spacing

      // Section content
      items.forEach(item => {
        const isSubheading = item.endsWith(':') && !item.startsWith('•');
        const isEmpty = item.trim() === '';
        
        if (isEmpty) {
          currentY += 12; // Reduced spacing
          return;
        }

        const itemText = this.add.text(0, currentY, item, {
          fontFamily: isSubheading ? 'serif' : 'monospace',
          fontSize: isSubheading ? '18px' : '14px', // Smaller fonts
          color: isSubheading ? '#aaccff' : '#ccddff',
          fontStyle: isSubheading ? 'bold' : 'normal',
          align: 'center',
          wordWrap: { width: 580 } // Slightly narrower to fit better
        }).setOrigin(0.5);

        this.scrollContainer.add(itemText);
        currentY += isSubheading ? 28 : 20; // Reduced spacing
      });

      // Add section divider
      return this.addSectionDivider(currentY + 15); // Reduced spacing
    }

    private addSectionDivider(y: number): number {
      if (this.textures.exists('sectionDivider')) {
        const divider = this.add.image(0, y, 'sectionDivider');
        divider.setAlpha(0.6);
        this.scrollContainer.add(divider);
      } else {
        const fallbackDivider = this.add.graphics();
        fallbackDivider.fillGradientStyle(0x88ccff, 0x4488ff, 0x88ccff, 0x4488ff, 1);
        fallbackDivider.fillRect(-250, 0, 500, 2); // Slightly narrower
        this.scrollContainer.add(fallbackDivider);
      }
      
      return y + 25; // Reduced spacing
    }

    private setupNavigation() {
      // Back button
      const backKey = 'credits_button_back_normal';
      if (!this.textures.exists(backKey)) {
        this.createFallbackActionButton('back', 0x6c757d);
      }

      this.backButton = this.add.image(400, 550, backKey)
        .setInteractive()
        .setDepth(20);

      this.backButton.on('pointerover', () => {
        const hoverKey = 'credits_button_back_hover';
        if (this.textures.exists(hoverKey)) {
          this.backButton.setTexture(hoverKey);
        }
        this.backButton.setScale(1.05);
      });

      this.backButton.on('pointerout', () => {
        this.backButton.setTexture(backKey);
        this.backButton.setScale(1.0);
      });

      this.backButton.on('pointerdown', () => {
        this.goBack();
      });

      // Scroll indicators
      this.createScrollIndicators();
    }

    private createScrollIndicators() {
      // Scroll up indicator
      const scrollUpText = this.add.text(750, 100, '▲\nSCROLL\nUP', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#888888',
        align: 'center',
        lineSpacing: 2
      }).setOrigin(0.5).setDepth(15).setAlpha(0.7);

      // Scroll down indicator
      const scrollDownText = this.add.text(750, 500, '▼\nSCROLL\nDOWN', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#888888',
        align: 'center',
        lineSpacing: 2
      }).setOrigin(0.5).setDepth(15).setAlpha(0.7);

      // Animate scroll indicators
      this.tweens.add({
        targets: [scrollUpText, scrollDownText],
        alpha: { from: 0.7, to: 0.3 },
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    private setupInput() {
      // Keyboard controls
      this.input.keyboard.on('keydown-ESC', () => {
        this.goBack();
      });

      this.input.keyboard.on('keydown-UP', () => {
        this.scroll(-30);
      });

      this.input.keyboard.on('keydown-DOWN', () => {
        this.scroll(30);
      });

      this.input.keyboard.on('keydown-SPACE', () => {
        this.goBack();
      });

      // Mouse wheel scrolling
      this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
        this.scroll(deltaY * 0.5);
      });

      // Touch/drag scrolling for mobile
      let startY = 0;
      let isDragging = false;

      this.input.on('pointerdown', (pointer: any) => {
        startY = pointer.y;
        isDragging = true;
      });

      this.input.on('pointermove', (pointer: any) => {
        if (isDragging) {
          const deltaY = startY - pointer.y;
          this.scroll(deltaY * 0.5);
          startY = pointer.y;
        }
      });

      this.input.on('pointerup', () => {
        isDragging = false;
      });
    }

    private scroll(deltaY: number) {
      if (this.isScrolling) return;

      // Apply scroll with proper bounds checking
      const newScrollY = this.scrollY + deltaY;
      this.scrollY = Phaser.Math.Clamp(newScrollY, 0, this.maxScrollY);
      
      this.isScrolling = true;
      this.tweens.add({
        targets: this.scrollContainer,
        y: 320 - this.scrollY, // Updated base position
        duration: 200,
        ease: 'Power2.easeOut',
        onComplete: () => {
          this.isScrolling = false;
        }
      });
    }

    private addEntranceAnimation() {
      // Fade in effect
      this.cameras.main.fadeIn(1000, 0, 0, 0);

      // Animate scroll panel entrance
      this.scrollContainer.setAlpha(0);
      this.scrollContainer.setScale(0.8);

      this.tweens.add({
        targets: this.scrollContainer,
        alpha: 1,
        scaleX: 1,
        scaleY: 1,
        duration: 1000,
        ease: 'Back.easeOut',
        delay: 500
      });

      // Animate back button entrance
      this.backButton.setAlpha(0);
      this.backButton.setY(600);

      this.tweens.add({
        targets: this.backButton,
        alpha: 1,
        y: 550,
        duration: 800,
        ease: 'Back.easeOut',
        delay: 1000
      });

      // Animate decorative elements
      this.decorativeElements.forEach((element, index) => {
        element.setAlpha(0);
        element.setScale(0);
        
        this.tweens.add({
          targets: element,
          alpha: 0.8,
          scaleX: 1,
          scaleY: 1,
          duration: 600,
          ease: 'Back.easeOut',
          delay: 200 + (index * 150)
        });
      });
    }

    private createFallbackActionButton(action: string, color: number) {
      const graphics = this.add.graphics();
      
      graphics.fillStyle(color);
      graphics.fillRoundedRect(0, 0, 200, 50, 8);
      graphics.lineStyle(2, 0xffffff, 0.3);
      graphics.strokeRoundedRect(0, 0, 200, 50, 8);
      graphics.generateTexture(`credits_button_${action}_normal`, 200, 50);
      
      graphics.clear();
      graphics.fillStyle(color + 0x202020);
      graphics.fillRoundedRect(0, 0, 200, 50, 8);
      graphics.lineStyle(2, 0xffffff, 0.5);
      graphics.strokeRoundedRect(0, 0, 200, 50, 8);
      graphics.generateTexture(`credits_button_${action}_hover`, 200, 50);
      
      graphics.destroy();
    }

    private goBack() {
      if (this.isScrolling) return;

      // Exit animation
      this.tweens.add({
        targets: this.scrollContainer,
        alpha: 0,
        scaleX: 0.8,
        scaleY: 0.8,
        duration: 500,
        ease: 'Power2.easeIn'
      });

      this.tweens.add({
        targets: this.backButton,
        alpha: 0,
        y: 600,
        duration: 400,
        ease: 'Power2.easeIn'
      });

      // Fade out and transition
      this.cameras.main.fadeOut(500, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MainMenuScene');
      });
    }

    private showErrorState() {
      const errorBg = this.add.graphics();
      errorBg.fillStyle(0x000000, 0.9);
      errorBg.fillRect(0, 0, 800, 600);
      
      const errorText = this.add.text(400, 300, `Credits Error: ${this.loadingError || 'Unknown error'}`, {
        fontFamily: 'Arial',
        fontSize: '24px',
        color: '#ff0000',
        align: 'center',
        wordWrap: { width: 600 }
      }).setOrigin(0.5);
      
      const restartText = this.add.text(400, 400, 'Click to return to main menu', {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff',
        align: 'center'
      }).setOrigin(0.5).setInteractive();
      
      restartText.on('pointerdown', () => {
        this.scene.start('MainMenuScene');
      });
    }

    destroy() {
      console.log('CreditsScene cleanup started');
      
      // Clean up animation tweens
      this.animationTweens.forEach(tween => {
        if (tween && tween.isActive()) {
          tween.destroy();
        }
      });
      
      // Clean up particles
      this.particles.forEach(particle => {
        if (particle && particle.destroy) {
          particle.destroy();
        }
      });
      
      // Clean up decorative elements
      this.decorativeElements.forEach(element => {
        if (element && element.destroy) {
          element.destroy();
        }
      });
      
      this.loadingManager.reset();
      
      console.log('CreditsScene destroyed and cleaned up');
      super.destroy();
    }
  };
}