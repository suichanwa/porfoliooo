import { useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";

export const useSimulationTime = (initialSpeed = 8) => {
  const [speed, setSpeed] = useState(initialSpeed);
  const timeRef = useRef(0);

  useFrame((_, delta) => {
    timeRef.current += delta * speed;
  });

  return { timeRef, speed, setSpeed };
};
