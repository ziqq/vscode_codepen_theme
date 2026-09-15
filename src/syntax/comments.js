/**
 * Add the base comment color and the two portable documentation constructs
 * understood by every supported parser: inline code and symbol references.
 * Type-shaped references reuse the live-code type role instead of becoming a
 * third live-code color. Neutral references use a dedicated softly muted
 * white so documentation metadata remains readable without competing with
 * executable code. The active theme still owns italics.
 */
function addComment(spans, source, start, end, fontStyle) {
  spans.add(start, end, 'gray', 100, fontStyle);
  const text = source.slice(start, end);
  const builtInTypes = new Set([
    'bool', 'boolean', 'byte', 'char', 'double', 'float', 'int', 'integer',
    'long', 'never', 'num', 'number', 'object', 'short', 'string', 'symbol',
    'unit', 'unknown', 'void',
  ]);
  const referenceRole = (value) => {
    const head = value.replace(/^[#@]/, '').split(/[.#]/, 1)[0];
    return /^[A-Z]/.test(head) || builtInTypes.has(head.toLowerCase())
      ? 'yellow'
      : 'documentation';
  };

  // Markdown-style inline code is common in Dartdoc, JSDoc, Rustdoc, and
  // ordinary explanatory comments. Do not cross a line or an escaped tick.
  for (const match of text.matchAll(/(?<!\\)`[^`\r\n]+(?<!\\)`/g)) {
    const at = start + match.index;
    spans.add(at, at + 1, 'documentation', 130, fontStyle);
    spans.add(at + match[0].length - 1, at + match[0].length,
      'documentation', 130, fontStyle);
    spans.add(at + 1, at + match[0].length - 1,
      referenceRole(match[0].slice(1, -1)), 130, fontStyle);
  }

  // Square-bracket symbol references are canonical Dartdoc and also occur in
  // Javadoc/Rustdoc prose. Delimiters remain neutral while type-shaped symbols
  // use the same yellow role as their declarations and live references.
  for (const match of text.matchAll(/\[([A-Za-z_$][\w$]*(?:[.#][A-Za-z_$][\w$]*)*)\]/g)) {
    const at = start + match.index;
    spans.add(at, at + 1, 'documentation', 120, fontStyle);
    spans.add(at + match[0].length - 1, at + match[0].length,
      'documentation', 120, fontStyle);
    spans.add(at + 1, at + match[0].length - 1,
      referenceRole(match[1]), 120, fontStyle);
  }

  // Javadoc and JSDoc commonly spell references as {@link Type.member}.
  for (const match of text.matchAll(/\{@(?:link|linkplain)\s+([A-Za-z_$][\w$]*(?:[.#][A-Za-z_$][\w$]*)*)/g)) {
    const nameAt = start + match.index + match[0].lastIndexOf(match[1]);
    spans.add(nameAt, nameAt + match[1].length,
      referenceRole(match[1]), 120, fontStyle);
  }
}

module.exports = { addComment };
