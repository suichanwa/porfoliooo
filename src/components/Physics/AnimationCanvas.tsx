import { motion } from 'motion/react';
import { ReactNode } from 'react';
import FPSCounter from './../FPSCounter';

interface AnimationCanvasProps {
  children?: ReactNode;
  time: number;
  position: number;
  isAnimating?: boolean;
}

export default function AnimationCanvas({ children, time, position, isAnimating = false }: AnimationCanvasProps): JSX.Element {
  const ballPosition = Math.max(40, Math.min(760, 40 + (position / 600) * 720));

  return (
    <div className="w-full h-48 sm:h-56 lg:h-64 bg-gray-800 rounded-lg mb-4 sm:mb-6 relative overflow-hidden border border-gray-600 shadow-lg">
      <FPSCounter isAnimating={isAnimating} />
      
      {/* Simplified background with CSS */}
      <div className="absolute inset-0 bg-gray-900">
        {/* Track - CSS-based for better performance */}
        <div className="absolute top-1/2 left-5 right-5 h-0.5 bg-blue-400 transform -translate-y-1/2"></div>
        
        {/* Start marker */}
        <div className="absolute left-5 top-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        
        {/* End marker */}
        <div className="absolute right-5 top-1/2 w-1.5 h-1.5 bg-blue-400 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
      </div>
      
      {/* Animated ball - CSS transform instead of SVG */}
      <div 
        className="absolute top-1/2 w-4 h-4 bg-blue-400 rounded-full will-change-transform shadow-lg"
        style={{
          left: `${(ballPosition / 800) * 100}%`,
          transform: `translate(-50%, -50%) translateZ(0)` // GPU hint
        }}
      />
      
      {/* Debug info */}
      <div className="absolute top-6 left-2 text-red-400 text-xs font-mono">
        bp: {ballPosition.toFixed(0)}
      </div>
      
      {/* Info display - minimal text for performance */}
      <div className="absolute top-2 left-2 text-blue-400 text-xs font-mono">
        t: {time.toFixed(1)}s | p: {position.toFixed(0)}px
      </div>
      
      {/* Simplified speed indicator */}
      <div className="absolute bottom-2 left-2 text-blue-400 text-xs font-mono hidden sm:block">
        {isAnimating ? "▶ Active" : "⏸ Stopped"}
      </div>
      
      {/* Simple mobile indicator */}
      <div className="absolute bottom-2 right-2 text-blue-400 text-xs sm:hidden">
        {isAnimating ? "▶" : "⏸"}
      </div>
      
      {/* Mobile touch hint */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-gray-400 text-xs sm:hidden">
        👆 Controls
      </div>
    </div>
  );
}
