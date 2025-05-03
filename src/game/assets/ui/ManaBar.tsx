import React, { useRef, useEffect } from 'react';

interface ManaBarProps {
  width?: number;
  height?: number;
  isPlayerBar?: boolean;
  onRender?: (imageData: string) => void;
}

export const ManaBar: React.FC<ManaBarProps> = ({
  width = 160,
  height = 16, // Slightly thinner than health bar
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
      
      // Draw the mana bar
      drawManaBar(ctx, width, height, isPlayerBar);
      
      // Convert to image data
      const imageData = canvasRef.current.toDataURL('image/png');
      onRender(imageData);
    }
  }, [width, height, isPlayerBar, onRender]);
  
  const drawManaBar = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    isPlayerBar: boolean
  ) => {
    // Set colors based on player/enemy
    const mainColor = '#4dabf7'; // Blue for mana
    const secondaryColor = '#1864ab'; // Darker blue
    const glowColor = 'rgba(77, 171, 247, 0.5)';
    
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
    const runeColor = 'rgba(180, 220, 255, 0.7)'; // Blueish for mana
    
    ctx.fillStyle = runeColor;
    
    // Add small arcane symbols along the bar
    const padding = height / 6;
    const runeSize = height / 3;
    const totalRunes = 3;
    const runeSpacing = (width - padding * 2 - runeSize) / (totalRunes - 1);
    
    for (let i = 0; i < totalRunes; i++) {
      const x = padding + i * runeSpacing;
      const y = height / 2 - runeSize / 2;
      
      // Draw different rune shapes for mana bar
      if (i === 0) {
        // First rune - wavy line
        ctx.beginPath();
        ctx.moveTo(x, y + runeSize/2);
        ctx.bezierCurveTo(
          x + runeSize/4, y, 
          x + runeSize*3/4, y + runeSize, 
          x + runeSize, y + runeSize/2
        );
        ctx.stroke();
      } else if (i === 1) {
        // Middle rune - small circle
        ctx.beginPath();
        ctx.arc(x + runeSize/2, y + runeSize/2, runeSize/3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Last rune - small star
        const centerX = x + runeSize/2;
        const centerY = y + runeSize/2;
        const spikes = 4;
        const outerRadius = runeSize/2;
        const innerRadius = runeSize/4;
        
        ctx.beginPath();
        for (let j = 0; j < spikes * 2; j++) {
          const radius = j % 2 === 0 ? outerRadius : innerRadius;
          const angle = (j / (spikes * 2)) * Math.PI * 2;
          
          const pointX = centerX + radius * Math.cos(angle);
          const pointY = centerY + radius * Math.sin(angle);
          
          if (j === 0) {
            ctx.moveTo(pointX, pointY);
          } else {
            ctx.lineTo(pointX, pointY);
          }
        }
        ctx.closePath();
        ctx.fill();
      }
    }
  };
  
  const addStoneTexture = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color1: string,
    color2: string
  ) => {
    // Simple noise texture to simulate stone
    for (let i = 0; i < width * height / 40; i++) {
      const px = Math.random() * width;
      const py = Math.random() * height;
      const size = Math.random() * 2 + 1;
      
      ctx.fillStyle = Math.random() > 0.5 ? color1 : color2;
      ctx.fillRect(x + px, y + py, size, size);
    }
  };
  
  const drawInnerGlow = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    glowColor: string
  ) => {
    const padding = height / 6;
    const glowWidth = 2;
    
    // Create a subtle glow around the inner edge
    ctx.strokeStyle = glowColor;
    ctx.lineWidth = glowWidth;
    ctx.strokeRect(
      padding + glowWidth/2, 
      padding + glowWidth/2, 
      width - padding * 2 - glowWidth, 
      height - padding * 2 - glowWidth
    );
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

export default ManaBar;