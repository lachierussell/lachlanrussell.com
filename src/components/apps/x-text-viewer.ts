import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';

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
    }

    .toolbar {
      display: flex;
      align-items: center;
      padding: 3px 6px;
      background: var(--x11-window-bg, #b4b4b4);
      border-bottom: 1px solid var(--x11-border-dark, #6e6e6e);
      font-size: 11px;
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
      flex: 1;
      overflow: auto;
      padding: 8px;
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
    }

    .status-bar {
      padding: 2px 6px;
      background: var(--x11-window-bg, #b4b4b4);
      border-top: 1px solid var(--x11-border-light, #dcdcdc);
      font-size: 10px;
      color: var(--x11-text, #000000);
    }
  `;

  private getLineCount(): number {
    return this.content.split('\n').length;
  }

  private getCharCount(): number {
    return this.content.length;
  }

  render() {
    return html`
      <div class="toolbar">
        <span class="filename">${this.fileName}</span>
        <span class="filepath">${this.filePath}</span>
      </div>

      <div class="content">
        <pre class="text-content">${this.content}</pre>
      </div>

      <div class="status-bar">
        ${this.getLineCount()} lines, ${this.getCharCount()} characters
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-text-viewer': XTextViewer;
  }
}
