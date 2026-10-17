import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { listFiles, PackageManager } from '@vscode/vsce';

describe('Installable theme distribution', () => {
  it('ships only the manifest, theme, icon, license, and release documentation', async () => {
    const packagedFiles = await listFiles({
      cwd: fileURLToPath(new URL('../', import.meta.url)),
      packageManager: PackageManager.None,
    });

    assert.deepEqual(packagedFiles.toSorted(), [
      'CHANGELOG.md',
      'LICENSE',
      'README.md',
      'assets/icon.png',
      'package.json',
      'themes/sylveon-light-color-theme.json',
    ]);
  });
});
