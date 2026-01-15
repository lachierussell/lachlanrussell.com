import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import type { FileSystemNode } from '../../types/index.js';
import { fileSystemService } from '../../services/file-system.js';
import { windowManager } from '../../services/window-manager.js';
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
      overflow: hidden;
      position: relative;
    }

    .desktop {
      width: 100%;
      height: 100%;
      /* Classic X11 root window weave/stipple pattern */
      background-color: var(--x11-bg, #708090);
      background-image: url("data:image/svg+xml,%3Csvg width='4' height='4' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='1' height='1' fill='%235a6a7a'/%3E%3Crect x='2' y='2' width='1' height='1' fill='%235a6a7a'/%3E%3C/svg%3E");
      background-repeat: repeat;
    }

    .icons-area {
      position: absolute;
      top: 12px;
      left: 12px;
      right: 12px;
      bottom: 36px;
      pointer-events: none;
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
    }

    /* FVWM doesn't have a traditional taskbar - we keep a minimal one */
    x-taskbar {
      height: 24px;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadDesktopItems();
    this.addEventListener('click', this.handleDesktopClick);
    this.addEventListener('contextmenu', this.handleContextMenu);
    document.addEventListener('keydown', this.handleKeyDown);
    
    // Open clock on startup in top-left corner
    setTimeout(() => {
      const clockWindow = windowManager.openWindow('clock', {});
      // Position in top-left corner
      windowManager.moveWindow(clockWindow.id, 50, 50);

      // Open xeyes below the clock
      const eyesWindow = windowManager.openWindow('xeyes', {});
      windowManager.moveWindow(eyesWindow.id, 50, 320);
      
      // Open README on startup
      const readmeContent = `Welcome to lachlanrussell.com
=============================

This website emulates a classic Unix desktop environment
inspired by OpenBSD and the FVWM window manager.

GETTING STARTED
---------------
• Right-click anywhere on the desktop to open the app menu
• Double-click icons on the right to open files and folders
• Drag window title bars to move windows
• Drag window edges to resize windows

AVAILABLE APPS
--------------
• XTerm      - Terminal emulator (try 'help' command)
• File Manager - Browse the virtual filesystem
• Web Browser - Browse websites (some sites may not load)
• XClock     - Clock showing Melbourne time
• XCalc      - Calculator
• XEyes      - Eyes that follow your cursor

KEYBOARD SHORTCUTS
------------------
Alt+Tab     - Cycle through windows
Alt+F4      - Close window
Alt+M       - Minimize window
Alt+X       - Maximize/restore window
Ctrl+N      - New file manager
Escape      - Close menu / deselect

Enjoy exploring!`;

      const readmeWindow = windowManager.openWindow('text-viewer', {
        path: '/readme.txt',
        name: 'README.txt',
        content: readmeContent,
      });
      // Position README to the right of the clock, slightly lower
      windowManager.moveWindow(readmeWindow.id, 280, 100);
    }, 100);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('click', this.handleDesktopClick);
    this.removeEventListener('contextmenu', this.handleContextMenu);
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  private loadDesktopItems(): void {
    this.desktopItems = fileSystemService.getRootItems();
    this.calculateIconPositions();
  }

  private calculateIconPositions(): void {
    const iconWidth = 80;
    const iconHeight = 75;
    const paddingRight = 20;
    const paddingTop = 20;
    const taskbarHeight = 30;
    
    // Start from top-right, flow down then to the left
    const startX = window.innerWidth - iconWidth - paddingRight;
    const startY = paddingTop;
    const maxHeight = window.innerHeight - taskbarHeight - paddingTop;

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
            this.openNode(node);
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
      // Desktop context menu - FVWM style with apps
      this.contextMenuItems = [
        { id: 'terminal', label: 'XTerm', icon: '💻' },
        { id: 'file-manager', label: 'File Manager', icon: '📁' },
        { id: 'browser', label: 'Web Browser', icon: '🌐' },
        { id: 'separator-1', label: '', separator: true },
        { id: 'clock', label: 'XClock', icon: '🕐' },
        { id: 'calculator', label: 'XCalc', icon: '🔢' },
        { id: 'xeyes', label: 'XEyes', icon: '👀' },
        { id: 'separator-2', label: '', separator: true },
        { id: 'refresh', label: 'Refresh', icon: '🔄' },
        { id: 'about', label: 'About', icon: 'ℹ️' },
      ];
    } else {
      // Check if clicking on an icon
      const iconEl = target.closest('x-desktop-icon');
      if (iconEl) {
        const nodeId = (iconEl as HTMLElement & { nodeId: string }).nodeId;
        this.selectedIconId = nodeId;
        const node = fileSystemService.getNodeById(nodeId);
        
        if (node?.type === 'folder') {
          this.contextMenuItems = [
            { id: 'open', label: 'Open', icon: '📂' },
            { id: 'separator-1', label: '', separator: true },
            { id: 'properties', label: 'Properties', icon: '📋' },
          ];
        } else {
          this.contextMenuItems = [
            { id: 'open', label: 'Open', icon: '📄' },
            { id: 'separator-1', label: '', separator: true },
            { id: 'properties', label: 'Properties', icon: '📋' },
          ];
        }
      } else {
        return; // Don't show menu for other elements
      }
    }

    this.contextMenu?.show(e.clientX, e.clientY, this.contextMenuItems);
  };

  private handleMenuSelect(e: CustomEvent): void {
    const { itemId } = e.detail;
    
    switch (itemId) {
      case 'file-manager':
        windowManager.openWindow('file-manager', { path: '/', name: 'Root' });
        break;
      case 'terminal':
        windowManager.openWindow('terminal', {});
        break;
      case 'clock':
        windowManager.openWindow('clock', {});
        break;
      case 'calculator':
        windowManager.openWindow('calculator', {});
        break;
      case 'xeyes':
        windowManager.openWindow('xeyes', {});
        break;
      case 'browser':
        windowManager.openWindow('browser', { url: 'https://en.wikipedia.org/wiki/Main_Page' });
        break;
      case 'refresh':
        this.loadDesktopItems();
        break;
      case 'about':
        const aboutNode = fileSystemService.getNode('/about.txt');
        if (aboutNode) {
          windowManager.openWindow('text-viewer', {
            path: aboutNode.path,
            name: aboutNode.name,
            content: aboutNode.content,
          });
        }
        break;
      case 'open':
        if (this.selectedIconId) {
          const node = fileSystemService.getNodeById(this.selectedIconId);
          if (node) {
            this.openNode(node);
          }
        }
        break;
      case 'properties':
        // TODO: Implement properties dialog
        break;
    }
  }

  private openNode(node: FileSystemNode): void {
    if (node.type === 'folder') {
      windowManager.openWindow('file-manager', {
        path: node.path,
        name: node.name,
      });
    } else {
      const fileType = fileSystemService.getFileType(node);
      switch (fileType) {
        case 'text':
          windowManager.openWindow('text-viewer', {
            path: node.path,
            name: node.name,
            content: node.content,
          });
          break;
        case 'image':
          windowManager.openWindow('image-viewer', {
            path: node.path,
            name: node.name,
            src: node.content,
          });
          break;
        default:
          windowManager.openWindow('text-viewer', {
            path: node.path,
            name: node.name,
            content: node.content || 'Unable to display this file type.',
          });
      }
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
    const { nodeId, type } = e.detail;
    const node = fileSystemService.getNodeById(nodeId);
    
    if (!node) return;

    if (type === 'folder') {
      windowManager.openWindow('file-manager', {
        path: node.path,
        name: node.name,
      });
    } else {
      const fileType = fileSystemService.getFileType(node);
      
      switch (fileType) {
        case 'text':
          windowManager.openWindow('text-viewer', {
            path: node.path,
            name: node.name,
            content: node.content,
          });
          break;
        case 'image':
          windowManager.openWindow('image-viewer', {
            path: node.path,
            name: node.name,
            src: node.content,
          });
          break;
        default:
          // Try to open as text
          windowManager.openWindow('text-viewer', {
            path: node.path,
            name: node.name,
            content: node.content || 'Unable to display this file type.',
          });
      }
    }
  }

  private getItemIcon(item: FileSystemNode): string {
    if (item.icon) return item.icon;
    if (item.type === 'folder') return '📁';
    
    const ext = item.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'txt':
      case 'md':
        return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📄';
    }
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
