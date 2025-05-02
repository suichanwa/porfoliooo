import { BattleAction, MagicType, ItemType, MENU_CONFIG } from '../constants.ts';

export type MenuType = 'main' | 'magic' | 'item' | 'settings';

export interface MenuItem {
  id: string;
  label: string;
  color: string;
  icon?: string;
  action?: () => void;
  disabled?: boolean;
}

export class MenuSystem {
  private currentMenu: MenuType = 'main';
  private selectedIndex: number = 0;
  private menuItems: Record<MenuType, MenuItem[]> = {
    main: [],
    magic: [],
    item: [],
    settings: []
  };
  private onSelectionChange?: (index: number) => void;
  private onMenuChange?: (menu: MenuType) => void;

  constructor() {
    // Initialize with default menu items
    this.menuItems.main = MENU_CONFIG.MAIN_ACTIONS.map(item => ({
      id: item.id,
      label: item.label,
      color: item.color,
      icon: item.id // Used for icon lookup
    }));

    this.menuItems.magic = MENU_CONFIG.MAGIC_ACTIONS.map(item => ({
      id: item.id,
      label: item.label,
      color: item.color,
      icon: item.id
    }));

    this.menuItems.item = MENU_CONFIG.ITEM_ACTIONS.map(item => ({
      id: item.id,
      label: item.label,
      color: item.color,
      icon: item.id
    }));

    // Add back option to submenu
    this.menuItems.magic.push({
      id: 'back',
      label: 'Back',
      color: '#ff9999',
      icon: 'back'
    });

    this.menuItems.item.push({
      id: 'back',
      label: 'Back',
      color: '#ff9999',
      icon: 'back'
    });

    // Settings menu
    this.menuItems.settings = [
      { id: 'sound', label: 'Sound: ON', color: '#ffffff', icon: 'sound' },
      { id: 'music', label: 'Music: ON', color: '#ffffff', icon: 'music' },
      { id: 'difficulty', label: 'Difficulty: Normal', color: '#ffffff', icon: 'difficulty' },
      { id: 'back', label: 'Back', color: '#ff9999', icon: 'back' }
    ];
  }

  public setOnSelectionChange(callback: (index: number) => void): void {
    this.onSelectionChange = callback;
  }

  public setOnMenuChange(callback: (menu: MenuType) => void): void {
    this.onMenuChange = callback;
  }

  public getCurrentMenu(): MenuType {
    return this.currentMenu;
  }

  public getSelectedIndex(): number {
    return this.selectedIndex;
  }

  // Add the missing method to set the selected index
  public setSelectedIndex(index: number): void {
    if (index >= 0 && index < this.menuItems[this.currentMenu].length) {
      this.selectedIndex = index;
      
      // Trigger the selection change callback if defined
      if (this.onSelectionChange) {
        this.onSelectionChange(this.selectedIndex);
      }
    }
  }

  public getMenuItems(): MenuItem[] {
    return this.menuItems[this.currentMenu];
  }

  public moveUp(): void {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      if (this.onSelectionChange) {
        this.onSelectionChange(this.selectedIndex);
      }
    }
  }

  public moveDown(): void {
    if (this.selectedIndex < this.menuItems[this.currentMenu].length - 1) {
      this.selectedIndex++;
      if (this.onSelectionChange) {
        this.onSelectionChange(this.selectedIndex);
      }
    }
  }

  public select(): void {
    const selectedItem = this.menuItems[this.currentMenu][this.selectedIndex];
    
    if (selectedItem.disabled) {
      return;
    }

    if (selectedItem.action) {
      selectedItem.action();
      return;
    }

    // Handle navigation between menus
    if (this.currentMenu === 'main') {
      switch (selectedItem.id) {
        case BattleAction.MAGIC:
          this.changeMenu('magic');
          break;
        case BattleAction.ITEM:
          this.changeMenu('item');
          break;
        case BattleAction.DEFEND:
          // Open settings menu when defend is selected
          this.changeMenu('settings');
          break;
      }
    } else if (selectedItem.id === 'back') {
      // Back item selected, return to main menu
      this.changeMenu('main');
    }
  }

  public back(): void {
    if (this.currentMenu !== 'main') {
      this.changeMenu('main');
    }
  }

  private changeMenu(menu: MenuType): void {
    this.currentMenu = menu;
    this.selectedIndex = 0;
    
    if (this.onMenuChange) {
      this.onMenuChange(menu);
    }
    
    if (this.onSelectionChange) {
      this.onSelectionChange(0);
    }
  }

  public setItemAction(menu: MenuType, itemId: string, action: () => void): void {
    const itemIndex = this.menuItems[menu].findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      this.menuItems[menu][itemIndex].action = action;
    }
  }

  public disableItem(menu: MenuType, itemId: string, disabled: boolean = true): void {
    const itemIndex = this.menuItems[menu].findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      this.menuItems[menu][itemIndex].disabled = disabled;
    }
  }

  public updateItemLabel(menu: MenuType, itemId: string, newLabel: string): void {
    const itemIndex = this.menuItems[menu].findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      this.menuItems[menu][itemIndex].label = newLabel;
    }
  }
}