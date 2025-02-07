export interface Skill {
  id: string;
  name: string;
  category: 'frontend' | 'backend' | 'tools' | 'languages';
  level: 1 | 2 | 3 | 4 | 5; // 1 = beginner, 5 = expert
  iconUrl?: string;
}