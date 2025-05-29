import React, { useRef, useEffect } from 'react';

interface FrameProps {
  width?: number;
  height?: number;
  variant?: 'default' | 'player' | 'enemy' | 'decorative';
  onRender?: (imageData: string) => void;
}

export const Frame: React.FC<FrameProps> = ({
  width = 100,
  height = 100,
  variant = 'default',
  onRender
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current && onRender) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw the frame based on variant
      drawFrame(ctx, width, height, variant);
      
      // Convert to image data
      const imageData = canvasRef.current.toDataURL('image/png');
      onRender(imageData);
    }
  }, [width, height, variant, onRender]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      style={{ display: 'none' }}
    />
  );
};

// Main frame drawing function
const drawFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  variant: string
) => {
  const centerX = width / 2;
  const centerY = height / 2;
  
  switch (variant) {
    case 'player':
      drawPlayerFrame(ctx, width, height);
      break;
    case 'enemy':
      drawEnemyFrame(ctx, width, height);
      break;
    case 'decorative':
      drawDecorativeFrame(ctx, width, height);
      break;
    default:
      drawDefaultFrame(ctx, width, height);
      break;
  }
};

// Default frame with mystical design
const drawDefaultFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const borderWidth = 4;
  const cornerSize = 16;
  
  // Main frame background
  ctx.fillStyle = 'rgba(136, 204, 255, 0.1)';
  ctx.fillRect(0, 0, width, height);
  
  // Outer border
  ctx.strokeStyle = '#88ccff';
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
  
  // Inner border
  ctx.strokeStyle = '#aaccff';
  ctx.lineWidth = 2;
  ctx.strokeRect(borderWidth + 2, borderWidth + 2, width - (borderWidth + 2) * 2, height - (borderWidth + 2) * 2);
  
  // Corner decorations
  drawCornerDecorations(ctx, width, height, cornerSize, '#88ccff');
  
  // Center mystical symbol
  drawMysticalSymbol(ctx, width / 2, height / 2, Math.min(width, height) * 0.2);
};

// Player-specific frame (blue theme)
const drawPlayerFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const borderWidth = 4;
  
  // Background with gradient
  const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
  gradient.addColorStop(0, 'rgba(68, 136, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(68, 136, 255, 0.05)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Main border
  ctx.strokeStyle = '#4488ff';
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
  
  // Inner glow
  ctx.strokeStyle = '#88aaff';
  ctx.lineWidth = 2;
  ctx.strokeRect(borderWidth + 1, borderWidth + 1, width - (borderWidth + 1) * 2, height - (borderWidth + 1) * 2);
  
  // Player emblem corners
  drawPlayerEmblems(ctx, width, height);
};

// Enemy-specific frame (red theme)
const drawEnemyFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const borderWidth = 4;
  
  // Background with gradient
  const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, Math.max(width, height)/2);
  gradient.addColorStop(0, 'rgba(255, 68, 68, 0.2)');
  gradient.addColorStop(1, 'rgba(255, 68, 68, 0.05)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // Main border
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = borderWidth;
  ctx.strokeRect(borderWidth / 2, borderWidth / 2, width - borderWidth, height - borderWidth);
  
  // Inner warning lines
  ctx.strokeStyle = '#ff8888';
  ctx.lineWidth = 2;
  ctx.strokeRect(borderWidth + 1, borderWidth + 1, width - (borderWidth + 1) * 2, height - (borderWidth + 1) * 2);
  
  // Danger symbols in corners
  drawDangerSymbols(ctx, width, height);
};

// Decorative frame for special UI elements
const drawDecorativeFrame = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  const borderWidth = 3;
  
  // Background with subtle pattern
  ctx.fillStyle = 'rgba(170, 170, 255, 0.1)';
  ctx.fillRect(0, 0, width, height);
  
  // Ornate border
  ctx.strokeStyle = '#aaaff';
  ctx.lineWidth = borderWidth;
  
  // Create ornate border pattern
  ctx.beginPath();
  ctx.moveTo(borderWidth, borderWidth);
  ctx.lineTo(width - borderWidth, borderWidth);
  ctx.lineTo(width - borderWidth, height - borderWidth);
  ctx.lineTo(borderWidth, height - borderWidth);
  ctx.closePath();
  ctx.stroke();
  
  // Decorative corner flourishes
  drawDecorativeFlourishes(ctx, width, height);
};

// Helper function to draw corner decorations
const drawCornerDecorations = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cornerSize: number,
  color: string
) => {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  
  const positions = [
    { x: cornerSize, y: cornerSize }, // Top-left
    { x: width - cornerSize, y: cornerSize }, // Top-right
    { x: cornerSize, y: height - cornerSize }, // Bottom-left
    { x: width - cornerSize, y: height - cornerSize } // Bottom-right
  ];
  
  positions.forEach((pos, index) => {
    ctx.save();
    ctx.translate(pos.x, pos.y);
    ctx.rotate((index * Math.PI) / 2);
    
    // Draw corner decoration
    ctx.beginPath();
    ctx.moveTo(-cornerSize/2, -cornerSize/2);
    ctx.lineTo(0, -cornerSize/3);
    ctx.lineTo(cornerSize/2, -cornerSize/2);
    ctx.moveTo(-cornerSize/3, 0);
    ctx.lineTo(cornerSize/3, 0);
    ctx.stroke();
    
    ctx.restore();
  });
};

// Helper function to draw mystical symbol
const drawMysticalSymbol = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) => {
  ctx.strokeStyle = '#88ccff';
  ctx.lineWidth = 1.5;
  ctx.fillStyle = 'rgba(136, 204, 255, 0.3)';
  
  // Outer circle
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  // Inner cross pattern
  ctx.beginPath();
  ctx.moveTo(x - size * 0.7, y);
  ctx.lineTo(x + size * 0.7, y);
  ctx.moveTo(x, y - size * 0.7);
  ctx.lineTo(x, y + size * 0.7);
  ctx.stroke();
  
  // Diagonal lines
  ctx.beginPath();
  ctx.moveTo(x - size * 0.5, y - size * 0.5);
  ctx.lineTo(x + size * 0.5, y + size * 0.5);
  ctx.moveTo(x - size * 0.5, y + size * 0.5);
  ctx.lineTo(x + size * 0.5, y - size * 0.5);
  ctx.stroke();
};

// Helper function to draw player emblems
const drawPlayerEmblems = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.fillStyle = '#4488ff';
  ctx.strokeStyle = '#88aaff';
  ctx.lineWidth = 1;
  
  const emblems = [
    { x: 15, y: 15 },
    { x: width - 15, y: 15 },
    { x: 15, y: height - 15 },
    { x: width - 15, y: height - 15 }
  ];
  
  emblems.forEach(emblem => {
    // Shield shape
    ctx.beginPath();
    ctx.moveTo(emblem.x, emblem.y - 6);
    ctx.lineTo(emblem.x + 4, emblem.y - 4);
    ctx.lineTo(emblem.x + 4, emblem.y + 2);
    ctx.lineTo(emblem.x, emblem.y + 6);
    ctx.lineTo(emblem.x - 4, emblem.y + 2);
    ctx.lineTo(emblem.x - 4, emblem.y - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });
};

// Helper function to draw danger symbols
const drawDangerSymbols = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.strokeStyle = '#ff4444';
  ctx.lineWidth = 2;
  
  const symbols = [
    { x: 12, y: 12 },
    { x: width - 12, y: 12 },
    { x: 12, y: height - 12 },
    { x: width - 12, y: height - 12 }
  ];
  
  symbols.forEach(symbol => {
    // Warning triangle
    ctx.beginPath();
    ctx.moveTo(symbol.x, symbol.y - 5);
    ctx.lineTo(symbol.x + 4, symbol.y + 3);
    ctx.lineTo(symbol.x - 4, symbol.y + 3);
    ctx.closePath();
    ctx.stroke();
    
    // Exclamation mark
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(symbol.x - 0.5, symbol.y - 2, 1, 3);
    ctx.fillRect(symbol.x - 0.5, symbol.y + 2, 1, 1);
  });
};

// Helper function to draw decorative flourishes
const drawDecorativeFlourishes = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) => {
  ctx.strokeStyle = '#aaaff';
  ctx.lineWidth = 1;
  
  const flourishes = [
    { x: 10, y: 10 },
    { x: width - 10, y: 10 },
    { x: 10, y: height - 10 },
    { x: width - 10, y: height - 10 }
  ];
  
  flourishes.forEach((flourish, index) => {
    ctx.save();
    ctx.translate(flourish.x, flourish.y);
    ctx.rotate((index * Math.PI) / 2);
    
    // Decorative swirl
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI);
    ctx.arc(-3, 0, 2, 0, Math.PI / 2);
    ctx.stroke();
    
    ctx.restore();
  });
};

export default Frame;