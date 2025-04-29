import { Project } from "../models/Project";
export default function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="p-4 bg-base-200 rounded-lg shadow hover:shadow-lg transition">
      <h3 className="font-semibold">{project.title}</h3>
      <p className="mt-1 text-sm">{project.description}</p>
    </div>
  );
}
