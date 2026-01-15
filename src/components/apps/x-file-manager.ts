import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FileSystemNode } from '../../types/index.js';
import { fileSystemService } from '../../services/file-system.js';
import { windowManager } from '../../services/window-manager.js';

@customElement('x-file-manager')
export class XFileManager extends LitElement {
  @property({ type: String }) currentPath = '/';
  @property({ type: String }) windowId = '';

  @state() private items: FileSystemNode[] = [];
  @state() private selectedId: string | null = null;
  @state() private history: string[] = ['/'];
  @state() private historyIndex = 0;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--x11-window-bg, #b4b4b4);
      font-family: var(--x11-font-family, sans-serif);
      font-size: var(--x11-font-size, 12px);
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 3px;
      background: var(--x11-window-bg, #b4b4b4);
      border-bottom: 1px solid var(--x11-border-dark, #6e6e6e);
    }

    .toolbar-btn {
      padding: 1px 6px;
      background: var(--x11-window-bg, #b4b4b4);
      border-style: solid;
      border-width: 1px;
      border-color: var(--x11-border-light, #dcdcdc) var(--x11-border-dark, #6e6e6e) var(--x11-border-dark, #6e6e6e) var(--x11-border-light, #dcdcdc);
      cursor: pointer;
      font-size: 11px;
      font-family: inherit;
    }

    .toolbar-btn:active {
      border-color: var(--x11-border-dark, #6e6e6e) var(--x11-border-light, #dcdcdc) var(--x11-border-light, #dcdcdc) var(--x11-border-dark, #6e6e6e);
    }

    .toolbar-btn:disabled {
      color: var(--x11-text-disabled, #6e6e6e);
      cursor: default;
    }

    .path-bar {
      flex: 1;
      padding: 1px 4px;
      background: var(--x11-input-bg, #ffffff);
      border-style: solid;
      border-width: 1px;
      border-color: var(--x11-border-dark, #6e6e6e) var(--x11-border-light, #dcdcdc) var(--x11-border-light, #dcdcdc) var(--x11-border-dark, #6e6e6e);
      font-family: var(--x11-font-mono, monospace);
      font-size: 11px;
    }

    .file-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
      gap: 4px;
      padding: 8px;
      overflow: auto;
      background: var(--x11-input-bg, #ffffff);
      align-content: start;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }

    .file-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4px 2px;
      cursor: pointer;
      text-align: center;
    }

    .file-item:hover {
      background: #d4d4d4;
    }

    .file-item.selected {
      background: var(--x11-selection-bg, #4a6984);
      color: var(--x11-selection-text, #ffffff);
    }

    .file-icon {
      font-size: 28px;
      margin-bottom: 2px;
    }

    .file-name {
      font-size: 10px;
      word-break: break-word;
      max-width: 64px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      line-height: 1.2;
    }

    .empty-folder {
      grid-column: 1 / -1;
      text-align: center;
      color: var(--x11-text-disabled, #6e6e6e);
      padding: 30px;
    }

    .status-bar {
      padding: 2px 6px;
      background: var(--x11-window-bg, #b4b4b4);
      border-top: 1px solid var(--x11-border-light, #dcdcdc);
      font-size: 10px;
      color: var(--x11-text, #000000);
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.loadItems();
  }

  updated(changedProperties: Map<string, unknown>): void {
    if (changedProperties.has('currentPath')) {
      this.loadItems();
      this.updateWindowTitle();
    }
  }

  private loadItems(): void {
    this.items = fileSystemService.getChildren(this.currentPath);
    this.selectedId = null;
  }

  private updateWindowTitle(): void {
    if (this.windowId) {
      windowManager.updateWindowTitle(this.windowId, `File Manager - ${this.currentPath}`);
    }
  }

  private navigateTo(path: string): void {
    // Add to history
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }
    this.history.push(path);
    this.historyIndex = this.history.length - 1;
    this.currentPath = path;
  }

  private goBack(): void {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.currentPath = this.history[this.historyIndex];
    }
  }

  private goForward(): void {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.currentPath = this.history[this.historyIndex];
    }
  }

  private goUp(): void {
    const parentPath = fileSystemService.getParentPath(this.currentPath);
    if (parentPath !== this.currentPath) {
      this.navigateTo(parentPath);
    }
  }

  private handleItemClick(item: FileSystemNode, e: MouseEvent): void {
    e.stopPropagation();
    this.selectedId = item.id;
  }

  private handleItemDoubleClick(item: FileSystemNode): void {
    if (item.type === 'folder') {
      this.navigateTo(item.path);
    } else {
      this.openFile(item);
    }
  }

  private openFile(node: FileSystemNode): void {
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
    }
  }

  private handleBackgroundClick(): void {
    this.selectedId = null;
  }

  private getFileIcon(node: FileSystemNode): string {
    if (node.icon) return node.icon;
    if (node.type === 'folder') return '📁';
    
    const ext = node.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'txt':
      case 'md':
        return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📄';
    }
  }

  render() {
    return html`
      <div class="toolbar">
        <button 
          class="toolbar-btn" 
          @click=${this.goBack}
          ?disabled=${this.historyIndex === 0}
          title="Back"
        >◀</button>
        <button 
          class="toolbar-btn" 
          @click=${this.goForward}
          ?disabled=${this.historyIndex >= this.history.length - 1}
          title="Forward"
        >▶</button>
        <button 
          class="toolbar-btn" 
          @click=${this.goUp}
          ?disabled=${this.currentPath === '/'}
          title="Up"
        >▲</button>
        <div class="path-bar">${this.currentPath}</div>
      </div>

      <div class="file-grid" @click=${this.handleBackgroundClick}>
        ${this.items.length === 0 
          ? html`<div class="empty-folder">Empty folder</div>`
          : this.items.map(item => html`
            <div 
              class="file-item ${this.selectedId === item.id ? 'selected' : ''}"
              @click=${(e: MouseEvent) => this.handleItemClick(item, e)}
              @dblclick=${() => this.handleItemDoubleClick(item)}
            >
              <span class="file-icon">${this.getFileIcon(item)}</span>
              <span class="file-name">${item.name}</span>
            </div>
          `)
        }
      </div>

      <div class="status-bar">
        ${this.items.length} item${this.items.length !== 1 ? 's' : ''}
        ${this.selectedId ? ` • Selected: ${this.items.find(i => i.id === this.selectedId)?.name}` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-file-manager': XFileManager;
  }
}
