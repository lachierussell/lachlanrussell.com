// Content loader - imports all markdown and config files from content/
// This is processed at build time by Vite

import type { FileSystemNode } from './types/index.js';

// Import all markdown files from content directory
const markdownFiles = import.meta.glob('/content/**/*.md', { eager: true, query: '?raw', import: 'default' });
const jsonFiles = import.meta.glob('/content/**/*.json', { eager: true, import: 'default' });
const shellFiles = import.meta.glob('/content/**/*.sh', { eager: true, query: '?raw', import: 'default' });

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

function getIconForFile(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'md': return '📄';
    case 'sh': return '📜';
    case 'json': return '📋';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif': return '🖼️';
    default: return '📄';
  }
}

function getIconForFolder(name: string): string {
  const icons: Record<string, string> = {
    'home': '🏠',
    'projects': '💼',
    'documents': '📂',
    'images': '🖼️',
    'music': '🎵',
    'downloads': '📥',
    'scripts': '📜',
    'applications': '🚀',
  };
  return icons[name.toLowerCase()] || '📁';
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'md': return 'text/markdown';
    case 'txt': return 'text/plain';
    case 'sh': return 'text/x-shellscript';
    case 'json': return 'application/json';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'gif': return 'image/gif';
    default: return 'text/plain';
  }
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
        icon: folderPath === '/' ? '📁' : getIconForFolder(name),
        createdAt: now,
        modifiedAt: now,
      });
    }
  }

  // Ensure root folder
  ensureFolder('/');

  // Process markdown files
  for (const [path, content] of Object.entries(markdownFiles)) {
    const relativePath = path.replace('/content', '');
    const parts = relativePath.split('/').filter(Boolean);
    const filename = parts.pop()!;
    const folderPath = parts.length > 0 ? '/' + parts.join('/') : '/';
    const id = relativePath.replace(/\//g, '-').replace(/^-/, '').replace(/\.md$/, '');
    
    // Skip hidden files
    if (filename.startsWith('_')) continue;

    // Ensure parent folder exists
    ensureFolder(folderPath);

    // Add to parent's children
    const parentId = folderPath === '/' ? 'root' : parts.join('-');
    if (!folderChildren.has(parentId)) {
      folderChildren.set(parentId, []);
    }
    if (!folderChildren.get(parentId)!.includes(id)) {
      folderChildren.get(parentId)!.push(id);
    }

    nodes.push({
      id,
      name: filename,
      type: 'file',
      path: relativePath,
      parentId,
      content: content as string,
      mimeType: getMimeType(filename),
      icon: getIconForFile(filename),
      createdAt: now,
      modifiedAt: now,
    });
  }

  // Process shell files
  for (const [path, content] of Object.entries(shellFiles)) {
    const relativePath = path.replace('/content', '');
    const parts = relativePath.split('/').filter(Boolean);
    const filename = parts.pop()!;
    const folderPath = parts.length > 0 ? '/' + parts.join('/') : '/';
    const id = relativePath.replace(/\//g, '-').replace(/^-/, '').replace(/\.sh$/, '');
    
    if (filename.startsWith('_')) continue;

    ensureFolder(folderPath);

    const parentId = folderPath === '/' ? 'root' : parts.join('-');
    if (!folderChildren.has(parentId)) {
      folderChildren.set(parentId, []);
    }
    if (!folderChildren.get(parentId)!.includes(id)) {
      folderChildren.get(parentId)!.push(id);
    }

    nodes.push({
      id,
      name: filename,
      type: 'file',
      path: relativePath,
      parentId,
      content: content as string,
      mimeType: getMimeType(filename),
      icon: getIconForFile(filename),
      createdAt: now,
      modifiedAt: now,
    });
  }

  // Process JSON config files for special content (apps, images)
  for (const [path, content] of Object.entries(jsonFiles)) {
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
