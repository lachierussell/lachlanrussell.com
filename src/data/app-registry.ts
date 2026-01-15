/**
 * App Registry - Single source of truth for all application configuration
 * 
 * This centralizes app metadata that was previously scattered across:
 * - window-manager.ts (getDefaultSize, getAppIcon, getAppTitle)
 * - x-window-container.ts (renderAppContent switch)
 * - x-desktop.ts (context menu items)
 */

import type { AppType } from '../types/index.js';

export interface AppConfig {
  /** Display icon (emoji) */
  icon: string;
  /** Base window title */
  title: string;
  /** Default window size */
  defaultSize: { width: number; height: number };
  /** Component tag name */
  component: string;
  /** Whether to show in desktop context menu */
  showInMenu?: boolean;
  /** Menu label (if different from title) */
  menuLabel?: string;
  /** Menu group: 'apps' | 'utilities' */
  menuGroup?: 'apps' | 'utilities';
}

/**
 * Central registry of all available applications
 */
export const APP_REGISTRY: Record<AppType, AppConfig> = {
  'file-manager': {
    icon: '📁',
    title: 'File Manager',
    defaultSize: { width: 500, height: 400 },
    component: 'x-file-manager',
    showInMenu: true,
    menuGroup: 'apps',
  },
  'text-viewer': {
    icon: '📄',
    title: 'Text Viewer',
    defaultSize: { width: 550, height: 450 },
    component: 'x-text-viewer',
  },
  'image-viewer': {
    icon: '🖼️',
    title: 'Image Viewer',
    defaultSize: { width: 600, height: 500 },
    component: 'x-image-viewer',
  },
  'about': {
    icon: 'ℹ️',
    title: 'About',
    defaultSize: { width: 400, height: 300 },
    component: 'x-text-viewer',
    showInMenu: true,
    menuGroup: 'utilities',
  },
  'clock': {
    icon: '🕐',
    title: 'xclock',
    defaultSize: { width: 200, height: 240 },
    component: 'x-clock',
    showInMenu: true,
    menuLabel: 'XClock',
    menuGroup: 'utilities',
  },
  'calculator': {
    icon: '🔢',
    title: 'xcalc',
    defaultSize: { width: 220, height: 320 },
    component: 'x-calculator',
    showInMenu: true,
    menuLabel: 'XCalc',
    menuGroup: 'utilities',
  },
  'terminal': {
    icon: '💻',
    title: 'xterm',
    defaultSize: { width: 600, height: 400 },
    component: 'x-terminal',
    showInMenu: true,
    menuLabel: 'XTerm',
    menuGroup: 'apps',
  },
  'xeyes': {
    icon: '👀',
    title: 'xeyes',
    defaultSize: { width: 220, height: 180 },
    component: 'x-eyes',
    showInMenu: true,
    menuLabel: 'XEyes',
    menuGroup: 'utilities',
  },
  'browser': {
    icon: '🌐',
    title: 'Web Browser',
    defaultSize: { width: 800, height: 600 },
    component: 'x-browser',
    showInMenu: true,
    menuGroup: 'apps',
  },
} as const;

/**
 * Get app configuration by type
 */
export function getAppConfig(appType: AppType): AppConfig {
  return APP_REGISTRY[appType] ?? {
    icon: '📋',
    title: 'Window',
    defaultSize: { width: 400, height: 300 },
    component: 'div',
  };
}

/**
 * Get default window size for an app type
 */
export function getDefaultSize(appType: AppType): { width: number; height: number } {
  return getAppConfig(appType).defaultSize;
}

/**
 * Get icon for an app type
 */
export function getAppIcon(appType: AppType): string {
  return getAppConfig(appType).icon;
}

/**
 * Get window title for an app, with optional dynamic data
 */
export function getAppTitle(appType: AppType, appData?: Record<string, unknown>): string {
  const config = getAppConfig(appType);
  const name = appData?.name as string | undefined;
  const path = appData?.path as string | undefined;
  
  // Special cases for dynamic titles
  switch (appType) {
    case 'file-manager':
      return `${config.title} - ${path || '/'}`;
    case 'text-viewer':
    case 'image-viewer':
      return name || config.title;
    default:
      return config.title;
  }
}

/**
 * Get menu items for desktop context menu, derived from registry
 */
export function getDesktopMenuItems(): Array<{
  id: string;
  label: string;
  icon: string;
  separator?: boolean;
}> {
  const apps = Object.entries(APP_REGISTRY)
    .filter(([_, config]) => config.showInMenu && config.menuGroup === 'apps')
    .map(([id, config]) => ({
      id,
      label: config.menuLabel || config.title,
      icon: config.icon,
    }));

  const utilities = Object.entries(APP_REGISTRY)
    .filter(([_, config]) => config.showInMenu && config.menuGroup === 'utilities')
    .map(([id, config]) => ({
      id,
      label: config.menuLabel || config.title,
      icon: config.icon,
    }));

  return [
    ...apps,
    { id: 'separator-1', label: '', icon: '', separator: true },
    ...utilities.filter(u => u.id !== 'about'),
    { id: 'separator-2', label: '', icon: '', separator: true },
    { id: 'refresh', label: 'Refresh', icon: '🔄' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ];
}
