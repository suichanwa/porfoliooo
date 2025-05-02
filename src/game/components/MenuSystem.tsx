import React from 'react';
import { motion } from 'framer-motion';
import { MenuItem, MenuType } from '../systems/MenuSystem';
import { Settings, Sword, Feather } from 'lucide-react';
// Replace Flask with Potion or another available icon

interface MenuSystemProps {
  menuItems: MenuItem[];
  selectedIndex: number;
  currentMenu: MenuType;
  onSelectItem: (index: number) => void;
}

// Map of menu item IDs to their corresponding icons
const menuIcons: Record<string, React.ReactNode> = {
  attack: <Sword size={18} />,
  magic: <Feather size={18} />,
  defend: <Settings size={18} />,
  back: <motion.span>←</motion.span>
};

export default function MenuSystem({ 
  menuItems, 
  selectedIndex, 
  currentMenu,
  onSelectItem
}: MenuSystemProps) {
  // Return to the title of the current menu
  const getMenuTitle = () => {
    switch(currentMenu) {
      case 'main': return 'Actions';
      case 'magic': return 'Spells';
      case 'item': return 'Items';
      case 'settings': return 'Settings';
      default: return 'Menu';
    }
  };

  return (
    <motion.div 
      className="bg-base-200 rounded-lg border border-base-content/10 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Menu header with title */}
      <div className="bg-base-300 px-3 py-2 border-b border-base-content/10 flex items-center">
        <div className="flex-1 font-medium text-sm">{getMenuTitle()}</div>
        <div className="text-xs opacity-70">
          {currentMenu !== 'main' && (
            <span>Press X to go back</span>
          )}
        </div>
      </div>

      {/* Menu items */}
      <div className="p-1">
        {menuItems.map((item, index) => (
          <motion.button
            key={item.id}
            className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-2 ${
              index === selectedIndex 
                ? 'bg-primary/20 text-primary-content' 
                : 'hover:bg-base-300'
            } ${item.disabled ? 'opacity-50' : 'opacity-100'}`}
            disabled={item.disabled}
            onClick={() => onSelectItem(index)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ 
              color: index === selectedIndex ? '#ffffff' : item.color 
            }}
          >
            {/* Ancient rune indicator for selected item */}
            <span className="w-6 h-6 flex items-center justify-center">
              {index === selectedIndex ? (
                <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 12L16 12M12 8L12 16" stroke="currentColor" strokeWidth="2"/>
                </svg>
              ) : (
                menuIcons[item.id] || <span>•</span>
              )}
            </span>

            {/* Item label */}
            <span className="flex-1">{item.label}</span>
            
            {/* For magic spells and items, show cost or count */}
            {currentMenu === 'magic' && item.id !== 'back' && (
              <span className="text-xs bg-primary/20 px-2 py-1 rounded text-primary-content">
                {item.id === 'fire' ? '5 MP' : item.id === 'ice' ? '8 MP' : item.id === 'heal' ? '10 MP' : ''}
              </span>
            )}
            {currentMenu === 'item' && item.id !== 'back' && (
              <span className="text-xs bg-primary/20 px-2 py-1 rounded text-primary-content">
                x3
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Decorative ancient runes at the bottom */}
      <div className="border-t border-base-content/10 px-4 py-1 flex justify-between">
        <svg className="w-5 h-5 opacity-40" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1"/>
          <path d="M8 12L16 12" stroke="currentColor" strokeWidth="1"/>
        </svg>
        <svg className="w-5 h-5 opacity-40" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1"/>
          <path d="M12 8L12 16" stroke="currentColor" strokeWidth="1"/>
        </svg>
        <svg className="w-5 h-5 opacity-40" viewBox="0 0 24 24" fill="none">
          <rect x="6" y="6" width="12" height="12" stroke="currentColor" strokeWidth="1"/>
        </svg>
      </div>
    </motion.div>
  );
}