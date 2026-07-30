import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const sourceDirectory = path.resolve('apps/app/public/moebel');
const outputDirectory = path.join(sourceDirectory, 'fills');
const size = 512;
const exclusions = {
  '004-table.svg': [[0.5, 0.5]],
  '005-chair.svg': [[0.5, 0.66]],
};

await fs.mkdir(outputDirectory, { recursive: true });
const files = (await fs.readdir(sourceDirectory))
  .filter((file) => file.endsWith('.svg'));

for (const file of files) {
  const { data, info } = await sharp(path.join(sourceDirectory, file))
    .resize(size, size)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const exterior = new Uint8Array(size * size);
  const queue = new Int32Array(size * size);
  let head = 0;
  let tail = 0;

  const addExterior = (index) => {
    if (exterior[index] || data[index * info.channels + 3] > 24) return;
    exterior[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  for (let coordinate = 0; coordinate < size; coordinate += 1) {
    addExterior(coordinate);
    addExterior((size - 1) * size + coordinate);
    addExterior(coordinate * size);
    addExterior(coordinate * size + size - 1);
  }
  for (const [xRatio, yRatio] of exclusions[file] ?? []) {
    addExterior(
      Math.round(yRatio * (size - 1)) * size
      + Math.round(xRatio * (size - 1)),
    );
  }
  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % size;
    const y = Math.floor(index / size);
    if (x > 0) addExterior(index - 1);
    if (x < size - 1) addExterior(index + 1);
    if (y > 0) addExterior(index - size);
    if (y < size - 1) addExterior(index + size);
  }

  const mask = Buffer.alloc(size * size * 4);
  for (let index = 0; index < exterior.length; index += 1) {
    const sourcePixel = index * info.channels;
    const targetPixel = index * 4;
    const isLine = data[sourcePixel + 3] > 24;
    const alpha = isLine || !exterior[index] ? 255 : 0;
    mask[targetPixel] = 255;
    mask[targetPixel + 1] = 255;
    mask[targetPixel + 2] = 255;
    mask[targetPixel + 3] = alpha;
  }

  await sharp(mask, {
    raw: { width: size, height: size, channels: 4 },
  })
    .png()
    .toFile(path.join(outputDirectory, file.replace(/\.svg$/, '.png')));
}
