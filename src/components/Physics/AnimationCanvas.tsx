import { motion } from 'motion/react';
import { ReactNode } from 'react';
import FPSCounter from './../FPSCounter';

interface AnimationCanvasProps {
  children: ReactNode;
  time: number;
  position: number;
}

export default function AnimationCanvas({ children, time, position }: AnimationCanvasProps): JSX.Element {
  return (
    <div className="w-full h-56 bg-base-300/50 rounded-lg mb-6 relative overflow-hidden">
      <FPSCounter />
      
      <svg className="w-full h-full" viewBox="0 0 800 224">
        {/* Background */}
        <rect width="800" height="224" fill="#1a1f2e" />
        
        {/* Track */}
        <line
          x1="50"
          y1="132"
          x2="650"
          y2="132"
          stroke="#3d8eff"
          strokeWidth="2"
          strokeDasharray="10,10"
        />
        
        {/* Start/End markers */}
        <circle cx="50" cy="132" r="4" fill="#5ba3ff" />
        <circle cx="650" cy="132" r="4" fill="#5ba3ff" />
        <text x="40" y="150" fill="#5ba3ff" fontSize="11" fontWeight="bold">Start</text>
        <text x="638" y="150" fill="#5ba3ff" fontSize="11" fontWeight="bold">End</text>
        
        {/* Animated content */}
        {children}
        
        {/* Info display */}
        <text x="15" y="20" fill="#5ba3ff" fontSize="13" fontFamily="monospace" fontWeight="bold">
          Time: {time.toFixed(2)}s
        </text>
        <text x="150" y="20" fill="#5ba3ff" fontSize="13" fontFamily="monospace" fontWeight="bold">
          Position: {position.toFixed(0)}px
        </text>
      </svg>
    </div>
  );
}