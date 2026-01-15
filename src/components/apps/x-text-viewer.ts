import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { marked } from 'marked';
import { windowManager } from '../../services/window-manager.js';

@customElement('x-text-viewer')
export class XTextViewer extends LitElement {
  @property({ type: String }) filePath = '';
  @property({ type: String }) fileName = 'Untitled';
  @property({ type: String }) content = '';

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--x11-window-bg, #b4b4b4);
      font-family: var(--x11-font-family, sans-serif);
      font-size: var(--x11-font-size, 12px);
      overflow: hidden;
    }

    .toolbar {
      display: flex;
      align-items: center;
      padding: 3px 6px;
      background: var(--x11-window-bg, #b4b4b4);
      border-bottom: 1px solid var(--x11-border-dark, #6e6e6e);
      font-size: 11px;
      flex-shrink: 0;
    }

    .filename {
      font-weight: bold;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .filepath {
      margin-left: 8px;
      color: var(--x11-text-disabled, #6e6e6e);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .content {
      flex: 1 1 0;
      min-height: 0;
      overflow: auto;
      background: var(--x11-input-bg, #ffffff);
      border-style: solid;
      border-width: 1px;
      border-color: var(--x11-border-dark, #6e6e6e) var(--x11-border-light, #dcdcdc) var(--x11-border-light, #dcdcdc) var(--x11-border-dark, #6e6e6e);
      margin: 2px;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }

    .text-content {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: var(--x11-font-mono, 'Liberation Mono', monospace);
      font-size: 12px;
      line-height: 1.4;
      color: var(--x11-text, #000000);
      margin: 0;
      padding: 8px;
    }

    /* Markdown content styles */
    .markdown-content {
      font-family: var(--x11-font-family, sans-serif);
      font-size: 13px;
      line-height: 1.5;
      color: var(--x11-text, #000000);
      padding: 12px;
    }

    .markdown-content h1 {
      font-size: 1.5em;
      margin: 0 0 0.5em 0;
      padding-bottom: 0.3em;
      border-bottom: 1px solid var(--x11-border-dark, #6e6e6e);
    }

    .markdown-content h2 {
      font-size: 1.3em;
      margin: 1em 0 0.5em 0;
    }

    .markdown-content h3 {
      font-size: 1.1em;
      margin: 1em 0 0.5em 0;
    }

    .markdown-content p {
      margin: 0.5em 0;
    }

    .markdown-content ul, .markdown-content ol {
      margin: 0.5em 0;
      padding-left: 1.5em;
    }

    .markdown-content li {
      margin: 0.25em 0;
    }

    .markdown-content code {
      font-family: var(--x11-font-mono, monospace);
      background: #e8e8e8;
      padding: 0.1em 0.3em;
      border-radius: 2px;
      font-size: 0.9em;
    }

    .markdown-content pre {
      background: #2a2a2a;
      color: #f0f0f0;
      padding: 10px;
      border-radius: 3px;
      overflow-x: auto;
      margin: 0.5em 0;
    }

    .markdown-content pre code {
      background: none;
      padding: 0;
      color: inherit;
    }

    .markdown-content a {
      color: #0066cc;
      text-decoration: none;
      cursor: pointer;
    }

    .markdown-content a:hover {
      text-decoration: underline;
    }

    .markdown-content a[href^="http"] {
      /* External links get special styling */
    }

    .markdown-content blockquote {
      margin: 0.5em 0;
      padding-left: 1em;
      border-left: 3px solid var(--x11-border-dark, #6e6e6e);
      color: #555;
    }

    .markdown-content hr {
      border: none;
      border-top: 1px solid var(--x11-border-dark, #6e6e6e);
      margin: 1em 0;
    }

    .markdown-content table {
      border-collapse: collapse;
      margin: 0.5em 0;
    }

    .markdown-content th, .markdown-content td {
      border: 1px solid var(--x11-border-dark, #6e6e6e);
      padding: 0.3em 0.6em;
    }

    .markdown-content th {
      background: #e8e8e8;
    }

    .status-bar {
      padding: 2px 6px;
      background: var(--x11-window-bg, #b4b4b4);
      border-top: 1px solid var(--x11-border-light, #dcdcdc);
      font-size: 10px;
      color: var(--x11-text, #000000);
      flex-shrink: 0;
    }
  `;

  private getLineCount(): number {
    return this.content.split('\n').length;
  }

  private handleContentClick = (e: MouseEvent): void => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    
    if (link && link.href) {
      const url = link.href;
      // Check if it's an external http(s) link
      if (url.startsWith('http://') || url.startsWith('https://')) {
        e.preventDefault();
        e.stopPropagation();
        // Open in embedded browser
        windowManager.openWindow('browser', { url });
      }
    }
  };

  private isMarkdown(): boolean {
    return this.fileName.endsWith('.md') || this.filePath.endsWith('.md');
  }

  private renderMarkdown(): string {
    try {
      return marked(this.content) as string;
    } catch {
      return this.content;
    }
  }

  render() {
    const isMarkdown = this.isMarkdown();
    
    return html`
      <div class="toolbar">
        <span class="filename">${this.fileName}</span>
        <span class="filepath">${this.filePath}</span>
      </div>

      <div class="content" @click=${this.handleContentClick}>
        ${isMarkdown 
          ? html`<div class="markdown-content">${unsafeHTML(this.renderMarkdown())}</div>`
          : html`<pre class="text-content">${this.content}</pre>`
        }
      </div>

      <div class="status-bar">
        ${isMarkdown ? 'Markdown' : 'Plain text'} • ${this.getLineCount()} lines
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-text-viewer': XTextViewer;
  }
}
