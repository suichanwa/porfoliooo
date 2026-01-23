import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";

export const useSimulationTime = (speed = 8, initialTimeDays = 0) => {
  const timeRef = useRef(initialTimeDays);
  const speedRef = useRef(speed);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useFrame((_, delta) => {
    timeRef.current += delta * speedRef.current;
  });

  return { timeRef };
};
