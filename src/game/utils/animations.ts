import { Scene, GameObjects, Tweens } from 'phaser';

/**
 * Animation types that can be used in the game
 */
export type AnimationType = 
  | 'attack' 
  | 'hit' 
  | 'magic' 
  | 'heal' 
  | 'victory' 
  | 'defeat'
  | 'fadeIn'
  | 'fadeOut'
  | 'bounce'
  | 'shake';

/**
 * Generic animation options
 */
export interface AnimationOptions {
  duration?: number;
  ease?: string;
  repeat?: number;
  yoyo?: boolean;
  delay?: number;
  onComplete?: () => void;
}

/**
 * Creates an attack animation for a game object
 */
export function attackAnimation(
  scene: Scene, 
  gameObject: GameObjects.Sprite, 
  targetX: number,
  options: AnimationOptions = {}
): Tweens.Tween {
  const defaultOptions = {
    duration: 300,
    ease: 'Power1',
    yoyo: true,
  };
  
  const config = { ...defaultOptions, ...options };
  const originalX = gameObject.x;
  
  return scene.tweens.add({
    targets: gameObject,
    x: targetX - 100, // Move toward target
    duration: config.duration,
    ease: config.ease,
    yoyo: config.yoyo,
    repeat: config.repeat,
    delay: config.delay,
    onComplete: config.onComplete
  });
}

/**
 * Creates a hit reaction animation for a game object
 */
export function hitAnimation(
  scene: Scene, 
  gameObject: GameObjects.Sprite,
  options: AnimationOptions = {}
): Tweens.Tween {
  const defaultOptions = {
    duration: 100,
    ease: 'Power1',
    repeat: 1,
    yoyo: true,
  };
  
  const config = { ...defaultOptions, ...options };
  
  return scene.tweens.add({
    targets: gameObject,
    alpha: 0.5,
    duration: config.duration,
    ease: config.ease,
    repeat: config.repeat,
    yoyo: config.yoyo,
    delay: config.delay,
    onComplete: config.onComplete
  });
}

/**
 * Creates a magic cast animation for a game object
 */
export function magicAnimation(
  scene: Scene, 
  gameObject: GameObjects.Sprite,
  options: AnimationOptions = {}
):// filepath: c:\Users\suiseika\porfoliooo\src\game\utils\animations.ts
import { Scene, GameObjects, Tweens } from 'phaser';

/**
 * Animation types that can be used in the game
 */
export type AnimationType = 
  | 'attack' 
  | 'hit' 
  | 'magic' 
  | 'heal' 
  | 'victory' 
  | 'defeat'
  | 'fadeIn'
  | 'fadeOut'
  | 'bounce'
  | 'shake';

/**
 * Generic animation options
 */
export interface AnimationOptions {
  duration?: number;
  ease?: string;
  repeat?: number;
  yoyo?: boolean;
  delay?: number;
  onComplete?: () => void;
}

/**
 * Creates an attack animation for a game object
 */
export function attackAnimation(
  scene: Scene, 
  gameObject: GameObjects.Sprite, 
  targetX: number,
  options: AnimationOptions = {}
): Tweens.Tween {
  const defaultOptions = {
    duration: 300,
    ease: 'Power1',
    yoyo: true,
  };
  
  const config = { ...defaultOptions, ...options };
  const originalX = gameObject.x;
  
  return scene.tweens.add({
    targets: gameObject,
    x: targetX - 100, // Move toward target
    duration: config.duration,
    ease: config.ease,
    yoyo: config.yoyo,
    repeat: config.repeat,
    delay: config.delay,
    onComplete: config.onComplete
  });
}

/**
 * Creates a hit reaction animation for a game object
 */
export function hitAnimation(
  scene: Scene, 
  gameObject: GameObjects.Sprite,
  options: AnimationOptions = {}
): Tweens.Tween {
  const defaultOptions = {
    duration: 100,
    ease: 'Power1',
    repeat: 1,
    yoyo: true,
  };
  
  const config = { ...defaultOptions, ...options };
  
  return scene.tweens.add({
    targets: gameObject,
    alpha: 0.5,
    duration: config.duration,
    ease: config.ease,
    repeat: config.repeat,
    yoyo: config.yoyo,
    delay: config.delay,
    onComplete: config.onComplete
  });
}

/**
 * Creates a magic cast animation for a game object
 */
export function magicAnimation(
  scene: Scene, 
  gameObject: GameObjects.Sprite,
  options: AnimationOptions = {}
):