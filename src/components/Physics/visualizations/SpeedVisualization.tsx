import { motion, MotionValue } from 'motion/react';

interface SpeedVisualizationProps {
  ballX: MotionValue<number>;
  speed: number;
  vectorLength: number;
}

export default function SpeedVisualization({ ballX, speed, vectorLength }: SpeedVisualizationProps): JSX.Element {
  return (
    <motion.g style={{ x: ballX }}>
      <motion.circle cy="132" r="12" fill="#5ba3ff" />
      
      <g>
        <line x1="0" y1="72" x2={vectorLength} y2="72" stroke="#88ccff" strokeWidth="3" />
        <polygon points={`${vectorLength},72 ${vectorLength-7},67 ${vectorLength-7},77`} fill="#88ccff" />
        <text x={vectorLength + 5} y="77" fill="#88ccff" fontSize="12" fontFamily="monospace" fontWeight="bold">
          {speed} px/s
        </text>
      </g>
    </motion.g>
  );
}