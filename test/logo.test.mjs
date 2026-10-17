import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const extensionRoot = new URL('../', import.meta.url);

describe('Pastel ribbon artwork', () => {
  for (const [size, artworkPath] of [
    [128, 'assets/icon.png'],
    [256, 'assets/icon-256.png'],
    [512, 'assets/icon-512.png'],
  ]) {
    it(`provides a ${size}×${size} PNG logo`, () => {
      const artwork = readFileSync(new URL(artworkPath, extensionRoot));

      assert.deepEqual(artwork.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
      assert.equal(artwork.toString('ascii', 12, 16), 'IHDR');
      assert.equal(artwork.readUInt32BE(16), size);
      assert.equal(artwork.readUInt32BE(20), size);
      assert.equal(artwork[24], 8);
      assert.equal(artwork[25], 6);
      assert.deepEqual(artwork.subarray(-8), Buffer.from('49454e44ae426082', 'hex'));
    });
  }
});
