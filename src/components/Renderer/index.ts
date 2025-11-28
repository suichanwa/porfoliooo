// Core Physics Engine
export { 
  Vector2D, 
  PhysicsObject, 
  BasePhysicsObject, 
  RenderEngine, 
  PerformanceMonitor 
} from './core/RenderEngine';

// Motion Types and Specialized Objects
export {
  DiaryEntryObject,
  PageFlipObject,
  ProjectCardObject,
  SkillBadgeObject,
  NavigationDotObject,
  SmoothEntryBehavior,
  OrbitalBehavior,
  ForceFieldBehavior
} from './objects/MotionTypes';

// React Hooks for Physics Integration
export {
  usePhysicsEngine,
  useDiaryEntryMotion,
  useProjectCardMotion,
  useSkillBadgeMotion,
  useSmoothEntry,
  useOrbitalMotion,
  useForceField
} from './hooks/usePhysicsEngine';

// React Components
export { default as MotionDemo } from './components/MotionDemo';

// Re-export MotionDemo hooks for easy access
export {
  useDiaryPhysics,
  useProjectCardPhysics,
  useSkillPhysics
} from './components/MotionDemo';

// ===============================================
// CONVENIENCE EXPORTS
// ===============================================

// Quick access to the main physics engine
export type { PhysicsEngineHook } from './hooks/usePhysicsEngine';

// Motion-specific hooks
export type { 
  DiaryEntryHook, 
  ProjectCardHook, 
  SkillBadgeHook,
  MotionBehaviorHook 
} from './hooks/usePhysicsEngine';

// Component props
export type { MotionDemoProps } from './components/MotionDemo';

// ===============================================
// USAGE EXAMPLES
// ===============================================

/**
 * BASIC USAGE EXAMPLE:
 * 
 * ```tsx
 * import { MotionDemo } from '@/components/Renderer';
 * 
 * function MyComponent() {
 *   return (
 *     <div className="p-6">
 *       <MotionDemo demoType="diary" />
 *     </div>
 *   );
 * }
 * ```
 * 
 * ADVANCED USAGE EXAMPLE:
 * 
 * ```tsx
 * import { 
 *   usePhysicsEngine, 
 *   useDiaryEntryMotion, 
 *   useProjectCardMotion 
 * } from '@/components/Renderer';
 * 
 * function MyAdvancedComponent() {
 *   const canvasRef = useRef<HTMLCanvasElement>(null);
 *   const { engine, start, addObject } = usePhysicsEngine(canvasRef);
 *   const diaryMotion = useDiaryEntryMotion('my-diary', { x: 100, y: 100 });
 *   const projectMotion = useProjectCardMotion('my-project', { x: 200, y: 200 });
 * 
 *   useEffect(() => {
 *     if (engine && diaryMotion.object) {
 *       addObject(diaryMotion.object);
 *       start();
 *     }
 *   }, [engine, diaryMotion.object]);
 * 
 *   return (
 *     <canvas ref={canvasRef} width={800} height={600} />
 *   );
 * }
 * ```
 * 
 * INTEGRATION WITH EXISTING COMPONENTS:
 * 
 * ```tsx
 * import { useDiaryPhysics } from '@/components/Renderer';
 * import DiaryEntry from '@/components/DiaryEntry';
 * 
 * function PhysicsEnabledDiaryEntry({ id, content }: Props) {
 *   const elementRef = useRef<HTMLDivElement>(null);
 *   const { physicsEnabled, setPhysicsEnabled, diaryMotion } = useDiaryPhysics(id, elementRef);
 * 
 *   return (
 *     <div ref={elementRef}>
 *       <DiaryEntry content={content} />
 *       <button onClick={() => setPhysicsEnabled(!physicsEnabled)}>
 *         Toggle Physics
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */

// ===============================================
// PHYSICS ENGINE CONFIGURATION
// ===============================================

export interface PhysicsConfig {
  gravity: { x: number; y: number };
  airResistance: number;
  friction: number;
  timeStep: number;
  maxDeltaTime: number;
}

// Default physics configuration
export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  gravity: { x: 0, y: 0 }, // No gravity for portfolio objects
  airResistance: 0.02,
  friction: 0.8,
  timeStep: 1 / 60, // 60 FPS
  maxDeltaTime: 0.1
};

// ===============================================
// MOTION PRESETS
// ===============================================

export interface MotionPreset {
  name: string;
  description: string;
  config: {
    mass: number;
    inertia: number;
    friction: number;
    airResistance: number;
  };
}

export const MOTION_PRESETS: Record<string, MotionPreset> = {
  diary: {
    name: 'Diary Entry',
    description: 'Gentle floating motion with low inertia',
    config: {
      mass: 0.5,
      inertia: 0.3,
      friction: 0.9,
      airResistance: 0.05
    }
  },
  projectCard: {
    name: 'Project Card',
    description: 'Bouncy motion with high inertia',
    config: {
      mass: 2,
      inertia: 2,
      friction: 0.6,
      airResistance: 0.04
    }
  },
  skillBadge: {
    name: 'Skill Badge',
    description: 'Subtle pulsing with medium inertia',
    config: {
      mass: 0.8,
      inertia: 0.8,
      friction: 0.85,
      airResistance: 0.02
    }
  },
  navigation: {
    name: 'Navigation Dot',
    description: 'Smooth traversal with very low inertia',
    config: {
      mass: 0.3,
      inertia: 0.4,
      friction: 0.95,
      airResistance: 0.01
    }
  }
};

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

/**
 * Create a physics object with preset configuration
 */
export function createPhysicsObject(
  type: keyof typeof MOTION_PRESETS,
  id: string,
  position: { x: number; y: number },
  radius: number = 10,
  color: string = '#4F46E5'
) {
  const preset = MOTION_PRESETS[type];
  if (!preset) {
    throw new Error(`Unknown motion preset: ${type}`);
  }

  // This would return the appropriate object type based on the preset
  // Implementation would depend on the specific object creation logic
  return null; // Placeholder
}

/**
 * Apply a force to an object based on mouse position
 */
export function applyMouseForce(
  object: any,
  mousePos: { x: number; y: number },
  mouseDown: boolean
) {
  if (!mouseDown) return;

  const force = new (require('./core/RenderEngine').Vector2D)(
    mousePos.x - object.position.x,
    mousePos.y - object.position.y
  );
  
  const magnitude = Math.min(force.magnitude() * 0.1, 50);
  const normalizedForce = force.normalize().multiply(magnitude);
  
  object.applyForce(normalizedForce);
}

/**
 * Get performance statistics for monitoring
 */
export function getPerformanceStats(engine: any) {
  if (!engine) return null;
  return engine.getPerformanceStats();
}
