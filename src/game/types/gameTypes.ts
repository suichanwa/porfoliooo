import { GameState, EnemyType } from '../constants';

export interface GameStateData {
  playerHP: number;
  maxPlayerHP: number;
  playerMP: number;
  maxPlayerMP: number;
  enemyHP: number;
  maxEnemyHP: number;
  enemyName: string;
  message: string;
  currentState: GameState;
  selectedAction: string | null;
}

declare global {
  interface Window {
    updateGameState: (state: GameStateData) => void;
    gameControlEvent: (action: string) => void;
  }
}

export interface AnimationProps {
  width?: number;
  height?: number;
  variant?: 'default' | 'attack' | 'hit' | 'cast';
  onRender?: (imageData: string) => void;
}