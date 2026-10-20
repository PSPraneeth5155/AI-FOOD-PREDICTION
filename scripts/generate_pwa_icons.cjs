const fs = require('fs');
const zlib = require('zlib');

function createPng(width, height, r, g, b) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression deflate
  ihdrData.writeUInt8(0, 11); // filter adaptive
  ihdrData.writeUInt8(0, 12); // interlace none

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);

    // CRC32
    let crc = 0xffffffff;
    for (let i = 4; i < 8 + len; i++) {
      let byte = buf[i];
      crc ^= byte;
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (-(crc & 1) & 0xedb88320);
      }
    }
    buf.writeInt32BE(~crc, 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data with scanline filters (filter byte 0 per line)
  const lineSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * lineSize);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;

  for (let y = 0; y < height; y++) {
    const offset = y * lineSize;
    rawData[offset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = offset + 1 + x * 4;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        // Deep emerald teal #0d9488 inside circle with slight lighter center
        const shade = Math.max(0, 1 - dist / radius);
        rawData[pxOffset] = Math.min(255, Math.floor(13 + shade * 30));     // R
        rawData[pxOffset + 1] = Math.min(255, Math.floor(148 + shade * 40)); // G
        rawData[pxOffset + 2] = Math.min(255, Math.floor(136 + shade * 40)); // B
        rawData[pxOffset + 3] = 255;                                        // Alpha
      } else if (dist < radius + 3) {
        // Anti-aliased border
        const alpha = Math.floor((1 - (dist - radius) / 3) * 255);
        rawData[pxOffset] = 13;
        rawData[pxOffset + 1] = 148;
        rawData[pxOffset + 2] = 136;
        rawData[pxOffset + 3] = alpha;
      } else {
        // Transparent
        rawData[pxOffset] = 15;
        rawData[pxOffset + 1] = 23;
        rawData[pxOffset + 2] = 42;
        rawData[pxOffset + 3] = 255; // solid slate-900 background for maskable compliance
      }
    }
  }

  const idatCompressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', idatCompressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

if (!fs.existsSync('public')) fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/icon-192.png', createPng(192, 192, 13, 148, 136));
fs.writeFileSync('public/icon-512.png', createPng(512, 512, 13, 148, 136));
console.log('Generated public/icon-192.png and public/icon-512.png successfully.');
