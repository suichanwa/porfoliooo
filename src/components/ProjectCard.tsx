import { motion } from "framer-motion";
import { Project } from "../models/Project";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        scale: 1.03,
        boxShadow: "0 10px 30px -15px rgba(0, 0, 0, 0.3)" 
      }}
      className="bg-base-200 rounded-xl overflow-hidden shadow-lg"
    >
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">{project.title}</h3>
        <p className="text-base-content/80 mb-4">{project.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {project.technologies.map((tech) => (
            <span 
              key={tech} 
              className="badge badge-primary badge-outline"
            >
              {tech}
            </span>
          ))}
        </div>
        
        <div className="flex gap-2 pt-2 border-t border-base-300">
          <motion.a 
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer" 
            className="btn btn-sm btn-ghost"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            GitHub
          </motion.a>
          {project.liveUrl && (
            <motion.a 
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer" 
              className="btn btn-sm btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Live Demo
            </motion.a>
          )}
        </div>
      </div>
    </motion.div>
  );
}