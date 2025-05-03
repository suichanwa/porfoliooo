import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface DiaryEntryProps {
  title: string;
  date: string;
  content: React.ReactNode;
  mood?: string;
  coverImage?: string;
  tags?: string[];
}

export default function DiaryEntry({
  title,
  date,
  content,
  mood = "neutral",
  coverImage,
  tags = []
}: DiaryEntryProps) {
  const entryRef = useRef<HTMLDivElement>(null);
  
  // Mood emoji mapping
  const moodEmoji = {
    happy: "😊",
    sad: "😢",
    excited: "🤩",
    tired: "😴",
    neutral: "😐",
    creative: "💡",
    reflective: "🤔",
    anxious: "😰",
    peaceful: "😌"
  };
  
  // Calculate reading time based on content length
  const calculateReadingTime = () => {
    if (!entryRef.current) return "2 min";
    
    const text = entryRef.current.textContent || "";
    const wordsPerMinute = 200; // Average reading speed
    const words = text.trim().split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(words / wordsPerMinute));
    
    return `${readingTime} min read`;
  };
  
  const [readingTime, setReadingTime] = React.useState("2 min");
  
  useEffect(() => {
    setReadingTime(calculateReadingTime());
  }, [content]);
  
  return (
    <motion.article 
      className="diary-entry bg-base-200 rounded-xl shadow-lg overflow-hidden mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {coverImage && (
        <div className="diary-cover-image w-full h-64 relative">
          <img 
            src={coverImage} 
            alt={`Cover for ${title}`} 
            className="w-full h-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-base-200 to-transparent"></div>
        </div>
      )}
      
      <div className="p-8">
        <div className="flex justify-between items-center mb-4">
          <time className="text-sm text-base-content/70">{date}</time>
          <div className="flex items-center">
            <span className="text-sm mr-2">{readingTime}</span>
            <span className="text-2xl" title={`Mood: ${mood}`}>{moodEmoji[mood as keyof typeof moodEmoji] || "😐"}</span>
          </div>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold mb-4 text-primary-accent">{title}</h2>
        
        <div ref={entryRef} className="diary-content prose prose-lg max-w-none">
          {content}
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-base-300">
            {tags.map(tag => (
              <span 
                key={tag} 
                className="px-3 py-1 bg-base-300 text-sm rounded-full text-secondary-accent"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.article>
  );
}