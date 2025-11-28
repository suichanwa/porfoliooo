import { useState, useEffect } from 'react';
import { useMotionValue, useTransform, animate } from 'motion/react';
import AnimationCanvas from './AnimationCanvas';
import ControlPanel from './ControlPanel';
import SpeedVisualization from './visualizations/SpeedVisualization';
import VelocityVisualization from './visualizations/VelocityVisualization';
import AccelerationVisualization from './visualizations/AccelerationVisualization';

interface MotionDemoProps {
  type: 'speed' | 'velocity' | 'acceleration';
}

export default function MotionDemo({ type }: MotionDemoProps): JSX.Element {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(50);
  const [time, setTime] = useState<number>(0);
  
  const position = useMotionValue(0);
  const currentSpeed = useMotionValue(speed);
  const ballX = useTransform(position, [0, 600], [50, 650]);

  useEffect(() => {
    let animationControls: any;
    let startTime: number;
    let animationFrame: number;

    if (isPlaying) {
      startTime = Date.now();
      
      if (type === 'acceleration') {
        const updateAcceleration = () => {
          const elapsed = (Date.now() - startTime) / 1000;
          setTime(elapsed);
          
          const newSpeed = Math.min(30 + 10 * elapsed, 150);
          currentSpeed.set(newSpeed);
          
          const newPosition = position.get() + newSpeed * 0.016;
          
          if (newPosition >= 600) {
            position.set(0);
            startTime = Date.now();
          } else {
            position.set(newPosition);
          }
          
          if (isPlaying) {
            animationFrame = requestAnimationFrame(updateAcceleration);
          }
        };
        
        animationFrame = requestAnimationFrame(updateAcceleration);
      } else {
        const duration = 600 / speed;
        
        animationControls = animate(position, 600, {
          duration,
          ease: 'linear',
          repeat: Infinity,
          onUpdate: () => {
            const elapsed = (Date.now() - startTime) / 1000;
            setTime(elapsed % duration);
          }
        });
      }
    }

    return () => {
      if (animationControls) animationControls.stop();
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isPlaying, speed, type, position, currentSpeed]);

  const handleReset = (): void => {
    setIsPlaying(false);
    position.set(0);
    currentSpeed.set(speed);
    setTime(0);
  };

  const handleStop = (): void => {
    setIsPlaying(false);
  };

  const handleSpeedChange = (newSpeed: number): void => {
    setSpeed(newSpeed);
    if (!isPlaying) {
      currentSpeed.set(newSpeed);
    }
  };

  const vectorLength = type === 'acceleration' 
    ? Math.min(currentSpeed.get() * 0.8, 100)
    : Math.min(speed * 0.8, 100);

  return (
    <div className="bg-gradient-to-br from-base-200/50 to-base-300/30 backdrop-blur-sm rounded-xl border border-blue-500/20 p-6 shadow-xl">
      <AnimationCanvas time={time} position={position.get()}>
        {type === 'speed' && (
          <SpeedVisualization ballX={ballX} speed={speed} vectorLength={vectorLength} />
        )}
        {type === 'velocity' && (
          <VelocityVisualization ballX={ballX} speed={speed} vectorLength={vectorLength} />
        )}
        {type === 'acceleration' && (
          <AccelerationVisualization ballX={ballX} currentSpeed={currentSpeed} />
        )}
      </AnimationCanvas>
      
      <ControlPanel
        isPlaying={isPlaying}
        speed={speed}
        showSpeedControl={type !== 'acceleration'}
        onPlay={() => setIsPlaying(!isPlaying)}
        onStop={handleStop}
        onReset={handleReset}
        onSpeedChange={handleSpeedChange}
      />
    </div>
  );
}