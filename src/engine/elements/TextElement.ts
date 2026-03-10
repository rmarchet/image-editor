import { Graphics, Text, TextStyle } from 'pixi.js';
import { BaseElement } from './BaseElement';

export interface TextConfig {
  text: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  align: 'left' | 'center' | 'right';
  strikethrough: boolean;
}

const DEFAULT_CONFIG: TextConfig = {
  text: 'Double-click to edit',
  fontFamily: 'Arial',
  fontSize: 32,
  fill: '#000000',
  fontWeight: 'normal',
  fontStyle: 'normal',
  align: 'left',
  strikethrough: false,
};

export class TextElement extends BaseElement {
  private textDisplay: Text;
  private strikeLine: Graphics;
  private _config: TextConfig;

  constructor(config: Partial<TextConfig> = {}) {
    super('text');
    this._config = { ...DEFAULT_CONFIG, ...config };

    const style = this.buildStyle();
    this.textDisplay = new Text({ text: this._config.text, style });
    this.strikeLine = new Graphics();
    this.container.addChild(this.textDisplay);
    this.container.addChild(this.strikeLine);
    this.updateStrikethrough();
    this.updatePivot();
  }

  private buildStyle(): TextStyle {
    return new TextStyle({
      fontFamily: this._config.fontFamily,
      fontSize: this._config.fontSize,
      fill: this._config.fill,
      fontWeight: this._config.fontWeight,
      fontStyle: this._config.fontStyle,
      align: this._config.align,
      wordWrap: true,
      wordWrapWidth: 400,
    });
  }

  private updatePivot() {
    this.container.pivot.set(this.textDisplay.width / 2, this.textDisplay.height / 2);
  }

  private updateStrikethrough() {
    this.strikeLine.clear();

    if (!this._config.strikethrough) {
      return;
    }

    const bounds = this.textDisplay.getLocalBounds();
    if (bounds.width <= 0 || bounds.height <= 0) {
      return;
    }

    const lineY = bounds.y + bounds.height * 0.52;
    const lineWidth = Math.max(1, Math.round(this._config.fontSize * 0.06));

    this.strikeLine.moveTo(bounds.x, lineY);
    this.strikeLine.lineTo(bounds.x + bounds.width, lineY);
    this.strikeLine.stroke({ width: lineWidth, color: this._config.fill });
  }

  get width(): number {
    return this.textDisplay.width;
  }
  set width(v: number) {
    this.textDisplay.style.wordWrapWidth = v;
    this.updateStrikethrough();
    this.updatePivot();
  }

  get height(): number {
    return this.textDisplay.height;
  }
  set height(_v: number) {
    // text height is derived from content
  }

  get config(): TextConfig {
    return { ...this._config };
  }

  updateConfig(updates: Partial<TextConfig>) {
    this._config = { ...this._config, ...updates };
    this.textDisplay.text = this._config.text;
    this.textDisplay.style = this.buildStyle();
    this.updateStrikethrough();
    this.updatePivot();
  }

  get text() {
    return this._config.text;
  }
  set text(v: string) {
    this.updateConfig({ text: v });
  }

  clone(): TextElement {
    const c = new TextElement(this._config);
    c.x = this.x;
    c.y = this.y;
    c.width = this.width;
    c.rotation = this.rotation;
    c.opacity = this.opacity;
    c.name = `${this.name} (copy)`;
    return c;
  }
}
