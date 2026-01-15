import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('x-clock')
export class XClock extends LitElement {
  @state() private hours = 0;
  @state() private minutes = 0;
  @state() private seconds = 0;

  private intervalId?: number;

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: var(--x11-window-bg, #c0c4cc);
      padding: 8px;
    }

    .clock-face {
      width: 150px;
      height: 150px;
      border-radius: 50%;
      background: #fffff0;
      border: 2px solid var(--x11-border-darker, #000);
      position: relative;
      box-shadow: inset 2px 2px 4px rgba(0,0,0,0.2);
    }

    .clock-center {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 8px;
      height: 8px;
      background: #333;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      z-index: 10;
    }

    .hand {
      position: absolute;
      bottom: 50%;
      left: 50%;
      transform-origin: 50% 100%;
      background: #333;
      border-radius: 2px;
    }

    .hour-hand {
      width: 4px;
      height: 35px;
      margin-left: -2px;
    }

    .minute-hand {
      width: 3px;
      height: 50px;
      margin-left: -1.5px;
    }

    .second-hand {
      width: 1px;
      height: 55px;
      margin-left: -0.5px;
      background: #c00;
    }

    /* Hour markers */
    .marker {
      position: absolute;
      width: 2px;
      height: 8px;
      background: #333;
      left: 50%;
      margin-left: -1px;
      transform-origin: 50% 75px;
    }

    .marker.major {
      width: 3px;
      height: 12px;
      margin-left: -1.5px;
    }

    .digital-time {
      text-align: center;
      margin-top: 12px;
      font-family: var(--x11-font-mono, monospace);
      font-size: 14px;
      color: var(--x11-text, #000);
    }

    .timezone {
      text-align: center;
      margin-top: 4px;
      font-family: var(--x11-font-family, sans-serif);
      font-size: 10px;
      color: var(--x11-text-disabled, #606468);
    }

    .clock-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.updateTime();
    this.intervalId = window.setInterval(() => this.updateTime(), 1000);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateTime(): void {
    // Always use Melbourne timezone (Australia/Melbourne)
    const now = new Date();
    const melbourneTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Melbourne' }));
    this.hours = melbourneTime.getHours();
    this.minutes = melbourneTime.getMinutes();
    this.seconds = melbourneTime.getSeconds();
  }

  private getHourRotation(): number {
    return (this.hours % 12) * 30 + this.minutes * 0.5;
  }

  private getMinuteRotation(): number {
    return this.minutes * 6 + this.seconds * 0.1;
  }

  private getSecondRotation(): number {
    return this.seconds * 6;
  }

  private formatTime(): string {
    const h = this.hours.toString().padStart(2, '0');
    const m = this.minutes.toString().padStart(2, '0');
    const s = this.seconds.toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  render() {
    const markers = [];
    for (let i = 0; i < 12; i++) {
      markers.push(html`
        <div 
          class="marker ${i % 3 === 0 ? 'major' : ''}" 
          style="transform: rotate(${i * 30}deg)"
        ></div>
      `);
    }

    return html`
      <div class="clock-container">
        <div class="clock-face">
          ${markers}
          <div class="hand hour-hand" style="transform: rotate(${this.getHourRotation()}deg)"></div>
          <div class="hand minute-hand" style="transform: rotate(${this.getMinuteRotation()}deg)"></div>
          <div class="hand second-hand" style="transform: rotate(${this.getSecondRotation()}deg)"></div>
          <div class="clock-center"></div>
        </div>
        <div class="digital-time">${this.formatTime()}</div>
        <div class="timezone">Melbourne, AU</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-clock': XClock;
  }
}
