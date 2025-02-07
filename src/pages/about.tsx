import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import SkillBadge from '../components/SkillBadge';
import type { Skill } from '../models/Skill';

// Sample skills data - customize with your actual skills
const skills: Skill[] = [
  {
    id: '1',
    name: 'React',
    category: 'frontend',
    level: 5,
    iconUrl: '/icons/react.svg'
  },
  {
    id: '2',
    name: 'TypeScript',
    category: 'languages',
    level: 4,
    iconUrl: '/icons/typescript.svg'
  },
  // Add more skills here
];

export default function About() {
  const { isDarkMode } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`about-container ${isDarkMode ? 'dark' : 'light'}`}
    >
      <motion.section
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="about-content"
      >
        <h1>About Me</h1>
        <p className="bio">
          Hi! I'm a passionate developer who loves creating beautiful and interactive web experiences.
          With a focus on modern web technologies and anime-inspired design, I bring creativity
          and technical expertise to every project.
        </p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="skills-section"
        >
          <h2>Skills</h2>
          <div className="skills-grid">
            {skills.map(skill => (
              <SkillBadge key={skill.id} skill={skill} />
            ))}
          </div>
        </motion.div>
      </motion.section>
    </motion.div>
  );
}