/**
 * @file Shared documentation foregrounds for prose, code, and bracketed references.
 * Explicit priorities keep documentation constructs visible within muted comments.
 */

const fencedComments = new WeakMap();
const blockDelimiters = [
  [/^\/\*+(?:!)?/, '*/', /^[ \t]*\*(?=[ \t`]|$)[ \t]?/],
  [/^<!--/, '-->'],
  [/^\(\*+/, '*)'],
  [/^\{-/, '-}'],
  [/^#=/, '=#'],
  [/^<#/, '#>'],
  [/^=begin\b/, '=end'],
  [/^--\[\[/, ']]'],
];
const lineDelimiter = /^(?:\/\/\/!?|\/\/!|\/\/|#+'?|--+|;+|%+|'+|!+)/;

/** Apply one foreground to the contents of closed fences in recognized comment ranges. */
function addCommentFences(spans) {
  const state = fencedComments.get(spans);
  if (!state) return;
  fencedComments.delete(spans);
  const { source, ranges } = state;
  let fenceLength = 0;
  let lines = [];
  let previousEnd = 0;
  let previousDelimiter;
  function reset() {
    fenceLength = 0;
    lines = [];
  }
  function readLine(text, start, fontStyle) {
    if (!fenceLength) {
      const opening = /^[ \t]*(`{3,})[^`]*$/.exec(text);
      if (opening) fenceLength = opening[1].length;
      return;
    }
    const closing = /^[ \t]*(`{3,})[ \t]*$/.exec(text);
    if (closing && closing[1].length >= fenceLength) {
      for (const line of lines) spans.add(line.start, line.end, 'operator', 140, line.fontStyle);
      reset();
    } else {
      lines.push({ start, end: start + text.length, fontStyle });
    }
  }
  for (const { start, end, fontStyle } of ranges.sort((a, b) => a.start - b.start || b.end - a.end)) {
    if (start < previousEnd) continue;
    const text = source.slice(start, end);
    const block = blockDelimiters.find(([opening]) => opening.test(text));
    if (block) {
      reset();
      const [opening, closing, margin] = block;
      let offset = start + opening.exec(text)[0].length;
      const limit = text.endsWith(closing) ? end - closing.length : end;
      for (const raw of source.slice(offset, limit).split('\n')) {
        const prefix = margin?.exec(raw)?.[0].length ?? 0;
        readLine(raw.slice(prefix).replace(/\r$/, ''), offset + prefix, fontStyle);
        offset += raw.length + 1;
      }
      reset();
      previousDelimiter = undefined;
    } else {
      const delimiter = lineDelimiter.exec(text)?.[0];
      const lineStart = source.lastIndexOf('\n', start - 1) + 1;
      if (!delimiter || !/^[ \t]*$/.test(source.slice(lineStart, start))) continue;
      if (delimiter !== previousDelimiter || !/^\r?\n[ \t]*$/.test(source.slice(previousEnd, start))) reset();
      const prefix = delimiter.length + Number(/[ \t]/.test(text[delimiter.length] ?? ''));
      // Rust includes the line break in its comment node, while other grammars leave it outside.
      const content = text.slice(prefix).replace(/\r?\n$|\r$/, '');
      readLine(content, start + prefix, fontStyle);
      previousDelimiter = delimiter;
      previousEnd = start + prefix + content.length;
      continue;
    }
    previousEnd = end;
  }
}

/** Record an already recognized comment for fence detection at collection time. */
function trackComment(spans, source, start, end, fontStyle) {
  if (!fencedComments.has(spans)) {
    fencedComments.set(spans, source.includes('```') ? { source, ranges: [] } : null);
  }
  fencedComments.get(spans)?.ranges.push({ start, end, fontStyle });
}

/**
 * Add the base comment color and the two portable documentation constructs
 * understood by every supported parser: inline code and symbol references.
 * Decorations change foreground only, so the active theme still owns italics.
 *
 * `resolve(name)` may return the role of a reference that names a declaration
 * the parser can see (for example a parameter of the documented function).
 *
 * @param {import('./spans').Spans} spans Collector receiving comment and embedded-documentation spans.
 * @param {string} source Original document text.
 * @param {number} start Inclusive comment offset.
 * @param {number} end Exclusive comment offset.
 * @param {string} [fontStyle] Optional inherited comment typography.
 * @param {(name: string) => import('./spans').Role | undefined} [resolve] Resolve a documented parameter visible in the local parser.
 * @returns {void} Higher-priority documentation spans refine the base comment.
 */
function addComment(spans, source, start, end, fontStyle, resolve) {
  trackComment(spans, source, start, end, fontStyle);
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

module.exports = { addComment, addCommentFences, trackComment };
