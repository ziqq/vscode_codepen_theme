# Syntax refinement dependencies

The parsers below are distributed without modification as WebAssembly files from
`tree-sitter-wasm` 1.1.6. Its package integrity is pinned in `package-lock.json`.
Only the listed parsers are included; editor queries and unrelated parsers are not.

| Parser | Upstream source | License and copyright |
| --- | --- | --- |
| C | https://github.com/tree-sitter/tree-sitter-c/tree/v0.24.1 | MIT; Copyright (c) 2014 Max Brunsfeld |
| C++ | https://github.com/tree-sitter/tree-sitter-cpp/tree/v0.23.4 | MIT; Copyright (c) 2014 Max Brunsfeld |
| C# | https://github.com/tree-sitter/tree-sitter-c-sharp/tree/v0.23.5 | MIT; Copyright (c) 2014-2023 Max Brunsfeld, Damien Guard, Amaan Qureshi, and contributors. |
| Dart | https://github.com/UserNobody14/tree-sitter-dart/tree/be07cf7118d3dba06236a3f19541685a68209934 | MIT; Copyright (c) 2020-2023 UserNobody14 and others |
| Go | https://github.com/tree-sitter/tree-sitter-go/tree/v0.25.0 | MIT; Copyright (c) 2014 Max Brunsfeld |
| Java | https://github.com/tree-sitter/tree-sitter-java/tree/v0.23.5 | MIT; Copyright (c) 2017 Ayman Nadeem |
| Just | https://github.com/casey/tree-sitter-just/tree/5685543a6e64f66335e25518c9ae8ffa1dae3d01 | Apache-2.0; Casey Rodarmor and contributors |
| Kotlin | https://github.com/fwcd/tree-sitter-kotlin/tree/0.3.8 | MIT; Copyright (c) 2019 fwcd |
| Make | https://github.com/tree-sitter-grammars/tree-sitter-make/tree/70613f3d812cbabbd7f38d104d60a409c4008b43 | MIT; Copyright (c) 2021 Alexandre A. Muller |
| PHP | https://github.com/tree-sitter/tree-sitter-php/tree/3fda2fb9577166c6399834917f9844f30370beea | MIT; Copyright (c) 2017 Josh Vera, GitHub; Copyright (c) 2019 Max Brunsfeld, Amaan Qureshi, Christian Frøystad, Caleb White |
| Python | https://github.com/tree-sitter/tree-sitter-python/tree/v0.25.0 | MIT; Copyright (c) 2016 Max Brunsfeld |
| Ruby | https://github.com/tree-sitter/tree-sitter-ruby/tree/v0.23.1 | MIT; Copyright (c) 2016 Rob Rix |
| Rust | https://github.com/tree-sitter/tree-sitter-rust/tree/v0.24.0 | MIT; Copyright (c) 2017 Maxim Sokolov |
| SQL | https://github.com/DerekStride/tree-sitter-sql/tree/v0.3.11 | MIT; Copyright (c) 2021 Derek Stride |
| Swift | https://github.com/alex-pinkus/tree-sitter-swift/tree/0.7.1 | MIT; Copyright (c) 2021 alex-pinkus |
| Bash | https://github.com/tree-sitter/tree-sitter-bash/tree/v0.25.1 | MIT; Copyright (c) 2017 Max Brunsfeld |
| HTML | https://github.com/tree-sitter/tree-sitter-html/tree/v0.23.2 | MIT; Copyright (c) 2014 Max Brunsfeld |
| Svelte | https://github.com/Himujjal/tree-sitter-svelte/tree/60ea1d673a1a3eeeb597e098d9ada9ed0c79ef4b | MIT; Copyright © Himujjal Upadhyaya <himu@tuta.io> |
| Vue | https://github.com/tree-sitter-grammars/tree-sitter-vue/tree/ce8011a414fdf8091f4e4071752efc376f4afb08 | MIT; Copyright (c) 2024 Amaan Qureshi <amaanq12@gmail.com> |
| Markdown | https://github.com/tree-sitter-grammars/tree-sitter-markdown/tree/a0a00f817d02412bd92c54d316f164d827b57b5c | MIT; Copyright (c) 2021 Matthias Deiml |

## MIT License (the MIT-licensed parsers above)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Other bundled dependencies

- TypeScript 6.0.3: Microsoft Corporation, Apache-2.0. See
  `licenses/typescript-LICENSE.txt` and `licenses/typescript-NOTICES.txt`.
- web-tree-sitter 0.27.0: Tree-sitter contributors, MIT. See
  `licenses/web-tree-sitter-LICENSE`.
- tree-sitter-wasm 1.1.6: see `licenses/tree-sitter-wasm-LICENSE`.
- The complete Apache-2.0 license applicable to Just is in `licenses/APACHE-2.0.txt`.

Parser source links identify the upstream baselines declared by the WASM package;
the artifact hashes in `manifest.json` identify the exact distributed binaries.
