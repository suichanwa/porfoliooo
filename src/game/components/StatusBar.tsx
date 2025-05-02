import { motion } from "framer-motion";

interface StatusBarProps {
  playerHP: number;
  maxPlayerHP: number;
  playerMP: number;
  maxPlayerMP: number;
  enemyHP: number;
  maxEnemyHP: number;
  enemyName: string;
}

export default function StatusBar({
  playerHP,
  maxPlayerHP,
  playerMP,
  maxPlayerMP,
  enemyHP,
  maxEnemyHP,
  enemyName
}: StatusBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      {/* Player Stats */}
      <div className="bg-base-200 rounded-lg p-3 border border-base-content/10 relative overflow-hidden">
        {/* Mystical rune decoration */}
        <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-400">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M50 5v90M5 50h90" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        
        <h3 className="font-medium text-base mb-2">Adventurer</h3>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span>HP</span>
            <span>{playerHP}/{maxPlayerHP}</span>
          </div>
          <div className="w-full bg-base-300 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(playerHP / maxPlayerHP) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-green-600 to-green-400"
            />
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>MP</span>
            <span>{playerMP}/{maxPlayerMP}</span>
          </div>
          <div className="w-full bg-base-300 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(playerMP / maxPlayerMP) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
            />
          </div>
        </div>
      </div>
      
      {/* Enemy Stats */}
      <div className="bg-base-200 rounded-lg p-3 border border-base-content/10 relative overflow-hidden">
        {/* Mystical rune decoration */}
        <div className="absolute top-0 left-0 w-16 h-16 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-red-500">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2" />
            <path d="M25 50h50M50 25v50" stroke="currentColor" strokeWidth="2" />
            <path d="M30 30l40 40M30 70l40-40" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        
        <h3 className="font-medium text-base mb-2">{enemyName}</h3>
        
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span>HP</span>
            <span>{enemyHP}/{maxEnemyHP}</span>
          </div>
          <div className="w-full bg-base-300 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(enemyHP / maxEnemyHP) * 100}%` }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-red-600 to-red-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
}