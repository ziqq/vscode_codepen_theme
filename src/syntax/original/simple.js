const { Spans } = require('./spans');
const { addComment } = require('./comments');

// A conservative lexer for the two formats without a bundled structural parser.
// It only refines proven identifiers or punctuation, never strings/comments.
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
    for (const match of masked.matchAll(/[()]/g)) spans.add(match.index, match.index + 1, 'white');
  } else if (language === 'c4') {
    const names = new Set([...masked.matchAll(/\b([A-Za-z_][\w]*)\s*=\s*(?:person|softwareSystem|container|component|deploymentNode|infrastructureNode)\b/g)].map((match) => match[1]));
    for (const match of masked.matchAll(/\b[A-Za-z_][\w]*\b/g)) {
      if (names.has(match[0])) spans.add(match.index, match.index + match[0].length, 'blue');
    }
  }
  return spans.finish();
}

module.exports = { refineSimple };
