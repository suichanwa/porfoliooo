import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Skill } from '../models/Skill';

interface SkillBadgeProps {
  skill: Skill | string;
  variant?: 'default' | 'compact' | 'detailed';
  showLevel?: boolean;
  animated?: boolean;
}

const SkillBadge: React.FC<SkillBadgeProps> = ({ 
  skill, 
  variant = 'default',
  showLevel = true,
  animated = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Handle both Skill object and string inputs for backward compatibility
  const skillData = typeof skill === 'string' 
    ? { name: skill, level: 75, iconUrl: undefined }
    : skill;

  const { name, level = 75, iconUrl } = skillData;

  // Generate skill colors based on level
  const getSkillColors = (level: number) => {
    if (level >= 85) return {
      bg: 'from-emerald-500/20 to-green-500/20',
      border: 'border-emerald-400/30',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-400/20'
    };
    if (level >= 70) return {
      bg: 'from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-400/30',
      text: 'text-blue-400',
      glow: 'shadow-blue-400/20'
    };
    if (level >= 50) return {
      bg: 'from-amber-500/20 to-yellow-500/20',
      border: 'border-amber-400/30',
      text: 'text-amber-400',
      glow: 'shadow-amber-400/20'
    };
    return {
      bg: 'from-slate-500/20 to-gray-500/20',
      border: 'border-slate-400/30',
      text: 'text-slate-400',
      glow: 'shadow-slate-400/20'
    };
  };

  const colors = getSkillColors(level);

  // Get fallback icon based on skill name
  const getFallbackIcon = (skillName: string) => {
    const skill = skillName.toLowerCase();
    
    if (skill.includes('react')) return '⚛️';
    if (skill.includes('typescript') || skill.includes('ts')) return '🔷';
    if (skill.includes('javascript') || skill.includes('js')) return '🟨';
    if (skill.includes('python')) return '🐍';
    if (skill.includes('node')) return '🟢';
    if (skill.includes('html')) return '🌐';
    if (skill.includes('css') || skill.includes('tailwind')) return '🎨';
    if (skill.includes('git')) return '📚';
    if (skill.includes('docker')) return '🐳';
    if (skill.includes('aws')) return '☁️';
    if (skill.includes('mongo')) return '🍃';
    if (skill.includes('postgres') || skill.includes('sql')) return '🗄️';
    if (skill.includes('astro')) return '🚀';
    
    return '⚡'; // Default fallback
  };

  const skillIcon = iconUrl || getFallbackIcon(name);

  // Render variants
  if (variant === 'compact') {
    return (
      <motion.div
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-gradient-to-r ${colors.bg} border ${colors.border}
          transition-all duration-300 cursor-default
          ${isHovered ? `shadow-lg ${colors.glow}` : ''}
        `}
        whileHover={animated ? { scale: 1.05 } : {}}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <span className="text-sm">{skillIcon}</span>
        <span className={`text-sm font-medium ${colors.text}`}>
          {name}
        </span>
      </motion.div>
    );
  }

  if (variant === 'detailed') {
    return (
      <motion.div
        className={`
          relative p-4 rounded-xl bg-gradient-to-br ${colors.bg}
          border ${colors.border} backdrop-blur-sm
          transition-all duration-300 cursor-default group
          ${isHovered ? `shadow-xl ${colors.glow}` : 'shadow-md'}
        `}
        whileHover={animated ? { scale: 1.02, y: -2 } : {}}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        {/* Skill Icon */}
        <div className="flex items-center justify-center mb-3">
          {iconUrl ? (
            <img 
              src={iconUrl} 
              alt={`${name} icon`}
              className="w-8 h-8 object-contain"
              onError={(e) => {
                // Fallback to emoji if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling!.classList.remove('hidden');
              }}
            />
          ) : null}
          <span className={`text-2xl ${iconUrl ? 'hidden' : ''}`}>
            {skillIcon}
          </span>
        </div>

        {/* Skill Name */}
        <h3 className={`text-center font-semibold mb-2 ${colors.text}`}>
          {name}
        </h3>

        {/* Progress Bar */}
        {showLevel && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs opacity-70">
              <span>Proficiency</span>
              <span>{level}%</span>
            </div>
            <div className="w-full bg-base-300/50 rounded-full h-2 overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${colors.bg.replace('/20', '/60')} rounded-full`}
                initial={{ width: 0 }}
                animate={{ width: `${level}%` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </div>
          </div>
        )}

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out rounded-xl" />
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      className={`
        relative flex flex-col items-center p-4 rounded-xl
        bg-gradient-to-br ${colors.bg} border ${colors.border}
        backdrop-blur-sm transition-all duration-300 cursor-default group
        ${isHovered ? `shadow-xl ${colors.glow}` : 'shadow-md'}
      `}
      whileHover={animated ? { scale: 1.05, y: -3 } : {}}
      whileTap={animated ? { scale: 0.98 } : {}}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-2 right-2 w-2 h-2 bg-current rounded-full animate-pulse" />
        <div className="absolute bottom-2 left-2 w-1.5 h-1.5 bg-current rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Skill Icon */}
      <div className="relative mb-3">
        {iconUrl ? (
          <div className="relative">
            <img 
              src={iconUrl} 
              alt={`${name} icon`}
              className="w-8 h-8 object-contain transition-transform duration-300 group-hover:scale-110"
              onError={(e) => {
                // Fallback to emoji if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling!.classList.remove('hidden');
              }}
            />
            <span className={`absolute inset-0 flex items-center justify-center text-2xl hidden`}>
              {skillIcon}
            </span>
          </div>
        ) : (
          <span className="text-2xl transition-transform duration-300 group-hover:scale-110">
            {skillIcon}
          </span>
        )}
      </div>

      {/* Skill Name */}
      <h3 className={`text-center font-medium text-sm mb-2 ${colors.text} transition-colors duration-300`}>
        {name}
      </h3>

      {/* Level Badge */}
      {showLevel && (
        <motion.div
          className={`
            px-2 py-1 rounded-full text-xs font-bold
            bg-gradient-to-r ${colors.bg.replace('/20', '/40')}
            border ${colors.border} ${colors.text}
          `}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {level}%
        </motion.div>
      )}

      {/* Hover Effect Shine */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out rounded-xl" />

      {/* Pulse Ring on Hover */}
      {isHovered && (
        <motion.div
          className={`absolute inset-0 border-2 ${colors.border} rounded-xl`}
          initial={{ scale: 1, opacity: 0.6 }}
          animate={{ scale: 1.1, opacity: 0 }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

export default SkillBadge;