import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import ProjectCard from '../components/ProjectCard';
import type { Project } from '../models/Project';

// Sample projects data - you can replace with your actual projects
const projects: Project[] = [
  {
    id: '1',
    title: 'Anime Portfolio',
    description: 'A personal portfolio website with anime-inspired design',
    technologies: ['React', 'TypeScript', 'Three.js', 'Framer Motion'],
    imageUrl: '/path-to-your-image.jpg',
    githubUrl: 'https://github.com/yourusername/portfolio',
    liveUrl: 'https://your-portfolio.com'
  },
  // Add more projects here
];

export default function Projects() {
  const { isDarkMode } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`projects-container ${isDarkMode ? 'dark' : 'light'}`}
    >
      <h1>My Projects</h1>
      <div className="projects-grid">
        {projects.map(project => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </motion.div>
  );
}