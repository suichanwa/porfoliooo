import { motion, MotionValue } from 'motion/react';

interface AccelerationVisualizationProps {
  ballX: MotionValue<number>;
  currentSpeed: MotionValue<number>;
}

export default function AccelerationVisualization({ ballX, currentSpeed }: AccelerationVisualizationProps): JSX.Element {
  const velocityLength = Math.min(currentSpeed.get() * 1.2, 100);
  
  return (
    <motion.g style={{ x: ballX }}>
      <motion.circle cy="132" r="12" fill="#2563eb" />
      
      <g>
        {/* Velocity vector (growing) */}
        <line x1="0" y1="132" x2={velocityLength} y2="132" stroke="#5ba3ff" strokeWidth="4" />
        <polygon points={`${velocityLength},132 ${velocityLength-8},126 ${velocityLength-8},138`} fill="#5ba3ff" />
        
        {/* Acceleration vector (constant) */}
        <line x1="0" y1="62" x2="40" y2="62" stroke="#f59e0b" strokeWidth="3" />
        <polygon points="40,62 33,57 33,67" fill="#f59e0b" />
        
        {/* Labels */}
        <text x="-50" y="147" fill="#88ccff" fontSize="12" fontFamily="monospace" fontWeight="bold">
          v = {currentSpeed.get().toFixed(0)} px/s
        </text>
        <text x="-40" y="57" fill="#f59e0b" fontSize="12" fontFamily="monospace" fontWeight="bold">
          a = 10 px/s²
        </text>
      </g>
    </motion.g>
  );
}