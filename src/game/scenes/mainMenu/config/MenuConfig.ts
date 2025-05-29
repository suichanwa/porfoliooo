export const MENU_CONFIG = {
  BUTTONS: [
    { id: 'start', text: 'Start Game', variant: 'primary', y: 320 },
    { id: 'settings', text: 'Settings', variant: 'secondary', y: 380 },
    { id: 'credits', text: 'Credits', variant: 'secondary', y: 440 }
  ],
  
  DIFFICULTY_OPTIONS: ['Normal', 'Hard', 'Insane'],
  
  DIFFICULTY_COLORS: {
    'Normal': '#28a745',
    'Hard': '#ffc107', 
    'Insane': '#dc3545'
  },

  LAYOUT: {
    TITLE_Y: 200,
    SUBTITLE_Y: 250,
    DIFFICULTY_Y: 540,
    INSTRUCTION_Y: 570
  },

  STYLES: {
    TITLE: {
      fontFamily: 'serif',
      fontSize: '48px',
      color: '#ffffff',
      stroke: '#2a2a4a',
      strokeThickness: 6,
      align: 'center'
    },
    SUBTITLE: {
      fontFamily: 'serif',
      fontSize: '24px',
      color: '#aaccff',
      align: 'center'
    }
  }
} as const;