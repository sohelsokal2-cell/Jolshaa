const sharp = require('sharp');
const path = require('path');

class MediaProcessor {
  static async compressImage(buffer, options = {}) {
    const {
      maxWidth = 1200,
      maxHeight = 1200,
      quality = 80,
      format = 'jpeg',
    } = options;

    try {
      const compressed = await sharp(buffer)
        .resize(maxWidth, maxHeight, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality, progressive: true })
        .toBuffer();

      return {
        buffer: compressed,
        info: {
          width: await sharp(compressed).metadata().then(m => m.width),
          height: await sharp(compressed).metadata().then(m => m.height),
          size: compressed.length,
        },
      };
    } catch (err) {
      return { buffer, info: { size: buffer.length } };
    }
  }

  static async generateThumbnail(buffer, size = 200) {
    try {
      return await sharp(buffer)
        .resize(size, size, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toBuffer();
    } catch (err) {
      return null;
    }
  }

  static async generateBlurHash(buffer) {
    try {
      const metadata = await sharp(buffer).metadata();
      const blurred = await sharp(buffer)
        .resize(20, 20, { fit: 'inside' })
        .blur(10)
        .jpeg({ quality: 20 })
        .toBuffer();

      return blurred.toString('base64');
    } catch (err) {
      return null;
    }
  }

  static getImageMetadata(buffer) {
    return sharp(buffer).metadata();
  }
}

module.exports = MediaProcessor;
