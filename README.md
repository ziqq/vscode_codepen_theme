# CodePen Theme Original

CodePen’s classic Twilight palette for Visual Studio Code. Blue bindings and constants, purple members, warm yellow keywords, and soft green strings.

· [Install from Marketplace](https://marketplace.visualstudio.com/items?itemName=ziqq.codepen-theme-original)<br/>
· [Explore all 68 languages](https://vscode-codepen-theme.ustinoff.dev/)<br/>
· [Download VSIX](https://github.com/ziqq/vscode_codepen_theme/releases)<br/>

## Install

Install [CodePen Theme Original](https://marketplace.visualstudio.com/items?itemName=ziqq.codepen-theme-original), open **Preferences: Color Theme**, and choose a variant:

| Theme | Style |
| --- | --- |
| **CodePen Theme Original** | Upright syntax with italic annotation and decorator names. |
| **CodePen Theme Original Italics** | The same palette with the full italic syntax layer. |

Version **1.0.0** requires **VS Code 1.96.0 or newer**. Upgrading from 0.12.x? See the [migration guide](MIGRATION.md).

To install a downloaded [VSIX](https://github.com/ziqq/vscode_codepen_theme/releases):

```sh
code --install-extension ./codepen-theme-original.vsix --force
```

You can also use **Extensions: Install from VSIX…**, then select the theme.

## See it in your language

The [interactive gallery](https://vscode-codepen-theme.ustinoff.dev/) includes real editor captures for **all 68 verified languages and formats**, language search, enlarged previews, and links to the sample source files. Diagnostics and error indicators are hidden in the preview profile so you can see the theme clearly.

| Dart | Rust |
| --- | --- |
| [![Dart fields, annotations and constants](./assets/preview_dart_II.webp)](https://vscode-codepen-theme.ustinoff.dev/#dart) | [![Rust fields and attributes](./assets/preview_rust_I.webp)](https://vscode-codepen-theme.ustinoff.dev/#rust) |
| **Java** | **Sass** |
| [![Java constants and methods](./assets/preview_java.webp)](https://vscode-codepen-theme.ustinoff.dev/#java) | [![Sass variables and mixins](./assets/preview_sass.webp)](https://vscode-codepen-theme.ustinoff.dev/#sass) |

**Web:** JavaScript, TypeScript, JSX, TSX, HTML, CSS, SCSS, Sass, Vue, Svelte, and more.<br>
**Applications:** Dart, Java, Kotlin, Rust, Go, Python, C, C++, C#, Swift, and more.<br>
**Data & tooling:** JSON, YAML, TOML, SQL, Dockerfile, Makefile, Justfile, and more.

[Open the full gallery →](https://vscode-codepen-theme.ustinoff.dev/) · [Markdown screenshot gallery](docs/SCREENSHOTS.md) · [Verified language providers](docs/LANGUAGE-SUPPORT.md)

## Highlighting

| Color | Role |
| --- | --- |
| Blue | Bindings and resolved constants. |
| Purple | Fields, properties, and methods. |
| Yellow | Keywords, global references, and annotation names. |
| Green | Strings. |
| Orange | Numbers. |
| Gray / white | Comments, operators, and punctuation according to their syntax role. |

TextMate and semantic highlighting share the palette. Contextual refinement is enabled by default to distinguish syntax that grammars leave ambiguous. See [highlighting](docs/HIGHLIGHTING.md) for language-specific rules and boundaries, and [configuration](docs/CONFIGURATION.md) to adjust typography or refinement.

Grammars come from VS Code and optional [language extensions](docs/LANGUAGE-SUPPORT.md). Installing the theme does not install language servers or SDKs.

## Development

See the [development guide](docs/DEVELOPMENT.md) for building and verifying the VSIX, and the [compatibility contract](compatibility/README.md) for provider versions and validation coverage. The gallery lives in [samples/index.html](samples/index.html), with its captures in [samples/screenshots](samples/screenshots/).

Made with 🖤 by [ziqq](https://github.com/ziqq). 

Licensed under [Apache-2.0](LICENSE).
