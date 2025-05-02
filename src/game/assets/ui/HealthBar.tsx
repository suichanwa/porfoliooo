import React, { useRef, useEffect } from 'react';

interface HealthBarProps {
  width?: number;
  height?: number;
  isPlayerBar?: boolean;
  onRender?: (imageData: string) => void;
}

export const HealthBar: React.FC<HealthBarProps> = ({
  width = 160,
  height = 24,
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
      
      // Draw the health bar
      drawHealthBar(ctx, width, height, isPlayerBar);
      
      // Convert to image data
      const imageData = canvasRef.current.toDataURL('image/png');
      onRender(imageData);
    }
  }, [width, height, isPlayerBar, onRender]);
  
  const drawHealthBar = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isPlayerBar: boolean
  ) => {
    // Set colors based on player/enemy
    const mainColor = isPlayerBar ? '#64dd17' : '#f44336'; // Green for player, red for enemy
    const secondaryColor = isPlayerBar ? '#33691e' : '#b71c1c'; // Darker shade
    const glowColor = isPlayerBar ? 'rgba(100, 221, 23, 0.5)' : 'rgba(244, 67, 54, 0.5)';
    
    // Draw background (frame)
    drawBarFrame(ctx, width, height);
    
    // Draw the fill area (empty)
    drawBarFill(ctx, width, height, mainColor, secondaryColor, glowColor);
    
    // Draw decorative runes
    drawRunes(ctx, width, height, isPlayerBar);
    
    // Add a subtle inner glow
    drawInnerGlow(ctx, width, height, glowColor);
  };
  
  const drawBarFrame = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Outer frame with stone texture effect
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(0, 0, width, height);
    
    // Inner carved area
    ctx.fillStyle = '#2a2a3a';
    const padding = height / 6;
    ctx.fillRect(padding, padding, width - padding * 2, height - padding * 2);
    
    // Add stone texture using noise
    addStoneTexture(ctx, 0, 0, width, height, '#3a3a4a', '#33333f');
    
    // Highlight edges
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, 0);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.stroke();
  };
  
  const drawBarFill = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    mainColor: string,
    secondaryColor: string,
    glowColor: string
  ) => {
    const padding = height / 6;
    const fillWidth = width - padding * 2;
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
  };
  
  const drawRunes = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number,
    isPlayerBar: boolean
  ) => {
    // Define rune color
    const runeColor = isPlayerBar ? 
      'rgba(180, 255, 180, 0.7)' : 
      'rgba(255, 180, 180, 0.7)';
    
    ctx.fillStyle = runeColor;
    
    // Add small rune symbols along the bar
    const padding = height / 6;
    const runeSize = height / 3;
    const totalRunes = 3;
    const runeSpacing = (width - padding * 2 - runeSize) / (totalRunes - 1);
    
    for (let i = 0; i < totalRunes; i++) {
      const x = padding + i * runeSpacing;
      const y = height / 2 - runeSize / 2;
      
      // Draw a simple rune shape
      if (i === 0) {
        // First rune - triangle
        ctx.beginPath();
        ctx.moveTo(x + runeSize/2, y);
        ctx.lineTo(x + runeSize, y + runeSize);
        ctx.lineTo(x, y + runeSize);
        ctx.closePath();
        ctx.fill();
      } else if (i === 1) {
        // Middle rune - circle
        ctx.beginPath();
        ctx.arc(x + runeSize/2, y + runeSize/2, runeSize/2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Last rune - square with center dot
        ctx.fillRect(x, y, runeSize, runeSize);
        ctx.fillStyle = '#2a2a3a';
        ctx.fillRect(x + runeSize/3, y + runeSize/3, runeSize/3, runeSize/3);
        ctx.fillStyle = runeColor;
      }
    }
  };
  
  const drawInnerGlow = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    glowColor: string
  ) => {
    const padding = height / 6;
    
    // Create a subtle glow around the fill area
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      padding - 1, 
      padding - 1, 
      width - (padding * 2) + 2, 
      height - (padding * 2) + 2
    );
  };
  
  const addStoneTexture = (
    ctx: CanvasRenderingContext2D,
    x: number, 
    y: number, 
    width: number, 
    height: number,
    baseColor: string,
    noiseColor: string
  ) => {
    // Create a subtle stone texture with random noise
    for (let i = 0; i < width * height / 20; i++) {
      const noiseX = x + Math.random() * width;
      const noiseY = y + Math.random() * height;
      const noiseSize = Math.random() * 2 + 1;
      
      ctx.fillStyle = Math.random() > 0.5 ? noiseColor : baseColor;
      ctx.fillRect(noiseX, noiseY, noiseSize, noiseSize);
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

export default HealthBar;