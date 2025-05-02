import React, { useRef, useEffect } from 'react';

interface TemplateRuinsProps {
  width?: number;
  height?: number;
  isMenuBackground?: boolean;
  onRender?: (imageData: string) => void;
}

export const TemplateRuins: React.FC<TemplateRuinsProps> = ({
  width = 800,
  height = 600,
  isMenuBackground = false,
  onRender
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current && onRender) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      if (isMenuBackground) {
        // Draw a more dramatic background for the main menu
        drawMenuBackground(ctx, width, height);
      } else {
        // Draw the regular game background
        drawGameBackground(ctx, width, height);
      }
      
      // Convert to image data
      const imageData = canvasRef.current.toDataURL('image/png');
      onRender(imageData);
    }
  }, [width, height, isMenuBackground, onRender]);
  
  const drawMenuBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Create dramatic sky gradient for menu
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.7);
    skyGradient.addColorStop(0, '#0a0a2a');
    skyGradient.addColorStop(0.5, '#203060');
    skyGradient.addColorStop(1, '#3a3a5a');
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Add stars
    drawStars(ctx, width, height);
    
    // Draw distant mountain silhouettes
    drawMountains(ctx, width, height, true);
    
    // Draw foreground ruins
    drawRuins(ctx, width, height, true);
    
    // Add mystical fog
    drawMysticalFog(ctx, width, height);
  };
  
  const drawGameBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Create sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, height * 0.6);
    skyGradient.addColorStop(0, '#2a2a4a');
    skyGradient.addColorStop(1, '#4a4a6a');
    
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw mountains
    drawMountains(ctx, width, height, false);
    
    // Draw ruins
    drawRuins(ctx, width, height, false);
  };
  
  const drawStars = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const starCount = 200;
    ctx.fillStyle = '#ffffff';
    
    for (let i = 0; i < starCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height * 0.7;
      const size = Math.random() * 2 + 0.5;
      const alpha = Math.random() * 0.9 + 0.1;
      
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.globalAlpha = 1;
  };
  
  const drawMountains = (ctx: CanvasRenderingContext2D, width: number, height: number, isMenu: boolean) => {
    // Draw far mountains
    ctx.fillStyle = isMenu ? '#101025' : '#202040';
    drawMountainRange(ctx, width, height, 0.6, 0.2, 3, 0.5);
    
    // Draw middle mountains
    ctx.fillStyle = isMenu ? '#1a1a35' : '#303050';
    drawMountainRange(ctx, width, height, 0.7, 0.15, 4, 0.6);
    
    // Draw closer mountains
    ctx.fillStyle = isMenu ? '#252545' : '#404060';
    drawMountainRange(ctx, width, height, 0.8, 0.1, 5, 0.7);
  };
  
  const drawMountainRange = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    baseHeight: number,
    variance: number,
    peaks: number,
    opacity: number
  ) => {
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.moveTo(0, height);
    
    const peakWidth = width / (peaks - 1);
    
    // Create peaks and valleys
    for (let i = 0; i < peaks; i++) {
      const peakHeight = height * (baseHeight - Math.random() * variance);
      const x = i * peakWidth;
      
      // Add some randomness to the peak shape
      if (i === 0) {
        ctx.lineTo(x, peakHeight);
      } else {
        const cpx1 = x - peakWidth * 0.5;
        const cpy1 = height * (baseHeight + Math.random() * 0.1);
        const cpx2 = x - peakWidth * 0.3;
        const cpy2 = peakHeight + height * 0.05;
        ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x, peakHeight);
      }
    }
    
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  };
  
  const drawRuins = (ctx: CanvasRenderingContext2D, width: number, height: number, isMenu: boolean) => {
    // Draw ground
    const groundGradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
    groundGradient.addColorStop(0, isMenu ? '#2a2a3a' : '#3a3a4a');
    groundGradient.addColorStop(1, isMenu ? '#1a1a2a' : '#2a2a3a');
    
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
    
    // Draw columns and structures
    if (isMenu) {
      // For menu, draw dramatic ruins silhouettes
      drawDramaticRuins(ctx, width, height);
    } else {
      // For gameplay, draw simpler ruins
      drawSimpleRuins(ctx, width, height);
    }
  };
  
  const drawDramaticRuins = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Define silhouettes for dramatic ruins
    const baseY = height * 0.7;
    
    // Center temple structure
    ctx.fillStyle = '#10102a';
    
    // Main temple base
    ctx.beginPath();
    ctx.rect(width * 0.3, baseY - height * 0.2, width * 0.4, height * 0.2);
    ctx.fill();
    
    // Temple steps
    ctx.beginPath();
    ctx.moveTo(width * 0.25, baseY);
    ctx.lineTo(width * 0.75, baseY);
    ctx.lineTo(width * 0.65, baseY - height * 0.1);
    ctx.lineTo(width * 0.35, baseY - height * 0.1);
    ctx.closePath();
    ctx.fill();
    
    // Temple top structure
    ctx.beginPath();
    ctx.moveTo(width * 0.35, baseY - height * 0.2);
    ctx.lineTo(width * 0.65, baseY - height * 0.2);
    ctx.lineTo(width * 0.55, baseY - height * 0.3);
    ctx.lineTo(width * 0.45, baseY - height * 0.3);
    ctx.closePath();
    ctx.fill();
    
    // Left Column
    ctx.beginPath();
    ctx.rect(width * 0.2, baseY - height * 0.25, width * 0.05, height * 0.25);
    ctx.fill();
    
    // Right Column
    ctx.beginPath();
    ctx.rect(width * 0.75, baseY - height * 0.25, width * 0.05, height * 0.25);
    ctx.fill();
    
    // Broken columns
    for (let i = 0; i < 6; i++) {
      const x = width * (0.1 + i * 0.15);
      const columnHeight = height * (0.15 + Math.random() * 0.15);
      
      if (x > width * 0.3 && x < width * 0.7) continue; // Skip where temple is
      
      ctx.beginPath();
      ctx.rect(x, baseY - columnHeight, width * 0.04, columnHeight);
      ctx.fill();
      
      // Column top
      if (Math.random() > 0.5) {
        ctx.beginPath();
        ctx.rect(x - width * 0.01, baseY - columnHeight - height * 0.02, width * 0.06, height * 0.02);
        ctx.fill();
      }
    }
  };
  
  const drawSimpleRuins = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const baseY = height * 0.7;
    
    // Draw some simple column structures
    ctx.fillStyle = '#2a2a3a';
    
    for (let i = 0; i < 5; i++) {
      const x = width * (0.1 + i * 0.2);
      const columnHeight = height * (0.1 + Math.random() * 0.1);
      
      ctx.beginPath();
      ctx.rect(x, baseY - columnHeight, width * 0.04, columnHeight);
      ctx.fill();
      
      // Column top
      ctx.beginPath();
      ctx.rect(x - width * 0.01, baseY - columnHeight - height * 0.01, width * 0.06, height * 0.01);
      ctx.fill();
    }
  };
  
  const drawMysticalFog = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Add a mystical fog layer at the bottom
    const fogGradient = ctx.createLinearGradient(0, height * 0.7, 0, height);
    fogGradient.addColorStop(0, 'rgba(80, 100, 180, 0)');
    fogGradient.addColorStop(0.5, 'rgba(80, 100, 180, 0.2)');
    fogGradient.addColorStop(1, 'rgba(80, 100, 180, 0.05)');
    
    ctx.fillStyle = fogGradient;
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
    
    // Add some fog patches
    ctx.fillStyle = 'rgba(150, 180, 255, 0.1)';
    for (let i = 0; i < 5; i++) {
      const x = width * Math.random();
      const y = height * (0.7 + Math.random() * 0.2);
      const fogWidth = width * (0.2 + Math.random() * 0.3);
      const fogHeight = height * (0.05 + Math.random() * 0.05);
      
      ctx.beginPath();
      ctx.ellipse(x, y, fogWidth, fogHeight, 0, 0, Math.PI * 2);
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

export default TemplateRuins;