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
): Tweens.Tween {
  const defaultOptions = {
    duration: 500,
    ease: 'Power2',
    yoyo: false,
  };
  
  const config = { ...defaultOptions, ...options };
  
  return scene.tweens.add({
    targets: gameObject,
    alpha: 0.8,
    scaleX: 1.2,
    scaleY: 1.2,
    duration: config.duration,
    ease: config.ease,
    yoyo: config.yoyo,
    repeat: config.repeat,
    delay: config.delay,
    onComplete: config.onComplete
  });
}

/**
 * Creates a heal animation for a game object
 */
export function healAnimation(
  scene: Scene, 
  gameObject: GameObjects.Sprite,
  options: AnimationOptions = {}
): Tweens.Tween {
  const defaultOptions = {
    duration: 400,
    ease: 'Sine.easeInOut',
    repeat: 2,
    yoyo: true,
  };
  
  const config = { ...defaultOptions, ...options };
  
  return scene.tweens.add({
    targets: gameObject,
    tint: 0x00ff00,
    alpha: 0.9,
    duration: config.duration,
    ease: config.ease,
    repeat: config.repeat,
    yoyo: config.yoyo,
    delay: config.delay,
    onComplete: () => {
      gameObject.clearTint();
      gameObject.setAlpha(1);
      if (config.onComplete) config.onComplete();
    }
  });
}

/**
 * Creates a victory animation for a game object
 */
export function victoryAnimation(
  scene: Scene, 
  gameObject: GameObjects.Sprite,
  options: AnimationOptions = {}
): Tweens.Tween {
  const defaultOptions = {
    duration: 1000,
    ease: 'Back.easeOut',
    repeat: 0,
    yoyo: false,
  };
  
  const config = { ...defaultOptions, ...options };
  
  return scene.tweens.add({
    targets: gameObject,
    scaleX: 1.5,
    scaleY: 1.5,
    alpha: 0.8,
    rotation: Math.PI * 2,
    duration: config.duration,
    ease: config.ease,
    repeat: config.repeat,
    yoyo: config.yoyo,
    delay: config.delay,
    onComplete: config.onComplete
  });
}

/**
 * Creates a defeat animation for a game object
 */
export function defeatAnimation(
  scene: Scene, 
  gameObject: GameObjects.Sprite,
  options: AnimationOptions = {}
): Tweens.Tween {
  const defaultOptions = {
    duration: 800,
    ease: 'Power2.easeIn',
    repeat: 0,
    yoyo: false,
  };
  
  const config = { ...defaultOptions, ...options };
  
  return scene.tweens.add({
    targets: gameObject,
    alpha: 0,
    scaleX: 0.5,
    scaleY: 0.5,
    rotation: Math.PI,
    duration: config.duration,
    ease: config.ease,
    repeat: config.repeat,
    yoyo: config.yoyo,
    delay: config.delay,
    onComplete: config.onComplete
  });
}

/**
 * Creates a fade in animation for a game object
 */
export function fadeInAnimation(
  scene: Scene, 
  gameObject: GameObjects.Sprite,
  options: AnimationOptions = {}
): Tweens.Tween {
  const defaultOptions = {
    duration: 500,
    ease: 'Power1',
    repeat: 0,
    yoyo: false,
  };
  
  const config = { ...defaultOptions, ...options };
  
  gameObject.setAlpha(0);
  
  return scene.tweens.add({
    targets: gameObject,
    alpha: 1,
    duration: config.duration,
    ease: config.ease,
    repeat: config.repeat,
    yoyo: config.yoyo,
    delay: config.delay,
    onComplete: config.onComplete
  });
}

/**
 * Creates a fade out animation for a game object
 */
export function fadeOutAnimation(
  scene: Scene, 
  gameObject: GameObjects.Sprite,
  options: AnimationOptions = {}
): Tweens.Tween {
  const defaultOptions = {
    duration: 500,
    ease: 'Power1',
    repeat: 0,
    yoyo: false,
  };
  
  const config = { ...defaultOptions, ...options };
  
  return scene.tweens.add({
    targets: gameObject,
    alpha: 0,
    duration: config.duration,
    ease: config.ease,
    repeat: config.repeat,
    yoyo: config.yoyo,
    delay: config.delay,
    onComplete: config.onComplete
  });
}

/**
 * Creates a bounce animation for a game object
 */
export function bounceAnimation(
  scene: Scene, 
  gameObject: GameObjects.Sprite,
  options: AnimationOptions = {}
): Tweens.Tween {
  const defaultOptions = {
    duration: 300,
    ease: 'Bounce.easeOut',
    repeat: 2,
    yoyo: true,
  };
  
  const config = { ...defaultOptions, ...options };
  
  return scene.tweens.add({
    targets: gameObject,
    y: gameObject.y - 20,
    scaleX: 1.1,
    scaleY: 1.1,
    duration: config.duration,
    ease: config.ease,
    repeat: config.repeat,
    yoyo: config.yoyo,
    delay: config.delay,
    onComplete: config.onComplete
  });
}

/**
 * Creates a shake animation for a game object
 */
export function shakeAnimation(
  scene: Scene, 
  gameObject: GameObjects.Sprite,
  options: AnimationOptions = {}
): Tweens.Tween {
  const defaultOptions = {
    duration: 50,
    ease: 'Power1',
    repeat: 5,
    yoyo: true,
  };
  
  const config = { ...defaultOptions, ...options };
  const originalX = gameObject.x;
  
  return scene.tweens.add({
    targets: gameObject,
    x: originalX + 5,
    duration: config.duration,
    ease: config.ease,
    repeat: config.repeat,
    yoyo: config.yoyo,
    delay: config.delay,
    onComplete: () => {
      gameObject.setX(originalX);
      if (config.onComplete) config.onComplete();
    }
  });
}

/**
 * Creates a custom animation based on animation type
 */
export function createAnimation(
  scene: Scene,
  gameObject: GameObjects.Sprite,
  animationType: AnimationType,
  options: AnimationOptions = {},
  targetX?: number
): Tweens.Tween {
  switch (animationType) {
    case 'attack':
      return attackAnimation(scene, gameObject, targetX || gameObject.x + 100, options);
    case 'hit':
      return hitAnimation(scene, gameObject, options);
    case 'magic':
      return magicAnimation(scene, gameObject, options);
    case 'heal':
      return healAnimation(scene, gameObject, options);
    case 'victory':
      return victoryAnimation(scene, gameObject, options);
    case 'defeat':
      return defeatAnimation(scene, gameObject, options);
    case 'fadeIn':
      return fadeInAnimation(scene, gameObject, options);
    case 'fadeOut':
      return fadeOutAnimation(scene, gameObject, options);
    case 'bounce':
      return bounceAnimation(scene, gameObject, options);
    case 'shake':
      return shakeAnimation(scene, gameObject, options);
    default:
      // Default to fade in animation
      return fadeInAnimation(scene, gameObject, options);
  }
}

/**
 * Creates a sequence of animations that play one after another
 */
export function createAnimationSequence(
  scene: Scene,
  gameObject: GameObjects.Sprite,
  animations: { type: AnimationType; options?: AnimationOptions; targetX?: number }[]
): Promise<void> {
  return new Promise((resolve) => {
    let currentIndex = 0;
    
    const playNext = () => {
      if (currentIndex >= animations.length) {
        resolve();
        return;
      }
      
      const { type, options = {}, targetX } = animations[currentIndex];
      const animOptions = {
        ...options,
        onComplete: () => {
          if (options.onComplete) options.onComplete();
          currentIndex++;
          playNext();
        }
      };
      
      createAnimation(scene, gameObject, type, animOptions, targetX);
    };
    
    playNext();
  });
}

/**
 * Creates multiple animations that play simultaneously
 */
export function createParallelAnimations(
  scene: Scene,
  targets: { gameObject: GameObjects.Sprite; type: AnimationType; options?: AnimationOptions; targetX?: number }[]
): Promise<void[]> {
  const promises = targets.map(({ gameObject, type, options = {}, targetX }) => {
    return new Promise<void>((resolve) => {
      const animOptions = {
        ...options,
        onComplete: () => {
          if (options.onComplete) options.onComplete();
          resolve();
        }
      };
      
      createAnimation(scene, gameObject, type, animOptions, targetX);
    });
  });
  
  return Promise.all(promises);
}