import type { WindowState, AppType, WindowEventDetail } from '../types/index.js';

class WindowManagerService {
  private static instance: WindowManagerService;
  
  windows: Map<string, WindowState> = new Map();
  focusedWindowId: string | null = null;
  
  private nextWindowId = 1;
  private nextZIndex = 100;
  private cascadeOffset = 0;

  private constructor() {}

  static getInstance(): WindowManagerService {
    if (!WindowManagerService.instance) {
      WindowManagerService.instance = new WindowManagerService();
    }
    return WindowManagerService.instance;
  }

  private emit(eventName: string, detail?: WindowEventDetail | void): void {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  private generateId(): string {
    return `window-${this.nextWindowId++}`;
  }

  getNextZIndex(): number {
    return this.nextZIndex++;
  }

  private getCascadePosition(): { x: number; y: number } {
    const baseX = 50;
    const baseY = 50;
    const offset = 30;
    const maxCascade = 10;

    const x = baseX + (this.cascadeOffset % maxCascade) * offset;
    const y = baseY + (this.cascadeOffset % maxCascade) * offset;
    
    this.cascadeOffset++;
    
    return { x, y };
  }

  private getDefaultSize(appType: AppType): { width: number; height: number } {
    switch (appType) {
      case 'file-manager':
        return { width: 500, height: 400 };
      case 'text-viewer':
        return { width: 550, height: 450 };
      case 'image-viewer':
        return { width: 600, height: 500 };
      case 'about':
        return { width: 400, height: 300 };
      case 'clock':
        return { width: 200, height: 240 };
      case 'calculator':
        return { width: 220, height: 320 };
      case 'terminal':
        return { width: 600, height: 400 };
      case 'xeyes':
        return { width: 220, height: 180 };
      default:
        return { width: 400, height: 300 };
    }
  }

  private getAppIcon(appType: AppType): string {
    switch (appType) {
      case 'file-manager':
        return '📁';
      case 'text-viewer':
        return '📄';
      case 'image-viewer':
        return '🖼️';
      case 'about':
        return 'ℹ️';
      case 'clock':
        return '🕐';
      case 'calculator':
        return '🔢';
      case 'terminal':
        return '💻';
      case 'xeyes':
        return '👀';
      default:
        return '📋';
    }
  }

  private getAppTitle(appType: AppType, appData?: Record<string, unknown>): string {
    const name = appData?.name as string | undefined;
    const path = appData?.path as string | undefined;
    
    switch (appType) {
      case 'file-manager':
        return `File Manager - ${path || '/'}`;
      case 'text-viewer':
        return name || 'Text Viewer';
      case 'image-viewer':
        return name || 'Image Viewer';
      case 'about':
        return 'About';
      case 'clock':
        return 'xclock';
      case 'calculator':
        return 'xcalc';
      case 'terminal':
        return 'xterm';
      case 'xeyes':
        return 'xeyes';
      default:
        return 'Window';
    }
  }

  openWindow(appType: AppType, appData?: Record<string, unknown>): WindowState {
    const id = this.generateId();
    const position = this.getCascadePosition();
    const size = this.getDefaultSize(appType);
    
    const windowState: WindowState = {
      id,
      title: this.getAppTitle(appType, appData),
      icon: this.getAppIcon(appType),
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
      zIndex: this.getNextZIndex(),
      isMinimized: false,
      isMaximized: false,
      isFocused: true,
      appType,
      appData,
    };

    // Unfocus all other windows
    for (const win of this.windows.values()) {
      win.isFocused = false;
    }

    this.windows.set(id, windowState);
    this.focusedWindowId = id;

    this.emit('window-opened', { windowId: id, window: windowState });
    this.emit('windows-changed');

    return windowState;
  }

  closeWindow(id: string): void {
    const window = this.windows.get(id);
    if (!window) return;

    this.windows.delete(id);

    if (this.focusedWindowId === id) {
      // Focus the next highest z-index window
      const remainingWindows = Array.from(this.windows.values())
        .filter(w => !w.isMinimized)
        .sort((a, b) => b.zIndex - a.zIndex);
      
      if (remainingWindows.length > 0) {
        this.focusWindow(remainingWindows[0].id);
      } else {
        this.focusedWindowId = null;
      }
    }

    this.emit('window-closed', { windowId: id });
    this.emit('windows-changed');
  }

  focusWindow(id: string): void {
    const window = this.windows.get(id);
    if (!window) return;

    // Unfocus all windows
    for (const win of this.windows.values()) {
      win.isFocused = false;
    }

    // Focus and bring to front
    window.isFocused = true;
    window.zIndex = this.getNextZIndex();
    window.isMinimized = false;
    this.focusedWindowId = id;

    this.emit('window-focused', { windowId: id, window });
    this.emit('windows-changed');
  }

  minimizeWindow(id: string): void {
    const window = this.windows.get(id);
    if (!window) return;

    window.isMinimized = true;
    window.isFocused = false;

    if (this.focusedWindowId === id) {
      // Focus next available window
      const visibleWindows = Array.from(this.windows.values())
        .filter(w => !w.isMinimized && w.id !== id)
        .sort((a, b) => b.zIndex - a.zIndex);
      
      if (visibleWindows.length > 0) {
        this.focusWindow(visibleWindows[0].id);
      } else {
        this.focusedWindowId = null;
      }
    }

    this.emit('window-minimized', { windowId: id, window });
    this.emit('windows-changed');
  }

  maximizeWindow(id: string): void {
    const window = this.windows.get(id);
    if (!window) return;

    if (!window.isMaximized) {
      // Store original position/size for restore
      window.appData = {
        ...window.appData,
        _restoreState: {
          x: window.x,
          y: window.y,
          width: window.width,
          height: window.height,
        },
      };
      
      window.x = 0;
      window.y = 0;
      window.width = globalThis.innerWidth;
      window.height = globalThis.innerHeight - 32; // Account for taskbar
      window.isMaximized = true;
    }

    this.focusWindow(id);
    this.emit('window-maximized', { windowId: id, window });
    this.emit('windows-changed');
  }

  restoreWindow(id: string): void {
    const window = this.windows.get(id);
    if (!window) return;

    if (window.isMaximized && window.appData?._restoreState) {
      const restore = window.appData._restoreState as {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      window.x = restore.x;
      window.y = restore.y;
      window.width = restore.width;
      window.height = restore.height;
      window.isMaximized = false;
    }

    window.isMinimized = false;
    this.focusWindow(id);
    this.emit('window-restored', { windowId: id, window });
    this.emit('windows-changed');
  }

  toggleMaximize(id: string): void {
    const window = this.windows.get(id);
    if (!window) return;

    if (window.isMaximized) {
      this.restoreWindow(id);
    } else {
      this.maximizeWindow(id);
    }
  }

  moveWindow(id: string, x: number, y: number): void {
    const window = this.windows.get(id);
    if (!window || window.isMaximized) return;

    // Snap to edges (within 15px)
    const snapThreshold = 15;
    const taskbarHeight = 28;
    const screenWidth = globalThis.innerWidth;
    const screenHeight = globalThis.innerHeight - taskbarHeight;

    let snappedX = x;
    let snappedY = y;

    // Snap to left edge
    if (x < snapThreshold) {
      snappedX = 0;
    }
    // Snap to right edge
    if (x + window.width > screenWidth - snapThreshold) {
      snappedX = screenWidth - window.width;
    }
    // Snap to top edge
    if (y < snapThreshold) {
      snappedY = 0;
    }
    // Snap to bottom edge
    if (y + window.height > screenHeight - snapThreshold) {
      snappedY = screenHeight - window.height;
    }

    window.x = Math.max(0, snappedX);
    window.y = Math.max(0, snappedY);

    this.emit('windows-changed');
  }

  resizeWindow(id: string, width: number, height: number): void {
    const window = this.windows.get(id);
    if (!window || window.isMaximized) return;

    // Snap resize to screen edges
    const snapThreshold = 15;
    const taskbarHeight = 28;
    const screenWidth = globalThis.innerWidth;
    const screenHeight = globalThis.innerHeight - taskbarHeight;

    let snappedWidth = Math.max(200, width);
    let snappedHeight = Math.max(150, height);

    // Snap width to right edge
    if (window.x + width > screenWidth - snapThreshold) {
      snappedWidth = screenWidth - window.x;
    }
    // Snap height to bottom edge  
    if (window.y + height > screenHeight - snapThreshold) {
      snappedHeight = screenHeight - window.y;
    }

    window.width = snappedWidth;
    window.height = snappedHeight;

    this.emit('windows-changed');
  }

  updateWindowTitle(id: string, title: string): void {
    const window = this.windows.get(id);
    if (!window) return;
    
    window.title = title;
    this.emit('windows-changed');
  }

  getWindows(): WindowState[] {
    return Array.from(this.windows.values());
  }

  getWindow(id: string): WindowState | undefined {
    return this.windows.get(id);
  }
}

export const windowManager = WindowManagerService.getInstance();
