import React, { useRef, useEffect } from 'react';

interface RuneConstructProps {
  width?: number;
  height?: number;
  variant?: 'default' | 'attack' | 'hit';
  onRender?: (imageData: string) => void;
}

export const RuneConstruct: React.FC<RuneConstructProps> = ({
  width = 128,
  height = 128,
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
      
      // Draw the Rune Construct based on variant
      if (variant === 'hit') {
        drawRuneConstructHit(ctx, width, height);
      } else if (variant === 'attack') {
        drawRuneConstructAttack(ctx, width, height);
      } else {
        drawRuneConstruct(ctx, width, height);
      }
      
      // Convert to image data
      const imageData = canvasRef.current.toDataURL('image/png');
      onRender(imageData);
    }
  }, [width, height, variant, onRender]);
  
  // Draw the standard pose of the rune construct
  const drawRuneConstruct = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Center point
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw body - a large stone with runes
    drawBody(ctx, centerX, centerY, width, height);
    
    // Draw glowing runes
    drawRunes(ctx, centerX, centerY, width, height, 1.0);
    
    // Draw arms
    drawArms(ctx, centerX, centerY, width, height, false);
    
    // Draw head/face
    drawHead(ctx, centerX, centerY - height * 0.25, width * 0.3, height * 0.3);
  };
  
  // Draw the attack animation pose
  const drawRuneConstructAttack = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Center point
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw body - a large stone with runes
    drawBody(ctx, centerX, centerY, width, height);
    
    // Draw glowing runes - more intense for attack
    drawRunes(ctx, centerX, centerY, width, height, 1.5);
    
    // Draw arms in attack position
    drawArms(ctx, centerX, centerY, width, height, true);
    
    // Draw head/face with glowing eyes
    drawHead(ctx, centerX, centerY - height * 0.25, width * 0.3, height * 0.3, true);
  };
  
  // Draw the hit animation pose
  const drawRuneConstructHit = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Center point - slightly shifted to indicate impact
    const centerX = width / 2 + width * 0.03;
    const centerY = height / 2;
    
    // Draw body - a large stone with runes
    drawBody(ctx, centerX, centerY, width, height, true);
    
    // Draw glowing runes - less intense when hit
    drawRunes(ctx, centerX, centerY, width, height, 0.7);
    
    // Draw arms in defensive position
    drawArms(ctx, centerX, centerY, width, height, false, true);
    
    // Draw head/face
    drawHead(ctx, centerX, centerY - height * 0.25, width * 0.3, height * 0.3, false, true);
  };
  
  // Draw the main body of the construct
  const drawBody = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number,
    isHit = false
  ) => {
    // Body is a large, irregular stone shape
    ctx.fillStyle = isHit ? '#555555' : '#666666';
    
    // Create an irregular shape for the body
    ctx.beginPath();
    ctx.moveTo(x - width * 0.3, y - height * 0.25);
    ctx.lineTo(x + width * 0.3, y - height * 0.25);
    ctx.lineTo(x + width * 0.35, y);
    ctx.lineTo(x + width * 0.25, y + height * 0.3);
    ctx.lineTo(x - width * 0.25, y + height * 0.3);
    ctx.lineTo(x - width * 0.35, y);
    ctx.closePath();
    ctx.fill();
    
    // Add some texture to the stone
    addStoneTexture(ctx, x - width * 0.35, y - height * 0.25, width * 0.7, height * 0.55);
    
    // Add shadow beneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + height * 0.3, width * 0.25, height * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  
  // Draw the mystical runes on the body
  const drawRunes = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    intensity: number
  ) => {
    // Rune color based on intensity
    const alpha = 0.7 * intensity;
    ctx.strokeStyle = `rgba(77, 213, 240, ${alpha})`;
    ctx.lineWidth = 2;
    
    // Draw a circle rune in the center
    ctx.beginPath();
    ctx.arc(x, y, width * 0.1, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw smaller circles inside
    ctx.beginPath();
    ctx.arc(x, y, width * 0.05, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw rune lines
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const startX = x + Math.cos(angle) * width * 0.12;
      const startY = y + Math.sin(angle) * width * 0.12;
      const endX = x + Math.cos(angle) * width * 0.2;
      const endY = y + Math.sin(angle) * width * 0.2;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      // Add a glyph at the end of each line
      drawGlyph(ctx, endX, endY, width * 0.04, alpha);
    }
    
    // Add glow effect
    if (intensity > 1.0) {
      ctx.fillStyle = `rgba(77, 213, 240, ${alpha * 0.2})`;
      ctx.beginPath();
      ctx.arc(x, y, width * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
  // Draw a small runic glyph
  const drawGlyph = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    alpha: number
  ) => {
    const glyphType = Math.floor(Math.random() * 3);
    
    switch (glyphType) {
      case 0:
        // Square glyph
        ctx.strokeStyle = `rgba(77, 213, 240, ${alpha})`;
        ctx.strokeRect(x - size/2, y - size/2, size, size);
        ctx.beginPath();
        ctx.moveTo(x - size/2, y);
        ctx.lineTo(x + size/2, y);
        ctx.stroke();
        break;
        
      case 1:
        // Triangle glyph
        ctx.beginPath();
        ctx.moveTo(x, y - size/2);
        ctx.lineTo(x + size/2, y + size/2);
        ctx.lineTo(x - size/2, y + size/2);
        ctx.closePath();
        ctx.stroke();
        break;
        
      case 2:
        // Diamond glyph
        ctx.beginPath();
        ctx.moveTo(x, y - size/2);
        ctx.lineTo(x + size/2, y);
        ctx.lineTo(x, y + size/2);
        ctx.lineTo(x - size/2, y);
        ctx.closePath();
        ctx.stroke();
        break;
    }
  };
  
  // Draw the arms
  const drawArms = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isAttacking = false,
    isHit = false
  ) => {
    const stoneColor = isHit ? '#555555' : '#666666';
    ctx.fillStyle = stoneColor;
    
    // Left arm
    ctx.save();
    if (isAttacking) {
      ctx.translate(x - width * 0.35, y - height * 0.05);
      ctx.rotate(-Math.PI / 4); // Rotate arm for attack
    } else if (isHit) {
      ctx.translate(x - width * 0.35, y);
      ctx.rotate(-Math.PI / 6); // Rotate arm for defense
    } else {
      ctx.translate(x - width * 0.35, y);
    }
    
    // Draw arm segments
    ctx.fillRect(-width * 0.05, 0, width * 0.1, height * 0.25);
    
    // Add a fist/hand at the end
    ctx.beginPath();
    ctx.arc(0, height * 0.25, width * 0.07, 0, Math.PI * 2);
    ctx.fill();
    
    // Add arm rune
    ctx.strokeStyle = `rgba(77, 213, 240, ${isAttacking ? 0.9 : 0.6})`;
    ctx.beginPath();
    ctx.arc(0, height * 0.12, width * 0.03, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
    
    // Right arm
    ctx.save();
    if (isAttacking) {
      ctx.translate(x + width * 0.35, y - height * 0.05);
      ctx.rotate(Math.PI / 4); // Rotate arm for attack
    } else if (isHit) {
      ctx.translate(x + width * 0.35, y);
      ctx.rotate(Math.PI / 6); // Rotate arm for defense
    } else {
      ctx.translate(x + width * 0.35, y);
    }
    
    // Draw arm segments
    ctx.fillRect(-width * 0.05, 0, width * 0.1, height * 0.25);
    
    // Add a fist/hand at the end
    ctx.beginPath();
    ctx.arc(0, height * 0.25, width * 0.07, 0, Math.PI * 2);
    ctx.fill();
    
    // Add arm rune
    ctx.strokeStyle = `rgba(77, 213, 240, ${isAttacking ? 0.9 : 0.6})`;
    ctx.beginPath();
    ctx.arc(0, height * 0.12, width * 0.03, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.restore();
  };
  
  // Draw the head
  const drawHead = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isAttacking = false,
    isHit = false
  ) => {
    // Head is a smaller stone
    ctx.fillStyle = isHit ? '#555555' : '#666666';
    
    ctx.beginPath();
    ctx.arc(x, y, width * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some texture
    addStoneTexture(ctx, x - width * 0.6, y - height * 0.6, width * 1.2, height * 1.2);
    
    // Eyes - glowing runes
    const eyeGlow = isAttacking ? 0.9 : isHit ? 0.5 : 0.7;
    ctx.fillStyle = `rgba(77, 213, 240, ${eyeGlow})`;
    
    // Left eye
    ctx.beginPath();
    ctx.arc(x - width * 0.25, y - height * 0.1, width * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Right eye
    ctx.beginPath();
    ctx.arc(x + width * 0.25, y - height * 0.1, width * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // When attacking, add a stronger glow around eyes
    if (isAttacking) {
      ctx.fillStyle = 'rgba(77, 213, 240, 0.2)';
      
      ctx.beginPath();
      ctx.arc(x - width * 0.25, y - height * 0.1, width * 0.25, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(x + width * 0.25, y - height * 0.1, width * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
  // Add stone texture to create a more realistic rock appearance
  const addStoneTexture = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // Add some texture to the stone using small darker spots
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    
    for (let i = 0; i < width * height / 30; i++) {
      const spotX = x + Math.random() * width;
      const spotY = y + Math.random() * height;
      const spotSize = Math.random() * 3 + 1;
      
      ctx.beginPath();
      ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add some lighter spots for texture as well
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    
    for (let i = 0; i < width * height / 50; i++) {
      const spotX = x + Math.random() * width;
      const spotY = y + Math.random() * height;
      const spotSize = Math.random() * 2 + 0.5;
      
      ctx.beginPath();
      ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
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

export default RuneConstruct;