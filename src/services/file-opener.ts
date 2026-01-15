/**
 * File Opener Service - Single source of truth for opening files/folders
 * 
 * This consolidates the duplicated file opening logic that was previously in:
 * - x-desktop.ts (openNode, handleIconDoubleClick)
 * - x-file-manager.ts (openFile)
 * - router-service.ts (openFileViewer)
 */

import type { FileSystemNode, AppType } from '../types/index.js';
import { fileSystemService } from './file-system.js';
import { windowManager } from './window-manager.js';

/**
 * Open a file system node in the appropriate viewer/application
 */
export function openNode(node: FileSystemNode): void {
  // Handle folders
  if (node.type === 'folder') {
    windowManager.openWindow('file-manager', {
      path: node.path,
      name: node.name,
    });
    return;
  }

  // Handle app launchers (.app files)
  if (node.mimeType === 'application/x-app' && node.content) {
    const appType = node.content as AppType;
    windowManager.openWindow(appType, {});
    return;
  }

  // Determine file type and open appropriate viewer
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
      // Fallback: try to open as text
      windowManager.openWindow('text-viewer', {
        path: node.path,
        name: node.name,
        content: node.content || 'Unable to display this file type.',
      });
  }
}

/**
 * Open a path (resolves to node first)
 */
export function openPath(path: string): void {
  const node = fileSystemService.getNode(path);
  if (node) {
    openNode(node);
  }
}

/**
 * Open a node by its ID
 */
export function openNodeById(nodeId: string): void {
  const node = fileSystemService.getNodeById(nodeId);
  if (node) {
    openNode(node);
  }
}
