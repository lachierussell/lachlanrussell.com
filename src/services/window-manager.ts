import type { WindowState, AppType, WindowEventDetail } from '../types/index.js';
import { getDefaultSize, getAppIcon, getAppTitle } from '../data/app-registry.js';
import { WINDOW, TASKBAR, EVENTS } from '../constants.js';
import { constrainBounds, snapPosition, snapResize } from '../utils/geometry.js';

class WindowManagerService {
  private static instance: WindowManagerService;
  
  windows: Map<string, WindowState> = new Map();
  focusedWindowId: string | null = null;
  
  private nextWindowId = 1;
  private nextZIndex = WINDOW.BASE_Z_INDEX;
  private cascadeOffset = 0;
  private basePath: string = import.meta.env.BASE_URL || '/';

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
    const x = WINDOW.INITIAL_OFFSET_X + (this.cascadeOffset % WINDOW.CASCADE_MAX) * WINDOW.CASCADE_OFFSET;
    const y = WINDOW.INITIAL_OFFSET_Y + (this.cascadeOffset % WINDOW.CASCADE_MAX) * WINDOW.CASCADE_OFFSET;
    
    this.cascadeOffset++;
    
    return { x, y };
  }

  openWindow(appType: AppType, appData?: Record<string, unknown>): WindowState {
    const id = this.generateId();
    const position = this.getCascadePosition();
    const size = getDefaultSize(appType);
    
    // Constrain window to fit viewport using geometry utilities
    const screenHeight = globalThis.innerHeight - TASKBAR.HEIGHT;
    const constrained = constrainBounds(
      { x: position.x, y: position.y, width: size.width, height: size.height },
      globalThis.innerWidth,
      screenHeight,
      WINDOW.PADDING
    );
    
    const windowState: WindowState = {
      id,
      title: getAppTitle(appType, appData),
      icon: getAppIcon(appType),
      x: constrained.x,
      y: constrained.y,
      width: constrained.width,
      height: constrained.height,
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

    // Update URL for deep linking when window opens
    this.updateUrlForWindow(windowState);

    this.emit(EVENTS.WINDOW_OPENED, { windowId: id, window: windowState });
    this.emit(EVENTS.WINDOWS_CHANGED);

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
        // Reset URL to base when no windows are open
        this.resetUrl();
      }
    }

    this.emit(EVENTS.WINDOW_CLOSED, { windowId: id });
    this.emit(EVENTS.WINDOWS_CHANGED);
  }

  /**
   * Reset the URL to the base path (desktop view)
   */
  resetUrl(): void {
    const basePath = this.basePath.replace(/\/$/, '') || '/';
    globalThis.history.replaceState({}, 'Desktop', basePath || '/');
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

    // Update URL for deep linking
    this.updateUrlForWindow(window);

    this.emit(EVENTS.WINDOW_FOCUSED, { windowId: id, window });
    this.emit(EVENTS.WINDOWS_CHANGED);
  }

  /**
   * Generate a deep link URL for a window based on its content
   * Updates browser URL without adding to history (for easy sharing)
   */
  private updateUrlForWindow(window: WindowState): void {
    const path = this.getDeepLinkPath(window);
    const fullPath = this.basePath.replace(/\/$/, '') + path;
    
    // Use replaceState to update URL without polluting browser history
    globalThis.history.replaceState(
      { windowId: window.id }, 
      window.title, 
      fullPath
    );
  }

  /**
   * Get the deep link path for a window based on its app type and data
   * Uses direct filesystem paths for file-based content
   */
  private getDeepLinkPath(window: WindowState): string {
    const { appType, appData } = window;

    switch (appType) {
      case 'file-manager':
      case 'text-viewer':
      case 'image-viewer': {
        // Use the direct filesystem path
        const path = appData?.path as string;
        return path || '/';
      }
      
      case 'terminal':
        return '/terminal';
      
      case 'calculator':
        return '/calculator';
      
      case 'clock':
        return '/clock';
      
      case 'xeyes':
        return '/xeyes';
      
      case 'browser':
        return '/browser';
      
      case 'about':
        return '/about';
      
      default:
        return '/';
    }
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

    this.emit(EVENTS.WINDOW_MINIMIZED, { windowId: id, window });
    this.emit(EVENTS.WINDOWS_CHANGED);
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
      window.height = globalThis.innerHeight - TASKBAR.HEIGHT;
      window.isMaximized = true;
    }

    this.focusWindow(id);
    this.emit(EVENTS.WINDOW_MAXIMIZED, { windowId: id, window });
    this.emit(EVENTS.WINDOWS_CHANGED);
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
    this.emit(EVENTS.WINDOW_RESTORED, { windowId: id, window });
    this.emit(EVENTS.WINDOWS_CHANGED);
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

    const screenHeight = globalThis.innerHeight - TASKBAR.HEIGHT;
    const snapped = snapPosition(
      x, y,
      window.width, window.height,
      globalThis.innerWidth, screenHeight
    );

    window.x = snapped.x;
    window.y = snapped.y;

    this.emit(EVENTS.WINDOWS_CHANGED);
  }

  resizeWindow(id: string, width: number, height: number): void {
    const window = this.windows.get(id);
    if (!window || window.isMaximized) return;

    const screenHeight = globalThis.innerHeight - TASKBAR.HEIGHT;
    const snapped = snapResize(
      window.x, window.y,
      width, height,
      globalThis.innerWidth, screenHeight
    );

    window.width = snapped.width;
    window.height = snapped.height;

    this.emit(EVENTS.WINDOWS_CHANGED);
  }

  updateWindowTitle(id: string, title: string): void {
    const window = this.windows.get(id);
    if (!window) return;
    
    window.title = title;
    this.emit(EVENTS.WINDOWS_CHANGED);
  }

  getWindows(): WindowState[] {
    return Array.from(this.windows.values());
  }

  getWindow(id: string): WindowState | undefined {
    return this.windows.get(id);
  }
}

export const windowManager = WindowManagerService.getInstance();
