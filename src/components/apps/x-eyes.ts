import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';

@customElement('x-eyes')
export class XEyes extends LitElement {
  @state() private leftPupilX = 0;
  @state() private leftPupilY = 0;
  @state() private rightPupilX = 0;
  @state() private rightPupilY = 0;

  private boundHandleMouseMove: (e: MouseEvent) => void;

  static styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      background: var(--x11-window-bg, #c0c4cc);
      padding: 16px;
    }

    .eyes-container {
      display: flex;
      gap: 20px;
    }

    .eye {
      width: 80px;
      height: 100px;
      background: #fffff8;
      border: 2px solid #000;
      border-radius: 50%;
      position: relative;
      overflow: hidden;
    }

    .pupil {
      width: 24px;
      height: 24px;
      background: #000;
      border-radius: 50%;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      transition: transform 0.05s ease-out;
    }

    .pupil::after {
      content: '';
      position: absolute;
      width: 8px;
      height: 8px;
      background: #fff;
      border-radius: 50%;
      top: 4px;
      left: 4px;
    }

    .label {
      text-align: center;
      margin-top: 12px;
      font-family: var(--x11-font-family, sans-serif);
      font-size: 12px;
      color: var(--x11-text, #000);
    }

    .wrapper {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  `;

  constructor() {
    super();
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
  }

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('mousemove', this.boundHandleMouseMove);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('mousemove', this.boundHandleMouseMove);
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.getBoundingClientRect();
    if (!rect) return;

    // Left eye center
    const leftEyeX = rect.left + 50;
    const leftEyeY = rect.top + rect.height / 2;
    
    // Right eye center  
    const rightEyeX = rect.left + rect.width - 50;
    const rightEyeY = rect.top + rect.height / 2;

    // Calculate pupil positions
    this.calculatePupilPosition(e.clientX, e.clientY, leftEyeX, leftEyeY, 'left');
    this.calculatePupilPosition(e.clientX, e.clientY, rightEyeX, rightEyeY, 'right');
  }

  private calculatePupilPosition(
    mouseX: number, 
    mouseY: number, 
    eyeX: number, 
    eyeY: number, 
    eye: 'left' | 'right'
  ): void {
    const dx = mouseX - eyeX;
    const dy = mouseY - eyeY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Max pupil movement radius
    const maxRadius = 20;
    const radius = Math.min(distance / 10, maxRadius);
    
    const angle = Math.atan2(dy, dx);
    const pupilX = Math.cos(angle) * radius;
    const pupilY = Math.sin(angle) * radius;

    if (eye === 'left') {
      this.leftPupilX = pupilX;
      this.leftPupilY = pupilY;
    } else {
      this.rightPupilX = pupilX;
      this.rightPupilY = pupilY;
    }
  }

  render() {
    return html`
      <div class="wrapper">
        <div class="eyes-container">
          <div class="eye">
            <div 
              class="pupil" 
              style="transform: translate(calc(-50% + ${this.leftPupilX}px), calc(-50% + ${this.leftPupilY}px))"
            ></div>
          </div>
          <div class="eye">
            <div 
              class="pupil" 
              style="transform: translate(calc(-50% + ${this.rightPupilX}px), calc(-50% + ${this.rightPupilY}px))"
            ></div>
          </div>
        </div>
        <div class="label">xeyes</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'x-eyes': XEyes;
  }
}
