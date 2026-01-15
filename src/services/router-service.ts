import { Router } from '@thepassle/app-tools/router.js';
import { windowManager } from './window-manager.js';
import { fileSystemService } from './file-system.js';

export interface RouteContext {
  url: URL;
  params: Record<string, string>;
  query: Record<string, string>;
}

// Declare Router type since the library doesn't have proper TypeScript definitions
declare class AppToolsRouter extends EventTarget {
  constructor(config: { routes: Array<{ path: string; title: string; render: (context: RouteContext) => unknown }> });
  navigate(path: string): void;
}

class RouterService {
  private static instance: RouterService;
  private router: AppToolsRouter;
  private currentRoute: RouteContext | null = null;

  private constructor() {
    this.router = new (Router as unknown as typeof AppToolsRouter)({
      routes: [
        {
          path: '/',
          title: 'Desktop',
          render: (context: RouteContext) => {
            this.currentRoute = context;
            return context;
          },
        },
        {
          path: '/browse/*',
          title: 'File Manager',
          render: (context: RouteContext) => {
            this.currentRoute = context;
            const path = '/' + (context.url.pathname.replace('/browse', '').replace(/^\//, '') || '');
            this.openFileManager(path);
            return context;
          },
        },
        {
          path: '/view/*',
          title: 'View File',
          render: (context: RouteContext) => {
            this.currentRoute = context;
            const path = '/' + (context.url.pathname.replace('/view', '').replace(/^\//, '') || '');
            this.openFileViewer(path);
            return context;
          },
        },
      ],
    });
  }

  static getInstance(): RouterService {
    if (!RouterService.instance) {
      RouterService.instance = new RouterService();
    }
    return RouterService.instance;
  }

  private openFileManager(path: string): void {
    const node = fileSystemService.getNode(path);
    if (node && node.type === 'folder') {
      windowManager.openWindow('file-manager', { path, name: node.name });
    } else {
      // Default to root if path not found
      windowManager.openWindow('file-manager', { path: '/', name: 'Root' });
    }
  }

  private openFileViewer(path: string): void {
    const node = fileSystemService.getNode(path);
    if (!node) return;

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
          src: node.content, // URL for images
        });
        break;
      case 'folder':
        this.openFileManager(path);
        break;
    }
  }

  navigateTo(path: string): void {
    this.router.navigate(path);
  }

  getCurrentRoute(): RouteContext | null {
    return this.currentRoute;
  }

  getRouter(): AppToolsRouter {
    return this.router;
  }
}

export const routerService = RouterService.getInstance();
