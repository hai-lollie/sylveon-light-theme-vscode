import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const extensionRoot = new URL('../', import.meta.url);
const extension = JSON.parse(readFileSync(new URL('package.json', extensionRoot), 'utf8'));
const sourceUrl = 'https://github.com/hai-lollie/sylveon-light-theme-vscode';
const releaseVersion = '1.0.1';
const releaseFilename = `sylveon-light-vscode-${releaseVersion}.vsix`;

describe('Sylveon Light release', () => {
  it('identifies the approved publisher and patch release', () => {
    assert.equal(`${extension.publisher}.${extension.name}`, 'hai-lollie.sylveon-light-vscode');
    assert.equal(extension.version, releaseVersion);
  });

  it('keeps the lockfile release identity aligned with the manifest', () => {
    const lockfile = JSON.parse(readFileSync(new URL('package-lock.json', extensionRoot), 'utf8'));

    assert.equal(lockfile.name, extension.name);
    assert.equal(lockfile.version, releaseVersion);
    assert.equal(lockfile.packages[''].name, extension.name);
    assert.equal(lockfile.packages[''].version, releaseVersion);
  });

  it('links the public source, issue tracker, and project homepage', () => {
    assert.deepEqual(extension.repository, { type: 'git', url: `${sourceUrl}.git` });
    assert.equal(extension.bugs?.url, `${sourceUrl}/issues`);
    assert.equal(extension.homepage, `${sourceUrl}#readme`);
  });

  it('ships the approved MIT license', () => {
    assert.equal(extension.license, 'MIT');
    const license = readFileSync(new URL('LICENSE', extensionRoot), 'utf8');
    assert.match(license, /^MIT License\n/);
    assert.match(license, /Permission is hereby granted, free of charge/);
    assert.match(license, /THE SOFTWARE IS PROVIDED "AS IS"/);
  });

  it('uses the original 128-pixel PNG as its Marketplace icon', () => {
    assert.equal(extension.icon, 'assets/icon.png');
    const icon = readFileSync(new URL(extension.icon, extensionRoot));
    assert.deepEqual(icon.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.equal(icon.toString('ascii', 12, 16), 'IHDR');
    assert.equal(icon.readUInt32BE(16), 128);
    assert.equal(icon.readUInt32BE(20), 128);
  });

  it('contributes only a declarative theme without executable extension hooks or dependencies', () => {
    assert.deepEqual(Object.keys(extension.contributes), ['themes']);
    assert.equal(extension.main, undefined);
    assert.equal(extension.browser, undefined);
    assert.deepEqual(extension.activationEvents ?? [], []);
    assert.deepEqual(extension.dependencies ?? {}, {});
    assert.deepEqual(extension.extensionDependencies ?? [], []);
    assert.deepEqual(extension.extensionPack ?? [], []);
    assert.equal(extension.scripts?.['vscode:uninstall'], undefined);
  });

  it('offers one light theme for the declared VS Code compatibility range', () => {
    assert.equal(extension.engines.vscode, '^1.85.0');
    assert.deepEqual(extension.categories, ['Themes']);
    assert.equal(extension.contributes.themes.length, 1);
    assert.equal(extension.contributes.themes[0].label, 'Sylveon Light');
    assert.equal(extension.contributes.themes[0].uiTheme, 'vs');
  });

  it('includes a valid light-theme document at the contributed path', () => {
    const theme = JSON.parse(readFileSync(new URL(extension.contributes.themes[0].path, extensionRoot), 'utf8'));
    assert.equal(theme.name, 'Sylveon Light');
    assert.equal(theme.type, 'light');
    assert.equal(theme.semanticHighlighting, true);
    assert.ok(Object.keys(theme.colors).length > 0);
    for (const [colorName, color] of Object.entries(theme.colors)) {
      assert.match(color, /^#[\da-f]{6}(?:[\da-f]{2})?$/i, colorName);
    }
  });

  it('provides valid syntax scopes and semantic token colours', () => {
    const theme = JSON.parse(readFileSync(new URL(extension.contributes.themes[0].path, extensionRoot), 'utf8'));
    assert.ok(theme.tokenColors.length > 0);
    for (const token of theme.tokenColors) {
      assert.ok(Array.isArray(token.scope) && token.scope.length > 0);
      for (const scope of token.scope) {
        assert.equal(typeof scope, 'string');
        assert.ok(scope.length > 0);
      }
      assert.match(token.settings.foreground, /^#[\da-f]{6}(?:[\da-f]{2})?$/i);
    }
    assert.ok(Object.keys(theme.semanticTokenColors).length > 0);
    for (const [tokenName, color] of Object.entries(theme.semanticTokenColors)) {
      assert.match(color, /^#[\da-f]{6}(?:[\da-f]{2})?$/i, tokenName);
    }
  });

  it('documents the exact identity and source for installation and security review', () => {
    const readme = readFileSync(new URL('README.md', extensionRoot), 'utf8');
    assert.ok(readme.includes('hai-lollie.sylveon-light-vscode'));
    assert.ok(readme.includes(`| Version | \`${releaseVersion}\` |`));
    assert.ok(readme.includes(`| Source tag | \`v${releaseVersion}\` |`));
    assert.ok(readme.includes(`${sourceUrl}/releases/tag/v${releaseVersion}`));
    assert.ok(readme.includes(sourceUrl));
    assert.ok(readme.includes('code --install-extension'));
    assert.ok(readme.includes('SHA-256'));
  });

  it('uses the current VSIX filename in every download, installation, and checksum example', () => {
    const readme = readFileSync(new URL('README.md', extensionRoot), 'utf8');
    const filenames = [...readme.matchAll(/sylveon-light-vscode-[\d.]+\.vsix/g)].map(match => match[0]);

    assert.ok(filenames.length > 0, 'Installation instructions must identify the VSIX');
    for (const filename of filenames) {
      assert.equal(filename, releaseFilename);
    }
  });

  it('records the packaged version in the changelog', () => {
    const changelog = readFileSync(new URL('CHANGELOG.md', extensionRoot), 'utf8');
    assert.ok(changelog.includes(`## ${releaseVersion}`));
  });

  it('shows the high-resolution ribbon artwork at a compact size in the README', () => {
    const readme = readFileSync(new URL('README.md', extensionRoot), 'utf8');
    assert.ok(readme.includes('assets/icon-512.png'));
    assert.ok(readme.includes('width="256"'));
    assert.ok(readme.includes('height="256"'));
  });
});
