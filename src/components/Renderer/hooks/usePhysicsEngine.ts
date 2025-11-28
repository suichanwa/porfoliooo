import { useRef, useEffect, useState } from 'react';
import { RenderEngine, Vector2D, BasePhysicsObject } from '../core/RenderEngine';
import { 
  DiaryEntryObject, 
  PageFlipObject, 
  ProjectCardObject, 
  SkillBadgeObject, 
  NavigationDotObject,
  SmoothEntryBehavior,
  OrbitalBehavior,
  ForceFieldBehavior
} from '../objects/MotionTypes';

export interface PhysicsEngineHook {
  engine: RenderEngine | null;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  addObject: (object: BasePhysicsObject) => void;
  removeObject: (id: string) => void;
  clearAll: () => void;
  getPerformanceStats: () => any;
}

export function usePhysicsEngine(canvasRef: React.RefObject<HTMLCanvasElement>): PhysicsEngineHook {
  const engineRef = useRef<RenderEngine | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new RenderEngine(canvasRef.current);
      console.log('Physics engine initialized');
    }

    return () => {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    };
  }, [canvasRef]);

  const start = () => {
    if (engineRef.current && !isRunning) {
      engineRef.current.start();
      setIsRunning(true);
    }
  };

  const stop = () => {
    if (engineRef.current && isRunning) {
      engineRef.current.stop();
      setIsRunning(false);
    }
  };

  const addObject = (object: BasePhysicsObject) => {
    if (engineRef.current) {
      engineRef.current.addObject(object);
    }
  };

  const removeObject = (id: string) => {
    if (engineRef.current) {
      engineRef.current.removeObject(id);
    }
  };

  const clearAll = () => {
    if (engineRef.current) {
      engineRef.current.clearAllObjects();
    }
  };

  const getPerformanceStats = () => {
    return engineRef.current?.getPerformanceStats();
  };

  return {
    engine: engineRef.current,
    isRunning,
    start,
    stop,
    addObject,
    removeObject,
    clearAll,
    getPerformanceStats
  };
}

// ===============================================
// SPECIALIZED HOOKS FOR DIFFERENT MOTION TYPES
// ===============================================

export interface DiaryEntryHook {
  object: DiaryEntryObject | null;
  triggerEntry: () => void;
  applyRandomForce: () => void;
  resetPosition: () => void;
}

export function useDiaryEntryMotion(
  id: string,
  initialPosition: { x: number; y: number },
  color?: string
): DiaryEntryHook {
  const objectRef = useRef<DiaryEntryObject | null>(null);

  useEffect(() => {
    objectRef.current = new DiaryEntryObject(
      id,
      new Vector2D(initialPosition.x, initialPosition.y),
      15,
      color || '#8B5CF6'
    );
  }, [id, initialPosition.x, initialPosition.y, color]);

  const triggerEntry = () => {
    // Entry animation will be handled by the physics engine
    if (objectRef.current) {
      const entryForce = new Vector2D(0, -20);
      objectRef.current.applyForce(entryForce);
    }
  };

  const applyRandomForce = () => {
    if (objectRef.current) {
      const angle = Math.random() * Math.PI * 2;
      const magnitude = Math.random() * 30 + 10;
      const force = new Vector2D(
        Math.cos(angle) * magnitude,
        Math.sin(angle) * magnitude
      );
      objectRef.current.applyForce(force);
    }
  };

  const resetPosition = () => {
    if (objectRef.current) {
      objectRef.current.stopMotion();
      objectRef.current.position = new Vector2D(initialPosition.x, initialPosition.y);
    }
  };

  return {
    object: objectRef.current,
    triggerEntry,
    applyRandomForce,
    resetPosition
  };
}

export interface ProjectCardHook {
  object: ProjectCardObject | null;
  setHovering: (hovering: boolean) => void;
  applyBounce: () => void;
}

export function useProjectCardMotion(
  id: string,
  initialPosition: { x: number; y: number },
  color?: string
): ProjectCardHook {
  const objectRef = useRef<ProjectCardObject | null>(null);

  useEffect(() => {
    objectRef.current = new ProjectCardObject(
      id,
      new Vector2D(initialPosition.x, initialPosition.y),
      25,
      color || '#10B981'
    );
  }, [id, initialPosition.x, initialPosition.y, color]);

  const setHovering = (hovering: boolean) => {
    if (objectRef.current) {
      objectRef.current.setHovering(hovering);
    }
  };

  const applyBounce = () => {
    if (objectRef.current) {
      objectRef.current.applyBounce();
    }
  };

  return {
    object: objectRef.current,
    setHovering,
    applyBounce
  };
}

export interface SkillBadgeHook {
  object: SkillBadgeObject | null;
  triggerPulse: () => void;
}

export function useSkillBadgeMotion(
  id: string,
  initialPosition: { x: number; y: number },
  color?: string
): SkillBadgeHook {
  const objectRef = useRef<SkillBadgeObject | null>(null);

  useEffect(() => {
    objectRef.current = new SkillBadgeObject(
      id,
      new Vector2D(initialPosition.x, initialPosition.y),
      12,
      color || '#EF4444'
    );
  }, [id, initialPosition.x, initialPosition.y, color]);

  const triggerPulse = () => {
    // Pulse is automatic in update, but we could trigger additional effects
    if (objectRef.current) {
      const pulseForce = new Vector2D(0, -10);
      objectRef.current.applyForce(pulseForce);
    }
  };

  return {
    object: objectRef.current,
    triggerPulse
  };
}

// ===============================================
// MOTION BEHAVIOR HOOKS
// ===============================================

export interface MotionBehaviorHook {
  behavior: SmoothEntryBehavior | OrbitalBehavior | ForceFieldBehavior | null;
  applyBehavior: (object: BasePhysicsObject) => void;
  isComplete: boolean;
  reset: () => void;
}

export function useSmoothEntry(
  startPosition: { x: number; y: number },
  targetPosition: { x: number; y: number },
  duration: number = 2
): MotionBehaviorHook {
  const behaviorRef = useRef<SmoothEntryBehavior | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    behaviorRef.current = new SmoothEntryBehavior(
      new Vector2D(startPosition.x, startPosition.y),
      new Vector2D(targetPosition.x, targetPosition.y),
      duration
    );
    setIsComplete(false);
  }, [startPosition.x, startPosition.y, targetPosition.x, targetPosition.y, duration]);

  const applyBehavior = (object: BasePhysicsObject) => {
    if (behaviorRef.current) {
      const complete = behaviorRef.current.update(object, 1/60); // Assume 60fps
      if (complete) {
        setIsComplete(true);
      }
    }
  };

  const reset = () => {
    if (behaviorRef.current) {
      behaviorRef.current = new SmoothEntryBehavior(
        new Vector2D(startPosition.x, startPosition.y),
        new Vector2D(targetPosition.x, targetPosition.y),
        duration
      );
      setIsComplete(false);
    }
  };

  return {
    behavior: behaviorRef.current,
    applyBehavior,
    isComplete,
    reset
  };
}

export function useOrbitalMotion(
  center: { x: number; y: number },
  radius: number = 50,
  speed: number = 1
): MotionBehaviorHook {
  const behaviorRef = useRef<OrbitalBehavior | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    behaviorRef.current = new OrbitalBehavior(
      new Vector2D(center.x, center.y),
      radius,
      speed
    );
  }, [center.x, center.y, radius, speed]);

  const applyBehavior = (object: BasePhysicsObject) => {
    if (behaviorRef.current) {
      behaviorRef.current.update(object, 1/60); // Assume 60fps
    }
  };

  const reset = () => {
    // Orbital motion is continuous, so reset just reinitializes
    behaviorRef.current = new OrbitalBehavior(
      new Vector2D(center.x, center.y),
      radius,
      speed
    );
  };

  return {
    behavior: behaviorRef.current,
    applyBehavior,
    isComplete, // Always false for orbital motion
    reset
  };
}

export function useForceField(
  strength: number = 10,
  radius: number = 100,
  isAttraction: boolean = true
): MotionBehaviorHook {
  const behaviorRef = useRef<ForceFieldBehavior | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    behaviorRef.current = new ForceFieldBehavior(strength, radius, isAttraction);
  }, [strength, radius, isAttraction]);

  const applyBehavior = (object: BasePhysicsObject) => {
    if (behaviorRef.current) {
      // Force field needs a center position, which would be provided externally
      // This hook is typically used with mouse position or another reference point
    }
  };

  const reset = () => {
    behaviorRef.current = new ForceFieldBehavior(strength, radius, isAttraction);
  };

  return {
    behavior: behaviorRef.current,
    applyBehavior,
    isComplete, // Always false for force field
    reset
  };
}
