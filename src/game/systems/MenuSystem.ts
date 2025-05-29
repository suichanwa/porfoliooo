export interface MenuItem {
  id: string;
  text: string;
  color?: string;
  enabled?: boolean;
}

export type MenuType = 'main' | 'magic' | 'item' | 'settings';

export class MenuSystem {
  private currentMenu: MenuType = 'main';
  private selectedIndex: number = 0;
  private menus: Record<MenuType, MenuItem[]> = {
    main: [
      { id: 'attack', text: 'Attack', color: '#ffffff' },
      { id: 'magic', text: 'Magic', color: '#00ffff' },
      { id: 'item', text: 'Item', color: '#ffff00' },
      { id: 'defend', text: 'Defend', color: '#ffffff' }
    ],
    magic: [
      { id: 'fire', text: 'Fire Spell', color: '#ff4444' },
      { id: 'ice', text: 'Ice Spell', color: '#44aaff' },
      { id: 'heal', text: 'Heal', color: '#44ff44' },
      { id: 'back', text: 'Back', color: '#ff9999' }
    ],
    item: [
      { id: 'potion', text: 'Health Potion', color: '#ff4444' },
      { id: 'ether', text: 'Mana Potion', color: '#4444ff' },
      { id: 'back', text: 'Back', color: '#ff9999' }
    ],
    settings: [
      { id: 'sound', text: 'Sound: ON', color: '#ffffff' },
      { id: 'music', text: 'Music: ON', color: '#ffffff' },
      { id: 'difficulty', text: 'Difficulty: Normal', color: '#ffffff' },
      { id: 'back', text: 'Back', color: '#ff9999' }
    ]
  };

  getCurrentMenu(): MenuType {
    return this.currentMenu;
  }

  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  getMenuItems(): MenuItem[] {
    return this.menus[this.currentMenu];
  }

  getCurrentMenuItems(): MenuItem[] {
    return this.getMenuItems();
  }

  setSelectedIndex(index: number): void {
    const items = this.getMenuItems();
    this.selectedIndex = Math.max(0, Math.min(index, items.length - 1));
  }

  moveUp(): void {
    const items = this.getMenuItems();
    this.selectedIndex = this.selectedIndex > 0 ? this.selectedIndex - 1 : items.length - 1;
  }

  moveDown(): void {
    const items = this.getMenuItems();
    this.selectedIndex = this.selectedIndex < items.length - 1 ? this.selectedIndex + 1 : 0;
  }

  select(): void {
    const selectedItem = this.getMenuItems()[this.selectedIndex];
    
    if (selectedItem.id === 'magic' && this.currentMenu === 'main') {
      this.currentMenu = 'magic';
      this.selectedIndex = 0;
    } else if (selectedItem.id === 'item' && this.currentMenu === 'main') {
      this.currentMenu = 'item';
      this.selectedIndex = 0;
    } else if (selectedItem.id === 'back') {
      this.back();
    }
  }

  back(): void {
    if (this.currentMenu !== 'main') {
      this.currentMenu = 'main';
      this.selectedIndex = 0;
    }
  }

  reset(): void {
    this.currentMenu = 'main';
    this.selectedIndex = 0;
  }
}