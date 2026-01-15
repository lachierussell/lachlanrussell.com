/**
 * Application Constants - Single source of truth for layout and configuration values
 * 
 * This eliminates magic numbers scattered throughout the codebase.
 */

// =============================================================================
// Layout Constants
// =============================================================================

/** Taskbar configuration */
export const TASKBAR = {
  HEIGHT: 24,
} as const;

/** Window constraints and behavior */
export const WINDOW = {
  MIN_WIDTH: 200,
  MIN_HEIGHT: 150,
  SNAP_THRESHOLD: 15,
  CASCADE_OFFSET: 30,
  CASCADE_MAX: 10,
  BASE_Z_INDEX: 100,
  INITIAL_OFFSET_X: 50,
  INITIAL_OFFSET_Y: 50,
  PADDING: 10,
} as const;

/** Desktop icon layout */
export const DESKTOP_ICON = {
  WIDTH: 80,
  HEIGHT: 75,
  WIDTH_MOBILE: 70,
  HEIGHT_MOBILE: 70,
  PADDING_RIGHT: 20,
  PADDING_RIGHT_MOBILE: 10,
  PADDING_TOP: 20,
  PADDING_TOP_MOBILE: 10,
  GRID_SNAP: 20,
} as const;

/** Icons area padding */
export const DESKTOP = {
  ICONS_PADDING: 12,
  ICONS_PADDING_MOBILE: 8,
} as const;

// =============================================================================
// Breakpoints
// =============================================================================

export const BREAKPOINTS = {
  MOBILE: 768,
} as const;

// =============================================================================
// Timing Constants
// =============================================================================

export const TIMING = {
  /** Delay before startup windows open */
  STARTUP_DELAY: 100,
  /** Delay before deep link window opens */
  DEEP_LINK_DELAY: 150,
  /** Clock update interval */
  CLOCK_INTERVAL: 1000,
} as const;

// =============================================================================
// Event Names - Single source of truth for custom events
// =============================================================================

export const EVENTS = {
  // Window events
  WINDOW_OPENED: 'window-opened',
  WINDOW_CLOSED: 'window-closed',
  WINDOW_FOCUSED: 'window-focused',
  WINDOW_MINIMIZED: 'window-minimized',
  WINDOW_MAXIMIZED: 'window-maximized',
  WINDOW_RESTORED: 'window-restored',
  WINDOWS_CHANGED: 'windows-changed',
  
  // Filesystem events
  FILESYSTEM_CHANGED: 'filesystem-changed',
} as const;

export type EventName = typeof EVENTS[keyof typeof EVENTS];
