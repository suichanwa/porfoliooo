import React, { useRef, useEffect } from 'react';

interface ManaBarFillProps {
  width?: number;
  height?: number;
  fillPercentage?: number;
  isPlayerBar?: boolean;
  onRender?: (imageData: string) => void;
}

export const ManaBarFill: React.FC<ManaBarFillProps> = ({
  width = 160,
  height = 16,
  fillPercentage = 1,
  isPlayerBar = true,
  onRender
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current && onRender) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw the mana bar fill
      drawManaBarFill(ctx, width, height, fillPercentage, isPlayerBar);
      
      // Convert to image data
      const imageData = canvasRef.current.toDataURL('image/png');
      onRender(imageData);
    }
  }, [width, height, fillPercentage, isPlayerBar, onRender]);
  
  const drawManaBarFill = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    fillPercentage: number,
    isPlayerBar: boolean
  ) => {
    // Clamp fill percentage between 0 and 1
    fillPercentage = Math.max(0, Math.min(1, fillPercentage));
    
    // Set colors for mana bar
    let mainColor = '#4dabf7'; // Standard blue
    let secondaryColor = '#1864ab'; // Darker blue
    let pulseColor = 'rgba(77, 171, 247, 0.7)';
    
    // Low mana color variation
    if (fillPercentage <= 0.3) {
      // Low mana - more desaturated blue
      mainColor = '#74c0fc';
      secondaryColor = '#1971c2';
      pulseColor = 'rgba(116, 192, 252, 0.7)';
    }
    
    // Calculate fill dimensions
    const padding = height / 6;
    const fillWidth = (width - padding * 2) * fillPercentage;
    const fillHeight = height - padding * 2;
    
    // Create gradient fill
    const gradient = ctx.createLinearGradient(
      padding, 
      padding, 
      padding, 
      padding + fillHeight
    );
    gradient.addColorStop(0, mainColor);
    gradient.addColorStop(1, secondaryColor);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(padding, padding, fillWidth, fillHeight);
    
    // Add a shine effect at the top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(padding, padding, fillWidth, fillHeight / 4);
    
    // Low mana pulse effect
    if (fillPercentage < 0.3) {
      ctx.fillStyle = pulseColor;
      ctx.globalAlpha = 0.4;
      ctx.fillRect(padding, padding, fillWidth, fillHeight);
      ctx.globalAlpha = 1;
    }
    
    // Add some magical particles at the edge where the fill ends
    if (fillPercentage > 0.05 && fillPercentage < 0.98) {
      drawMagicalEdge(ctx, padding + fillWidth, padding, fillHeight, pulseColor);
    }
  };
  
  const drawMagicalEdge = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    height: number,
    color: string
  ) => {
    // Draw small particles at the edge of the fill
    for (let i = 0; i < 8; i++) {
      const particleY = y + Math.random() * height;
      const particleSize = Math.random() * 2 + 0.5;
      const distance = Math.random() * 3;
      
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x - distance, particleY, particleSize, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      style={{ display: 'none' }}
    />
  );
};

export default ManaBarFill;