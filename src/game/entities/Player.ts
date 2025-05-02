import { BATTLE_CONFIG, MENU_CONFIG, MagicType, ItemType } from '../constants.ts';

export class Player {
  private hp: number;
  private maxHp: number;
  private mp: number;
  private maxMp: number;
  private defense: number;
  private sprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.maxHp = BATTLE_CONFIG.PLAYER.MAX_HP;
    this.hp = this.maxHp;
    this.maxMp = BATTLE_CONFIG.PLAYER.MAX_MP;
    this.mp = this.maxMp;
    this.defense = BATTLE_CONFIG.PLAYER.DEFENSE;
    
    // Create sprite
    this.sprite = scene.add.sprite(x, y, 'warrior').setScale(2);
  }

  attack(): number {
    // Calculate attack damage
    const min = BATTLE_CONFIG.PLAYER.ATTACK_POWER.MIN;
    const max = BATTLE_CONFIG.PLAYER.ATTACK_POWER.MAX;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  castSpell(type: MagicType): {damage: number, mpCost: number} {
    // Find the spell in config
    const spell = MENU_CONFIG.MAGIC_ACTIONS.find(s => s.id === type);
    
    if (!spell || this.mp < spell.mpCost) {
      return {damage: 0, mpCost: 0};
    }
    
    this.mp -= spell.mpCost;
    return {
      damage: spell.power + Math.floor(Math.random() * 5),
      mpCost: spell.mpCost
    };
  }

  useItem(type: ItemType): {healing: number} {
    if (type === ItemType.POTION) {
      const healing = 30;
      this.hp = Math.min(this.maxHp, this.hp + healing);
      return {healing};
    }
    
    if (type === ItemType.ETHER) {
      const mpRestored = 15;
      this.mp = Math.min(this.maxMp, this.mp + mpRestored);
      return {healing: 0};
    }
    
    return {healing: 0};
  }

  takeDamage(amount: number): number {
    const actualDamage = Math.max(1, amount - this.defense);
    this.hp = Math.max(0, this.hp - actualDamage);
    return actualDamage;
  }

  heal(amount: number): number {
    const beforeHp = this.hp;
    this.hp = Math.min(this.maxHp, this.hp + amount);
    return this.hp - beforeHp;
  }

  isDead(): boolean {
    return this.hp <= 0;
  }

  getStats() {
    return {
      hp: this.hp,
      maxHp: this.maxHp,
      mp: this.mp,
      maxMp: this.maxMp,
      defense: this.defense
    };
  }

  getSprite(): Phaser.GameObjects.Sprite {
    return this.sprite;
  }
  
  playAttackAnimation(scene: Phaser.Scene): Phaser.Tweens.Tween {
    return scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + 100,
      duration: 300,
      yoyo: true,
      ease: 'Power1'
    });
  }
  
  playHitAnimation(scene: Phaser.Scene): Phaser.Tweens.Tween {
    return scene.tweens.add({
      targets: this.sprite,
      alpha: 0.5,
      duration: 100,
      yoyo: true,
      repeat: 1
    });
  }
}