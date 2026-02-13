export type CharacterClass = 'warrior' | 'mage' | 'rogue' | 'cleric';

export interface CharacterStats {
  strength: number;
  dexterity: number;
  intelligence: number;
  constitution: number;
  wisdom: number;
  charisma: number;
}

export interface ClassDefinition {
  name: string;
  description: string;
  baseStats: CharacterStats;
  statPointBonus: number;
  primaryStat: keyof CharacterStats;
  abilities: string[];
}

export interface CharacterCreationData {
  name: string;
  class: CharacterClass;
  stats: CharacterStats;
  appearance: {
    skinTone: number;
    hairColor: number;
    hairStyle: number;
  };
}

export const CLASS_DEFINITIONS: Record<CharacterClass, ClassDefinition> = {
  warrior: {
    name: 'Warrior',
    description: 'A fearless fighter skilled in melee combat. High strength and constitution.',
    baseStats: {
      strength: 15,
      dexterity: 10,
      intelligence: 8,
      constitution: 14,
      wisdom: 9,
      charisma: 10
    },
    statPointBonus: 10,
    primaryStat: 'strength',
    abilities: ['Power Strike', 'Shield Block', 'Battle Cry']
  },
  mage: {
    name: 'Mage',
    description: 'A master of arcane arts. High intelligence and wisdom, but fragile.',
    baseStats: {
      strength: 7,
      dexterity: 9,
      intelligence: 16,
      constitution: 8,
      wisdom: 14,
      charisma: 12
    },
    statPointBonus: 10,
    primaryStat: 'intelligence',
    abilities: ['Fireball', 'Ice Shield', 'Arcane Missile']
  },
  rogue: {
    name: 'Rogue',
    description: 'A nimble assassin who strikes from the shadows. High dexterity and agility.',
    baseStats: {
      strength: 10,
      dexterity: 16,
      intelligence: 12,
      constitution: 10,
      wisdom: 9,
      charisma: 9
    },
    statPointBonus: 10,
    primaryStat: 'dexterity',
    abilities: ['Backstab', 'Stealth', 'Poison Dagger']
  },
  cleric: {
    name: 'Cleric',
    description: 'A holy warrior who heals allies and smites foes. Balanced stats with high wisdom.',
    baseStats: {
      strength: 11,
      dexterity: 9,
      intelligence: 10,
      constitution: 12,
      wisdom: 15,
      charisma: 13
    },
    statPointBonus: 10,
    primaryStat: 'wisdom',
    abilities: ['Heal', 'Holy Smite', 'Divine Shield']
  }
};