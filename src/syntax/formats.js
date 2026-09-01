const { Spans } = require('./spans');
const { addComment } = require('./comments');

// Line-oriented and markup formats do not benefit from the declaration tree
// used for programming languages. Their compact refiners model data keys,
// substitutions, commands, and references directly from source structure.

function lines(source, callback) {
  let offset = 0;
  for (const line of source.split('\n')) {
    callback(line, offset);
    offset += line.length + 1;
  }
}

function trimRange(text, start, end = text.length) {
  while (start < end && /\s/.test(text[start])) start++;
  while (end > start && /\s/.test(text[end - 1])) end--;
  return { start, end };
}

function separatorAt(line) {
  let escaped = false;
  for (let index = 0; index < line.length; index++) {
    if (escaped) { escaped = false; continue; }
    if (line[index] === '\\') { escaped = true; continue; }
    if (line[index] === '=' || line[index] === ':') return index;
  }
  return -1;
}

/** INI and Java properties share data roles with TOML/YAML: keys are
 * members, scalar values are strings, and substitutions are bindings. */
function refineConfig(source, language) {
  const spans = new Spans(source.length);
  let continuation = false;
  lines(source, (line, offset) => {
    const leading = line.search(/\S|$/);
    const trimmed = line.slice(leading);
    if (!trimmed) { continuation = false; return; }
    if (!continuation && (trimmed.startsWith(';') || trimmed.startsWith('#'))) {
      addComment(spans, source, offset + leading, offset + line.length);
      return;
    }
    if (!continuation && language === 'ini' && trimmed.startsWith('[') && trimmed.endsWith(']')) {
      spans.add(offset + leading, offset + leading + 1, 'white', 40);
      spans.add(offset + leading + 1, offset + line.length - 1, 'purple', 50);
      spans.add(offset + line.length - 1, offset + line.length, 'white', 40);
      return;
    }
    const separator = continuation ? -1 : separatorAt(line);
    if (separator >= 0) {
      const key = trimRange(line, leading, separator);
      spans.add(offset + key.start, offset + key.end, 'purple', 50);
      spans.add(offset + separator, offset + separator + 1,
        line[separator] === ':' ? 'white' : 'operator', 40);
    }
    const value = trimRange(line, separator >= 0 ? separator + 1 : leading);
    if (value.start < value.end) {
      spans.add(offset + value.start, offset + value.end, 'green', 30);
      const scalar = line.slice(value.start, value.end);
      if (/^(?:true|false|yes|no|on|off|null)$/i.test(scalar)) {
        spans.add(offset + value.start, offset + value.end, 'yellow', 45);
      } else if (/^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/.test(scalar)) {
        spans.add(offset + value.start, offset + value.end, 'orange', 45);
      }
      for (const match of scalar.matchAll(/\$\{([^}]+)\}/g)) {
        spans.add(offset + value.start + match.index, offset + value.start + match.index + 2, 'green', 55);
        spans.add(offset + value.start + match.index + 2,
          offset + value.start + match.index + match[0].length - 1, 'blue', 60);
        spans.add(offset + value.start + match.index + match[0].length - 1,
          offset + value.start + match.index + match[0].length, 'green', 55);
      }
    }
    continuation = language === 'properties' && /(?<!\\)(?:\\\\)*\\\s*$/.test(line);
  });
  return spans.finish();
}

function refineDockerfile(source) {
  const spans = new Spans(source.length);
  const stages = new Set();
  lines(source, (line, offset) => {
    const leading = line.search(/\S|$/);
    const trimmed = line.slice(leading);
    if (!trimmed) return;
    if (trimmed.startsWith('#')) {
      addComment(spans, source, offset + leading, offset + line.length);
      return;
    }
    const instruction = /^(\w+)/.exec(trimmed);
    if (!instruction) return;
    const keywordEnd = offset + leading + instruction[1].length;
    spans.add(offset + leading, keywordEnd, 'yellow', 45);
    const restStart = leading + instruction[1].length;
    const upper = instruction[1].toUpperCase();
    if (upper === 'ARG' || upper === 'ENV') {
      for (const match of line.slice(restStart).matchAll(/(?:^|\s)([A-Za-z_][\w.-]*)\s*=/g)) {
        const at = offset + restStart + match.index + match[0].indexOf(match[1]);
        spans.add(at, at + match[1].length, 'blue', 55);
      }
    }
    if (upper === 'FROM') {
      const alias = /\bAS\s+([A-Za-z_][\w.-]*)/i.exec(line);
      if (alias) {
        const at = offset + alias.index + alias[0].lastIndexOf(alias[1]);
        spans.add(at, at + alias[1].length, 'blue', 55);
        stages.add(alias[1]);
      }
    }
    if (upper === 'LABEL') {
      const key = /\b([A-Za-z_][\w.-]*)\s*=/.exec(line.slice(restStart));
      if (key) {
        const at = offset + restStart + key.index + key[0].indexOf(key[1]);
        spans.add(at, at + key[1].length, 'purple', 55);
      }
    }
    for (const match of line.matchAll(/\$\{([A-Za-z_][\w.-]*)\}/g)) {
      spans.add(offset + match.index + 2, offset + match.index + 2 + match[1].length, 'blue', 60);
    }
    for (const match of line.matchAll(/--from=([A-Za-z_][\w.-]*)/g)) {
      if (stages.has(match[1])) {
        const at = offset + match.index + match[0].lastIndexOf(match[1]);
        spans.add(at, at + match[1].length, 'blue', 60);
      }
    }
    for (const match of line.matchAll(/\b\d+(?:\.\d+)?(?:ms|s|m|h)?\b/g)) {
      spans.add(offset + match.index, offset + match.index + match[0].length, 'orange', 35);
    }
  });
  return spans.finish();
}

function refineBibtex(source) {
  const spans = new Spans(source.length);
  for (const match of source.matchAll(/@(\w+)\s*\{\s*([^,\s]+)/g)) {
    spans.add(match.index, match.index + 1, 'white', 45);
    spans.add(match.index + 1, match.index + 1 + match[1].length, 'yellow', 50);
    const keyAt = match.index + match[0].lastIndexOf(match[2]);
    spans.add(keyAt, keyAt + match[2].length, 'blue', 50);
  }
  for (const match of source.matchAll(/^\s*([A-Za-z][\w-]*)\s*=/gm)) {
    const at = match.index + match[0].indexOf(match[1]);
    spans.add(at, at + match[1].length, 'purple', 55);
  }
  return spans.finish();
}

function maskLatex(source, spans) {
  return source.replace(/%[^\n]*/g, (text, at) => {
    addComment(spans, source, at, at + text.length);
    return ' '.repeat(text.length);
  });
}

function refineLatex(source) {
  const spans = new Spans(source.length);
  const masked = maskLatex(source, spans);
  for (const match of masked.matchAll(/\\[A-Za-z@]+|\\./g)) {
    spans.add(match.index, match.index + match[0].length, 'yellow', 40);
  }
  for (const match of masked.matchAll(/\\(?:newcommand|renewcommand|providecommand)\s*(?:\{\s*)?(\\[A-Za-z@]+)|\\(?:def|edef|gdef|xdef)\s*(\\[A-Za-z@]+)/g)) {
    const name = match[1] ?? match[2];
    const at = match.index + match[0].lastIndexOf(name);
    spans.add(at, at + name.length, 'blue', 65);
  }
  for (const match of masked.matchAll(/#\d+/g)) {
    spans.add(match.index, match.index + match[0].length, 'blue', 60);
  }
  for (const match of masked.matchAll(/\\(?:documentclass|usepackage|begin|end|label|ref|cite)\s*(?:\[[^\]]*\]\s*)?\{([^}]*)\}/g)) {
    const value = match[1];
    const at = match.index + match[0].lastIndexOf(value);
    spans.add(at, at + value.length, /^(?:sec:|fig:|tab:)/.test(value) ? 'blue' : 'green', 55);
  }
  for (const match of masked.matchAll(/\b\d+(?:\.\d+)?\b/g)) {
    spans.add(match.index, match.index + match[0].length, 'orange', 30);
  }
  for (const match of masked.matchAll(/[+\-*/=<>]/g)) spans.add(match.index, match.index + 1, 'operator', 35);
  return spans.finish();
}

function refineWat(source) {
  const spans = new Spans(source.length);
  const masked = source.replace(/;;[^\n]*|\(;[\s\S]*?(?:;\)|$)|"(?:\\.|[^"\\])*(?:"|$)/g,
    (text, at) => {
      if (text.startsWith(';')) addComment(spans, source, at, at + text.length);
      else spans.add(at, at + text.length, 'green', 50);
      return text.replace(/[^\n]/g, ' ');
    });
  const declarations = new Set();
  const addDeclaration = (at, name) => {
    spans.add(at, at + name.length, 'blue', 60);
    declarations.add(at);
  };
  // A type is declared only when it opens a top-level form. `(type $name)`
  // inside a function is a reference to the declared signature instead.
  for (const match of masked.matchAll(/^\s*\(type\s+(\$[\w.$-]+)/gm)) {
    const nameAt = match.index + match[0].lastIndexOf(match[1]);
    addDeclaration(nameAt, match[1]);
  }
  for (const match of masked.matchAll(/\((func|param|local|global|memory|table)\s+(\$[\w.$-]+)/g)) {
    const lineStart = masked.lastIndexOf('\n', match.index) + 1;
    const prefix = masked.slice(lineStart, match.index);
    // `(export "name" (func $name))` references an existing function.
    if (match[1] === 'func' && /\(export\b/.test(prefix)) continue;
    const nameAt = match.index + match[0].lastIndexOf(match[2]);
    addDeclaration(nameAt, match[2]);
  }
  for (const match of masked.matchAll(/\bcall\s+(\$[\w.$-]+)/g)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'yellow', 65);
  }
  for (const match of masked.matchAll(/\(type\s+(\$[\w.$-]+)\)/g)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    if (!declarations.has(at)) spans.add(at, at + match[1].length, 'white', 65);
  }
  for (const match of masked.matchAll(/\(export\b[^()]*\(func\s+(\$[\w.$-]+)\)/g)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'yellow', 65);
  }
  for (const match of masked.matchAll(/\$[\w.$-]+/g)) {
    if (!declarations.has(match.index)) spans.add(match.index, match.index + match[0].length, 'blue', 45);
  }
  return spans.finish();
}

function refineFormat(source, language) {
  if (language === 'ini' || language === 'properties') return refineConfig(source, language);
  if (language === 'dockerfile') return refineDockerfile(source);
  if (language === 'bibtex') return refineBibtex(source);
  if (language === 'latex' || language === 'tex') return refineLatex(source);
  if (language === 'wat') return refineWat(source);
  return [];
}

const formatLanguages = ['ini', 'properties', 'dockerfile', 'bibtex', 'latex', 'tex', 'wat'];

module.exports = { refineFormat, formatLanguages };
