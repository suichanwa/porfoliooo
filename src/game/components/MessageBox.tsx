import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface MessageBoxProps {
  message: string;
}

export default function MessageBox({ message }: MessageBoxProps) {
  const [displayedMessage, setDisplayedMessage] = useState(message);

  // Update the displayed message when the prop changes
  useEffect(() => {
    setDisplayedMessage(message);
  }, [message]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="mt-2 p-4 bg-base-200 rounded-lg border border-base-content/10 min-h-[80px] flex items-center"
      >
        <div className="w-full">
          {/* Rune decoration at top left */}
          <div className="absolute -top-1 -left-1 w-6 h-6">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-cyan-400 opacity-70">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M12 6v12M6 12h12" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          
          {/* Message text */}
          <p className="font-mono text-sm md:text-base text-base-content px-2">
            {displayedMessage || "..."}
          </p>
          
          {/* Rune decoration at bottom right */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-cyan-400 opacity-70">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}