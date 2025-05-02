import { GameState, MagicType, ItemType, EnemyType } from '../constants';
import { Player } from '../entities/Player';
import { Enemy } from '../entities/Enemy';

// Types for battle events
export type BattleEvent = {
  type: 'attack' | 'magic' | 'item' | 'enemyAttack' | 'turnChange' | 'victory' | 'defeat';
  source: 'player' | 'enemy';
  target: 'player' | 'enemy';
  value?: number; // Damage/healing amount
  message: string;
};

export type BattleEventCallback = (event: BattleEvent) => void;

export class BattleSystem {
  private player: Player;
  private enemy: Enemy;
  private currentState: GameState;
  private scene: Phaser.Scene;
  private eventListeners: BattleEventCallback[] = [];

  constructor(scene: Phaser.Scene, player: Player, enemyType: EnemyType) {
    this.scene = scene;
    this.player = player;
    this.enemy = new Enemy(scene, 580, 280, enemyType);
    this.currentState = GameState.PLAYER_TURN;
  }

  /**
   * Add a listener for battle events
   */
  addEventListener(callback: BattleEventCallback): void {
    this.eventListeners.push(callback);
  }

  /**
   * Remove a listener for battle events
   */
  removeEventListener(callback: BattleEventCallback): void {
    this.eventListeners = this.eventListeners.filter(cb => cb !== callback);
  }

  /**
   * Trigger an event to all registered listeners
   */
  private triggerEvent(event: BattleEvent): void {
    this.eventListeners.forEach(callback => callback(event));
  }

  /**
   * Get the current battle state
   */
  getState(): GameState {
    return this.currentState;
  }

  /**
   * Get the current enemy
   */
  getEnemy(): Enemy {
    return this.enemy;
  }

  /**
   * Execute player attack
   */
  async playerAttack(): Promise<void> {
    if (this.currentState !== GameState.PLAYER_TURN) return;

    // Calculate damage
    const damage = this.player.attack();
    const actualDamage = this.enemy.takeDamage(damage);
    
    // Play attack animation
    const attackAnim = this.player.playAttackAnimation(this.scene);
    
    // Start attack
    this.triggerEvent({
      type: 'attack',
      source: 'player',
      target: 'enemy',
      value: actualDamage,
      message: `You attack for ${actualDamage} damage!`
    });

    await new Promise<void>(resolve => {
      attackAnim.play();
      attackAnim.on('complete', () => {
        // Play enemy hit animation
        const hitAnim = this.enemy.playHitAnimation(this.scene);
        hitAnim.play();
        hitAnim.on('complete', () => resolve());
      });
    });

    // Check if enemy is defeated
    if (this.enemy.isDead()) {
      this.currentState = GameState.VICTORY;
      this.triggerEvent({
        type: 'victory',
        source: 'player',
        target: 'enemy',
        message: `You defeated the ${this.enemy.getStats().name}!`
      });
    } else {
      // Enemy's turn next
      this.startEnemyTurn();
    }
  }

  /**
   * Execute player magic spell
   */
  async castSpell(spellType: MagicType): Promise<void> {
    if (this.currentState !== GameState.PLAYER_TURN) return;

    const spell = this.player.castSpell(spellType);
    
    // If no MP or spell failed
    if (spell.damage === 0) {
      this.triggerEvent({
        type: 'magic',
        source: 'player',
        target: 'enemy',
        message: 'Not enough MP to cast spell!'
      });
      return;
    }

    // Handle different spell types
    if (spellType === MagicType.HEAL) {
      const healing = this.player.heal(spell.damage);
      
      // Animation for healing
      const healAnim = this.scene.tweens.add({
        targets: this.player.getSprite(),
        alpha: 0.7,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 200,
        yoyo: true,
        repeat: 2
      });
      
      this.triggerEvent({
        type: 'magic',
        source: 'player',
        target: 'player',
        value: healing,
        message: `You cast Heal! Recovered ${healing} HP!`
      });
      
      await new Promise<void>(resolve => {
        healAnim.play();
        healAnim.on('complete', resolve);
      });
    } else {
      // Damage spell
      const actualDamage = this.enemy.takeDamage(spell.damage);

      // Animation for damage spell
      const spellAnim = this.scene.tweens.add({
        targets: this.player.getSprite(),
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 200,
        yoyo: true
      });
      
      this.triggerEvent({
        type: 'magic',
        source: 'player',
        target: 'enemy',
        value: actualDamage,
        message: `You cast ${spellType}! Dealt ${actualDamage} damage!`
      });

      await new Promise<void>(resolve => {
        spellAnim.play();
        spellAnim.on('complete', () => {
          // Play enemy hit animation
          const hitAnim = this.enemy.playHitAnimation(this.scene);
          hitAnim.play();
          hitAnim.on('complete', () => resolve());
        });
      });

      // Check if enemy is defeated
      if (this.enemy.isDead()) {
        this.currentState = GameState.VICTORY;
        this.triggerEvent({
          type: 'victory',
          source: 'player',
          target: 'enemy',
          message: `You defeated the ${this.enemy.getStats().name}!`
        });
        return;
      }
    }

    // Enemy's turn next
    this.startEnemyTurn();
  }

  /**
   * Execute player item use
   */
  async useItem(itemType: ItemType): Promise<void> {
    if (this.currentState !== GameState.PLAYER_TURN) return;

    const result = this.player.useItem(itemType);
    
    this.triggerEvent({
      type: 'item',
      source: 'player',
      target: 'player',
      value: result.healing,
      message: `You used ${itemType}! ${result.healing > 0 ? `Recovered ${result.healing} HP!` : ''}`
    });
    
    // Animation for item use
    const itemAnim = this.scene.tweens.add({
      targets: this.player.getSprite(),
      alpha: 0.8,
      duration: 100,
      yoyo: true,
      repeat: 1
    });
    
    await new Promise<void>(resolve => {
      itemAnim.play();
      itemAnim.on('complete', resolve);
    });

    // Enemy's turn next
    this.startEnemyTurn();
  }

  /**
   * Start enemy's turn
   */
  private async startEnemyTurn(): Promise<void> {
    this.currentState = GameState.ENEMY_TURN;
    
    this.triggerEvent({
      type: 'turnChange',
      source: 'enemy',
      target: 'player',
      message: "Enemy's turn!"
    });
    
    // Add a slight delay before enemy attacks
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.enemyAttack();
  }

  /**
   * Execute enemy attack
   */
  private async enemyAttack(): Promise<void> {
    // Calculate damage
    const damage = this.enemy.attack();
    const actualDamage = this.player.takeDamage(damage);
    
    // Get a random attack message
    const attackMessage = this.enemy.getAttackMessage();
    
    this.triggerEvent({
      type: 'enemyAttack',
      source: 'enemy',
      target: 'player',
      value: actualDamage,
      message: `${attackMessage} You take ${actualDamage} damage!`
    });
    
    // Play enemy attack animation
    const attackAnim = this.enemy.playAttackAnimation(this.scene, this.player.getSprite().x);
    
    await new Promise<void>(resolve => {
      attackAnim.play();
      attackAnim.on('complete', () => {
        // Player hit effect
        const hitEffect = this.player.playHitAnimation(this.scene);
        hitEffect.play();
        hitEffect.on('complete', resolve);
      });
    });
    
    // Check if player is defeated
    if (this.player.isDead()) {
      this.currentState = GameState.DEFEAT;
      this.triggerEvent({
        type: 'defeat',
        source: 'enemy',
        target: 'player',
        message: 'You were defeated!'
      });
      return;
    }
    
    // Back to player's turn
    this.currentState = GameState.PLAYER_TURN;
    this.triggerEvent({
      type: 'turnChange',
      source: 'player',
      target: 'enemy',
      message: 'Your turn! Select an action.'
    });
  }

  /**
   * Reset the battle with a new enemy
   */
  resetBattle(enemyType: EnemyType): void {
    this.enemy = new Enemy(this.scene, 580, 280, enemyType);
    this.currentState = GameState.PLAYER_TURN;
    
    this.triggerEvent({
      type: 'turnChange',
      source: 'player',
      target: 'enemy',
      message: 'Battle start! Select an action.'
    });
  }
}