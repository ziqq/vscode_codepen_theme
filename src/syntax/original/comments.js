/**
 * Add the base comment color and the two portable documentation constructs
 * understood by every supported parser: inline code and symbol references.
 * Decorations change foreground only, so the active theme still owns italics.
 *
 * `resolve(name)` may return the role of a reference that names a declaration
 * the parser can see (for example a parameter of the documented function).
 */
function addComment(spans, source, start, end, fontStyle, resolve) {
  spans.add(start, end, 'gray', 100, fontStyle);
  const text = source.slice(start, end);

  // Markdown-style inline code is common in Dartdoc, JSDoc, Rustdoc, and
  // ordinary explanatory comments. Do not cross a line or an escaped tick.
  for (const match of text.matchAll(/(?<!\\)`[^`\r\n]+(?<!\\)`/g)) {
    spans.add(start + match.index, start + match.index + match[0].length,
      'white', 130, fontStyle);
  }

  // Square-bracket symbol references are canonical Dartdoc and also occur in
  // Javadoc/Rustdoc prose. Names take their code role; delimiters and generic
  // punctuation stay muted so the reference does not outshine the prose.
  // A following `(` marks a Markdown link rather than a symbol reference.
  for (const match of text.matchAll(/\[([A-Za-z_$](?:[\w$.#<>?()]|, ?)*)\](?!\()/g)) {
    const at = start + match.index;
    spans.add(at, at + match[0].length, 'operator', 120, fontStyle);
    for (const name of match[1].matchAll(/[A-Za-z_$][\w$]*/g)) {
      const offset = at + 1 + name.index;
      const qualified = name.index > 0 && /[.#]/.test(match[1][name.index - 1]);
      const role = (!qualified && resolve?.(name[0])) ||
        (/^[A-Z]/.test(name[0]) ? 'white' : 'purple');
      spans.add(offset, offset + name[0].length, role, 121, fontStyle);
    }
  }
}

module.exports = { addComment };
