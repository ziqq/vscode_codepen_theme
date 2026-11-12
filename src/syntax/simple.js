/**
 * @file Lexical corrections for Sass syntax roles and C4 declaration references.
 * Unrecognized syntax keeps the grammar or semantic-provider foreground.
 */

const { Spans } = require('./spans');
const { addComment } = require('./comments');

// A conservative lexer for the two formats without a bundled structural parser.
// It only refines proven identifiers or punctuation, never strings/comments.
/**
 * Apply conservative Sass/C4 refinements after masking comments and strings.
 *
 * @param {string} source Document text; offsets are UTF-16 code units.
 * @param {string} language VS Code language identifier used to select syntax rules.
 * @returns {import('./spans').Span[]} Sorted, non-overlapping foreground refinements.
 */
function refineSimple(source, language) {
  const spans = new Spans(source.length);
  const masked = source.replace(/\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\n]*|"(?:\\.|[^"\\])*(?:"|$)|'(?:\\.|[^'\\])*(?:'|$)/g,
    (text, at) => {
      if (text.startsWith('//') || text.startsWith('/*')) {
        addComment(spans, source, at, at + text.length);
      }
      return text.replace(/[^\n]/g, ' ');
    });
  if (language === 'sass') {
    // Match the measured CodePen Sass mode, including its directive and mixin
    // roles. An @directive is Sass control syntax, not an annotation marker.
    for (const match of masked.matchAll(/[():=%]/g)) spans.add(match.index, match.index + 1, 'operator');
    for (const match of masked.matchAll(/[\[\],]/g)) spans.add(match.index, match.index + 1, 'white', 20);
    for (const match of masked.matchAll(/@[A-Za-z_][\w-]*/g)) {
      spans.add(match.index, match.index + match[0].length, 'blue', 30);
    }
    for (const match of masked.matchAll(/(?<![$\w-])[A-Za-z_][\w-]*(?=\s*\()/g)) {
      spans.add(match.index, match.index + match[0].length, 'yellow', 20);
    }
    for (const match of masked.matchAll(/^(\s*)[=+]([A-Za-z_][\w-]*)/gm)) {
      const start = match.index + match[1].length;
      spans.add(start, start + match[2].length + 1, masked[start] === '=' ? 'purple' : 'white', 40);
    }
    // The Sass mode distinguishes numeric units from ordinary CSS value words.
    for (const match of masked.matchAll(/(?<![\w$-])-?(?:\d*\.)?\d+([A-Za-z]+)/g)) {
      const start = match.index + match[0].length - match[1].length;
      spans.add(start, start + match[1].length, /^(?:px|em|in)$/.test(match[1]) ? 'orange' : 'yellow', 30);
    }
    for (const match of masked.matchAll(/^\s*@(?:each|for)\b[^\n]*/gm)) {
      for (const word of match[0].matchAll(/\b(?:in|from|through|to)\b/g)) {
        spans.add(match.index + word.index, match.index + word.index + word[0].length,
          word[0] === 'in' ? 'orange' : 'yellow', 30);
      }
    }
    for (const match of masked.matchAll(/#\{|\}/g)) {
      spans.add(match.index, match.index + match[0].length, 'operator', 30);
    }
    // Pseudo selectors are a single variable-3 token, including their colon.
    for (const line of masked.matchAll(/^[\t ]*[.#&%>~][^\n]*/gm)) {
      for (const pseudo of line[0].matchAll(/::?[A-Za-z_][\w-]*/g)) {
        spans.add(line.index + pseudo.index, line.index + pseudo.index + pseudo[0].length, 'white', 30);
      }
    }
    for (const match of masked.matchAll(/#(?:[\da-f]{8}|[\da-f]{6}|[\da-f]{4}|[\da-f]{3})(?![\da-f])/gi)) {
      const lineStart = masked.lastIndexOf('\n', match.index) + 1;
      // A hash at a selector position may be an ID, not a color literal.
      if (masked.slice(lineStart, match.index).includes(':') &&
          !/^[\t ]*[.#&%>~]/.test(masked.slice(lineStart, match.index))) {
        spans.add(match.index, match.index + match[0].length, 'orange', 30);
      }
    }
  } else if (language === 'c4') {
    const names = new Set([...masked.matchAll(/\b([A-Za-z_][\w]*)\s*=\s*(?:person|softwareSystem|container|component|deploymentNode|infrastructureNode)\b/g)].map((match) => match[1]));
    for (const match of masked.matchAll(/\b[A-Za-z_][\w]*\b/g)) {
      if (names.has(match[0])) spans.add(match.index, match.index + match[0].length, 'blue');
    }
  }
  return spans.finish();
}

module.exports = { refineSimple };
