export class SettingsSystem {
  private settings = {
    sound: true,
    music: true,
    sfxVolume: 0.7,
    musicVolume: 0.5,
    difficulty: 'Normal' as 'Easy' | 'Normal' | 'Hard'
  };

  // Basic getters
  getSoundEnabled(): boolean {
    return this.settings.sound;
  }

  setSoundEnabled(enabled: boolean): void {
    this.settings.sound = enabled;
  }

  getMusicEnabled(): boolean {
    return this.settings.music;
  }

  setMusicEnabled(enabled: boolean): void {
    this.settings.music = enabled;
  }

  getSfxVolume(): number {
    return this.settings.sfxVolume;
  }

  setSfxVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  getMusicVolume(): number {
    return this.settings.musicVolume;
  }

  setMusicVolume(volume: number): void {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
  }

  getDifficulty(): string {
    return this.settings.difficulty;
  }

  setDifficulty(difficulty: 'Easy' | 'Normal' | 'Hard'): void {
    this.settings.difficulty = difficulty;
  }

  // Methods that SettingsPanel expects
  getSoundLabel(): string {
    return `Sound: ${this.settings.sound ? 'ON' : 'OFF'}`;
  }

  getMusicLabel(): string {
    return `Music: ${this.settings.music ? 'ON' : 'OFF'}`;
  }

  getDifficultyLabel(): string {
    return `Difficulty: ${this.settings.difficulty}`;
  }

  // Toggle methods
  toggleSound(): void {
    this.settings.sound = !this.settings.sound;
  }

  toggleMusic(): void {
    this.settings.music = !this.settings.music;
  }

  cycleDifficulty(): void {
    const difficulties: ('Easy' | 'Normal' | 'Hard')[] = ['Easy', 'Normal', 'Hard'];
    const currentIndex = difficulties.indexOf(this.settings.difficulty);
    const nextIndex = (currentIndex + 1) % difficulties.length;
    this.settings.difficulty = difficulties[nextIndex];
  }

  // Get all settings
  getSettings() {
    return { ...this.settings };
  }

  getAllSettings() {
    return { ...this.settings };
  }

  resetToDefaults(): void {
    this.settings = {
      sound: true,
      music: true,
      sfxVolume: 0.7,
      musicVolume: 0.5,
      difficulty: 'Normal'
    };
  }
}