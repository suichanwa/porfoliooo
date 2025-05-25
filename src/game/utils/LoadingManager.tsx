export interface LoadingTask {
  id: string;
  name: string;
  weight: number; // How much this task contributes to overall progress (1-10)
}

export class LoadingManager {
  private tasks: Map<string, LoadingTask> = new Map();
  private completedTasks: Set<string> = new Set();
  private totalWeight: number = 0;
  private completedWeight: number = 0;
  private currentTask: string = '';
  private callbacks: Set<(progress: number, currentTask: string) => void> = new Set();

  constructor() {
    this.reset();
  }

  reset() {
    this.tasks.clear();
    this.completedTasks.clear();
    this.totalWeight = 0;
    this.completedWeight = 0;
    this.currentTask = '';
  }

  addTask(task: LoadingTask) {
    this.tasks.set(task.id, task);
    this.totalWeight += task.weight;
  }

  setCurrentTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task) {
      this.currentTask = task.name;
      this.notifyProgress();
    }
  }

  completeTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (task && !this.completedTasks.has(taskId)) {
      this.completedTasks.add(taskId);
      this.completedWeight += task.weight;
      this.notifyProgress();
    }
  }

  getProgress(): number {
    if (this.totalWeight === 0) return 0;
    return Math.min(100, (this.completedWeight / this.totalWeight) * 100);
  }

  getCurrentTask(): string {
    return this.currentTask || 'Initializing...';
  }

  isComplete(): boolean {
    return this.completedTasks.size === this.tasks.size && this.tasks.size > 0;
  }

  onProgress(callback: (progress: number, currentTask: string) => void) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  private notifyProgress() {
    const progress = this.getProgress();
    const currentTask = this.getCurrentTask();
    this.callbacks.forEach(callback => callback(progress, currentTask));
  }

  // Predefined task sets for different scenes
  static createBattleSceneTasks(): LoadingTask[] {
    return [
      { id: 'background', name: 'Loading mystical backgrounds...', weight: 2 },
      { id: 'ui', name: 'Crafting user interface...', weight: 3 },
      { id: 'player', name: 'Awakening hero sprites...', weight: 2 },
      { id: 'enemies', name: 'Summoning ancient guardians...', weight: 4 },
      { id: 'buttons', name: 'Forging action buttons...', weight: 3 },
      { id: 'external', name: 'Connecting to the ruins...', weight: 2 },
      { id: 'finalize', name: 'Preparing for battle...', weight: 1 }
    ];
  }

  static createMainMenuTasks(): LoadingTask[] {
    return [
      { id: 'background', name: 'Loading ancient backgrounds...', weight: 2 },
      { id: 'buttons', name: 'Creating menu buttons...', weight: 3 },
      { id: 'ui', name: 'Setting up interface...', weight: 2 },
      { id: 'audio', name: 'Loading mystical sounds...', weight: 2 },
      { id: 'finalize', name: 'Awakening the ruins...', weight: 1 }
    ];
  }
}