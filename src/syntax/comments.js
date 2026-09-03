/**
 * Add the base comment color and the two portable documentation constructs
 * understood by every supported parser: inline code and symbol references.
 * Decorations change foreground only, so the active theme still owns italics.
 */
function addComment(spans, source, start, end, fontStyle) {
  spans.add(start, end, 'gray', 100, fontStyle);
  const text = source.slice(start, end);

  // Markdown-style inline code is common in Dartdoc, JSDoc, Rustdoc, and
  // ordinary explanatory comments. Do not cross a line or an escaped tick.
  for (const match of text.matchAll(/(?<!\\)`[^`\r\n]+(?<!\\)`/g)) {
    spans.add(start + match.index, start + match.index + match[0].length,
      'white', 130, fontStyle);
  }

  // Square-bracket symbol references are canonical Dartdoc and also occur in
  // Javadoc/Rustdoc prose. They are documentation markup, not live code roles:
  // both the delimiters and referenced name stay neutral white.
  for (const match of text.matchAll(/\[([A-Za-z_$][\w$]*(?:[.#][A-Za-z_$][\w$]*)*)\]/g)) {
    const at = start + match.index;
    spans.add(at, at + 1, 'white', 120, fontStyle);
    spans.add(at + match[0].length - 1, at + match[0].length,
      'white', 120, fontStyle);
    spans.add(at + 1, at + match[0].length - 1,
      'white', 120, fontStyle);
  }
}

module.exports = { addComment };
