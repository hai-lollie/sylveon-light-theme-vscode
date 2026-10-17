import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const extensionRoot = new URL('../', import.meta.url);
const extension = JSON.parse(readFileSync(new URL('package.json', extensionRoot), 'utf8'));
const theme = JSON.parse(readFileSync(new URL(extension.contributes.themes[0].path, extensionRoot), 'utf8'));

// VS Code's status-bar colour reference and registrations, including inactive windows:
// https://code.visualstudio.com/api/references/theme-color#status-bar-colors
// https://github.com/microsoft/vscode/blob/main/src/vs/workbench/common/theme.ts
const statusBarSurfaces = [
  ['workspace', 'statusBar.background', 'statusBar.foreground'],
  ['no-folder window', 'statusBar.noFolderBackground', 'statusBar.noFolderForeground'],
  ['inactive window', 'statusBar.inactiveBackground', 'statusBar.foreground'],
  ['debugging', 'statusBar.debuggingBackground', 'statusBar.debuggingForeground'],
];
const statusBarItemKinds = ['prominent', 'remote', 'error', 'warning', 'offline'];
const statusBarItemSurfaces = statusBarItemKinds.flatMap(kind => [
  [`${kind} item`, `statusBarItem.${kind}Background`, `statusBarItem.${kind}Foreground`],
  [`hovered ${kind} item`, `statusBarItem.${kind}HoverBackground`, `statusBarItem.${kind}HoverForeground`],
]);
const statusBarInteractions = [
  ['hovered item', 'statusBarItem.hoverBackground'],
  ['pressed item', 'statusBarItem.activeBackground'],
  ['hovered compact item', 'statusBarItem.compactHoverBackground'],
];
const statusBarBorders = ['statusBar.border', 'statusBar.noFolderBorder', 'statusBar.debuggingBorder'];
const statusBarFocusBorders = ['statusBar.focusBorder', 'statusBarItem.focusBorder'];
const statusBarBackgrounds = [
  ...statusBarSurfaces.map(([, background]) => background),
  ...statusBarItemSurfaces.map(([, background]) => background),
  ...statusBarInteractions.map(([, background]) => background),
];
const statusBarForegrounds = [...new Set([
  ...statusBarSurfaces.map(([, , foreground]) => foreground),
  ...statusBarItemSurfaces.map(([, , foreground]) => foreground),
  'statusBarItem.hoverForeground',
])];
const statusBarColourTokens = [
  ...statusBarBackgrounds,
  ...statusBarForegrounds,
  ...statusBarBorders,
  ...statusBarFocusBorders,
];

// WCAG's sRGB relative luminance and contrast ratio, without rounding at the threshold:
// https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
function relativeLuminance(colour) {
  assert.match(colour, /^#[\da-f]{6}$/i, 'Contrast checks require an opaque six-digit hex colour');
  const [red, green, blue] = colour.slice(1).match(/../g).map(channel => {
    const srgb = Number.parseInt(channel, 16) / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(foreground, background) {
  const luminances = [relativeLuminance(foreground), relativeLuminance(background)];
  return (Math.max(...luminances) + 0.05) / (Math.min(...luminances) + 0.05);
}

describe('Readable pastel status bar', () => {
  it('explicitly styles every supported status-bar colour token without transparent fallbacks', () => {
    for (const token of statusBarColourTokens) {
      assert.match(theme.colors[token] ?? '', /^#[\da-f]{6}$/i, token);
    }
    const declaredTokens = Object.keys(theme.colors).filter(token => /^statusBar(?:Item)?\./.test(token));
    assert.deepEqual(declaredTokens.toSorted(), [...new Set(statusBarColourTokens)].toSorted());
  });

  it('uses ribbon-blue for both workspace and no-folder status bars', () => {
    assert.equal(theme.colors['statusBar.background'], '#AEDFF7');
    assert.equal(theme.colors['statusBar.noFolderBackground'], '#AEDFF7');
  });

  it('keeps every status-bar surface light rather than inheriting dark defaults', () => {
    for (const background of statusBarBackgrounds) {
      assert.ok(relativeLuminance(theme.colors[background]) >= 0.5, `${background} must remain light`);
    }
  });

  for (const [name, background, foreground] of [...statusBarSurfaces, ...statusBarItemSurfaces]) {
    it(`keeps ${name} text and icons at a contrast ratio of at least 4.5:1`, () => {
      const contrast = contrastRatio(theme.colors[foreground], theme.colors[background]);

      assert.ok(contrast >= 4.5, `${foreground} on ${background}: ${contrast.toFixed(2)}:1`);
    });
  }

  // VS Code applies shared active/compact backgrounds to specialised items too:
  // https://github.com/microsoft/vscode/blob/main/src/vs/workbench/browser/parts/statusbar/media/statusbarpart.css
  for (const [name, background] of statusBarInteractions) {
    it(`keeps every foreground readable on the shared ${name} background`, () => {
      for (const foreground of statusBarForegrounds) {
        const contrast = contrastRatio(theme.colors[foreground], theme.colors[background]);

        assert.ok(contrast >= 4.5, `${foreground} on ${background}: ${contrast.toFixed(2)}:1`);
      }
    });
  }

  for (const border of statusBarFocusBorders) {
    it(`keeps ${border} visible against every adjacent status-bar surface`, () => {
      for (const background of [...statusBarBackgrounds, ...statusBarBorders, 'editor.background']) {
        const contrast = contrastRatio(theme.colors[border], theme.colors[background]);

        assert.ok(contrast >= 3, `${border} against ${background}: ${contrast.toFixed(2)}:1`);
      }
    });
  }

  it('distinguishes debugging and every semantic item kind from each other and the normal bar', () => {
    const semanticBackgrounds = [
      'statusBar.background',
      'statusBar.debuggingBackground',
      ...statusBarItemKinds.map(kind => `statusBarItem.${kind}Background`),
    ];
    const colours = semanticBackgrounds.map(background => theme.colors[background]);

    assert.equal(new Set(colours).size, semanticBackgrounds.length, 'State indicators need distinct colours');
  });

  for (const kind of statusBarItemKinds) {
    it(`gives ${kind} items a distinct hover colour`, () => {
      assert.notEqual(theme.colors[`statusBarItem.${kind}HoverBackground`], theme.colors[`statusBarItem.${kind}Background`]);
    });
  }

  it('distinguishes shared hover, pressed, and compact-hover feedback', () => {
    const backgrounds = ['statusBar.background', ...statusBarInteractions.map(([, background]) => background)];
    const colours = backgrounds.map(background => theme.colors[background]);

    assert.equal(new Set(colours).size, backgrounds.length, 'Each interaction needs distinct feedback');
  });
});
