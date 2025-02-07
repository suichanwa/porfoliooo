import { motion } from 'framer-motion';
import { Skill } from '../models/Skill';

interface SkillBadgeProps {
  skill: Skill;
}

export default function SkillBadge({ skill }: SkillBadgeProps) {
  return (
    <motion.div
      className="skill-badge"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.2 }}
    >
      {skill.iconUrl && (
        <img src={skill.iconUrl} alt={skill.name} className="skill-icon" />
      )}
      <span className="skill-name">{skill.name}</span>
      <div className="skill-level">
        {[...Array(5)].map((_, index) => (
          <span
            key={index}
            className={`level-dot ${index < skill.level ? 'filled' : ''}`}
          />
        ))}
      </div>
    </motion.div>
  );
}