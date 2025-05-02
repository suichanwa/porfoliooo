import {
  Sword,
  Sparkles,
  Heart,
  Flask,  // Correct icon name (check if available in your version)
  Shield,
  Flame,
  Snowflake,
  Briefcase,
  VolumeX,
  Volume2,
  Music,
  Music3,
  Gauge,
  ArrowLeft,
  ArrowRight,
  Activity,
  Zap,
  RotateCcw,
  User,
  Crown,
  Beaker  // Alternative for potion icon
} from 'lucide-react';

export const GameIcons = {
  // Battle actions
  attack: Sword,
  magic: Sparkles,
  item: Briefcase,
  defend: Shield,
  
  // Magic types
  fire: Flame,
  ice: Snowflake,
  heal: Heart,
  
  // Items
  potion: Beaker,  // Using Beaker instead of non-existent Bottle
  ether: Zap,
  revive: Activity,
  
  // Settings
  sound: Volume2,
  soundOff: VolumeX,
  music: Music,
  musicOff: Music3,
  difficulty: Gauge,
  
  // Navigation
  back: ArrowLeft,
  next: ArrowRight,
  
  // Player stats
  hp: Heart,
  mp: Zap,
  xp: Crown,
  reset: RotateCcw,
  
  // UI
  player: User
};

export type IconName = keyof typeof GameIcons;

export function getIconByName(iconName: IconName) {
  return GameIcons[iconName] || GameIcons.back; // Default fallback icon
}

// Custom React component to render game icons
export function GameIcon({ name, size = 20, color = 'currentColor' }: { 
  name: IconName; 
  size?: number;
  color?: string;
}) {
  const IconComponent = getIconByName(name);
  return <IconComponent size={size} color={color} />;
}