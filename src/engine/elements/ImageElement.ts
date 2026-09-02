import { Sprite, Texture, Assets } from 'pixi.js';
import { BaseElement } from './BaseElement';

let imageCounter = 0;

export class ImageElement extends BaseElement {
  private sprite: Sprite;
  private _sourceWidth: number;
  private _sourceHeight: number;
  private _sourceUrl: string | null = null;

  constructor(texture: Texture) {
    super('image');
    this.sprite = new Sprite(texture);
    this._sourceWidth = texture.width;
    this._sourceHeight = texture.height;
    this.container.addChild(this.sprite);
    this.container.pivot.set(this._sourceWidth / 2, this._sourceHeight / 2);
  }

  get width(): number {
    return this.sprite.width;
  }
  set width(v: number) {
    this.sprite.width = v;
    this.container.pivot.set(this.sprite.width / 2, this.sprite.height / 2);
  }

  get height(): number {
    return this.sprite.height;
  }
  set height(v: number) {
    this.sprite.height = v;
    this.container.pivot.set(this.sprite.width / 2, this.sprite.height / 2);
  }

  get sourceWidth() {
    return this._sourceWidth;
  }

  get sourceHeight() {
    return this._sourceHeight;
  }

  get sourceUrl() {
    return this._sourceUrl;
  }

  setSourceUrl(url: string) {
    this._sourceUrl = url;
  }

  setTexture(texture: Texture) {
    this.sprite.texture = texture;
    this._sourceWidth = texture.width;
    this._sourceHeight = texture.height;
    this.container.pivot.set(texture.width / 2, texture.height / 2);
  }

  static async fromURL(url: string): Promise<ImageElement> {
    const alias = `img-${imageCounter++}-${Date.now()}`;
    let texture: Texture | null = null;

    try {
      const result = await Assets.load<Texture>({
        src: url,
        alias,
        loadParser: 'loadTextures',
      });
      texture = result && typeof (result as Texture).width !== 'undefined' ? (result as Texture) : null;
    } catch {
      texture = null;
    }

    if (!texture) {
      texture = await ImageElement.loadTextureFromImage(url);
    }
    if (!texture) throw new Error('Failed to load image');
    const element = new ImageElement(texture);
    element.setSourceUrl(url);
    return element;
  }

  private static loadTextureFromImage(url: string): Promise<Texture> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const tex = Texture.from(img);
        resolve(tex);
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = url;
    });
  }

  static async fromFile(file: File): Promise<ImageElement> {
    const dataUrl = await ImageElement.blobToDataUrl(file);
    const element = await ImageElement.fromURL(dataUrl);
    element.name = file.name.replace(/\.[^.]+$/, '');
    return element;
  }

  private static blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
          return;
        }
        reject(new Error('Invalid image data'));
      };
      reader.onerror = () => reject(reader.error ?? new Error('Failed to read image file'));
      reader.readAsDataURL(blob);
    });
  }

  clone(): ImageElement {
    const c = new ImageElement(this.sprite.texture);
    if (this._sourceUrl) c.setSourceUrl(this._sourceUrl);
    c.x = this.x;
    c.y = this.y;
    c.width = this.width;
    c.height = this.height;
    c.rotation = this.rotation;
    c.opacity = this.opacity;
    c.name = `${this.name} (copy)`;
    return c;
  }
}
