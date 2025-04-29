import { motion } from "framer-motion";
import { Skill } from "../models/Skill";

export default function SkillBadge({ skill }: { skill: Skill }) {
  return (
    <motion.div 
      className="bg-base-300 rounded-lg p-4 flex flex-col items-center shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: "0 4px 20px -5px rgba(0, 0, 0, 0.2)" 
      }}
    >
      {skill.iconUrl && (
        <div className="mb-2 w-10 h-10 flex items-center justify-center">
          <img 
            src={skill.iconUrl} 
            alt={`${skill.name} icon`} 
            className="w-8 h-8 object-contain"
          />
        </div>
      )}
      
      <span className="font-medium text-base-content mb-2">{skill.name}</span>
      
      {skill.level && (
        <div className="w-full">
          <div className="w-full bg-base-100 rounded-full h-1.5 mt-1">
            <motion.div 
              className="bg-primary h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${skill.level}%` }}
              transition={{ duration: 1, delay: 0.2 }}
            />
          </div>
          <div className="flex justify-between text-xs text-base-content/70 mt-1">
            <span>Beginner</span>
            <span>Expert</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}