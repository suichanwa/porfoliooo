export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;

// Game states
export enum GameState {
  IDLE = 'idle',
  PLAYER_TURN = 'playerTurn',
  ENEMY_TURN = 'enemyTurn',
  VICTORY = 'victory',
  DEFEAT = 'defeat'
}

// Battle actions
export enum BattleAction {
  ATTACK = 'attack',
  MAGIC = 'magic',
  ITEM = 'item',
  DEFEND = 'defend'
}

// Magic types
export enum MagicType {
  FIRE = 'fire',
  ICE = 'ice',
  HEAL = 'heal'
}

// Item types
export enum ItemType {
  POTION = 'potion',
  ETHER = 'ether',
  REVIVE = 'revive'
}

// Define enemy type as a string literal union - now including the new themed enemies
export type EnemyType = 'SLIME' | 'BAT' | 'SKELETON' | 'STONE_GUARDIAN' | 'SHADOW_WISP' | 'RUNE_CONSTRUCT';

// Game colors
export const COLORS = {
  TEXT_NORMAL: '#ffffff',
  TEXT_MAGIC: '#00ffff',
  TEXT_ITEM: '#ffff00',
  TEXT_BACK: '#ff9999',
  HP_PLAYER: '#00ff00',
  HP_ENEMY: '#ff0000',
  MENU_BG: '#222244',
  MENU_BORDER: '#4444aa'
};

// Magic spell type definition
export interface MagicSpell {
  id: MagicType;
  label: string;
  color: string;
  mpCost: number;
  power: number;
}

// Item type definition
export interface Item {
  id: ItemType;
  label: string;
  color: string;
  effect: string;
}

// Menu configuration
export const MENU_CONFIG = {
  MAIN_ACTIONS: [
    { id: BattleAction.ATTACK, label: 'Attack', color: COLORS.TEXT_NORMAL },
    { id: BattleAction.MAGIC, label: 'Magic', color: COLORS.TEXT_NORMAL },
    { id: BattleAction.ITEM, label: 'Item', color: COLORS.TEXT_NORMAL },
    { id: BattleAction.DEFEND, label: 'Defend', color: COLORS.TEXT_NORMAL }
  ],
  MAGIC_ACTIONS: [
    { id: MagicType.FIRE, label: 'Fire', color: COLORS.TEXT_MAGIC, mpCost: 5, power: 15 },
    { id: MagicType.ICE, label: 'Ice', color: COLORS.TEXT_MAGIC, mpCost: 8, power: 18 },
    { id: MagicType.HEAL, label: 'Heal', color: COLORS.TEXT_MAGIC, mpCost: 10, power: 20 }
  ] as MagicSpell[],
  ITEM_ACTIONS: [
    { id: ItemType.POTION, label: 'Potion', color: COLORS.TEXT_ITEM, effect: 'Restores 30 HP' },
    { id: ItemType.ETHER, label: 'Ether', color: COLORS.TEXT_ITEM, effect: 'Restores 15 MP' },
    { id: ItemType.REVIVE, label: 'Revive', color: COLORS.TEXT_ITEM, effect: 'Revives fallen ally' }
  ] as Item[]
};

// Battle configuration
export const BATTLE_CONFIG = {
  PLAYER: {
    MAX_HP: 100,
    MAX_MP: 50,
    ATTACK_POWER: { MIN: 10, MAX: 15 },
    DEFENSE: 5
  },
  ENEMY: {
    // New themed enemies for Mystic Ruins
    STONE_GUARDIAN: {
      NAME: 'Stone Guardian',
      MAX_HP: 90,
      ATTACK_POWER: { MIN: 6, MAX: 10 },
      DEFENSE: 3,
      EXP: 12
    },
    SHADOW_WISP: {
      NAME: 'Shadow Wisp',
      MAX_HP: 65,
      ATTACK_POWER: { MIN: 8, MAX: 14 },
      DEFENSE: 1,
      EXP: 18
    },
    RUNE_CONSTRUCT: {
      NAME: 'Rune Construct',
      MAX_HP: 130,
      ATTACK_POWER: { MIN: 9, MAX: 16 },
      DEFENSE: 5,
      EXP: 30
    },
    // Keep original enemies for backward compatibility
    SLIME: {
      NAME: 'Slime',
      MAX_HP: 80,
      ATTACK_POWER: { MIN: 5, MAX: 8 },
      DEFENSE: 2,
      EXP: 10
    },
    BAT: {
      NAME: 'Cave Bat',
      MAX_HP: 60,
      ATTACK_POWER: { MIN: 7, MAX: 12 },
      DEFENSE: 1,
      EXP: 15
    },
    SKELETON: {
      NAME: 'Skeleton',
      MAX_HP: 120,
      ATTACK_POWER: { MIN: 8, MAX: 14 },
      DEFENSE: 4,
      EXP: 25
    }
  }
};

// Helper type to access enemy config
export type EnemyConfig = typeof BATTLE_CONFIG.ENEMY[EnemyType];