import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import type { FileSystemNode, AppType } from '../../types/index.js';
import { fileSystemService } from '../../services/file-system.js';
import { windowManager } from '../../services/window-manager.js';
import { openNode, openNodeById } from '../../services/file-opener.js';
import { getDesktopMenuItems, APP_REGISTRY } from '../../data/app-registry.js';
import { getNodeIcon } from '../../data/file-icons.js';
import { DESKTOP_ICON, TASKBAR, TIMING } from '../../constants.js';
import { isMobile } from '../../utils/device.js';
import './x-desktop-icon.js';
import './x-taskbar.js';
import '../window/x-window-container.js';
import '../shared/x-context-menu.js';
import type { XContextMenu, MenuItem } from '../shared/x-context-menu.js';

interface DesktopIconPosition {
  nodeId: string;
  x: number;
  y: number;
}

@customElement('x-desktop')
export class XDesktop extends LitElement {
  @state() private desktopItems: FileSystemNode[] = [];
  @state() private iconPositions: Map<string, DesktopIconPosition> = new Map();
  @state() private selectedIconId: string | null = null;
  @state() private contextMenuItems: MenuItem[] = [];

  @query('x-context-menu') private contextMenu!: XContextMenu;

  static styles = css`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      height: 100dvh; /* Dynamic viewport height for mobile */
      overflow: hidden;
      position: fixed;
      top: 0;
      left: 0;
      touch-action: none; /* Prevent default touch behaviors */
    }

    .desktop {
      width: 100%;
      height: 100%;
      /* Classic X11 root window weave/stipple pattern */
      background-color: var(--x11-bg, #708090);
      background-image: url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='1' height='1' fill='%235a6a7a'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%235a6a7a'/%3E%3C/svg%3E");
      background-repeat: repeat;
      overflow: hidden;
    }

    .icons-area {
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      bottom: 36px;
      pointer-events: none;
      overflow: hidden;
    }

    .icons-area > * {
      pointer-events: auto;
    }

    x-window-container {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      overflow: hidden;
    }

    /* FVWM doesn't have a traditional taskbar - we keep a minimal one */
    x-taskbar {
      height: 24px;
    }

    /* Mobile adjustments */
    @media (max-width: 767px) {
      .icons-area {
        top: 8px;
        left: 8px;
        right: 8px;
        bottom: 32px;
      }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadDesktopItems();
    this.addEventListener('click', this.handleDesktopClick);
    this.addEventListener('contextmenu', this.handleContextMenu);
    document.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('resize', this.handleResize);
    
    // Check if we have a deep-link URL to handle
    const hasDeepLink = this.checkForDeepLink();
    
    // Open startup windows
    setTimeout(() => {
      this.openStartupWindows(hasDeepLink);
    }, TIMING.STARTUP_DELAY);
  }

  /**
   * Open initial windows on startup - extracted for clarity
   */
  private openStartupWindows(hasDeepLink: boolean): void {
    const mobile = isMobile();
    
    // Clock window
    const clockWindow = windowManager.openWindow('clock', {});
    if (mobile) {
      windowManager.moveWindow(clockWindow.id, 10, 10);
      windowManager.resizeWindow(clockWindow.id, 180, 220);
    } else {
      windowManager.moveWindow(clockWindow.id, 50, 50);
    }

    // XEyes - desktop only (doesn't work well on mobile/touch)
    if (!mobile) {
      const eyesWindow = windowManager.openWindow('xeyes', {});
      windowManager.moveWindow(eyesWindow.id, 50, 320);
    }
    
    // About file - only if no deep link
    if (!hasDeepLink) {
      this.openAboutWindow(mobile);
    }
  }

  /**
   * Open the about/welcome window
   */
  private openAboutWindow(mobile: boolean): void {
    const aboutNode = fileSystemService.getNode('/about.txt');
    const readmeWindow = windowManager.openWindow('text-viewer', {
      path: aboutNode?.path || '/about.txt',
      name: aboutNode?.name || 'about.txt',
      content: aboutNode?.content || 'Welcome! Right-click to open apps.',
    });
    
    if (mobile) {
      const mobileWidth = Math.min(window.innerWidth - 20, 350);
      const mobileHeight = Math.min(window.innerHeight - 320, 350);
      windowManager.moveWindow(readmeWindow.id, 10, 280);
      windowManager.resizeWindow(readmeWindow.id, mobileWidth, mobileHeight);
    } else {
      windowManager.moveWindow(readmeWindow.id, 280, 120);
    }
  }

  /**
   * Check if the current URL is a deep link to a file/folder and handle it
   * Returns true if a deep link was found and handled
   */
  private checkForDeepLink(): boolean {
    const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    let pathname = window.location.pathname;
    
    // Strip base path
    if (basePath && pathname.startsWith(basePath)) {
      pathname = pathname.slice(basePath.length) || '/';
    }
    
    // If we're at root, no deep link
    if (pathname === '/' || pathname === '') {
      return false;
    }

    // Normalize path - remove trailing slashes except for root
    const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
    
    // Look up the node directly
    const node = fileSystemService.getNode(normalizedPath);
    
    if (!node) {
      return false;
    }

    // Open the file/folder after a short delay to let the desktop initialize
    setTimeout(() => {
      openNode(node);
    }, TIMING.DEEP_LINK_DELAY);
    
    return true;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this.handleDesktopClick);
    this.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('resize', this.handleResize);
  }

  private handleResize = (): void => {
    // Recalculate icon positions
    this.calculateIconPositions();
    
    // Adjust windows to stay within bounds
    const windows = windowManager.getWindows();
    const maxX = window.innerWidth;
    const maxY = window.innerHeight - TASKBAR.HEIGHT;
    
    windows.forEach(win => {
      let needsMove = false;
      let newX = win.x;
      let newY = win.y;
      let newWidth = win.width;
      let newHeight = win.height;
      
      // Ensure window fits horizontally
      if (win.width > maxX - 20) {
        newWidth = maxX - 20;
        windowManager.resizeWindow(win.id, newWidth, win.height);
      }
      
      // Ensure window fits vertically
      if (win.height > maxY - 20) {
        newHeight = maxY - 20;
        windowManager.resizeWindow(win.id, newWidth, newHeight);
      }
      
      // Ensure window is visible (at least titlebar)
      if (win.x + win.width > maxX) {
        newX = Math.max(0, maxX - newWidth - 10);
        needsMove = true;
      }
      
      if (win.y + 30 > maxY) { // At least titlebar visible
        newY = Math.max(0, maxY - newHeight - 10);
        needsMove = true;
      }
      
      if (needsMove) {
        windowManager.moveWindow(win.id, newX, newY);
      }
    });
    
    this.requestUpdate();
  };

  private loadDesktopItems(): void {
    const items = fileSystemService.getRootItems();
    
    // Sort: folders first, then files, each group alphabetically
    this.desktopItems = items.sort((a, b) => {
      // Folders before files
      if (a.type === 'folder' && b.type !== 'folder') return -1;
      if (a.type !== 'folder' && b.type === 'folder') return 1;
      // Alphabetically within each type
      return a.name.localeCompare(b.name);
    });
    
    this.calculateIconPositions();
  }

  private calculateIconPositions(): void {
    const mobile = isMobile();
    const iconWidth = mobile ? DESKTOP_ICON.WIDTH_MOBILE : DESKTOP_ICON.WIDTH;
    const iconHeight = mobile ? DESKTOP_ICON.HEIGHT_MOBILE : DESKTOP_ICON.HEIGHT;
    const paddingRight = mobile ? DESKTOP_ICON.PADDING_RIGHT_MOBILE : DESKTOP_ICON.PADDING_RIGHT;
    const paddingTop = mobile ? DESKTOP_ICON.PADDING_TOP_MOBILE : DESKTOP_ICON.PADDING_TOP;
    
    // Start from top-right, flow down then to the left
    const startX = window.innerWidth - iconWidth - paddingRight;
    const startY = paddingTop;
    const maxHeight = window.innerHeight - TASKBAR.HEIGHT - paddingTop;

    let currentX = startX;
    let currentY = startY;

    this.desktopItems.forEach((item) => {
      this.iconPositions.set(item.id, {
        nodeId: item.id,
        x: currentX,
        y: currentY,
      });

      currentY += iconHeight;
      // If we've gone past the bottom, move to next column (to the left)
      if (currentY + iconHeight > maxHeight) {
        currentY = startY;
        currentX -= iconWidth;
      }
    });
  }

  private handleDesktopClick = (e: MouseEvent): void => {
    // Deselect when clicking on desktop background
    const target = e.target as HTMLElement;
    if (target === this || target.classList.contains('desktop')) {
      this.selectedIconId = null;
    }
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    // Don't handle if typing in an input
    if ((e.target as HTMLElement).tagName === 'INPUT' || 
        (e.target as HTMLElement).tagName === 'TEXTAREA') {
      return;
    }

    const focusedWindow = windowManager.focusedWindowId 
      ? windowManager.getWindow(windowManager.focusedWindowId) 
      : null;

    // Global keyboard shortcuts
    switch (e.key) {
      case 'Escape':
        // Close context menu or deselect
        this.contextMenu?.hide();
        this.selectedIconId = null;
        break;

      case 'Enter':
        // Open selected icon
        if (this.selectedIconId) {
          const node = fileSystemService.getNodeById(this.selectedIconId);
          if (node) {
            openNode(node);
          }
        }
        break;

      case 'Delete':
        // Close focused window
        if (focusedWindow) {
          windowManager.closeWindow(focusedWindow.id);
        }
        break;

      case 'Tab':
        // Cycle through windows (Alt+Tab style)
        if (e.altKey) {
          e.preventDefault();
          this.cycleWindows(e.shiftKey ? -1 : 1);
        }
        break;

      case 'F4':
        // Alt+F4 close window
        if (e.altKey && focusedWindow) {
          e.preventDefault();
          windowManager.closeWindow(focusedWindow.id);
        }
        break;

      case 'F5':
        // Refresh desktop
        e.preventDefault();
        this.loadDesktopItems();
        break;

      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        // Navigate desktop icons
        if (!focusedWindow || e.altKey) {
          e.preventDefault();
          this.navigateIcons(e.key);
        }
        break;

      case 'n':
      case 'N':
        // Ctrl+N: New file manager window
        if (e.ctrlKey) {
          e.preventDefault();
          windowManager.openWindow('file-manager', { path: '/', name: 'Root' });
        }
        break;

      case 'm':
      case 'M':
        // Minimize focused window
        if (e.altKey && focusedWindow) {
          e.preventDefault();
          windowManager.minimizeWindow(focusedWindow.id);
        }
        break;

      case 'x':
      case 'X':
        // Alt+X: Maximize/restore focused window
        if (e.altKey && focusedWindow) {
          e.preventDefault();
          windowManager.toggleMaximize(focusedWindow.id);
        }
        break;
    }
  };

  private cycleWindows(direction: number): void {
    const windows = windowManager.getWindows();
    if (windows.length === 0) return;

    const currentIndex = windows.findIndex(w => w.id === windowManager.focusedWindowId);
    let nextIndex = currentIndex + direction;
    
    if (nextIndex < 0) nextIndex = windows.length - 1;
    if (nextIndex >= windows.length) nextIndex = 0;

    windowManager.focusWindow(windows[nextIndex].id);
  }

  private navigateIcons(key: string): void {
    const iconIds = this.desktopItems.map(item => item.id);
    if (iconIds.length === 0) return;

    if (!this.selectedIconId) {
      this.selectedIconId = iconIds[0];
      return;
    }

    const currentIndex = iconIds.indexOf(this.selectedIconId);
    let nextIndex = currentIndex;

    // Simple vertical navigation (icons are arranged in columns)
    switch (key) {
      case 'ArrowUp':
        nextIndex = Math.max(0, currentIndex - 1);
        break;
      case 'ArrowDown':
        nextIndex = Math.min(iconIds.length - 1, currentIndex + 1);
        break;
      case 'ArrowLeft':
        nextIndex = Math.max(0, currentIndex - 5); // Jump ~5 icons (one column)
        break;
      case 'ArrowRight':
        nextIndex = Math.min(iconIds.length - 1, currentIndex + 5);
        break;
    }

    this.selectedIconId = iconIds[nextIndex];
  }

  private handleContextMenu = (e: MouseEvent): void => {
    e.preventDefault();
    
    const target = e.target as HTMLElement;
    const isDesktopClick = target === this || 
                           target.classList.contains('desktop') || 
                           target.classList.contains('icons-area');

    if (isDesktopClick) {
      // Desktop context menu - derived from app registry
      this.contextMenuItems = getDesktopMenuItems();
    } else {
      // Check if clicking on an icon
      const iconEl = target.closest('x-desktop-icon');
      if (iconEl) {
        const nodeId = (iconEl as HTMLElement & { nodeId: string }).nodeId;
        this.selectedIconId = nodeId;
        const node = fileSystemService.getNodeById(nodeId);
        
        const openIcon = node?.type === 'folder' ? '📂' : '📄';
        this.contextMenuItems = [
          { id: 'open', label: 'Open', icon: openIcon },
          { id: 'separator-1', label: '', separator: true },
          { id: 'properties', label: 'Properties', icon: '📋' },
        ];
      } else {
        return; // Don't show menu for other elements
      }
    }

    this.contextMenu?.show(e.clientX, e.clientY, this.contextMenuItems);
  };

  private handleMenuSelect(e: CustomEvent): void {
    const { itemId } = e.detail;
    
    // Handle special menu items
    switch (itemId) {
      case 'refresh':
        this.loadDesktopItems();
        return;
      case 'about':
        const aboutNode = fileSystemService.getNode('/about.txt');
        if (aboutNode) {
          windowManager.openWindow('text-viewer', {
            path: aboutNode.path,
            name: aboutNode.name,
            content: aboutNode.content,
          });
        }
        return;
      case 'open':
        if (this.selectedIconId) {
          openNodeById(this.selectedIconId);
        }
        return;
      case 'properties':
        // TODO: Implement properties dialog
        return;
    }
    
    // Handle app launches from registry
    if (itemId in APP_REGISTRY) {
      const appType = itemId as AppType;
      const defaultData: Record<string, unknown> = {};
      
      // Special default data for certain apps
      if (appType === 'file-manager') {
        defaultData.path = '/';
        defaultData.name = 'Root';
      } else if (appType === 'browser') {
        defaultData.url = 'https://en.wikipedia.org/wiki/Main_Page';
      }
      
      windowManager.openWindow(appType, defaultData);
    }
  }

  private handleIconClick(e: CustomEvent): void {
    const { nodeId } = e.detail;
    this.selectedIconId = nodeId;
  }

  private handleIconMove(e: CustomEvent): void {
    const { nodeId, x, y } = e.detail;
    const pos = this.iconPositions.get(nodeId);
    if (pos) {
      this.iconPositions.set(nodeId, { ...pos, x, y });
      this.requestUpdate();
    }
  }

  private handleIconDoubleClick(e: CustomEvent): void {
    openNodeById(e.detail.nodeId);
  }

  private getItemIcon(item: FileSystemNode): string {
    return getNodeIcon(item);
  }

  render() {
    return html`
      <div class="desktop">
        <div class="icons-area">
          ${this.desktopItems.map(item => {
            const pos = this.iconPositions.get(item.id);
            return html`
              <x-desktop-icon
                .nodeId=${item.id}
                .name=${item.name}
                .icon=${this.getItemIcon(item)}
                .type=${item.type}
                .x=${pos?.x ?? 0}
                .y=${pos?.y ?? 0}
                ?selected=${this.selectedIconId === item.id}
                @icon-click=${this.handleIconClick}
                @icon-dblclick=${this.handleIconDoubleClick}
                @icon-move=${this.handleIconMove}
              ></x-desktop-icon>
            `;
          })}
        </div>

        <x-window-container></x-window-container>
        <x-taskbar></x-taskbar>
        <x-context-menu 
          @menu-select=${this.handleMenuSelect}
        ></x-context-menu>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-desktop': XDesktop;
  }
}
