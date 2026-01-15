import type { FileSystemNode, ViewerType } from '../types/index.js';
import { loadContentFileSystem } from '../content-loader.js';

class FileSystemService {
  private static instance: FileSystemService;
  private nodes: Map<string, FileSystemNode> = new Map();
  private pathIndex: Map<string, string> = new Map(); // path -> id

  private constructor() {
    this.initialize();
  }

  static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }

  private initialize(): void {
    const initialNodes = loadContentFileSystem();
    for (const node of initialNodes) {
      this.nodes.set(node.id, node);
      this.pathIndex.set(node.path, node.id);
    }
    this.emit('filesystem-changed');
  }

  private emit(eventName: string, detail?: unknown): void {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }

  getNode(path: string): FileSystemNode | undefined {
    const id = this.pathIndex.get(path);
    if (id) {
      return this.nodes.get(id);
    }
    return undefined;
  }

  getNodeById(id: string): FileSystemNode | undefined {
    return this.nodes.get(id);
  }

  getChildren(path: string): FileSystemNode[] {
    const node = this.getNode(path);
    if (!node || node.type !== 'folder' || !node.children) {
      return [];
    }
    return node.children
      .map(childId => this.nodes.get(childId))
      .filter((child): child is FileSystemNode => child !== undefined);
  }

  getChildrenById(id: string): FileSystemNode[] {
    const node = this.nodes.get(id);
    if (!node || node.type !== 'folder' || !node.children) {
      return [];
    }
    return node.children
      .map(childId => this.nodes.get(childId))
      .filter((child): child is FileSystemNode => child !== undefined);
  }

  getParent(path: string): FileSystemNode | undefined {
    const node = this.getNode(path);
    if (!node || !node.parentId) {
      return undefined;
    }
    return this.nodes.get(node.parentId);
  }

  getParentPath(path: string): string {
    if (path === '/') return '/';
    const parts = path.split('/').filter(Boolean);
    parts.pop();
    return parts.length === 0 ? '/' : '/' + parts.join('/');
  }

  resolvePath(basePath: string, relativePath: string): string {
    if (relativePath.startsWith('/')) {
      return relativePath;
    }
    
    const baseParts = basePath.split('/').filter(Boolean);
    const relativeParts = relativePath.split('/');
    
    for (const part of relativeParts) {
      if (part === '..') {
        baseParts.pop();
      } else if (part !== '.' && part !== '') {
        baseParts.push(part);
      }
    }
    
    return '/' + baseParts.join('/');
  }

  getFileType(node: FileSystemNode): ViewerType {
    if (node.type === 'folder') {
      return 'folder';
    }

    const mimeType = node.mimeType || '';
    
    if (mimeType.startsWith('image/')) {
      return 'image';
    }
    
    if (
      mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      mimeType === 'application/javascript'
    ) {
      return 'text';
    }

    // Fallback to extension-based detection
    const ext = node.name.split('.').pop()?.toLowerCase();
    const textExtensions = ['txt', 'md', 'json', 'js', 'ts', 'html', 'css', 'xml', 'yaml', 'yml'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'];

    if (ext && textExtensions.includes(ext)) {
      return 'text';
    }
    if (ext && imageExtensions.includes(ext)) {
      return 'image';
    }

    return 'unknown';
  }

  getRootItems(): FileSystemNode[] {
    const root = this.getNode('/');
    if (!root || !root.children) {
      return [];
    }
    return root.children
      .map(childId => this.nodes.get(childId))
      .filter((child): child is FileSystemNode => child !== undefined);
  }

  getAllNodes(): FileSystemNode[] {
    return Array.from(this.nodes.values());
  }
}

export const fileSystemService = FileSystemService.getInstance();
