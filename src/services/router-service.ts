import { Router } from '@thepassle/app-tools/router.js';
import { fileSystemService } from './file-system.js';
import { openNode } from './file-opener.js';

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
  // Base path for deployment (e.g., '/lachlanrussell.com/' for GitHub Pages)
  private basePath: string = import.meta.env.BASE_URL || '/';

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
            const path = '/' + (this.stripBasePath(context.url.pathname).replace('/browse', '').replace(/^\//, '') || '');
            this.openPath(path);
            return context;
          },
        },
        {
          path: '/view/*',
          title: 'View File',
          render: (context: RouteContext) => {
            this.currentRoute = context;
            const path = '/' + (this.stripBasePath(context.url.pathname).replace('/view', '').replace(/^\//, '') || '');
            this.openPath(path);
            return context;
          },
        },
        {
          path: '/*',
          title: 'Open Path',
          render: (context: RouteContext) => {
            this.currentRoute = context;
            const path = this.stripBasePath(context.url.pathname) || '/';
            this.openPath(path);
            return context;
          },
        },
      ],
    });
  }

  /**
   * Strip the base path from a URL pathname to get the app-relative path
   */
  private stripBasePath(pathname: string): string {
    const base = this.basePath.replace(/\/$/, ''); // Remove trailing slash
    if (base && pathname.startsWith(base)) {
      return pathname.slice(base.length) || '/';
    }
    return pathname;
  }

  static getInstance(): RouterService {
    if (!RouterService.instance) {
      RouterService.instance = new RouterService();
    }
    return RouterService.instance;
  }

  /** Open a path using the centralized file opener service */
  private openPath(path: string): void {
    // Normalize path - remove trailing slashes except for root
    const normalizedPath = path === '/' ? '/' : path.replace(/\/$/, '');
    
    const node = fileSystemService.getNode(normalizedPath);
    if (node) {
      openNode(node);
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
