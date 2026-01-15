// X Window System Types

export type FileType = 'file' | 'folder';
export type AppType = 'file-manager' | 'text-viewer' | 'image-viewer' | 'about' | 'clock' | 'calculator' | 'terminal' | 'xeyes';
export type ViewerType = 'text' | 'image' | 'folder' | 'unknown';

export interface FileSystemNode {
  id: string;
  name: string;
  type: FileType;
  path: string;
  parentId: string | null;
  children?: string[]; // IDs of child nodes
  content?: string; // For text files
  mimeType?: string;
  icon?: string;
  createdAt: Date;
  modifiedAt: Date;
}

export interface WindowState {
  id: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  isMinimized: boolean;
  isMaximized: boolean;
  isFocused: boolean;
  appType: AppType;
  appData?: Record<string, unknown>;
}

export interface DesktopIcon {
  nodeId: string;
  x: number;
  y: number;
  selected: boolean;
}

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// Event types for window manager
export interface WindowEventDetail {
  windowId: string;
  window?: WindowState;
}

export interface WindowMoveEventDetail extends WindowEventDetail {
  x: number;
  y: number;
}

export interface WindowResizeEventDetail extends WindowEventDetail {
  width: number;
  height: number;
}

// Route types
export interface RouteParams {
  path?: string;
}

declare global {
  interface WindowEventMap {
    'window-opened': CustomEvent<WindowEventDetail>;
    'window-closed': CustomEvent<WindowEventDetail>;
    'window-focused': CustomEvent<WindowEventDetail>;
    'window-minimized': CustomEvent<WindowEventDetail>;
    'window-maximized': CustomEvent<WindowEventDetail>;
    'window-restored': CustomEvent<WindowEventDetail>;
    'windows-changed': CustomEvent<void>;
    'filesystem-changed': CustomEvent<void>;
  }
}
