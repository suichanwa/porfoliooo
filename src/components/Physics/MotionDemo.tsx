import { useState, useEffect, useRef } from 'react';
import AnimationCanvas from './AnimationCanvas';
import ControlPanel from './ControlPanel';

interface MotionDemoProps {
  type: 'speed' | 'velocity' | 'acceleration';
}

export default function MotionDemo({ type }: MotionDemoProps): JSX.Element {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(50);
  const [time, setTime] = useState<number>(0);
  const [position, setPosition] = useState<number>(0);
  const [currentSpeed, setCurrentSpeed] = useState<number>(50);
  
  const animationFrameRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      return;
    }

    let animationId: number;
    let lastTime = performance.now();
    
    const updateAnimation = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      const elapsed = (currentTime - startTimeRef.current) / 1000;
      
      setTime(elapsed);
      
      let newPosition = 0;
      
      if (type === 'acceleration') {
        const newSpeed = Math.min(30 + 10 * elapsed, 150);
        setCurrentSpeed(newSpeed);
        newPosition = (elapsed * newSpeed * 0.2) % 600;
      } else {
        // More visible movement: position increases based on speed
        const currentPos = (elapsed * speed * 2) % 600;
        newPosition = currentPos;
      }
      
      setPosition(newPosition);
      
      if (isPlaying) {
        animationId = requestAnimationFrame(updateAnimation);
        animationFrameRef.current = animationId;
      }
    };
    
    startTimeRef.current = performance.now();
    lastTime = startTimeRef.current;
    animationId = requestAnimationFrame(updateAnimation);
    animationFrameRef.current = animationId;

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [isPlaying, speed, type]);

  const handleReset = (): void => {
    setIsPlaying(false);
    setPosition(0);
    setCurrentSpeed(speed);
    setTime(0);
  };

  const handleStop = (): void => {
    setIsPlaying(false);
  };

  const handleSpeedChange = (newSpeed: number): void => {
    setSpeed(newSpeed);
    if (!isPlaying) {
      setCurrentSpeed(newSpeed);
    }
  };

  const displaySpeed = type === 'acceleration' ? currentSpeed : speed;
  const vectorLength = Math.min(displaySpeed * 0.8, 100);

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-600 p-4 sm:p-6 shadow-lg">
      <AnimationCanvas time={time} position={position} isAnimating={isPlaying} />
      
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
