/**
 * Content Loader - Builds the virtual file system from content/ directory
 * 
 * This is processed at build time by Vite's import.meta.glob
 */

import type { FileSystemNode } from './types/index.js';
import { getFileIcon, getFolderIcon } from './data/file-icons.js';

// Import all content files from content directory using Vite's glob imports
const contentFiles = {
  markdown: import.meta.glob('/content/**/*.md', { eager: true, query: '?raw', import: 'default' }),
  text: import.meta.glob('/content/**/*.txt', { eager: true, query: '?raw', import: 'default' }),
  shell: import.meta.glob('/content/**/*.sh', { eager: true, query: '?raw', import: 'default' }),
  json: import.meta.glob('/content/**/*.json', { eager: true, import: 'default' }),
};

interface AppConfig {
  id: string;
  name: string;
  icon: string;
  appType: string;
}

interface ImageConfig {
  id: string;
  name: string;
  url: string;
}

/** Extension to MIME type mapping */
const MIME_TYPES: Record<string, string> = {
  md: 'text/markdown',
  txt: 'text/plain',
  sh: 'text/x-shellscript',
  json: 'application/json',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
};

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return MIME_TYPES[ext] || 'text/plain';
}

export function loadContentFileSystem(): FileSystemNode[] {
  const nodes: FileSystemNode[] = [];
  const folderChildren: Map<string, string[]> = new Map();
  const processedPaths = new Set<string>();
  const now = new Date();

  // Helper to ensure folder exists
  function ensureFolder(folderPath: string): void {
    if (processedPaths.has(folderPath)) return;
    processedPaths.add(folderPath);

    const parts = folderPath.split('/').filter(Boolean);
    const name = parts[parts.length - 1] || '/';
    const id = folderPath === '/' ? 'root' : parts.join('-');
    
    // Determine parent
    let parentPath: string | null = null;
    let parentId: string | null = null;
    
    if (folderPath !== '/') {
      if (parts.length === 1) {
        // Direct child of root (e.g., /home)
        parentPath = '/';
        parentId = 'root';
      } else {
        // Nested folder
        parentPath = '/' + parts.slice(0, -1).join('/');
        parentId = parts.slice(0, -1).join('-');
      }
      
      // Ensure parent exists first
      ensureFolder(parentPath);
      
      // Add to parent's children
      if (!folderChildren.has(parentId)) {
        folderChildren.set(parentId, []);
      }
      if (!folderChildren.get(parentId)!.includes(id)) {
        folderChildren.get(parentId)!.push(id);
      }
    }

    if (!nodes.find(n => n.id === id)) {
      nodes.push({
        id,
        name: name === '/' ? '/' : name.charAt(0).toUpperCase() + name.slice(1),
        type: 'folder',
        path: folderPath,
        parentId: parentId,
        icon: folderPath === '/' ? '📁' : getFolderIcon(name),
        createdAt: now,
        modifiedAt: now,
      });
    }
  }

  // Ensure root folder
  ensureFolder('/');

  /**
   * Process a raw text file (markdown, txt, shell scripts)
   * Unified handler to eliminate code duplication
   */
  function processTextFile(
    filePath: string, 
    content: string, 
    extPattern: RegExp,
    idSuffix: string = ''
  ): void {
    const relativePath = filePath.replace('/content', '');
    const parts = relativePath.split('/').filter(Boolean);
    const filename = parts.pop()!;
    
    // Skip hidden/config files
    if (filename.startsWith('_')) return;

    const folderPath = parts.length > 0 ? '/' + parts.join('/') : '/';
    const id = relativePath.replace(/\//g, '-').replace(/^-/, '').replace(extPattern, '') + idSuffix;
    const parentId = folderPath === '/' ? 'root' : parts.join('-');

    // Ensure parent folder exists
    ensureFolder(folderPath);

    // Add to parent's children
    if (!folderChildren.has(parentId)) {
      folderChildren.set(parentId, []);
    }
    const children = folderChildren.get(parentId)!;
    if (!children.includes(id)) {
      children.push(id);
    }

    nodes.push({
      id,
      name: filename,
      type: 'file',
      path: relativePath,
      parentId,
      content,
      mimeType: getMimeType(filename),
      icon: getFileIcon(filename),
      createdAt: now,
      modifiedAt: now,
    });
  }

  // Process all text-based content files using the unified handler
  for (const [path, content] of Object.entries(contentFiles.markdown)) {
    processTextFile(path, content as string, /\.md$/, '');
  }
  for (const [path, content] of Object.entries(contentFiles.text)) {
    processTextFile(path, content as string, /\.txt$/, '-txt');
  }
  for (const [path, content] of Object.entries(contentFiles.shell)) {
    processTextFile(path, content as string, /\.sh$/, '');
  }

  // Process JSON config files for special content (apps, images)
  for (const [path, content] of Object.entries(contentFiles.json)) {
    const relativePath = path.replace('/content', '');
    const parts = relativePath.split('/').filter(Boolean);
    const filename = parts.pop()!;
    const folderPath = parts.length > 0 ? '/' + parts.join('/') : '/';

    ensureFolder(folderPath);
    const parentId = folderPath === '/' ? 'root' : parts.join('-');

    // Handle apps config
    if (filename === '_apps.json') {
      const apps = content as AppConfig[];
      if (!folderChildren.has(parentId)) {
        folderChildren.set(parentId, []);
      }
      for (const app of apps) {
        const appId = `app-${app.id}`;
        folderChildren.get(parentId)!.push(appId);
        nodes.push({
          id: appId,
          name: `${app.name}.app`,
          type: 'file',
          path: `${folderPath}/${app.name}.app`,
          parentId,
          content: app.appType,
          mimeType: 'application/x-app',
          icon: app.icon,
          createdAt: now,
          modifiedAt: now,
        });
      }
    }

    // Handle images config
    if (filename === '_images.json') {
      const images = content as ImageConfig[];
      if (!folderChildren.has(parentId)) {
        folderChildren.set(parentId, []);
      }
      for (const img of images) {
        const imgId = `img-${img.id}`;
        folderChildren.get(parentId)!.push(imgId);
        nodes.push({
          id: imgId,
          name: img.name,
          type: 'file',
          path: `${folderPath}/${img.name}`,
          parentId,
          content: img.url,
          mimeType: img.name.endsWith('.png') ? 'image/png' : 'image/jpeg',
          icon: '🖼️',
          createdAt: now,
          modifiedAt: now,
        });
      }
    }
  }

  // Update folder children
  for (const node of nodes) {
    if (node.type === 'folder') {
      node.children = folderChildren.get(node.id) || [];
    }
  }

  return nodes;
}
