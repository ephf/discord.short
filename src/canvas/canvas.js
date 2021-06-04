const { convert } = require("convert-svg-to-png");
const { writeFileSync } = require("fs");
const CanvasContext2d = require("discord.short/src/canvas/CanvasContext2d");

/**
 * ## Discord.Short Canvas
 * ```
 * const canvas = new ds.Canvas(width: Number, height: Number);
 * const ctx = canvas.getContext(context: '2d');
 * ```
 * **Docs {@link https://ephf.gitbook.io/discord-short/canvas Canvas}**
 */
class Canvas {
  /**
   * ## Discord.Short Canvas
   * ```
   * const canvas = new ds.Canvas(width: Number, height: Number);
   * const ctx = canvas.getContext(context: '2d');
   * ```
   * **Docs {@link https://ephf.gitbook.io/discord-short/canvas Canvas}**
   * @param {Number} width
   * @param {Number} height
   */
  constructor(width, height) {
    this.svg = `<svg width='${width}' height='${height}'>`;
  }

  /**
   * Allow for writing
   * @param {'2d'} context
   */
  getContext(context) {
    if (context != "2d") throw 'can only get context "2d"';
    return new CanvasContext2d(this);
  }

  /**
   * Save as a png
   * @param {String} path
   * @returns {Promise<void>}
   */
  async save(path) {
    const png = await convert(`${this.svg}</svg>`);
    writeFileSync(path, png);
  }

  /**
   * Returns a png
   * @returns {Promise<png>}
   */
  async png() {
    return await convert(`${this.svg}</svg>`);
  }
}

module.exports = Canvas;
