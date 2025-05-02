import { BATTLE_CONFIG, EnemyType } from '../constants';

export class Enemy {
  private hp: number;
  private maxHp: number;
  private defense: number;
  private name: string;
  private sprite: Phaser.GameObjects.Sprite;
  private type: EnemyType;
  private expValue: number;

  constructor(scene: Phaser.Scene, x: number, y: number, type: EnemyType = 'SLIME') {
    this.type = type;
    
    // Get enemy config based on type
    const enemyConfig = BATTLE_CONFIG.ENEMY[type];
    
    // Initialize stats from config
    this.name = enemyConfig.NAME;
    this.maxHp = enemyConfig.MAX_HP;
    this.hp = this.maxHp;
    this.defense = enemyConfig.DEFENSE;
    this.expValue = enemyConfig.EXP;
    
    // Create sprite based on enemy type
    const spriteKey = this.getSpriteKey();
    this.sprite = scene.add.sprite(x, y, spriteKey);
    
    // Configure sprite based on enemy type
    this.configureSprite();
  }

  private getSpriteKey(): string {
    // Return the appropriate sprite key based on enemy type
    switch(this.type) {
      case 'SLIME': return 'slime';
      case 'BAT': return 'bat';
      case 'SKELETON': return 'skeleton';
      default: return 'slime';
    }
  }

  private configureSprite(): void {
    // Configure sprite appearance based on enemy type
    switch(this.type) {
      case 'SLIME':
        this.sprite.setScale(3);
        break;
      case 'BAT':
        this.sprite.setScale(2.5);
        break;
      case 'SKELETON':
        this.sprite.setScale(2.2);
        break;
      default:
        this.sprite.setScale(3);
    }
  }

  attack(): number {
    // Calculate attack damage
    const min = BATTLE_CONFIG.ENEMY[this.type].ATTACK_POWER.MIN;
    const max = BATTLE_CONFIG.ENEMY[this.type].ATTACK_POWER.MAX;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  getAttackMessage(): string {
    // Return a random attack message based on enemy type
    const slimeMessages = [
      "Slime bounces at you!",
      "Slime oozes an acid attack!",
      "Slime jiggles menacingly!"
    ];
    
    const batMessages = [
      "Bat swoops down!",
      "Bat screeches and attacks!",
      "Bat bites with sharp fangs!"
    ];
    
    const skeletonMessages = [
      "Skeleton swings its bony arm!",
      "Skeleton rattles and strikes!",
      "Skeleton lunges forward!"
    ];
    
    let messages;
    switch(this.type) {
      case 'SLIME': messages = slimeMessages; break;
      case 'BAT': messages = batMessages; break;
      case 'SKELETON': messages = skeletonMessages; break;
      default: messages = slimeMessages;
    }
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  takeDamage(amount: number): number {
    const actualDamage = Math.max(1, amount - this.defense);
    this.hp = Math.max(0, this.hp - actualDamage);
    return actualDamage;
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  getStats() {
    return {
      name: this.name,
      hp: this.hp,
      maxHp: this.maxHp,
      defense: this.defense,
      type: this.type,
      expValue: this.expValue
    };
  }

  getSprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }

  // Fixed return type to allow for both Tween and Tween[]
  playAttackAnimation(scene: Phaser.Scene, targetX: number): Phaser.Tweens.Tween {
    // Different attack animations based on enemy type
    switch(this.type) {
      case 'SLIME':
        return scene.tweens.add({
          targets: this.sprite,
          x: targetX - 100, // Move closer to target
          duration: 300,
          yoyo: true,
          ease: 'Power1'
        });
      
      case 'BAT':
        return scene.tweens.add({
          targets: this.sprite,
          x: targetX - 80,
          y: this.sprite.y - 50, // Fly up and swoop down
          duration: 400,
          yoyo: true,
          ease: 'Sine.easeOut'
        });
      
      case 'SKELETON':
        return scene.tweens.add({
          targets: this.sprite,
          x: targetX - 120,
          angle: 15, // Rotate slightly for a swing motion
          duration: 250,
          yoyo: true,
          ease: 'Power2'
        });
      
      default:
        return scene.tweens.add({
          targets: this.sprite,
          x: targetX - 100,
          duration: 300,
          yoyo: true,
          ease: 'Power1'
        });
    }
  }

  playHitAnimation(scene: Phaser.Scene): Phaser.Tweens.Tween {
    // Different hit animations based on enemy type
    switch(this.type) {
      case 'SLIME':
        return scene.tweens.add({
          targets: this.sprite,
          alpha: 0.5,
          scaleX: 2.8,
          scaleY: 3.2,
          duration: 100,
          yoyo: true,
          repeat: 1,
          ease: 'Power1'
        });
      
      case 'BAT':
        return scene.tweens.add({
          targets: this.sprite,
          alpha: 0.7,
          rotation: 0.2,
          duration: 100,
          yoyo: true,
          repeat: 1
        });
      
      case 'SKELETON':
        return scene.tweens.add({
          targets: this.sprite,
          alpha: 0.7,
          x: this.sprite.x + 10,
          duration: 50,
          yoyo: true,
          repeat: 3
        });
      
      default:
        return scene.tweens.add({
          targets: this.sprite,
          alpha: 0.5,
          duration: 100,
          yoyo: true,
          repeat: 1
        });
    }
  }
}