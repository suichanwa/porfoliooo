import { motion, MotionValue } from 'motion/react';

interface VelocityVisualizationProps {
  ballX: MotionValue<number>;
  speed: number;
  vectorLength: number;
}

export default function VelocityVisualization({ ballX, speed, vectorLength }: VelocityVisualizationProps): JSX.Element {
  return (
    <motion.g style={{ x: ballX }}>
      <motion.circle cy="132" r="12" fill="#3d8eff" />
      
      <g>
        <line x1="0" y1="132" x2={vectorLength} y2="132" stroke="#5ba3ff" strokeWidth="4" />
        <polygon points={`${vectorLength},132 ${vectorLength-8},126 ${vectorLength-8},138`} fill="#5ba3ff" />
        <text x="-50" y="107" fill="#88ccff" fontSize="12" fontFamily="monospace" fontWeight="bold">
          v = {speed} px/s →
        </text>
      </g>
    </motion.g>
  );
}