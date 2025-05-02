export interface GameSettings {
  sound: boolean;
  music: boolean;
  difficulty: 'easy' | 'normal' | 'hard';
}

export class SettingsSystem {
  private settings: GameSettings;
  private onSettingsChange?: (settings: GameSettings) => void;

  constructor() {
    // Try to load from local storage, or use defaults
    const savedSettings = localStorage.getItem('gameSettings');
    if (savedSettings) {
      try {
        this.settings = JSON.parse(savedSettings);
      } catch (e) {
        this.resetToDefaults();
      }
    } else {
      this.resetToDefaults();
    }
  }

  private resetToDefaults(): void {
    this.settings = {
      sound: true,
      music: true,
      difficulty: 'normal'
    };
    this.saveSettings();
  }

  public getSettings(): GameSettings {
    return { ...this.settings };
  }

  public toggleSound(): void {
    this.settings.sound = !this.settings.sound;
    this.saveSettings();
  }

  public toggleMusic(): void {
    this.settings.music = !this.settings.music;
    this.saveSettings();
  }

  public cycleDifficulty(): void {
    const difficulties: Array<'easy' | 'normal' | 'hard'> = ['easy', 'normal', 'hard'];
    const currentIndex = difficulties.indexOf(this.settings.difficulty);
    const nextIndex = (currentIndex + 1) % difficulties.length;
    this.settings.difficulty = difficulties[nextIndex];
    this.saveSettings();
  }

  public getSoundLabel(): string {
    return `Sound: ${this.settings.sound ? 'ON' : 'OFF'}`;
  }

  public getMusicLabel(): string {
    return `Music: ${this.settings.music ? 'ON' : 'OFF'}`;
  }

  public getDifficultyLabel(): string {
    return `Difficulty: ${this.settings.difficulty.charAt(0).toUpperCase() + this.settings.difficulty.slice(1)}`;
  }

  public setOnSettingsChange(callback: (settings: GameSettings) => void): void {
    this.onSettingsChange = callback;
  }

  private saveSettings(): void {
    localStorage.setItem('gameSettings', JSON.stringify(this.settings));
    
    if (this.onSettingsChange) {
      this.onSettingsChange(this.getSettings());
    }
  }
}