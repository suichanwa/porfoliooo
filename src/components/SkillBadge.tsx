import { Skill } from "../models/Skill";
export default function SkillBadge({ skill }: { skill: Skill }) {
  return <span className="px-2 py-1 bg-primary text-primary-content rounded-full text-sm">{skill.name}</span>;
}
