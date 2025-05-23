import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface TypeWriterProps {
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
}

//no need comment

export default function TypeWriter({ 
  text, 
  speed = 50, 
  delay = 0,
  className = "" 
}: TypeWriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTyping, setStartTyping] = useState(false);

  useEffect(() => {
    // Initial delay before typing starts
    const initialDelay = setTimeout(() => {
      setStartTyping(true);
    }, delay);

    return () => clearTimeout(initialDelay);
  }, [delay]);

  useEffect(() => {
    if (!startTyping) return;
    
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed, startTyping]);

  return (
    <span className={className}>
      {displayedText}
      {currentIndex < text.length && (
        <motion.span 
          animate={{ opacity: [0, 1, 0] }} 
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="inline-block ml-0.5"
        >
          |
        </motion.span>
      )}
    </span>
  );
}