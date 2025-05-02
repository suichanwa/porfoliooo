import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

interface SettingsButtonProps {
  onClick: () => void;
}

export default function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <motion.button
      className="btn btn-circle btn-sm bg-base-300 border-base-content/20 absolute top-4 right-4 p-2"
      onClick={onClick}
      whileHover={{ scale: 1.1, rotate: 45 }}
      whileTap={{ scale: 0.9 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      aria-label="Settings"
    >
      <Settings size={18} className="text-base-content" />
    </motion.button>
  );
}