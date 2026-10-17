<p align="center">
  <img src="https://raw.githubusercontent.com/hai-lollie/sylveon-light-theme-vscode/main/assets/icon-512.png" width="256" height="256" alt="An abstract pastel pink and blue ribbon with a lavender sparkle" />
</p>

<h1 align="center">Sylveon Light 🎀</h1>

<p align="center">A little pastel magic for your editor.</p>

A soft light colour theme inspired by Sylveon, J-fashion, and kawaii culture. Warm pink editor surfaces, ribbon-blue accents, and lavender details bring a playful touch to everyday coding. 💙

## Features

- Coordinated editor, sidebar, tabs, terminal, and workbench colours.
- A ribbon-blue status bar with readable pastel debugging, remote, offline, error, and warning states, plus hover and keyboard-focus treatments.
- Syntax highlighting and semantic token colours.
- An original abstract ribbon logo, available as SVG and 128px, 256px, and 512px PNGs in [`assets/`](assets/).
- A declarative theme with no executable extension entry point or runtime dependencies.

## Installation

Requires **Visual Studio Code 1.85.0 or later** within the declared `^1.85.0` compatibility range. The VSIX is platform-independent for VS Code desktop on Windows, macOS, and Linux, subject to your organisation's extension policy.

### Visual Studio Marketplace

Search for **Sylveon Light** by **hai-lollie** in the Extensions view, or run:

```sh
code --install-extension hai-lollie.sylveon-light-vscode
```

The listing URL is [hai-lollie.sylveon-light-vscode](https://marketplace.visualstudio.com/items?itemName=hai-lollie.sylveon-light-vscode). Marketplace publication is separate from GitHub releases, so the available versions may differ. If the required version is not listed yet, use its GitHub release VSIX or build it locally.

### Install a VSIX

Download `sylveon-light-vscode-1.0.1.vsix` from the [v1.0.1 GitHub release](https://github.com/hai-lollie/sylveon-light-theme-vscode/releases/tag/v1.0.1). Verify its SHA-256 checksum against the release's `SHA256SUMS` file, then run:

```sh
code --install-extension ./sylveon-light-vscode-1.0.1.vsix
```

You can also use **Extensions → … → Install from VSIX…**.

After installation, open **Preferences: Color Theme** from the Command Palette and select **Sylveon Light**. ✨

## Source and security review

| Item | Value |
| --- | --- |
| Source | https://github.com/hai-lollie/sylveon-light-theme-vscode |
| Publisher ID | `hai-lollie` |
| Extension ID | `hai-lollie.sylveon-light-vscode` |
| Version | `1.0.1` |
| Source tag | `v1.0.1` |
| Distribution filename | `sylveon-light-vscode-1.0.1.vsix` |
| License | [MIT](LICENSE) |

For an exact approval record, use the published release's source commit, VSIX download URL, and SHA-256 checksum. These are established when the release is published, not by this README alone.

The installed extension consists of the manifest, theme JSON, PNG icon, and release documentation. It has no JavaScript extension entry point, extension activation hooks, runtime dependencies, bundled extensions, or telemetry implementation. Documentation images are hosted on GitHub. Packaging tools, tests, editable SVG artwork, and the larger PNGs are development/source assets and are excluded from the VSIX.

Corporate approval is still required where an extension policy is enforced. VS Code administrators can [allow an exact extension ID and version](https://code.visualstudio.com/docs/enterprise/extensions#allow-specific-versions-or-platforms); this project does not bypass those controls.

## Development

Use **Node.js 22 or later** and npm:

```sh
npm ci --ignore-scripts
npm test
npm run package
```

The packaging command runs the tests before producing `sylveon-light-vscode-1.0.1.vsix`. The packaging tool is pinned in `package.json`, with its dependency versions recorded in `package-lock.json`. It is a development dependency, not a runtime dependency of the installed theme.

Inspect the package and generate a checksum before distributing it:

```sh
npx --no-install vsce ls --no-dependencies
sha256sum sylveon-light-vscode-1.0.1.vsix > SHA256SUMS
```

On Windows, PowerShell's `Get-FileHash -Algorithm SHA256` can calculate the same checksum.

## Inspiration and license

This is an unofficial fan-inspired theme, not affiliated with or endorsed by Nintendo, Game Freak, or The Pokémon Company. The logo is an original abstract ribbon design and does not depict a Pokémon character.

Project code and original artwork are available under the [MIT license](LICENSE). Third-party names and trademarks remain the property of their respective owners.
