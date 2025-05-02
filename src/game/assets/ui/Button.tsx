import React, { useRef, useEffect } from 'react';

interface ButtonProps {
  width?: number;
  height?: number;
  text?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  state?: 'normal' | 'hover' | 'pressed' | 'disabled';
  onRender?: (imageData: string) => void;
}

export const Button: React.FC<ButtonProps> = ({
  width = 160,
  height = 48,
  text = 'Button',
  variant = 'primary',
  state = 'normal',
  onRender
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current && onRender) {
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, width, height);
      
      // Draw the button
      drawButton(ctx, width, height, text, variant, state);
      
      // Convert to image data
      const imageData = canvasRef.current.toDataURL('image/png');
      onRender(imageData);
    }
  }, [width, height, text, variant, state, onRender]);
  
  const drawButton = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    text: string,
    variant: 'primary' | 'secondary' | 'danger' | 'success',
    state: 'normal' | 'hover' | 'pressed' | 'disabled'
  ) => {
    // Get colors based on variant and state
    const colors = getButtonColors(variant, state);
    
    // Draw button background
    drawButtonBackground(ctx, width, height, colors);
    
    // Add stone texture
    if (state !== 'disabled') {
      addStoneTexture(ctx, 0, 0, width, height, colors.baseColor, colors.darkColor);
    }
    
    // Draw border and inner glow
    drawButtonBorder(ctx, width, height, colors);
    
    // Draw text
    drawButtonText(ctx, width, height, text, colors);
    
    // Add decorative runes
    drawRunes(ctx, width, height, colors, state);
    
    // Add state effects
    if (state === 'hover') {
      drawHoverEffect(ctx, width, height);
    } else if (state === 'pressed') {
      drawPressedEffect(ctx, width, height);
    } else if (state === 'disabled') {
      drawDisabledEffect(ctx, width, height);
    }
  };
  
  const getButtonColors = (
    variant: 'primary' | 'secondary' | 'danger' | 'success',
    state: 'normal' | 'hover' | 'pressed' | 'disabled'
  ) => {
    const baseColors = {
      primary: {
        baseColor: '#3a3a6a',
        darkColor: '#2a2a4a',
        glowColor: 'rgba(120, 180, 255, 0.6)',
        borderColor: '#5a5a9a',
        textColor: '#ffffff',
        runeColor: 'rgba(130, 210, 255, 0.8)'
      },
      secondary: {
        baseColor: '#3a4a5a',
        darkColor: '#2a3a4a',
        glowColor: 'rgba(170, 220, 230, 0.5)',
        borderColor: '#5a6a7a',
        textColor: '#ffffff',
        runeColor: 'rgba(170, 220, 230, 0.7)'
      },
      danger: {
        baseColor: '#6a3a3a',
        darkColor: '#4a2a2a',
        glowColor: 'rgba(255, 120, 120, 0.5)',
        borderColor: '#8a5a5a',
        textColor: '#ffffff',
        runeColor: 'rgba(255, 150, 150, 0.7)'
      },
      success: {
        baseColor: '#3a6a3a',
        darkColor: '#2a4a2a',
        glowColor: 'rgba(120, 255, 120, 0.5)',
        borderColor: '#5a8a5a',
        textColor: '#ffffff',
        runeColor: 'rgba(150, 255, 150, 0.7)'
      }
    };
    
    const colors = { ...baseColors[variant] };
    
    // Modify colors based on state
    if (state === 'hover') {
      colors.baseColor = lightenColor(colors.baseColor, 10);
      colors.borderColor = lightenColor(colors.borderColor, 15);
    } else if (state === 'pressed') {
      colors.baseColor = darkenColor(colors.baseColor, 10);
      colors.darkColor = darkenColor(colors.darkColor, 10);
    } else if (state === 'disabled') {
      colors.baseColor = desaturateColor(colors.baseColor);
      colors.darkColor = desaturateColor(colors.darkColor);
      colors.glowColor = 'rgba(100, 100, 100, 0.3)';
      colors.borderColor = desaturateColor(colors.borderColor);
      colors.textColor = '#999999';
      colors.runeColor = 'rgba(150, 150, 150, 0.4)';
    }
    
    return colors;
  };
  
  const drawButtonBackground = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: any
  ) => {
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, colors.baseColor);
    gradient.addColorStop(1, colors.darkColor);
    
    // Draw button shape with rounded corners
    const radius = 8;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
    
    // Add a subtle light effect at the top
    const lightGradient = ctx.createLinearGradient(0, 0, 0, height * 0.3);
    lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.15)');
    lightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = lightGradient;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height * 0.3);
    ctx.lineTo(0, height * 0.3);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
  };
  
  const drawButtonBorder = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: any
  ) => {
    const radius = 8;
    
    // Draw inner glow
    const glowWidth = 4;
    const glow = ctx.createLinearGradient(0, 0, 0, height);
    glow.addColorStop(0, colors.glowColor);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.strokeStyle = glow;
    ctx.lineWidth = glowWidth;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.stroke();
    
    // Draw border
    ctx.strokeStyle = colors.borderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.stroke();
  };
  
  const drawButtonText = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    text: string,
    colors: any
  ) => {
    ctx.fillStyle = colors.textColor;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add text shadow for depth
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.fillText(text, width / 2, height / 2);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
  };
  
  const drawRunes = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    colors: any,
    state: string
  ) => {
    ctx.fillStyle = colors.runeColor;
    
    // Left rune
    const leftX = 12;
    const centerY = height / 2;
    const runeSize = Math.min(height - 16, 24);
    
    ctx.beginPath();
    ctx.arc(leftX, centerY, runeSize / 4, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = colors.runeColor;
    ctx.lineWidth = 1.5;
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(leftX, centerY - runeSize / 2);
    ctx.lineTo(leftX, centerY + runeSize / 2);
    ctx.stroke();
    
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(leftX - runeSize / 2, centerY);
    ctx.lineTo(leftX + runeSize / 2, centerY);
    ctx.stroke();
    
    // Right rune (different symbol)
    const rightX = width - 12;
    
    ctx.beginPath();
    ctx.moveTo(rightX - runeSize / 3, centerY - runeSize / 3);
    ctx.lineTo(rightX + runeSize / 3, centerY + runeSize / 3);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(rightX - runeSize / 3, centerY + runeSize / 3);
    ctx.lineTo(rightX + runeSize / 3, centerY - runeSize / 3);
    ctx.stroke();
    
    // Add rune glow on hover
    if (state === 'hover') {
      const glow = ctx.createRadialGradient(
        leftX, centerY, 0,
        leftX, centerY, runeSize
      );
      glow.addColorStop(0, colors.glowColor);
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(leftX, centerY, runeSize, 0, Math.PI * 2);
      ctx.fill();
      
      const rightGlow = ctx.createRadialGradient(
        rightX, centerY, 0,
        rightX, centerY, runeSize
      );
      rightGlow.addColorStop(0, colors.glowColor);
      rightGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      
      ctx.fillStyle = rightGlow;
      ctx.beginPath();
      ctx.arc(rightX, centerY, runeSize, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  
  const drawHoverEffect = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Add a subtle glow around the button
    const radius = 8;
    ctx.shadowColor = 'rgba(200, 220, 255, 0.5)';
    ctx.shadowBlur = 8;
    
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(width - radius, 0);
    ctx.quadraticCurveTo(width, 0, width, radius);
    ctx.lineTo(width, height - radius);
    ctx.quadraticCurveTo(width, height, width - radius, height);
    ctx.lineTo(radius, height);
    ctx.quadraticCurveTo(0, height, 0, height - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
  };
  
  const drawPressedEffect = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Darken the button slightly
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(0, 0, width, height);
    
    // Add impression effect
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, width - 4, height - 4);
  };
  
  const drawDisabledEffect = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Add a translucent overlay
    ctx.fillStyle = 'rgba(80, 80, 80, 0.5)';
    ctx.fillRect(0, 0, width, height);
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
    for (let i = 0; i < width * height / 50; i++) {
      const noiseX = x + Math.random() * width;
      const noiseY = y + Math.random() * height;
      const noiseSize = Math.random() * 2 + 0.5;
      
      ctx.fillStyle = Math.random() > 0.5 ? noiseColor : baseColor;
      ctx.fillRect(noiseX, noiseY, noiseSize, noiseSize);
    }
  };
  
  // Helper function to lighten a color
  const lightenColor = (color: string, amount: number): string => {
    // Convert hex to RGB
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
    
    // Increase each component by the amount
    r = Math.min(255, r + amount);
    g = Math.min(255, g + amount);
    b = Math.min(255, b + amount);
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // Helper function to darken a color
  const darkenColor = (color: string, amount: number): string => {
    // Convert hex to RGB
    let r = parseInt(color.slice(1, 3), 16);
    let g = parseInt(color.slice(3, 5), 16);
    let b = parseInt(color.slice(5, 7), 16);
    
    // Decrease each component by the amount
    r = Math.max(0, r - amount);
    g = Math.max(0, g - amount);
    b = Math.max(0, b - amount);
    
    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };
  
  // Helper function to desaturate a color
  const desaturateColor = (color: string): string => {
    // Convert hex to RGB
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    // Calculate grayscale value (simple average)
    const gray = Math.floor((r + g + b) / 3);
    
    // Mix with original color (50% desaturation)
    const mixR = Math.floor((r + gray) / 2);
    const mixG = Math.floor((g + gray) / 2);
    const mixB = Math.floor((b + gray) / 2);
    
    // Convert back to hex
    return `#${mixR.toString(16).padStart(2, '0')}${mixG.toString(16).padStart(2, '0')}${mixB.toString(16).padStart(2, '0')}`;
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

export default Button;