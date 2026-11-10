# Changelog

## Unreleased

- Add a generated workbench preview to the README, rendered from the theme's own colours with `npm run render:preview` (Firefox headless) and covered by PNG regression tests.

## 1.0.1

- Use a pastel ribbon-blue status bar for workspace and no-folder windows, replacing VS Code's inherited dark-purple no-folder background.
- Style all 36 current status-bar colour tokens, including inactive windows, debugging, prominent, remote, offline, error, and warning items.
- Coordinate hover, pressed, compact-item, border, and keyboard-focus colours while preserving distinct state indicators.
- Add status-bar coverage and contrast regression tests; text contrast is at least 7.08:1 across the configured status-bar backgrounds.

## 1.0.0

- Initial release preparation for Sylveon Light.
- Pastel light workbench, terminal, syntax, and semantic token colours.
- Original ribbon logo in SVG and 128px, 256px, and 512px PNG formats.
- MIT license, source links, release validation tests, and VSIX packaging support.
