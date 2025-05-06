import React, { useRef, useEffect } from 'react';

interface ShadowWispProps {
  width?: number;
  height?: number;
  variant?: 'default' | 'attack' | 'hit';
  onRender?: (imageData: string) => void;
}

export const ShadowWisp: React.FC<ShadowWispProps> = ({
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
      
      // Draw the wisp based on variant
      if (variant === 'attack') {
        drawWispAttack(ctx, width, height);
      } else if (variant === 'hit') {
        drawWispHit(ctx, width, height);
      } else {
        drawWisp(ctx, width, height);
      }
      
      // Convert to image data
      const imageData = canvasRef.current.toDataURL('image/png');
      onRender(imageData);
    }
  }, [width, height, variant, onRender]);
  
  // Draw the standard pose
  const drawWisp = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Center point
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw the main shadow body
    drawShadowBody(ctx, centerX, centerY, width, height);
    
    // Draw the face
    drawWispFace(ctx, centerX, centerY, width, height);
    
    // Draw energy tendrils
    drawEnergyTendrils(ctx, centerX, centerY, width, height, 1.0);
    
    // Draw particle effects
    drawParticleEffects(ctx, centerX, centerY, width, height, 0.7);
  };
  
  // Draw the attack animation pose
  const drawWispAttack = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Center point with slight forward shift for attack
    const centerX = width / 2 + width * 0.05;
    const centerY = height / 2;
    
    // Draw the main shadow body - expanded when attacking
    drawShadowBody(ctx, centerX, centerY, width * 1.15, height * 1.1);
    
    // Draw the face - more intense during attack
    drawWispFace(ctx, centerX, centerY, width, height, true);
    
    // Draw energy tendrils - more intense during attack
    drawEnergyTendrils(ctx, centerX, centerY, width, height, 1.5);
    
    // Draw particle effects - more intense during attack
    drawParticleEffects(ctx, centerX, centerY, width, height, 1.2);
    
    // Draw attack energy
    drawAttackEnergy(ctx, centerX, centerY, width, height);
  };
  
  // Draw the hit animation pose
  const drawWispHit = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Center point with slight backward shift when hit
    const centerX = width / 2 - width * 0.03;
    const centerY = height / 2;
    
    // Draw the main shadow body - contracted when hit
    drawShadowBody(ctx, centerX, centerY, width * 0.9, height * 0.9);
    
    // Draw the face - dimmed when hit
    drawWispFace(ctx, centerX, centerY, width, height, false, true);
    
    // Draw energy tendrils - diminished when hit
    drawEnergyTendrils(ctx, centerX, centerY, width, height, 0.6);
    
    // Draw particle effects - scattered when hit
    drawParticleEffects(ctx, centerX, centerY, width, height, 0.5);
    
    // Draw hit effect (flash of light disrupting the shadow)
    drawHitEffect(ctx, centerX, centerY, width, height);
  };
  
  // Draw the main shadow body
  const drawShadowBody = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // Create a dark, shadowy gradient for the body
    const bodyGradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, width * 0.4
    );
    bodyGradient.addColorStop(0, 'rgba(30, 20, 40, 0.9)');
    bodyGradient.addColorStop(0.6, 'rgba(40, 30, 60, 0.7)');
    bodyGradient.addColorStop(1, 'rgba(50, 40, 80, 0)');
    
    // Draw main body
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.ellipse(x, y, width * 0.4, height * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some texture to the shadow
    addShadowTexture(ctx, x - width * 0.4, y - height * 0.35, width * 0.8, height * 0.7);
    
    // Add a subtle shadow beneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(x, y + height * 0.35, width * 0.3, height * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  
  // Draw the wisp's ethereal face
  const drawWispFace = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isAttacking = false,
    isHit = false
  ) => {
    // Calculate eye glow intensity
    const eyeGlow = isHit ? 0.5 : isAttacking ? 1.0 : 0.8;
    const eyeColor = isAttacking ? '#b580ff' : '#8a60e0';
    
    // Eyes
    ctx.fillStyle = eyeColor;
    
    // Eyes shift based on state
    const eyeShiftX = isAttacking ? width * 0.02 : isHit ? -width * 0.02 : 0;
    
    // Left eye
    ctx.beginPath();
    ctx.ellipse(
      x - width * 0.15 + eyeShiftX, 
      y - height * 0.05, 
      width * 0.08, 
      isAttacking ? height * 0.12 : height * 0.08, 
      isAttacking ? Math.PI / 6 : 0, 
      0, Math.PI * 2
    );
    ctx.fill();
    
    // Right eye
    ctx.beginPath();
    ctx.ellipse(
      x + width * 0.15 + eyeShiftX, 
      y - height * 0.05, 
      width * 0.08, 
      isAttacking ? height * 0.12 : height * 0.08, 
      isAttacking ? -Math.PI / 6 : 0, 
      0, Math.PI * 2
    );
    ctx.fill();
    
    // Add eye glow
    ctx.fillStyle = `rgba(138, 96, 224, ${eyeGlow * 0.3})`;
    
    ctx.beginPath();
    ctx.arc(x - width * 0.15 + eyeShiftX, y - height * 0.05, width * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x + width * 0.15 + eyeShiftX, y - height * 0.05, width * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a mouth that changes with state
    if (isAttacking) {
      // Attacking mouth - wide open
      ctx.fillStyle = 'rgba(20, 10, 30, 0.9)';
      ctx.beginPath();
      ctx.ellipse(x, y + height * 0.15, width * 0.15, height * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner mouth glow
      ctx.fillStyle = 'rgba(138, 96, 224, 0.4)';
      ctx.beginPath();
      ctx.arc(x, y + height * 0.15, width * 0.08, 0, Math.PI * 2);
      ctx.fill();
    } else if (isHit) {
      // Hit mouth - distorted jagged line
      ctx.strokeStyle = 'rgba(200, 180, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - width * 0.1, y + height * 0.15);
      
      // Jagged line for distress
      for (let i = 0; i < 5; i++) {
        const xPos = x - width * 0.1 + (width * 0.2 / 4) * i;
        const yPos = y + height * 0.15 + (i % 2 === 0 ? height * 0.03 : -height * 0.03);
        ctx.lineTo(xPos, yPos);
      }
      
      ctx.stroke();
    } else {
      // Default mouth - small oval
      ctx.fillStyle = 'rgba(100, 80, 140, 0.7)';
      ctx.beginPath();
      ctx.ellipse(x, y + height * 0.15, width * 0.06, height * 0.03, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
  // Draw energy tendrils emanating from the wisp
  const drawEnergyTendrils = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    intensity: number
  ) => {
    const tendrilCount = 6;
    const alpha = 0.6 * intensity;
    
    // Draw tendrils around the shadow body
    for (let i = 0; i < tendrilCount; i++) {
      const angle = (i / tendrilCount) * Math.PI * 2;
      
      // Each tendril is slightly different
      const length = (0.7 + Math.sin(i * 5) * 0.3) * width * 0.6 * intensity;
      const startX = x + Math.cos(angle) * width * 0.2;
      const startY = y + Math.sin(angle) * height * 0.2;
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length * 0.8; // Slightly flattened vertically
      
      // Create gradient for each tendril
      const tendrilGradient = ctx.createLinearGradient(startX, startY, endX, endY);
      tendrilGradient.addColorStop(0, `rgba(90, 70, 140, ${alpha})`);
      tendrilGradient.addColorStop(1, 'rgba(90, 70, 140, 0)');
      
      ctx.strokeStyle = tendrilGradient;
      ctx.lineWidth = 3 * intensity;
      
      // Draw the tendril with a curve
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      // Control point for curve
      const cp1x = startX + (endX - startX) * 0.3 + Math.cos(angle + Math.PI/2) * width * 0.1;
      const cp1y = startY + (endY - startY) * 0.3 + Math.sin(angle + Math.PI/2) * height * 0.1;
      const cp2x = startX + (endX - startX) * 0.7 + Math.cos(angle - Math.PI/2) * width * 0.05;
      const cp2y = startY + (endY - startY) * 0.7 + Math.sin(angle - Math.PI/2) * height * 0.05;
      
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
      ctx.stroke();
      
      // Add a small energy core at the end of each tendril
      drawEnergyCore(ctx, endX, endY, width * 0.03 * intensity, alpha);
    }
  };
  
  // Draw a small energy core at the end of tendrils
  const drawEnergyCore = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    alpha: number
  ) => {
    // Inner bright core
    ctx.fillStyle = `rgba(180, 160, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
    
    // Outer glow
    ctx.fillStyle = `rgba(140, 120, 220, ${alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(x, y, size * 2, 0, Math.PI * 2);
    ctx.fill();
  };
  
  // Draw particle effects around the wisp
  const drawParticleEffects = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    intensity: number
  ) => {
    const particleCount = Math.floor(30 * intensity);
    
    // Draw small particles floating around the wisp
    for (let i = 0; i < particleCount; i++) {
      // Particle position - random distance from center
      const distance = (Math.random() * 0.3 + 0.2) * width * 0.6;
      const angle = Math.random() * Math.PI * 2;
      
      const particleX = x + Math.cos(angle) * distance;
      const particleY = y + Math.sin(angle) * distance;
      
      // Random size and opacity
      const particleSize = Math.random() * width * 0.02 + width * 0.005;
      const opacity = (Math.random() * 0.5 + 0.3) * intensity;
      
      // Draw particle with glow
      ctx.fillStyle = `rgba(160, 140, 240, ${opacity})`;
      ctx.beginPath();
      ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
      ctx.fill();
      
      // Add subtle glow around some particles
      if (Math.random() > 0.7) {
        ctx.fillStyle = `rgba(160, 140, 240, ${opacity * 0.3})`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };
  
  // Draw attack energy
  const drawAttackEnergy = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // Attack energy concentrated in front of the wisp
    const attackX = x + width * 0.3;
    const attackY = y;
    
    // Create energy orb gradient
    const orbGradient = ctx.createRadialGradient(
      attackX, attackY, 0,
      attackX, attackY, width * 0.2
    );
    orbGradient.addColorStop(0, 'rgba(180, 120, 255, 0.8)');
    orbGradient.addColorStop(0.6, 'rgba(130, 80, 200, 0.4)');
    orbGradient.addColorStop(1, 'rgba(100, 60, 180, 0)');
    
    // Draw attack energy orb
    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(attackX, attackY, width * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add some energy streaks
    ctx.strokeStyle = 'rgba(200, 160, 255, 0.7)';
    ctx.lineWidth = 2;
    
    const streakCount = 8;
    for (let i = 0; i < streakCount; i++) {
      const angle = (i / streakCount) * Math.PI * 2;
      const startX = attackX + Math.cos(angle) * width * 0.1;
      const startY = attackY + Math.sin(angle) * width * 0.1;
      const endX = attackX + Math.cos(angle) * width * 0.25;
      const endY = attackY + Math.sin(angle) * width * 0.25;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  };
  
  // Draw hit effect
  const drawHitEffect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // Flash of light disrupting the shadow
    const flashGradient = ctx.createRadialGradient(
      x, y, 0,
      x, y, width * 0.4
    );
    flashGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    flashGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
    flashGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    // Draw flash
    ctx.fillStyle = flashGradient;
    ctx.beginPath();
    ctx.arc(x, y, width * 0.4, 0, Math.PI * 2);
    ctx.fill();
    
    // Add disruption lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    
    const lineCount = 6;
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      const length = width * 0.3;
      const startX = x;
      const startY = y;
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  };
  
  // Add texture to the shadow body
  const addShadowTexture = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // Add swirls and patterns to make the shadow look more ethereal
    ctx.strokeStyle = 'rgba(70, 50, 100, 0.3)';
    ctx.lineWidth = 1;
    
    // Draw swirl patterns
    for (let i = 0; i < 5; i++) {
      const centerX = x + Math.random() * width;
      const centerY = y + Math.random() * height;
      const radius = (Math.random() * 0.1 + 0.05) * width;
      
      ctx.beginPath();
      for (let angle = 0; angle < Math.PI * 4; angle += 0.1) {
        const r = radius * (1 - angle / (Math.PI * 4));
        const pointX = centerX + Math.cos(angle) * r;
        const pointY = centerY + Math.sin(angle) * r;
        
        if (angle === 0) {
          ctx.moveTo(pointX, pointY);
        } else {
          ctx.lineTo(pointX, pointY);
        }
      }
      ctx.stroke();
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

export default ShadowWisp;