/**
 * File Icons - Single source of truth for file/folder icon resolution
 * 
 * This centralizes icon logic that was previously duplicated in:
 * - content-loader.ts (getIconForFile, getIconForFolder)
 * - x-desktop.ts (getItemIcon)
 * - x-file-manager.ts (getItemIcon)
 */

/** Icon mapping for file extensions */
const FILE_EXTENSION_ICONS: Record<string, string> = {
  // Text files
  'md': '📄',
  'txt': '📝',
  'json': '📋',
  'xml': '📋',
  'yaml': '📋',
  'yml': '📋',
  
  // Code files
  'js': '📜',
  'ts': '📜',
  'html': '🌐',
  'css': '🎨',
  'sh': '📜',
  
  // Images
  'jpg': '🖼️',
  'jpeg': '🖼️',
  'png': '🖼️',
  'gif': '🖼️',
  'svg': '🖼️',
  'webp': '🖼️',
  'bmp': '🖼️',
};

/** Icon mapping for special folder names */
const FOLDER_NAME_ICONS: Record<string, string> = {
  'home': '🏠',
  'projects': '💼',
  'documents': '📂',
  'images': '🖼️',
  'music': '🎵',
  'downloads': '📥',
  'scripts': '📜',
  'applications': '🚀',
};

/** Default icons */
const DEFAULT_FILE_ICON = '📄';
const DEFAULT_FOLDER_ICON = '📁';

/**
 * Get icon for a file based on its filename/extension
 */
export function getFileIcon(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext && ext in FILE_EXTENSION_ICONS) {
    return FILE_EXTENSION_ICONS[ext];
  }
  return DEFAULT_FILE_ICON;
}

/**
 * Get icon for a folder based on its name
 */
export function getFolderIcon(folderName: string): string {
  const lowerName = folderName.toLowerCase();
  if (lowerName in FOLDER_NAME_ICONS) {
    return FOLDER_NAME_ICONS[lowerName];
  }
  return DEFAULT_FOLDER_ICON;
}

/**
 * Get icon for a file system node (file or folder)
 * Uses the node's stored icon if available, otherwise determines from name
 */
export function getNodeIcon(node: { 
  icon?: string; 
  type: 'file' | 'folder'; 
  name: string;
}): string {
  // Use stored icon if available
  if (node.icon) {
    return node.icon;
  }
  
  // Determine icon based on type
  if (node.type === 'folder') {
    return getFolderIcon(node.name);
  }
  
  return getFileIcon(node.name);
}
