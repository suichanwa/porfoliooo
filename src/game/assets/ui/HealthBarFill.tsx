import React, { useRef, useEffect } from 'react';

interface HealthBarFillProps {
  width?: number;
  height?: number;
  fillPercentage?: number;
  isPlayerBar?: boolean;
  onRender?: (imageData: string) => void;
}

export const HealthBarFill: React.FC<HealthBarFillProps> = ({
  width = 160,
  height = 24,
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
      
      // Draw the health bar fill
      drawHealthBarFill(ctx, width, height, fillPercentage, isPlayerBar);
      
      // Convert to image data
      const imageData = canvasRef.current.toDataURL('image/png');
      onRender(imageData);
    }
  }, [width, height, fillPercentage, isPlayerBar, onRender]);
  
  const drawHealthBarFill = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    fillPercentage: number,
    isPlayerBar: boolean
  ) => {
    // Clamp fill percentage between 0 and 1
    fillPercentage = Math.max(0, Math.min(1, fillPercentage));
    
    // Set colors based on player/enemy
    let mainColor, secondaryColor, pulseColor;
    
    if (isPlayerBar) {
      // Player colors - Green with different shades based on health
      if (fillPercentage > 0.6) {
        // Healthy - bright green
        mainColor = '#64dd17';
        secondaryColor = '#33691e';
        pulseColor = 'rgba(100, 221, 23, 0.7)';
      } else if (fillPercentage > 0.3) {
        // Medium health - yellowish
        mainColor = '#ffeb3b';
        secondaryColor = '#f57f17';
        pulseColor = 'rgba(255, 235, 59, 0.7)';
      } else {
        // Low health - reddish
        mainColor = '#ff9800';
        secondaryColor = '#e65100';
        pulseColor = 'rgba(255, 152, 0, 0.7)';
      }
    } else {
      // Enemy is always red with variations
      mainColor = '#f44336';
      secondaryColor = '#b71c1c';
      pulseColor = 'rgba(244, 67, 54, 0.7)';
    }
    
    const padding = height / 6;
    const fillWidth = (width - padding * 2) * fillPercentage;
    const fillHeight = height - padding * 2;
    
    if (fillWidth <= 0) return; // Nothing to draw
    
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
    
    // Low health pulse effect
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
    for (let i = 0; i < 10; i++) {
      const particleY = y + Math.random() * height;
      const particleSize = Math.random() * 3 + 1;
      const distance = Math.random() * 4;
      
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

export default HealthBarFill;