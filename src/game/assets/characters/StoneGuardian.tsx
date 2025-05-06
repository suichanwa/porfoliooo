import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface StoneGuardianProps {
  width?: number;
  height?: number;
  variant?: 'default' | 'attack' | 'hit';
  onRender?: (imageData: string) => void;
}

export const StoneGuardian: React.FC<StoneGuardianProps> = ({
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
      
      // Draw the stone guardian based on variant
      if (variant === 'attack') {
        drawStoneGuardianAttack(ctx, width, height);
      } else if (variant === 'hit') {
        drawStoneGuardianHit(ctx, width, height);
      } else {
        drawStoneGuardian(ctx, width, height);
      }
      
      // Convert to image data
      const imageData = canvasRef.current.toDataURL('image/png');
      onRender(imageData);
    }
  }, [width, height, variant, onRender]);
  
  // Draw the standard pose
  const drawStoneGuardian = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Center point
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw body - a large stone structure
    drawBody(ctx, centerX, centerY, width, height);
    
    // Draw head
    drawHead(ctx, centerX, centerY - height * 0.25, width * 0.26, height * 0.26);
    
    // Draw arms
    drawArms(ctx, centerX, centerY, width, height);
    
    // Draw weapon - a large stone hammer
    drawWeapon(ctx, centerX, centerY, width, height);
    
    // Draw glowing runes
    drawRunes(ctx, centerX, centerY, width, height, 1.0);
  };
  
  // Draw the attack animation pose
  const drawStoneGuardianAttack = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Center point with slight forward shift for attack
    const centerX = width / 2 + width * 0.03;
    const centerY = height / 2;
    
    // Draw body - leaning forward for attack
    drawBody(ctx, centerX, centerY, width, height);
    
    // Draw head - looking downward for attack
    drawHead(ctx, centerX, centerY - height * 0.22, width * 0.26, height * 0.26, true);
    
    // Draw arms - in attack position
    drawArms(ctx, centerX, centerY, width, height, true);
    
    // Draw weapon - raised for attack
    drawWeapon(ctx, centerX, centerY, width, height, true);
    
    // Draw glowing runes - more intense during attack
    drawRunes(ctx, centerX, centerY, width, height, 1.5);
  };
  
  // Draw the hit animation pose
  const drawStoneGuardianHit = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Center point with slight backward shift when hit
    const centerX = width / 2 - width * 0.02;
    const centerY = height / 2;
    
    // Draw body - showing damage
    drawBody(ctx, centerX, centerY, width, height, true);
    
    // Draw head - tilted from impact
    drawHead(ctx, centerX - width * 0.03, centerY - height * 0.23, width * 0.26, height * 0.26, false, true);
    
    // Draw arms - defensive position
    drawArms(ctx, centerX, centerY, width, height, false, true);
    
    // Draw weapon - lowered when hit
    drawWeapon(ctx, centerX, centerY, width, height, false, true);
    
    // Draw glowing runes - dimmer when damaged
    drawRunes(ctx, centerX, centerY, width, height, 0.7);
    
    // Draw damage cracks and fragments
    drawDamageEffect(ctx, centerX, centerY, width, height);
  };
  
  // Draw the main body
  const drawBody = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isDamaged: boolean = false
  ) => {
    // Base stone color with darker tint if damaged
    const stoneColor = isDamaged ? '#555555' : '#666666';
    ctx.fillStyle = stoneColor;
    
    // Main torso - trapezoid shape for a broad shouldered look
    ctx.beginPath();
    ctx.moveTo(x - width * 0.2, y - height * 0.15); // Top left
    ctx.lineTo(x + width * 0.2, y - height * 0.15); // Top right
    ctx.lineTo(x + width * 0.18, y + height * 0.15); // Bottom right
    ctx.lineTo(x - width * 0.18, y + height * 0.15); // Bottom left
    ctx.closePath();
    ctx.fill();
    
    // Add stone texture
    addStoneTexture(ctx, x - width * 0.2, y - height * 0.15, width * 0.4, height * 0.3, isDamaged);
    
    // Lower body/legs - massive stone base
    ctx.fillStyle = stoneColor;
    ctx.beginPath();
    ctx.moveTo(x - width * 0.18, y + height * 0.15); // Top left
    ctx.lineTo(x + width * 0.18, y + height * 0.15); // Top right
    ctx.lineTo(x + width * 0.15, y + height * 0.3); // Bottom right
    ctx.lineTo(x - width * 0.15, y + height * 0.3); // Bottom left
    ctx.closePath();
    ctx.fill();
    
    // Add stone texture to legs
    addStoneTexture(ctx, x - width * 0.18, y + height * 0.15, width * 0.36, height * 0.15, isDamaged);
    
    // Draw shoulder pads - large and imposing
    ctx.fillStyle = isDamaged ? '#505050' : '#5a5a5a';
    
    // Left shoulder
    ctx.beginPath();
    ctx.arc(x - width * 0.22, y - height * 0.13, width * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Right shoulder
    ctx.beginPath();
    ctx.arc(x + width * 0.22, y - height * 0.13, width * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    // Add texture to shoulders
    addStoneTexture(ctx, x - width * 0.3, y - height * 0.21, width * 0.16, height * 0.16, isDamaged);
    addStoneTexture(ctx, x + width * 0.14, y - height * 0.21, width * 0.16, height * 0.16, isDamaged);
    
    // Add seams where stones fit together
    drawStoneSeams(ctx, x, y, width, height);
    
    // Shadow beneath
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(x, y + height * 0.3, width * 0.15, height * 0.03, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  
  // Draw the head
  const drawHead = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isAttacking: boolean = false,
    isDamaged: boolean = false
  ) => {
    // Head is a rough stone shape - darker if damaged
    const stoneColor = isDamaged ? '#505050' : '#5a5a5a';
    ctx.fillStyle = stoneColor;
    
    // Main head shape
    ctx.beginPath();
    
    if (isAttacking) {
      // More angular, aggressive shape when attacking
      ctx.moveTo(x - width * 0.5, y - height * 0.3); // Top left
      ctx.lineTo(x + width * 0.5, y - height * 0.3); // Top right
      ctx.lineTo(x + width * 0.4, y + height * 0.5); // Bottom right
      ctx.lineTo(x - width * 0.4, y + height * 0.5); // Bottom left
      ctx.closePath();
    } else if (isDamaged) {
      // Slightly askew shape when damaged
      ctx.moveTo(x - width * 0.5, y - height * 0.3); // Top left
      ctx.lineTo(x + width * 0.45, y - height * 0.35); // Top right
      ctx.lineTo(x + width * 0.4, y + height * 0.45); // Bottom right
      ctx.lineTo(x - width * 0.35, y + height * 0.5); // Bottom left
      ctx.closePath();
    } else {
      // Regular blocky shape
      ctx.moveTo(x - width * 0.5, y - height * 0.3); // Top left
      ctx.lineTo(x + width * 0.5, y - height * 0.3); // Top right
      ctx.lineTo(x + width * 0.4, y + height * 0.5); // Bottom right
      ctx.lineTo(x - width * 0.4, y + height * 0.5); // Bottom left
      ctx.closePath();
    }
    
    ctx.fill();
    
    // Add stone texture
    addStoneTexture(ctx, x - width * 0.5, y - height * 0.3, width, height * 0.8, isDamaged);
    
    // Eyes - glowing energy
    const eyeGlow = isAttacking ? 1.0 : isDamaged ? 0.6 : 0.8;
    const eyeColor = isAttacking ? '#ff9940' : '#ff7730';
    
    // Determine eye position based on state
    const eyeShiftX = isAttacking ? width * 0.05 : isDamaged ? -width * 0.05 : 0;
    const eyeShiftY = isAttacking ? height * 0.1 : 0;
    
    ctx.fillStyle = eyeColor;
    
    // Left eye
    ctx.beginPath();
    ctx.moveTo(x - width * 0.25 + eyeShiftX, y - height * 0.05 + eyeShiftY);
    ctx.lineTo(x - width * 0.15 + eyeShiftX, y - height * 0.15 + eyeShiftY);
    ctx.lineTo(x - width * 0.05 + eyeShiftX, y - height * 0.05 + eyeShiftY);
    ctx.closePath();
    ctx.fill();
    
    // Right eye
    ctx.beginPath();
    ctx.moveTo(x + width * 0.25 + eyeShiftX, y - height * 0.05 + eyeShiftY);
    ctx.lineTo(x + width * 0.15 + eyeShiftX, y - height * 0.15 + eyeShiftY);
    ctx.lineTo(x + width * 0.05 + eyeShiftX, y - height * 0.05 + eyeShiftY);
    ctx.closePath();
    ctx.fill();
    
    // Add eye glow
    ctx.fillStyle = `rgba(255, 150, 50, ${eyeGlow * 0.5})`;
    
    ctx.beginPath();
    ctx.arc(x - width * 0.15 + eyeShiftX, y - height * 0.08 + eyeShiftY, width * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x + width * 0.15 + eyeShiftX, y - height * 0.08 + eyeShiftY, width * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Mouth/jaw - a stern line
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    if (isAttacking) {
      // Open mouth when attacking
      ctx.moveTo(x - width * 0.2, y + height * 0.2);
      ctx.lineTo(x, y + height * 0.3);
      ctx.lineTo(x + width * 0.2, y + height * 0.2);
    } else if (isDamaged) {
      // Crooked mouth when hit
      ctx.moveTo(x - width * 0.2, y + height * 0.25);
      ctx.lineTo(x, y + height * 0.2);
      ctx.lineTo(x + width * 0.2, y + height * 0.25);
    } else {
      // Default stern line
      ctx.moveTo(x - width * 0.2, y + height * 0.2);
      ctx.lineTo(x + width * 0.2, y + height * 0.2);
    }
    
    ctx.stroke();
  };
  
  // Draw arms
  const drawArms = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isAttacking: boolean = false,
    isDamaged: boolean = false
  ) => {
    // Arm color - darker if damaged
    const stoneColor = isDamaged ? '#505050' : '#5a5a5a';
    
    // Left arm
    ctx.save();
    
    if (isAttacking) {
      // Positioned back for attack swing
      ctx.translate(x - width * 0.22, y - height * 0.1);
      ctx.rotate(-Math.PI / 4);
    } else if (isDamaged) {
      // Raised to protect
      ctx.translate(x - width * 0.22, y - height * 0.1);
      ctx.rotate(-Math.PI / 6);
    } else {
      // Standard position
      ctx.translate(x - width * 0.22, y - height * 0.1);
      ctx.rotate(-Math.PI / 8);
    }
    
    // Upper arm
    ctx.fillStyle = stoneColor;
    ctx.fillRect(-width * 0.05, 0, width * 0.1, height * 0.2);
    
    // Add texture
    addStoneTexture(ctx, -width * 0.05, 0, width * 0.1, height * 0.2, isDamaged);
    
    // Elbow joint
    ctx.beginPath();
    ctx.arc(0, height * 0.2, width * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    // Forearm
    ctx.translate(0, height * 0.2);
    if (isDamaged) {
      ctx.rotate(-Math.PI / 8); // Arm bent when hit
    } else {
      ctx.rotate(Math.PI / 8); // Slight bend at elbow
    }
    
    ctx.fillRect(-width * 0.05, 0, width * 0.1, height * 0.18);
    
    // Add texture
    addStoneTexture(ctx, -width * 0.05, 0, width * 0.1, height * 0.18, isDamaged);
    
    // Hand/fist
    ctx.translate(0, height * 0.18);
    ctx.beginPath();
    ctx.arc(0, 0, width * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Right arm
    ctx.save();
    
    if (isAttacking) {
      // Raised high for attack
      ctx.translate(x + width * 0.22, y - height * 0.1);
      ctx.rotate(Math.PI / 2); // Arm up
    } else if (isDamaged) {
      // Lowered from impact
      ctx.translate(x + width * 0.22, y - height * 0.05);
      ctx.rotate(Math.PI / 6);
    } else {
      // Standard position
      ctx.translate(x + width * 0.22, y - height * 0.1);
      ctx.rotate(Math.PI / 8);
    }
    
    // Upper arm
    ctx.fillStyle = stoneColor;
    ctx.fillRect(-width * 0.05, 0, width * 0.1, height * 0.2);
    
    // Add texture
    addStoneTexture(ctx, -width * 0.05, 0, width * 0.1, height * 0.2, isDamaged);
    
    // Elbow joint
    ctx.beginPath();
    ctx.arc(0, height * 0.2, width * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    // Forearm
    ctx.translate(0, height * 0.2);
    
    if (isAttacking) {
      ctx.rotate(-Math.PI / 4); // Bent for attack swing
    } else if (isDamaged) {
      ctx.rotate(Math.PI / 8); // Limp when hit
    } else {
      ctx.rotate(-Math.PI / 8); // Slight bend at elbow
    }
    
    ctx.fillRect(-width * 0.05, 0, width * 0.1, height * 0.18);
    
    // Add texture
    addStoneTexture(ctx, -width * 0.05, 0, width * 0.1, height * 0.18, isDamaged);
    
    // Hand/fist
    ctx.translate(0, height * 0.18);
    ctx.beginPath();
    ctx.arc(0, 0, width * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };
  
  // Draw weapon - stone hammer
  const drawWeapon = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isAttacking: boolean = false,
    isDamaged: boolean = false
  ) => {
    ctx.save();
    
    // Position the hammer based on animation state
    if (isAttacking) {
      // Raised high for attack
      ctx.translate(x + width * 0.3, y - height * 0.4);
      ctx.rotate(Math.PI / 4); // Ready to swing
    } else if (isDamaged) {
      // Lowered when hit
      ctx.translate(x + width * 0.25, y + height * 0.1);
      ctx.rotate(Math.PI / 6);
    } else {
      // Standard position
      ctx.translate(x + width * 0.3, y);
      ctx.rotate(Math.PI / 8);
    }
    
    // Handle
    ctx.fillStyle = '#5a5a5a';
    ctx.fillRect(-width * 0.03, 0, width * 0.06, height * 0.3);
    
    // Add texture to handle
    addStoneTexture(ctx, -width * 0.03, 0, width * 0.06, height * 0.3);
    
    // Hammerhead
    ctx.fillStyle = '#505050';
    ctx.fillRect(-width * 0.15, -height * 0.12, width * 0.3, height * 0.12);
    
    // Add texture to hammerhead
    addStoneTexture(ctx, -width * 0.15, -height * 0.12, width * 0.3, height * 0.12);
    
    // Binding between handle and hammerhead
    ctx.fillStyle = '#666666';
    ctx.fillRect(-width * 0.06, 0, width * 0.12, height * 0.04);
    
    // Runes on hammerhead
    ctx.strokeStyle = 'rgba(255, 120, 40, 0.8)';
    ctx.lineWidth = 2;
    
    // Left rune
    ctx.beginPath();
    ctx.moveTo(-width * 0.1, -height * 0.06);
    ctx.lineTo(-width * 0.05, -height * 0.02);
    ctx.lineTo(-width * 0.1, height * 0.02);
    ctx.stroke();
    
    // Right rune
    ctx.beginPath();
    ctx.moveTo(width * 0.1, -height * 0.06);
    ctx.lineTo(width * 0.05, -height * 0.02);
    ctx.lineTo(width * 0.1, height * 0.02);
    ctx.stroke();
    
    // Center symbol
    ctx.beginPath();
    ctx.arc(0, -height * 0.06, width * 0.03, 0, Math.PI * 2);
    ctx.stroke();
    
    // Add glow effect when attacking
    if (isAttacking) {
      ctx.fillStyle = 'rgba(255, 120, 40, 0.3)';
      ctx.beginPath();
      ctx.rect(-width * 0.15, -height * 0.12, width * 0.3, height * 0.12);
      ctx.fill();
    }
    
    ctx.restore();
  };
  
  // Draw the glowing runes across the body
  const drawRunes = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    intensity: number
  ) => {
    // Determine rune color and brightness based on intensity
    const alpha = 0.7 * intensity;
    ctx.strokeStyle = `rgba(255, 120, 40, ${alpha})`;
    ctx.lineWidth = 2;
    
    // Draw a central rune on the chest
    ctx.beginPath();
    ctx.arc(x, y - height * 0.05, width * 0.08, 0, Math.PI * 2);
    ctx.stroke();
    
    // Add inner details to chest rune
    ctx.beginPath();
    ctx.moveTo(x, y - height * 0.13);
    ctx.lineTo(x, y + height * 0.03);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x - width * 0.08, y - height * 0.05);
    ctx.lineTo(x + width * 0.08, y - height * 0.05);
    ctx.stroke();
    
    // Draw power lines connecting to other runes
    const runePositions = [
      { x: x - width * 0.15, y: y - height * 0.15 }, // Upper left
      { x: x + width * 0.15, y: y - height * 0.15 }, // Upper right
      { x: x - width * 0.12, y: y + height * 0.1 },  // Lower left
      { x: x + width * 0.12, y: y + height * 0.1 }   // Lower right
    ];
    
    // Draw lines connecting the central rune to the others
    for (const pos of runePositions) {
      ctx.beginPath();
      ctx.moveTo(x, y - height * 0.05);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      
      // Draw the connected runes
      drawRuneSymbol(ctx, pos.x, pos.y, width * 0.05, alpha);
    }
    
    // Add glow around main rune if intensity is high (attacking)
    if (intensity > 1.0) {
      ctx.fillStyle = `rgba(255, 120, 40, ${alpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(x, y - height * 0.05, width * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
  // Draw individual rune symbols
  const drawRuneSymbol = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    alpha: number
  ) => {
    // Choose a random rune type for visual variety
    const runeType = Math.floor(Math.random() * 3);
    
    ctx.strokeStyle = `rgba(255, 120, 40, ${alpha})`;
    ctx.lineWidth = 1.5;
    
    switch (runeType) {
      case 0:
        // Triangle rune
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x - size, y + size * 0.5);
        ctx.lineTo(x + size, y + size * 0.5);
        ctx.closePath();
        ctx.stroke();
        break;
        
      case 1:
        // Square with inner cross
        ctx.strokeRect(x - size * 0.7, y - size * 0.7, size * 1.4, size * 1.4);
        ctx.beginPath();
        ctx.moveTo(x - size * 0.7, y - size * 0.7);
        ctx.lineTo(x + size * 0.7, y + size * 0.7);
        ctx.moveTo(x + size * 0.7, y - size * 0.7);
        ctx.lineTo(x - size * 0.7, y + size * 0.7);
        ctx.stroke();
        break;
        
      case 2:
        // Circle with dot
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  };
  
  // Draw damage effect when hit
  const drawDamageEffect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // Draw cracks throughout the body
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    
    // Main crack down middle
    ctx.beginPath();
    ctx.moveTo(x, y - height * 0.25);
    ctx.lineTo(x - width * 0.05, y - height * 0.1);
    ctx.lineTo(x + width * 0.1, y);
    ctx.lineTo(x, y + height * 0.15);
    ctx.stroke();
    
    // Secondary cracks
    ctx.beginPath();
    ctx.moveTo(x - width * 0.05, y - height * 0.1);
    ctx.lineTo(x - width * 0.15, y - height * 0.05);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + width * 0.1, y);
    ctx.lineTo(x + width * 0.2, y - height * 0.05);
    ctx.stroke();
    
    // Small fragments breaking off
    ctx.fillStyle = '#5a5a5a';
    
    // Draw fragments falling off
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * width * 0.3 + width * 0.15;
      const fragX = x + Math.cos(angle) * distance;
      const fragY = y + Math.sin(angle) * distance;
      const fragSize = Math.random() * width * 0.03 + width * 0.01;
      
      ctx.beginPath();
      ctx.moveTo(fragX, fragY);
      ctx.lineTo(fragX + fragSize, fragY + fragSize * 0.5);
      ctx.lineTo(fragX + fragSize * 0.5, fragY + fragSize * 1.5);
      ctx.closePath();
      ctx.fill();
    }
    
    // Impact flash
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(x + width * 0.1, y - height * 0.1, width * 0.15, 0, Math.PI * 2);
    ctx.fill();
  };
  
  // Draw the seams between stone blocks
  const drawStoneSeams = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    
    // Horizontal seams
    ctx.beginPath();
    ctx.moveTo(x - width * 0.18, y);
    ctx.lineTo(x + width * 0.18, y);
    ctx.stroke();
    
    // Vertical seams
    ctx.beginPath();
    ctx.moveTo(x, y - height * 0.15);
    ctx.lineTo(x, y + height * 0.15);
    ctx.stroke();
    
    // Shoulder seams
    ctx.beginPath();
    ctx.moveTo(x - width * 0.2, y - height * 0.15);
    ctx.lineTo(x - width * 0.22, y - height * 0.05);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(x + width * 0.2, y - height * 0.15);
    ctx.lineTo(x + width * 0.22, y - height * 0.05);
    ctx.stroke();
  };
  
  // Add stone texture
  const addStoneTexture = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isDamaged: boolean = false
  ) => {
    // Add some texture to the stone using small darker spots
    ctx.fillStyle = isDamaged ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.2)';
    
    // Calculate number of spots based on area
    const spotCount = Math.floor((width * height) / 30);
    
    for (let i = 0; i < spotCount; i++) {
      const spotX = x + Math.random() * width;
      const spotY = y + Math.random() * height;
      const spotSize = Math.random() * 3 + 1;
      
      ctx.beginPath();
      ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add some lighter spots for texture as well
    ctx.fillStyle = isDamaged ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)';
    
    for (let i = 0; i < spotCount / 2; i++) {
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

export default StoneGuardian;