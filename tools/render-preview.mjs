// Renders assets/preview.png — a workbench preview of the Sylveon Light theme.
//
// Every colour is read from themes/sylveon-light-color-theme.json at render
// time: the workbench chrome from its `colors` map and the syntax tokens from
// its `tokenColors` scopes. A missing token aborts the render, so the preview
// can never silently drift from the theme.
//
// Usage: node tools/render-preview.mjs
// Needs: firefox (headless screenshot) and ImageMagick (PNG optimisation).

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const themePath = path.join(projectRoot, 'themes', 'sylveon-light-color-theme.json');
const previewPath = path.join(projectRoot, 'assets', 'preview.png');
const scratchDir = '/tmp/opencode/sylveon-preview';
const previewWidth = 2400;
const previewHeight = 1500;

const theme = JSON.parse(readFileSync(themePath, 'utf8'));

const workbenchColor = (name) => {
  const color = theme.colors[name];
  if (!color) {
    throw new Error(`theme is missing workbench colour "${name}"`);
  }
  return color;
};

const tokenColor = (scope) => {
  const rule = theme.tokenColors.find((token) => token.scope.includes(scope));
  if (!rule) {
    throw new Error(`theme is missing token colour for scope "${scope}"`);
  }
  return rule.settings.foreground;
};

const tokenStyle = (scope) => {
  const rule = theme.tokenColors.find((token) => token.scope.includes(scope));
  return rule.settings.fontStyle ?? '';
};

// The sample buffer: a small Clojure file, one array of [scope, text] spans
// per line. Rendering, the minimap, and the status-bar position all read
// from this single description of the picture.
const bufferLines = [
  [['keyword', '(ns'], ['type', ' ribbon.workshop']],
  [['string', '  "Pastel ribbons for every mood."'], ['punct', ')']],
  [],
  [['keyword', '(def'], ['variable', ' pastels']],
  [['punct', '  {'], ['string', ':ribbon-blue'], ['punct', ' '], ['string', '"#5BA8D1"']],
  [['punct', '   '], ['string', ':soft-pink'], ['punct', '   '], ['string', '"#F8E8F0"']],
  [['punct', '   '], ['string', ':bow-accent'], ['punct', '  '], ['string', '"#C83D78"']],
  [['punct', '   '], ['string', ':lavender'], ['punct', '    '], ['string', '"#8F5BB7"'], ['punct', '})']],
  [],
  [['keyword', '(defn'], ['function', ' ribbon-for']],
  [['string', '  "Pick the ribbon that matches a mood."']],
  [['punct', '  [{'], ['string', ':keys'], ['punct', ' '], ['string', '[mood]'], ['punct', '}]'], ['variable', ' pastel'], ['punct', ']']],
  [['keyword', '  (case'], ['variable', ' mood']],
  [['string', '    :playful'], ['punct', ' ('], ['string', ':bow-accent'], ['variable', ' pastel'], ['punct', ')']],
  [['string', '    :dreamy'], ['punct', '  ('], ['string', ':lavender'], ['variable', ' pastel'], ['punct', ')']],
  [['string', '    :serene'], ['punct', '   ('], ['string', ':ribbon-blue'], ['variable', ' pastel'], ['punct', ')']],
  [['string', '    :warm'], ['punct', '    ('], ['string', ':soft-pink'], ['variable', ' pastel'], ['punct', '))']],
  [],
  [['function', '(ribbon-for'], ['punct', ' {'], ['string', ':mood'], ['punct', ' '], ['string', ':playful'], ['punct', '}'], ['variable', ' pastels'], ['punct', ')']],
  [['comment', ';; => "#C83D78"']],
];

const activeLineNumber = 19;
const cursorLineIndex = 18;

const escapeHtml = (text) =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

const codeLineHtml = (spans) =>
  spans.map(([scope, text]) => `<span class="tok tok-${scope}">${escapeHtml(text)}</span>`).join('');

const minimapLineHtml = (spans) =>
  spans
    .filter(([scope, text]) => text.trim().length > 0)
    .map(([scope, text]) => `<i style="background: var(--tok-${scope}); width: ${text.trim().length * 4}px"></i>`)
    .join('');

const icon = (paths, extra = '') =>
  `<svg class="icon" viewBox="0 0 16 16" ${extra} aria-hidden="true">${paths}</svg>`;

const icons = {
  files: icon(
    '<path d="M4 1.5h5.5L13 5v9.5H4z" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M6 1.5V4h4" fill="none" stroke="currentColor" stroke-width="1.1"/><path d="M2.5 4.5H9l1.5 1.5h3v8H2.5z" fill="none" stroke="currentColor" stroke-width="1.1" transform="translate(3.5 4)"/>',
  ),
  search: icon('<circle cx="6.5" cy="6.5" r="4.2" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M9.8 9.8 14 14" stroke="currentColor" stroke-width="1.7"/>'),
  branch: icon('<circle cx="4" cy="4" r="1.9" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="4" cy="12" r="1.9" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="6" r="1.9" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M4 6v4M5.7 5.2c2 .4 3 1.2 4.4 1.6" fill="none" stroke="currentColor" stroke-width="1.3"/>'),
  debug: icon('<path d="M4 2.8v10.4L13 8z" fill="currentColor"/>'),
  extensions: icon('<rect x="2" y="2" width="5" height="5" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="2" width="5" height="5" fill="none" stroke="currentColor" stroke-width="1.4"/><rect x="2" y="9" width="5" height="5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M9 9h5v5H9z" fill="currentColor"/>'),
  gear: icon('<circle cx="8" cy="8" r="2.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M8 1.6v2.2M8 12.2v2.2M1.6 8h2.2M12.2 8h2.2M3.5 3.5l1.6 1.6M10.9 10.9l1.6 1.6M12.5 3.5l-1.6 1.6M5.1 10.9l-1.6 1.6" stroke="currentColor" stroke-width="1.4"/>'),
  account: icon('<circle cx="8" cy="5.4" r="2.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2.8 13.4c.8-2.6 2.8-3.8 5.2-3.8s4.4 1.2 5.2 3.8" fill="none" stroke="currentColor" stroke-width="1.4"/>'),
  folder: icon('<path d="M1.5 3h4l1.5 2h7.5v8h-13z" fill="none" stroke="currentColor" stroke-width="1.3"/>'),
  folderOpen: icon('<path d="M1.5 3h4l1.5 2h7.5v2H4z" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M1.5 7H15l-1.8 6.5H1.5z" fill="none" stroke="currentColor" stroke-width="1.3"/>'),
  file: icon('<path d="M3.5 1.5h5L12.5 5v9.5h-9z" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8.5 1.5V5h4" fill="none" stroke="currentColor" stroke-width="1.1"/>'),
};

const treeRow = (label, { depth = 0, open = false, folder = false, selected = false, hovered = false } = {}) => {
  const iconHtml = folder
    ? `${open ? icons.folderOpen : icons.folder}`
    : icons.file;
  const chevron = folder
    ? `<span class="chevron">${open ? '▾' : '▸'}</span>`
    : '<span class="chevron spacer"></span>';
  return `<div class="tree-row${selected ? ' selected' : ''}${hovered ? ' hovered' : ''}" style="padding-left: ${14 + depth * 26}px">
    ${chevron}${iconHtml}<span class="tree-label">${escapeHtml(label)}</span>
  </div>`;
};

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>
  :root {
    --foreground: ${workbenchColor('foreground')};
    --description: ${workbenchColor('descriptionForeground')};
    --editor-bg: ${workbenchColor('editor.background')};
    --editor-fg: ${workbenchColor('editor.foreground')};
    --line-highlight: ${workbenchColor('editor.lineHighlightBackground')};
    --line-number: ${workbenchColor('editorLineNumber.foreground')};
    --line-number-active: ${workbenchColor('editorLineNumber.activeForeground')};
    --gutter-bg: ${workbenchColor('editorGutter.background')};
    --indent-guide: ${workbenchColor('editorIndentGuide.background1')};
    --cursor: ${workbenchColor('editorCursor.foreground')};
    --sidebar-bg: ${workbenchColor('sideBar.background')};
    --sidebar-fg: ${workbenchColor('sideBar.foreground')};
    --sidebar-border: ${workbenchColor('sideBar.border')};
    --sidebar-header-bg: ${workbenchColor('sideBarSectionHeader.background')};
    --sidebar-header-fg: ${workbenchColor('sideBarSectionHeader.foreground')};
    --activity-bg: ${workbenchColor('activityBar.background')};
    --activity-fg: ${workbenchColor('activityBar.foreground')};
    --activity-inactive: ${workbenchColor('activityBar.inactiveForeground')};
    --badge-bg: ${workbenchColor('activityBarBadge.background')};
    --badge-fg: ${workbenchColor('activityBarBadge.foreground')};
    --titlebar-bg: ${workbenchColor('titleBar.activeBackground')};
    --titlebar-fg: ${workbenchColor('titleBar.activeForeground')};
    --tab-active-bg: ${workbenchColor('tab.activeBackground')};
    --tab-active-fg: ${workbenchColor('tab.activeForeground')};
    --tab-inactive-bg: ${workbenchColor('tab.inactiveBackground')};
    --tab-inactive-fg: ${workbenchColor('tab.inactiveForeground')};
    --tab-border: ${workbenchColor('tab.border')};
    --border: ${workbenchColor('editorWidget.border')};
    --input-bg: ${workbenchColor('input.background')};
    --input-border: ${workbenchColor('input.border')};
    --list-active-bg: ${workbenchColor('list.activeSelectionBackground')};
    --list-active-fg: ${workbenchColor('list.activeSelectionForeground')};
    --list-hover-bg: ${workbenchColor('list.hoverBackground')};
    --status-bg: ${workbenchColor('statusBar.background')};
    --status-fg: ${workbenchColor('statusBar.foreground')};
    --status-border: ${workbenchColor('statusBar.border')};
    --status-remote-bg: ${workbenchColor('statusBarItem.remoteBackground')};
    --status-remote-fg: ${workbenchColor('statusBarItem.remoteForeground')};
    --terminal-bg: ${workbenchColor('terminal.background')};
    --terminal-fg: ${workbenchColor('terminal.foreground')};
    --ansi-green: ${workbenchColor('terminal.ansiGreen')};
    --ansi-blue: ${workbenchColor('terminal.ansiBlue')};
    --ansi-cyan: ${workbenchColor('terminal.ansiCyan')};
    --ansi-yellow: ${workbenchColor('terminal.ansiYellow')};
    --panel-title-active: ${workbenchColor('panelTitle.activeForeground')};
    --panel-title-inactive: ${workbenchColor('panelTitle.inactiveForeground')};
    --tok-comment: ${tokenColor('comment')};
    --tok-string: ${tokenColor('string')};
    --tok-number: ${tokenColor('constant.numeric')};
    --tok-keyword: ${tokenColor('keyword')};
    --tok-function: ${tokenColor('entity.name.function')};
    --tok-type: ${tokenColor('entity.name.type')};
    --tok-variable: ${tokenColor('variable')};
    --tok-punct: ${tokenColor('keyword.operator')};
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  html, body { width: ${previewWidth}px; height: ${previewHeight}px; overflow: hidden; }

  body {
    display: flex;
    flex-direction: column;
    font-family: 'Cantarell', 'Noto Sans', sans-serif;
    color: var(--foreground);
    -webkit-font-smoothing: antialiased;
  }

  .icon { width: 26px; height: 26px; display: inline-block; vertical-align: middle; }

  /* Title bar */
  .titlebar {
    height: 64px;
    flex: none;
    background: var(--titlebar-bg);
    color: var(--titlebar-fg);
    display: flex;
    align-items: center;
    font-size: 22px;
    padding: 0 18px;
  }
  .menubar { display: flex; gap: 26px; flex: none; }
  .menubar span { padding: 4px 8px; border-radius: 6px; }
  .menubar span:hover { background: var(--list-hover-bg); }
  .command-center {
    flex: 1;
    display: flex;
    justify-content: center;
  }
  .command-pill {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    border-radius: 999px;
    padding: 8px 26px;
    min-width: 560px;
    color: var(--description);
    font-size: 21px;
  }
  .command-pill .icon { width: 22px; height: 22px; color: var(--description); }
  .window-controls { display: flex; gap: 30px; flex: none; margin-left: 26px; color: var(--description); font-size: 24px; }

  .workbench { flex: 1; display: flex; min-height: 0; }

  /* Activity bar */
  .activitybar {
    width: 76px;
    flex: none;
    background: var(--activity-bg);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 14px 0;
    gap: 10px;
  }
  .activity-item {
    width: 56px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    color: var(--activity-inactive);
    border-radius: 10px;
  }
  .activity-item .icon { width: 30px; height: 30px; }
  .activity-item.active { color: var(--activity-fg); }
  .activity-item.active::before {
    content: '';
    position: absolute;
    left: -10px;
    top: 6px;
    bottom: 6px;
    width: 3px;
    background: var(--activity-fg);
  }
  .activity-item .badge {
    position: absolute;
    right: 2px;
    bottom: 2px;
    min-width: 22px;
    height: 22px;
    border-radius: 11px;
    background: var(--badge-bg);
    color: var(--badge-fg);
    font-size: 15px;
    line-height: 22px;
    text-align: center;
    font-weight: 600;
  }
  .activity-spacer { flex: 1; }

  /* Sidebar */
  .sidebar {
    width: 580px;
    flex: none;
    background: var(--sidebar-bg);
    color: var(--sidebar-fg);
    border-right: 1px solid var(--sidebar-border);
    display: flex;
    flex-direction: column;
  }
  .sidebar-header {
    height: 54px;
    flex: none;
    background: var(--sidebar-header-bg);
    color: var(--sidebar-header-fg);
    display: flex;
    align-items: center;
    font-size: 20px;
    letter-spacing: 2.5px;
    font-weight: 700;
    padding: 0 22px;
  }
  .sidebar-actions { margin-left: auto; display: flex; gap: 20px; color: var(--description); font-size: 21px; }
  .tree { padding-top: 10px; font-size: 22px; }
  .tree-row {
    height: 46px;
    display: flex;
    align-items: center;
    gap: 10px;
    white-space: nowrap;
  }
  .tree-row.selected { background: var(--list-active-bg); color: var(--list-active-fg); }
  .tree-row.hovered { background: var(--list-hover-bg); }
  .tree-row .icon { width: 24px; height: 24px; flex: none; }
  .chevron { width: 20px; text-align: center; color: var(--description); font-size: 17px; flex: none; }
  .chevron.spacer { visibility: hidden; }

  /* Editor group */
  .editor-group { flex: 1; display: flex; flex-direction: column; min-width: 0; }

  .tabs {
    height: 58px;
    flex: none;
    display: flex;
    background: var(--tab-inactive-bg);
    border-bottom: 1px solid var(--tab-border);
  }
  .tab {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 26px;
    font-size: 22px;
    border-right: 1px solid var(--tab-border);
    color: var(--tab-inactive-fg);
  }
  .tab .icon { width: 22px; height: 22px; }
  .tab.active { background: var(--tab-active-bg); color: var(--tab-active-fg); }
  .tab .close { color: var(--description); font-size: 19px; margin-left: 6px; }
  .tabs-edge { flex: 1; background: var(--tab-inactive-bg); }

  .breadcrumbs {
    height: 46px;
    flex: none;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 0 26px;
    font-size: 20px;
    color: var(--description);
    background: var(--tab-active-bg);
  }

  .editor-body { flex: 1; display: flex; min-height: 0; background: var(--editor-bg); }

  .code-area {
    flex: 1;
    display: flex;
    font-family: 'Source Code Pro', 'DejaVu Sans Mono', monospace;
    font-size: 26px;
    line-height: 46px;
    position: relative;
    overflow: hidden;
  }
  .gutter {
    width: 118px;
    flex: none;
    text-align: right;
    padding-right: 26px;
    color: var(--line-number);
    background: var(--gutter-bg);
    user-select: none;
  }
  .gutter .ln.active { color: var(--line-number-active); }
  .lines { position: relative; white-space: pre; }
  .code-line { display: block; height: 46px; }
  .code-line.active { background: var(--line-highlight); }
  .cursor {
    position: absolute;
    top: ${cursorLineIndex * 46 + 2}px;
    left: 690px;
    width: 3px;
    height: 40px;
    background: var(--cursor);
  }
  .tok-comment { color: var(--tok-comment); font-style: ${tokenStyle('comment')}; }
  .tok-string { color: var(--tok-string); }
  .tok-number { color: var(--tok-number); }
  .tok-keyword { color: var(--tok-keyword); }
  .tok-function { color: var(--tok-function); }
  .tok-type { color: var(--tok-type); }
  .tok-variable { color: var(--tok-variable); }
  .tok-punct { color: var(--tok-punct); }
  .scrollbar-thumb {
    position: absolute;
    right: 128px;
    top: 96px;
    width: 9px;
    height: 320px;
    border-radius: 5px;
    background: var(--sidebar-border);
  }

  .minimap {
    width: 112px;
    flex: none;
    border-left: 1px solid var(--sidebar-border);
    padding: 10px 8px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .minimap i { display: block; height: 3px; border-radius: 1px; margin-bottom: 2px; opacity: 0.85; }

  /* Terminal panel */
  .panel {
    height: 300px;
    flex: none;
    background: var(--terminal-bg);
    border-top: 1px solid var(--tab-border);
    display: flex;
    flex-direction: column;
  }
  .panel-tabs {
    height: 50px;
    flex: none;
    display: flex;
    align-items: center;
    gap: 34px;
    padding: 0 26px;
    font-size: 20px;
    letter-spacing: 1px;
    color: var(--panel-title-inactive);
  }
  .panel-tabs .active {
    color: var(--panel-title-active);
    border-bottom: 2px solid var(--panel-title-active);
    padding-bottom: 6px;
    font-weight: 700;
  }
  .panel-actions { margin-left: auto; display: flex; gap: 24px; color: var(--description); font-size: 20px; }
  .terminal-body {
    flex: 1;
    padding: 10px 26px;
    font-family: 'Source Code Pro', 'DejaVu Sans Mono', monospace;
    font-size: 23px;
    line-height: 40px;
    color: var(--terminal-fg);
    white-space: pre;
  }
  .term-green { color: var(--ansi-green); font-weight: 700; }
  .term-blue { color: var(--ansi-blue); font-weight: 700; }
  .term-cyan { color: var(--ansi-cyan); }
  .term-yellow { color: var(--ansi-yellow); }
  .term-cursor { display: inline-block; width: 13px; height: 30px; background: var(--cursor); vertical-align: middle; }

  /* Status bar */
  .statusbar {
    height: 56px;
    flex: none;
    background: var(--status-bg);
    color: var(--status-fg);
    border-top: 1px solid var(--status-border);
    display: flex;
    align-items: center;
    font-size: 21px;
    padding: 0 14px;
    gap: 30px;
  }
  .status-item { display: flex; align-items: center; gap: 9px; white-space: nowrap; }
  .remote {
    background: var(--status-remote-bg);
    color: var(--status-remote-fg);
    height: 100%;
    padding: 0 18px;
    margin: 0 4px;
    display: flex;
    align-items: center;
    gap: 9px;
  }
  .status-right { margin-left: auto; display: flex; gap: 30px; }
</style>
</head>
<body>
  <div class="titlebar">
    <div class="menubar">
      <span>File</span><span>Edit</span><span>Selection</span><span>View</span><span>Go</span><span>Run</span><span>Terminal</span><span>Help</span>
    </div>
    <div class="command-center">
      <div class="command-pill">${icons.search} ribbon-workshop</div>
    </div>
    <div class="window-controls"><span>─</span><span>▢</span><span>✕</span></div>
  </div>

  <div class="workbench">
    <div class="activitybar">
      <div class="activity-item active">${icons.files}</div>
      <div class="activity-item">${icons.search}</div>
      <div class="activity-item">${icons.branch}<span class="badge">2</span></div>
      <div class="activity-item">${icons.debug}</div>
      <div class="activity-item">${icons.extensions}</div>
      <div class="activity-spacer"></div>
      <div class="activity-item">${icons.account}</div>
      <div class="activity-item">${icons.gear}</div>
    </div>

    <div class="sidebar">
      <div class="sidebar-header">EXPLORER<span class="sidebar-actions"><span>⋯</span></span></div>
      <div class="tree">
        ${treeRow('ribbon-workshop', { folder: true, open: true, depth: 0 })}
        ${treeRow('src', { folder: true, open: true, depth: 1 })}
        ${treeRow('ribbon', { folder: true, open: true, depth: 2 })}
        ${treeRow('workshop.clj', { depth: 3, selected: true })}
        ${treeRow('pastels.clj', { depth: 3 })}
        ${treeRow('test', { folder: true, depth: 1 })}
        ${treeRow('deps.edn', { depth: 1, hovered: true })}
        ${treeRow('README.md', { depth: 1 })}
      </div>
    </div>

    <div class="editor-group">
      <div class="tabs">
        <div class="tab active">${icons.file} workshop.clj <span class="close">✕</span></div>
        <div class="tab">${icons.file} pastels.clj</div>
        <div class="tab">${icons.file} deps.edn</div>
        <div class="tabs-edge"></div>
      </div>
      <div class="breadcrumbs">
        <span>ribbon-workshop</span><span>›</span><span>src</span><span>›</span><span>ribbon</span><span>›</span><span>workshop.clj</span>
      </div>
      <div class="editor-body">
        <div class="code-area">
          <div class="gutter">
            ${bufferLines.map((_, index) => `<span class="ln${index + 1 === activeLineNumber ? ' active' : ''}">${index + 1}</span><br>`).join('')}
          </div>
          <div class="lines">
            ${bufferLines.map((spans, index) => `<span class="code-line${index + 1 === activeLineNumber ? ' active' : ''}">${spans.length > 0 ? codeLineHtml(spans) : ' '}</span>`).join('\n')}
            <div class="cursor"></div>
          </div>
          <div class="scrollbar-thumb"></div>
        </div>
        <div class="minimap">
          ${bufferLines.map((spans) => (spans.length > 0 ? minimapLineHtml(spans) : '<i></i>')).join('\n')}
        </div>
      </div>

      <div class="panel">
        <div class="panel-tabs">
          <span>PROBLEMS</span><span>OUTPUT</span><span>DEBUG CONSOLE</span><span class="active">TERMINAL</span>
          <span class="panel-actions"><span>bash</span><span>+</span><span>⌄</span><span>✕</span></span>
        </div>
        <div class="terminal-body"><span class="term-green">lollie@ribbon-workshop</span>:<span class="term-blue">~/dev/ribbon-workshop</span>$ clojure -M:dev
Clojure 1.12.0
user=&gt; <span class="term-cyan">(println "ribbon ready! 🎀")</span>
<span class="term-yellow">ribbon ready! 🎀</span>
nil
user=&gt; <span class="term-cursor"></span></div>
      </div>
    </div>
  </div>

  <div class="statusbar">
    <div class="remote">${icons.branch} SSH: ribbon-workshop</div>
    <div class="status-item"><span>⎇</span> main<span>✱1</span></div>
    <div class="status-item"><span>↻</span> 1↓ 1↑</div>
    <div class="status-item"><span>⊗</span> 0 &nbsp; <span>⚠</span> 0</div>
    <div class="status-right">
      <span class="status-item">Ln 19, Col 28</span>
      <span class="status-item">Spaces: 2</span>
      <span class="status-item">UTF-8</span>
      <span class="status-item">LF</span>
      <span class="status-item">Clojure</span>
      <span class="status-item">🎀</span>
    </div>
  </div>
</body>
</html>
`;

const render = () => {
  mkdirSync(scratchDir, { recursive: true });
  const htmlPath = path.join(scratchDir, 'preview.html');
  const rawPngPath = path.join(scratchDir, 'preview-raw.png');
  writeFileSync(htmlPath, html);

  execFileSync('firefox', [
    '--headless',
    '--screenshot', rawPngPath,
    '--window-size', `${previewWidth},${previewHeight}`,
    `file://${htmlPath}`,
  ], { stdio: 'inherit' });

  execFileSync('magick', [
    rawPngPath,
    '-strip',
    '-background', 'white',
    '-alpha', 'remove',
    '-alpha', 'off',
    '-define', 'png:compression-level=9',
    '-define', 'png:compression-strategy=1',
    previewPath,
  ], { stdio: 'inherit' });

  const previewBytes = readFileSync(previewPath).byteLength;
  console.log(`rendered ${previewWidth}×${previewHeight} preview → ${previewPath} (${previewBytes} bytes)`);
};

render();
