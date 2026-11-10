import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const extensionRoot = new URL('../', import.meta.url);
const previewPath = 'assets/preview.png';
const previewWidth = 2400;
const previewHeight = 1500;
const previewByteBudget = 1_500_000;

describe('Workbench preview artwork', () => {
  it(`provides a ${previewWidth}×${previewHeight} PNG preview of the theme workbench`, () => {
    const preview = readFileSync(new URL(previewPath, extensionRoot));

    assert.deepEqual(preview.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.equal(preview.toString('ascii', 12, 16), 'IHDR');
    assert.equal(preview.readUInt32BE(16), previewWidth);
    assert.equal(preview.readUInt32BE(20), previewHeight);
    assert.equal(preview[24], 8);
    assert.deepEqual(preview.subarray(-8), Buffer.from('49454e44ae426082', 'hex'));

    assert.ok(
      preview.byteLength <= previewByteBudget,
      `preview must stay lean for the Marketplace README (${preview.byteLength} bytes)`,
    );
  });

  it('shows the generated workbench preview in the README', () => {
    const readme = readFileSync(new URL('README.md', extensionRoot), 'utf8');

    assert.ok(readme.includes('assets/preview.png'));
  });
});
