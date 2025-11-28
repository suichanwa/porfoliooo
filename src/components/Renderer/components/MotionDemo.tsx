import React, { useRef, useEffect, useState } from 'react';
import { usePhysicsEngine, useDiaryEntryMotion, useProjectCardMotion, useSkillBadgeMotion } from '../hooks/usePhysicsEngine';
import { Vector2D } from '../core/RenderEngine';
import { BasePhysicsObject } from '../core/RenderEngine';

interface MotionDemoProps {
  className?: string;
  showControls?: boolean;
  demoType?: 'diary' | 'projects' | 'skills' | 'all';
}

const MotionDemo: React.FC<MotionDemoProps> = ({ 
  className = '', 
  showControls = true, 
  demoType = 'all' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    engine, 
    isRunning, 
    start, 
    stop, 
    addObject, 
    clearAll, 
    getPerformanceStats 
  } = usePhysicsEngine(canvasRef);
  
  // Motion objects
  const diaryEntry1 = useDiaryEntryMotion('diary-1', { x: 100, y: 150 }, '#8B5CF6');
  const diaryEntry2 = useDiaryEntryMotion('diary-2', { x: 200, y: 200 }, '#10B981');
  const projectCard1 = useProjectCardMotion('project-1', { x: 400, y: 100 }, '#F59E0B');
  const skillBadge1 = useSkillBadgeMotion('skill-1', { x: 300, y: 250 }, '#EF4444');
  
  const [stats, setStats] = useState<any>(null);

  // Initialize objects when engine is ready
  useEffect(() => {
    if (engine && !isRunning) {
      // Add objects based on demo type
      if (demoType === 'diary' || demoType === 'all') {
        if (diaryEntry1.object) addObject(diaryEntry1.object);
        if (diaryEntry2.object) addObject(diaryEntry2.object);
      }
      
      if (demoType === 'projects' || demoType === 'all') {
        if (projectCard1.object) addObject(projectCard1.object);
      }
      
      if (demoType === 'skills' || demoType === 'all') {
        if (skillBadge1.object) addObject(skillBadge1.object);
      }
      
      start();
    }
  }, [engine, isRunning, demoType]);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getPerformanceStats());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [getPerformanceStats]);

  const handleRandomForces = () => {
    if (engine) {
      engine.applyRandomForces();
    }
  };

  const handleReset = () => {
    if (engine) {
      engine.resetAllObjects();
      clearAll();
      
      // Re-add objects
      if (diaryEntry1.object) addObject(diaryEntry1.object);
      if (diaryEntry2.object) addObject(diaryEntry2.object);
      if (projectCard1.object) addObject(projectCard1.object);
      if (skillBadge1.object) addObject(skillBadge1.object);
    }
  };

  const triggerBounce = () => {
    if (projectCard1.object) {
      projectCard1.applyBounce();
    }
  };

  const triggerDiaryFloat = () => {
    if (diaryEntry1.object) {
      diaryEntry1.applyRandomForce();
    }
  };

  return (
    <div className={`bg-gradient-to-br from-base-200/50 to-base-300/30 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6 shadow-xl ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          Physics Motion Demo - Newton's First Law
        </h3>
        <p className="text-sm text-gray-300">
          Objects with inertia: they resist changes to their state of motion. 
          Click the buttons to apply forces and see how different objects respond based on their mass and inertia.
        </p>
      </div>
      
      {/* Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="border border-gray-600 rounded-lg bg-gray-900/50 w-full max-w-full"
          style={{ aspectRatio: '3/2' }}
        />
        
        {/* Overlay with object labels */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-2 left-2 text-xs text-purple-400">
            📝 Diary Entry (Low Inertia)
          </div>
          <div className="absolute top-2 right-2 text-xs text-yellow-400">
            📋 Project Card (High Inertia)
          </div>
          <div className="absolute bottom-2 left-2 text-xs text-red-400">
            🏆 Skill Badge (Medium Inertia)
          </div>
        </div>
      </div>

      {showControls && (
        <div className="mt-4 space-y-3">
          {/* Control Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={isRunning ? stop : start}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                isRunning 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {isRunning ? '⏸️ Stop' : '▶️ Start'}
            </button>
            
            <button
              onClick={handleRandomForces}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
            >
              🎯 Apply Random Forces
            </button>
            
            <button
              onClick={handleReset}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm font-medium transition-colors"
            >
              🔄 Reset All
            </button>
          </div>

          {/* Individual Controls */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={triggerDiaryFloat}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition-colors"
            >
              📝 Nudge Diary Entry
            </button>
            
            <button
              onClick={triggerBounce}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium transition-colors"
            >
              📋 Bounce Project Card
            </button>
          </div>

          {/* Performance Stats */}
          {stats && (
            <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-600">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Performance Stats</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-gray-400">
                <div>FPS: {stats.fps}</div>
                <div>Objects: {stats.objects}</div>
                <div>Draw Calls: {stats.drawCalls}</div>
                <div>Memory: {stats.memory.toFixed(1)}MB</div>
                <div>Delta: {stats.deltaTime.toFixed(3)}s</div>
              </div>
            </div>
          )}

          {/* Physics Explanation */}
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <h4 className="text-sm font-medium text-blue-300 mb-2">🔬 Newton's First Law in Action</h4>
            <ul className="text-xs text-blue-200 space-y-1">
              <li>• <strong>Diary Entry:</strong> Low mass = Low inertia = Responds quickly to forces</li>
              <li>• <strong>Project Card:</strong> High mass = High inertia = Needs more force to move</li>
              <li>• <strong>Skill Badge:</strong> Medium mass = Medium inertia = Balanced response</li>
              <li>• All objects continue in their current state unless acted upon by a force</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MotionDemo;

// ===============================================
// HOOKS FOR INTEGRATION WITH EXISTING COMPONENTS
// ===============================================

// Hook to add physics to existing diary entries
export function useDiaryPhysics(id: string, elementRef: React.RefObject<HTMLElement>) {
  const [physicsEnabled, setPhysicsEnabled] = useState(false);
  const diaryMotion = useDiaryEntryMotion(id, { x: 0, y: 0 }); // Position will be updated

  useEffect(() => {
    if (!elementRef.current || !physicsEnabled) return;

    const element = elementRef.current;
    const rect = element.getBoundingClientRect();
    
    // Update position based on element's current position
    // This would integrate with the actual physics engine
  }, [physicsEnabled, elementRef]);

  return {
    physicsEnabled,
    setPhysicsEnabled,
    diaryMotion
  };
}

// Hook for project cards
export function useProjectCardPhysics(id: string, elementRef: React.RefObject<HTMLElement>) {
  const [physicsEnabled, setPhysicsEnabled] = useState(false);
  const projectMotion = useProjectCardMotion(id, { x: 0, y: 0 });

  // Similar implementation to diary physics
  return {
    physicsEnabled,
    setPhysicsEnabled,
    projectMotion
  };
}

// Hook for skill badges
export function useSkillPhysics(id: string, elementRef: React.RefObject<HTMLElement>) {
  const [physicsEnabled, setPhysicsEnabled] = useState(false);
  const skillMotion = useSkillBadgeMotion(id, { x: 0, y: 0 });

  // Similar implementation
  return {
    physicsEnabled,
    setPhysicsEnabled,
    skillMotion
  };
}
