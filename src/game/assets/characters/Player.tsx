import React, { useRef, useEffect } from 'react';

interface PlayerProps {
  width?: number;
  height?: number;
  variant?: 'default' | 'attack' | 'hit' | 'cast';
  onRender?: (imageData: string) => void;
}

export const Player: React.FC<PlayerProps> = ({
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
      
      // Draw the player based on variant
      if (variant === 'hit') {
        drawPlayerHit(ctx, width, height);
      } else if (variant === 'attack') {
        drawPlayerAttack(ctx, width, height);
      } else if (variant === 'cast') {
        drawPlayerCast(ctx, width, height);
      } else {
        drawPlayer(ctx, width, height);
      }
      
      // Convert to image data
      const imageData = canvasRef.current.toDataURL('image/png');
      onRender(imageData);
    }
  }, [width, height, variant, onRender]);
  
  // Draw the standard pose of the player character
  const drawPlayer = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Center point
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw body structure
    drawBody(ctx, centerX, centerY, width, height);
    
    // Draw the armor
    drawArmor(ctx, centerX, centerY, width, height);
    
    // Draw the head/face
    drawHead(ctx, centerX, centerY - height * 0.25, width * 0.22, height * 0.22);
    
    // Draw arms and weapon
    drawArmsAndWeapon(ctx, centerX, centerY, width, height, false);
  };
  
  // Draw the attack animation pose
  const drawPlayerAttack = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Center point
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw body with slight forward tilt
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(Math.PI * 0.05); // Slight tilt forward
    ctx.translate(-centerX, -centerY);
    
    drawBody(ctx, centerX, centerY, width, height);
    
    // Draw the armor
    drawArmor(ctx, centerX, centerY, width, height);
    
    // Draw the head/face with determined expression
    drawHead(ctx, centerX, centerY - height * 0.25, width * 0.22, height * 0.22, true);
    
    ctx.restore();
    
    // Draw arms and weapon in attack position
    drawArmsAndWeapon(ctx, centerX, centerY, width, height, true);
  };
  
  // Draw the hit animation pose
  const drawPlayerHit = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Center point with slight shift to indicate impact
    const centerX = width / 2 - width * 0.03;
    const centerY = height / 2;
    
    // Draw body with slight backward tilt
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(Math.PI * -0.05); // Slight tilt backward
    ctx.translate(-centerX, -centerY);
    
    drawBody(ctx, centerX, centerY, width, height);
    
    // Draw the armor with damage indication
    drawArmor(ctx, centerX, centerY, width, height, true);
    
    // Draw the head/face with pained expression
    drawHead(ctx, centerX, centerY - height * 0.25, width * 0.22, height * 0.22, false, true);
    
    ctx.restore();
    
    // Draw arms and weapon in defensive position
    drawArmsAndWeapon(ctx, centerX, centerY, width, height, false, true);
  };
  
  // Draw the magic casting animation pose
  const drawPlayerCast = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Center point
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Draw body
    drawBody(ctx, centerX, centerY, width, height);
    
    // Draw the armor with magical glow
    drawArmor(ctx, centerX, centerY, width, height, false, true);
    
    // Draw the head/face with focused expression
    drawHead(ctx, centerX, centerY - height * 0.25, width * 0.22, height * 0.22, false, false, true);
    
    // Draw arms in casting position
    drawCastingPose(ctx, centerX, centerY, width, height);
    
    // Add magical effect
    drawMagicEffect(ctx, centerX, centerY, width, height);
  };
  
  // Draw the basic body form
  const drawBody = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    width: number, 
    height: number
  ) => {
    // Draw torso
    ctx.fillStyle = '#5a4a3a';
    
    // Torso shape
    ctx.beginPath();
    ctx.moveTo(x - width * 0.15, y - height * 0.2);
    ctx.lineTo(x + width * 0.15, y - height * 0.2);
    ctx.lineTo(x + width * 0.15, y + height * 0.2);
    ctx.lineTo(x - width * 0.15, y + height * 0.2);
    ctx.closePath();
    ctx.fill();
    
    // Draw legs
    ctx.fillStyle = '#4a3a2a';
    
    // Left leg
    ctx.beginPath();
    ctx.moveTo(x - width * 0.1, y + height * 0.2);
    ctx.lineTo(x - width * 0.05, y + height * 0.2);
    ctx.lineTo(x - width * 0.04, y + height * 0.35);
    ctx.lineTo(x - width * 0.11, y + height * 0.35);
    ctx.closePath();
    ctx.fill();
    
    // Right leg
    ctx.beginPath();
    ctx.moveTo(x + width * 0.05, y + height * 0.2);
    ctx.lineTo(x + width * 0.1, y + height * 0.2);
    ctx.lineTo(x + width * 0.11, y + height * 0.35);
    ctx.lineTo(x + width * 0.04, y + height * 0.35);
    ctx.closePath();
    ctx.fill();
    
    // Boots
    ctx.fillStyle = '#3a2a1a';
    
    // Left boot
    ctx.beginPath();
    ctx.moveTo(x - width * 0.11, y + height * 0.35);
    ctx.lineTo(x - width * 0.04, y + height * 0.35);
    ctx.lineTo(x - width * 0.03, y + height * 0.4);
    ctx.lineTo(x - width * 0.12, y + height * 0.4);
    ctx.closePath();
    ctx.fill();
    
    // Right boot
    ctx.beginPath();
    ctx.moveTo(x + width * 0.04, y + height * 0.35);
    ctx.lineTo(x + width * 0.11, y + height * 0.35);
    ctx.lineTo(x + width * 0.12, y + height * 0.4);
    ctx.lineTo(x + width * 0.03, y + height * 0.4);
    ctx.closePath();
    ctx.fill();
  };
  
  // Draw armor with optional damage or magical glow effect
  const drawArmor = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isDamaged = false,
    isMagical = false
  ) => {
    // Draw chestplate
    const armorColor = isDamaged ? '#7a7a7a' : isMagical ? '#a0a0d0' : '#a0a0a0';
    ctx.fillStyle = armorColor;
    
    // Main chest armor
    ctx.beginPath();
    ctx.moveTo(x - width * 0.14, y - height * 0.18);
    ctx.lineTo(x + width * 0.14, y - height * 0.18);
    ctx.lineTo(x + width * 0.13, y + height * 0.15);
    ctx.lineTo(x - width * 0.13, y + height * 0.15);
    ctx.closePath();
    ctx.fill();
    
    // Shoulder pads
    ctx.beginPath();
    ctx.arc(x - width * 0.17, y - height * 0.15, width * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x + width * 0.17, y - height * 0.15, width * 0.06, 0, Math.PI * 2);
    ctx.fill();
    
    // Add shine to armor
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(x - width * 0.05, y - height * 0.1, width * 0.04, height * 0.02, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Add a belt
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(x - width * 0.13, y + height * 0.15, width * 0.26, height * 0.05);
    
    // Add buckle
    ctx.fillStyle = '#d0b060';
    ctx.fillRect(x - width * 0.02, y + height * 0.15, width * 0.04, height * 0.05);
    
    // Add rune decorations to armor
    const runeColor = isDamaged ? 'rgba(150, 120, 80, 0.6)' : 
                      isMagical ? 'rgba(100, 150, 250, 0.9)' : 'rgba(150, 150, 180, 0.7)';
    
    ctx.strokeStyle = runeColor;
    ctx.lineWidth = 1;
    
    // Central rune
    ctx.beginPath();
    ctx.arc(x, y, width * 0.05, 0, Math.PI * 2);
    ctx.stroke();
    
    // Add small lines emanating from it
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2;
      const startX = x + Math.cos(angle) * width * 0.05;
      const startY = y + Math.sin(angle) * width * 0.05;
      const endX = x + Math.cos(angle) * width * 0.08;
      const endY = y + Math.sin(angle) * width * 0.08;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
    // Add magical glow if casting
    if (isMagical) {
      ctx.fillStyle = 'rgba(100, 150, 250, 0.2)';
      ctx.beginPath();
      ctx.arc(x, y, width * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add damage effect
    if (isDamaged) {
      ctx.strokeStyle = 'rgba(150, 30, 30, 0.6)';
      ctx.lineWidth = 2;
      
      // Add some "damage" scratches
      ctx.beginPath();
      ctx.moveTo(x - width * 0.1, y - height * 0.1);
      ctx.lineTo(x - width * 0.05, y + height * 0.05);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(x + width * 0.08, y - height * 0.15);
      ctx.lineTo(x + width * 0.12, y - height * 0.05);
      ctx.stroke();
    }
  };
  
  // Draw head and face with different expressions
  const drawHead = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isAttacking = false,
    isHit = false,
    isCasting = false
  ) => {
    // Draw head shape
    ctx.fillStyle = '#e0c0a0'; // Skin tone
    ctx.beginPath();
    ctx.arc(x, y, width * 0.8, 0, Math.PI * 2);
    ctx.fill();
    
    // Hair
    ctx.fillStyle = '#5a3a20';
    ctx.beginPath();
    ctx.arc(x, y - height * 0.1, width * 0.85, Math.PI, Math.PI * 2);
    ctx.fill();
    
    // Draw helmet/headband
    ctx.fillStyle = '#a0a0a0';
    ctx.beginPath();
    ctx.ellipse(x, y - height * 0.2, width * 0.9, height * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Add gem to helmet
    const gemColor = isCasting ? '#4dabf7' : '#d0b060';
    ctx.fillStyle = gemColor;
    ctx.beginPath();
    ctx.arc(x, y - height * 0.4, width * 0.15, 0, Math.PI * 2);
    ctx.fill();
    
    // Add glow to gem if casting
    if (isCasting) {
      ctx.fillStyle = 'rgba(77, 171, 247, 0.3)';
      ctx.beginPath();
      ctx.arc(x, y - height * 0.4, width * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Eyes - different based on state
    const eyeY = y + height * 0.1;
    ctx.fillStyle = '#000000';
    
    // Left eye
    ctx.beginPath();
    if (isHit) {
      // Closed in pain
      ctx.moveTo(x - width * 0.4, eyeY);
      ctx.lineTo(x - width * 0.2, eyeY);
    } else if (isAttacking || isCasting) {
      // Determined/focused look
      ctx.ellipse(x - width * 0.3, eyeY, width * 0.1, height * (isCasting ? 0.09 : 0.06), 0, 0, Math.PI * 2);
    } else {
      // Normal
      ctx.arc(x - width * 0.3, eyeY, width * 0.08, 0, Math.PI * 2);
    }
    ctx.fill();
    
    // Right eye
    ctx.beginPath();
    if (isHit) {
      // Closed in pain
      ctx.moveTo(x + width * 0.2, eyeY);
      ctx.lineTo(x + width * 0.4, eyeY);
    } else if (isAttacking || isCasting) {
      // Determined/focused look
      ctx.ellipse(x + width * 0.3, eyeY, width * 0.1, height * (isCasting ? 0.09 : 0.06), 0, 0, Math.PI * 2);
    } else {
      // Normal
      ctx.arc(x + width * 0.3, eyeY, width * 0.08, 0, Math.PI * 2);
    }
    ctx.fill();
    
    // Mouth
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000000';
    
    if (isHit) {
      // Grimacing in pain - open mouth
      ctx.fillStyle = '#300000';
      ctx.beginPath();
      ctx.ellipse(x, y + height * 0.3, width * 0.2, height * 0.1, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (isAttacking) {
      // Determined/shouting
      ctx.beginPath();
      ctx.moveTo(x - width * 0.2, y + height * 0.3);
      ctx.lineTo(x + width * 0.2, y + height * 0.3);
      ctx.stroke();
    } else if (isCasting) {
      // Focused, slightly open
      ctx.beginPath();
      ctx.ellipse(x, y + height * 0.3, width * 0.1, height * 0.05, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Normal neutral expression
      ctx.beginPath();
      ctx.moveTo(x - width * 0.15, y + height * 0.3);
      ctx.lineTo(x + width * 0.15, y + height * 0.3);
      ctx.stroke();
    }
  };
  
  // Draw arms and weapon with different poses
  const drawArmsAndWeapon = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    isAttacking = false,
    isHit = false
  ) => {
    // Arm color
    ctx.fillStyle = '#e0c0a0'; // Skin tone
    
    // Left arm (shield arm)
    ctx.save();
    if (isAttacking) {
      // Pulled back a bit while attacking
      ctx.translate(x - width * 0.28, y - height * 0.1);
      ctx.rotate(Math.PI * -0.2);
    } else if (isHit) {
      // Raised to protect
      ctx.translate(x - width * 0.28, y - height * 0.1);
      ctx.rotate(Math.PI * -0.4);
    } else {
      // Normal position
      ctx.translate(x - width * 0.28, y - height * 0.1);
    }
    
    // Upper arm
    ctx.fillRect(0, 0, -width * 0.08, height * 0.16);
    
    // Draw a shield if not attacking
    if (!isAttacking) {
      const shieldX = -width * 0.04;
      const shieldY = height * 0.2;
      
      // Shield base
      ctx.fillStyle = '#7a5a3a';
      ctx.beginPath();
      ctx.ellipse(shieldX, shieldY, width * 0.12, height * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Shield decoration
      ctx.fillStyle = '#d0b060';
      ctx.beginPath();
      ctx.arc(shieldX, shieldY, width * 0.06, 0, Math.PI * 2);
      ctx.fill();
      
      // Shield border
      ctx.strokeStyle = '#a08060';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(shieldX, shieldY, width * 0.12, height * 0.16, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    
    ctx.restore();
    
    // Right arm (sword arm)
    ctx.save();
    if (isAttacking) {
      // Extended forward for attack
      ctx.translate(x + width * 0.28, y - height * 0.1);
      ctx.rotate(Math.PI * 0.4);
    } else if (isHit) {
      // Pulled back from being hit
      ctx.translate(x + width * 0.28, y - height * 0.1);
      ctx.rotate(Math.PI * -0.2);
    } else {
      // Normal resting position
      ctx.translate(x + width * 0.28, y - height * 0.1);
      ctx.rotate(Math.PI * 0.1);
    }
    
    // Upper arm
    ctx.fillStyle = '#e0c0a0'; // Skin tone
    ctx.fillRect(0, 0, width * 0.08, height * 0.16);
    
    // Draw the sword
    const swordX = width * 0.04;
    const swordY = height * 0.2;
    
    // Sword handle
    ctx.fillStyle = '#5a3a20';
    ctx.fillRect(swordX - width * 0.015, swordY - height * 0.06, width * 0.03, height * 0.1);
    
    // Sword guard
    ctx.fillStyle = '#d0b060';
    ctx.fillRect(swordX - width * 0.05, swordY - height * 0.01, width * 0.1, height * 0.02);
    
    // Sword blade
    ctx.fillStyle = isAttacking ? '#e0e0ff' : '#c0c0d0';
    ctx.beginPath();
    ctx.moveTo(swordX, swordY);
    ctx.lineTo(swordX - width * 0.03, swordY + height * 0.2);
    ctx.lineTo(swordX + width * 0.03, swordY + height * 0.2);
    ctx.closePath();
    ctx.fill();
    
    // Blade shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(swordX, swordY);
    ctx.lineTo(swordX - width * 0.01, swordY + height * 0.15);
    ctx.lineTo(swordX + width * 0.01, swordY + height * 0.15);
    ctx.closePath();
    ctx.fill();
    
    // Add glow to sword if attacking
    if (isAttacking) {
      ctx.strokeStyle = 'rgba(200, 200, 255, 0.7)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(swordX, swordY);
      ctx.lineTo(swordX, swordY + height * 0.2);
      ctx.stroke();
    }
    
    ctx.restore();
  };
  
  // Draw arms in a casting pose
  const drawCastingPose = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // Arm color
    ctx.fillStyle = '#e0c0a0'; // Skin tone
    
    // Both arms raised for casting
    
    // Left arm
    ctx.save();
    ctx.translate(x - width * 0.28, y - height * 0.1);
    ctx.rotate(Math.PI * -0.3);
    
    // Upper arm
    ctx.fillRect(0, 0, -width * 0.08, height * 0.16);
    
    // Lower arm raised
    ctx.translate(-width * 0.08, height * 0.16);
    ctx.rotate(Math.PI * -0.4);
    ctx.fillRect(0, 0, -width * 0.08, height * 0.16);
    
    // Hand
    ctx.translate(-width * 0.08, height * 0.16);
    ctx.beginPath();
    ctx.arc(0, 0, width * 0.04, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
    
    // Right arm
    ctx.save();
    ctx.translate(x + width * 0.28, y - height * 0.1);
    ctx.rotate(Math.PI * 0.3);
    
    // Upper arm
    ctx.fillRect(0, 0, width * 0.08, height * 0.16);
    
    // Lower arm raised
    ctx.translate(width * 0.08, height * 0.16);
    ctx.rotate(Math.PI * 0.4);
    ctx.fillRect(0, 0, width * 0.08, height * 0.16);
    
    // Hand
    ctx.translate(width * 0.08, height * 0.16);
    ctx.beginPath();
    ctx.arc(0, 0, width * 0.04, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  };
  
  // Draw magic effect for casting
  const drawMagicEffect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    // Create a magical orb between the hands
    ctx.fillStyle = 'rgba(77, 171, 247, 0.6)';
    ctx.beginPath();
    ctx.arc(x, y - height * 0.1, width * 0.1, 0, Math.PI * 2);
    ctx.fill();
    
    // Add outer glow
    const gradient = ctx.createRadialGradient(
      x, y - height * 0.1, width * 0.05,
      x, y - height * 0.1, width * 0.2
    );
    gradient.addColorStop(0, 'rgba(77, 171, 247, 0.5)');
    gradient.addColorStop(1, 'rgba(77, 171, 247, 0)');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y - height * 0.1, width * 0.2, 0, Math.PI * 2);
    ctx.fill();
    
    // Add magical particles
    ctx.fillStyle = 'rgba(200, 220, 255, 0.8)';
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const distance = Math.random() * width * 0.15 + width * 0.12;
      const size = Math.random() * width * 0.02 + width * 0.01;
      
      const particleX = x + Math.cos(angle) * distance;
      const particleY = (y - height * 0.1) + Math.sin(angle) * distance;
      
      ctx.beginPath();
      ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Add magical runes
    ctx.strokeStyle = 'rgba(150, 200, 255, 0.7)';
    ctx.lineWidth = 1.5;
    
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const runeX = x + Math.cos(angle) * width * 0.18;
      const runeY = (y - height * 0.1) + Math.sin(angle) * width * 0.18;
      const runeSize = width * 0.04;
      
      if (i === 0) {
        // Triangle rune
        ctx.beginPath();
        ctx.moveTo(runeX, runeY - runeSize);
        ctx.lineTo(runeX + runeSize, runeY + runeSize);
        ctx.lineTo(runeX - runeSize, runeY + runeSize);
        ctx.closePath();
        ctx.stroke();
      } else if (i === 1) {
        // Square rune
        ctx.strokeRect(runeX - runeSize/2, runeY - runeSize/2, runeSize, runeSize);
      } else {
        // Circle rune
        ctx.beginPath();
        ctx.arc(runeX, runeY, runeSize/2, 0, Math.PI * 2);
        ctx.stroke();
      }
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

export default Player;