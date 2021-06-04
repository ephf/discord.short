const { readFileSync } = require("fs");

class CanvasContext2d {
  /** @private */
  _dat = {
    fill: "#fff",
    reload() {
      this.mask = false;
    },
  };

  constructor(canvas) {
    this.canvas = canvas;
  }

  /**
   * Fill the next elements with a color
   * @param {String} color
   */
  fill(color) {
    this._dat.fill = color;
  }

  /**
   * Draw a rectangle
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   */
  rect(x, y, width, height) {
    this.canvas.svg += `<rect x='${x}' y='${y}' width='${width}' height='${height}' fill='${
      this._dat.fill
    }' ${this._dat.mask ? `mask='url(${this._dat.mask})' ` : ""}/>`;
    this._dat.reload();
  }

  /**
   * Change the background to a color
   * @param {String} color
   */
  background(color) {
    this.canvas.svg += `<rect x='0' y='0' width='100%' height='100%' fill='${color}' />`;
  }

  /**
   * Start a mask
   * @param {String} id
   */
  beginMask(id) {
    this.canvas.svg += `<defs><mask id='${id}'><rect x='0' y='0' width='100%' height='100%' fill='#fff' />`;
    this.fill("#000");
  }

  /**
   * End a mask
   */
  closeMask() {
    this.canvas.svg += `</mask></defs>`;
  }

  /**
   * Add a mask to the next object
   * @param {String} id
   */
  mask(id) {
    this._dat.mask = `#${id}`;
  }

  /**
   * Draw an ellipse
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   */
  ellipse(x, y, width, height) {
    this.canvas.svg += `<ellipse cx='${x}' cy='${y}' rx='${width / 2}' ry='${
      height / 2
    }' fill='${this._dat.fill}' ${
      this._dat.mask ? `mask='url(${this._dat.mask})' ` : ""
    }/>`;
    this._dat.reload();
  }

  /**
   * Draw an svg to the canvas
   * @param {String} filepath
   */
  svg(filepath) {
    this.canvas.svg = readFileSync(filepath, "utf-8").replace(/<\/svg> *$/, "");
  }

  /**
   * Draw text
   * @param {String} text
   * @param {Number} x
   * @param {Number} y
   * @param {Number} size
   * @param {String} font
   */
  text(text, x, y, size, font) {
    this.canvas.svg += `<text x='${x}' y='${y}' style='font: ${size || 20}px ${
      font || ""
    };fill: ${this._dat.fill};'${
      this._dat.mask ? `mask='url(${this._dat.mask})' ` : ""
    }>${text}</text>`;
  }

  /**
   * Draw an image
   * @param {String} path
   * @param {Number} x
   * @param {Number} y
   * @param {Number} width
   * @param {Number} height
   */
  image(path, x, y, width, height) {
    this.canvas.svg += `<image href='${path}' x='${x}' y='${y}' width='${width}' height='${height}' />`;
  }
}

module.exports = CanvasContext2d;
