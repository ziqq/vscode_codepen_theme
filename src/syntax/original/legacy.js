const { Spans } = require('./spans');
const { addComment } = require('./comments');
const { refineTypeScript } = require('./typescript');

// Providers without a dependable Tree-sitter grammar use bounded lexical
// refiners here. Each refiner applies the same declaration/reference/member
// role model and masks strings/comments before matching executable syntax.

function lines(source, callback) {
  let offset = 0;
  for (const line of source.split('\n')) {
    callback(line, offset);
    offset += line.length + 1;
  }
}

function mask(source, spans, commentPattern, stringPattern = /"(?:\\.|[^"\\])*(?:"|$)|'(?:\\.|[^'\\])*(?:'|$)/g) {
  // Match strings first so comment markers embedded in a scalar never start a
  // synthetic comment (notably #rrggbb in Perl/Raku and PowerShell strings).
  const patterns = [stringPattern?.source, commentPattern?.source].filter(Boolean).join('|');
  return source.replace(new RegExp(patterns, 'gm'), (text, at) => {
    const comment = commentPattern && new RegExp(`^(?:${commentPattern.source})$`, commentPattern.flags.replace('g', '')).test(text);
    if (comment) addComment(spans, source, at, at + text.length);
    else spans.add(at, at + text.length, 'green', 35);
    return text.replace(/[^\n]/g, ' ');
  });
}

function wordSpans(spans, text, words, role, priority = 40) {
  const pattern = new RegExp(`\\b(?:${[...words].join('|')})\\b`, 'g');
  for (const match of text.matchAll(pattern)) spans.add(match.index, match.index + match[0].length, role, priority);
}

/** Restore identifiers inside legacy interpolated strings after the enclosing
 * string has been masked. Delimiters remain green; bindings and member paths
 * keep the same blue/purple roles they have outside a string. */
function addBraceInterpolations(spans, source, pattern, members = new Set()) {
  for (const string of source.matchAll(pattern)) {
    for (const expression of string[0].matchAll(/\{([A-Za-z_][\w']*(?:\.[A-Za-z_][\w']*)*)\}/g)) {
      const start = string.index + expression.index;
      spans.add(start, start + 1, 'green', 70);
      spans.add(start + expression[0].length - 1, start + expression[0].length, 'green', 70);
      let cursor = start + 1;
      const names = expression[1].split('.');
      for (const [index, name] of names.entries()) {
        spans.add(cursor, cursor + name.length, index > 0 || members.has(name) ? 'purple' : 'blue', 80);
        cursor += name.length;
        if (index < names.length - 1) {
          spans.add(cursor, cursor + 1, 'white', 80);
          cursor++;
        }
      }
    }
  }
}

function refineFsharp(source) {
  const spans = new Spans(source.length);
  const masked = mask(source, spans, /\/\/[^\n]*/, /\$?@?"(?:""|\\.|[^"\\])*(?:"|$)/);
  const types = new Set();
  const bindings = new Set();
  const members = new Set();
  lines(masked, (line, offset) => {
    let match = /^\s*(?:type|module)\s+([A-Za-z_][\w']*)/.exec(line);
    if (match) {
      const at = offset + line.indexOf(match[1]);
      spans.add(at, at + match[1].length, 'blue', 65); types.add(match[1]);
    }
    match = /^\s*\|\s*([A-Z][\w']*)/.exec(line);
    if (match) {
      const at = offset + line.indexOf(match[1]);
      spans.add(at, at + match[1].length, 'purple', 65); members.add(match[1]);
    }
    for (const item of line.matchAll(/\|\s*([A-Z][\w']*)/g)) {
      const at = offset + item.index + item[0].lastIndexOf(item[1]);
      spans.add(at, at + item[1].length, 'purple', 65); members.add(item[1]);
    }
    for (const item of line.matchAll(/(?:\{|;)\s*([A-Z][\w']*)\s*:/g)) {
      const at = offset + item.index + item[0].lastIndexOf(item[1]);
      spans.add(at, at + item[1].length, 'purple', 65); members.add(item[1]);
    }
    match = /^\s*([A-Z][\w']*)\s*:/.exec(line);
    if (match) {
      const at = offset + line.indexOf(match[1]);
      spans.add(at, at + match[1].length, 'purple', 65); members.add(match[1]);
    }
    match = /^\s*let\s+(?:rec\s+)?([A-Za-z_][\w']*)([^=]*)=/.exec(line);
    if (match) {
      const nameAt = offset + line.indexOf(match[1]);
      spans.add(nameAt, nameAt + match[1].length, 'blue', 65); bindings.add(match[1]);
      const argsAt = line.indexOf(match[2], line.indexOf(match[1]) + match[1].length);
      for (const arg of match[2].matchAll(/[a-z_][\w']*/g)) {
        spans.add(offset + argsAt + arg.index, offset + argsAt + arg.index + arg[0].length, 'blue', 60);
        bindings.add(arg[0]);
      }
    }
    for (const item of line.matchAll(/\.([A-Za-z_][\w']*)/g)) {
      if (/^\s*(?:namespace|open)\b/.test(line)) continue;
      spans.add(offset + item.index + 1, offset + item.index + 1 + item[1].length, 'purple', 70);
    }
  });
  for (const match of masked.matchAll(/\b[A-Za-z_][\w']*\b/g)) {
    if (types.has(match[0])) spans.add(match.index, match.index + match[0].length, 'white', 35);
    else if (members.has(match[0])) spans.add(match.index, match.index + match[0].length, 'purple', 35);
    else if (bindings.has(match[0])) spans.add(match.index, match.index + match[0].length, 'blue', 30);
  }
  wordSpans(spans, masked, new Set(['namespace', 'open', 'type', 'of', 'module', 'let', 'rec', 'function', 'match', 'with', 'if', 'then', 'else', 'for', 'in', 'do', 'yield', 'return', 'true', 'false', 'None', 'Some']), 'yellow', 45);
  wordSpans(spans, masked, new Set(['string', 'bool', 'int', 'float', 'unit', 'list', 'option']), 'white', 50);
  for (const match of masked.matchAll(/\b\d+(?:\.\d+)?\b/g)) spans.add(match.index, match.index + match[0].length, 'orange', 45);
  for (const match of masked.matchAll(/->|<-|\|>|\|\||&&|<>|<=|>=|[=+*\/<>|-]/g)) {
    spans.add(match.index, match.index + match[0].length, 'operator', 60);
  }
  for (const match of masked.matchAll(/[{}()[\],;:]/g)) spans.add(match.index, match.index + 1, 'white', 55);
  addBraceInterpolations(spans, source, /\$@?"(?:""|\\.|[^"\\])*(?:"|$)/g, members);
  return spans.finish();
}

function refineShader(source, language) {
  const spans = new Spans(source.length);
  const masked = mask(source, spans, /\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$)/);
  const typeNames = new Set(['void', 'bool', 'int', 'uint', 'half', 'fixed', 'float', 'double',
    'float2', 'float3', 'float4', 'float2x2', 'float3x3', 'float4x4', 'half2', 'half3', 'half4',
    'fixed2', 'fixed3', 'fixed4', 'Texture2D', 'SamplerState', 'sampler2D']);
  const locals = new Set();
  const globals = new Set();
  const functions = new Set();
  const members = new Set();
  let inAggregate = false;
  let pendingAggregate = false;
  let inFunction = false;
  let pendingFunction = false;
  let functionDepth = 0;
  let braces = 0;
  lines(masked, (line, offset) => {
    const aggregate = /^\s*(?:struct|cbuffer)\s+([A-Za-z_]\w*)/.exec(line);
    if (aggregate) {
      const at = offset + line.indexOf(aggregate[1]);
      spans.add(at, at + aggregate[1].length, 'blue', 70); typeNames.add(aggregate[1]);
      pendingAggregate = true;
      if (line.includes('{')) { inAggregate = true; pendingAggregate = false; }
      const inlineBody = /\{([\s\S]*)\}/.exec(line);
      if (inlineBody) {
        const bodyAt = offset + line.indexOf(inlineBody[1]);
        for (const member of inlineBody[1].matchAll(/\b[A-Za-z_]\w*(?:<[^>]+>)?\s+([A-Za-z_]\w*)\s*(?::|;)/g)) {
          const memberAt = bodyAt + member.index + member[0].lastIndexOf(member[1]);
          spans.add(memberAt, memberAt + member[1].length, 'purple', 78);
          members.add(member[1]);
        }
      }
    }
    if (pendingAggregate && line.includes('{')) { inAggregate = true; pendingAggregate = false; }
    const functionMatch = /^\s*([A-Za-z_]\w*(?:<[^>]+>)?)\s+([A-Za-z_]\w*)\s*\(([^;]*)\)\s*(?::\s*([A-Za-z_]\w*))?\s*\{?/.exec(line);
    if (functionMatch && !['if', 'for', 'while', 'switch'].includes(functionMatch[1])) {
      const nameAt = offset + line.indexOf(functionMatch[2], line.indexOf(functionMatch[1]) + functionMatch[1].length);
      spans.add(nameAt, nameAt + functionMatch[2].length, 'blue', 75); functions.add(functionMatch[2]);
      if (functionMatch[4]) {
        const semanticAt = offset + line.lastIndexOf(functionMatch[4]);
        spans.add(semanticAt, semanticAt + functionMatch[4].length, 'purple', 70);
      }
      const paramsAt = line.indexOf(functionMatch[3], nameAt - offset + functionMatch[2].length);
      for (const param of functionMatch[3].matchAll(/(?:\b[A-Za-z_]\w*(?:<[^>]+>)?\s+)([A-Za-z_]\w*)/g)) {
        const at = offset + paramsAt + param.index + param[0].lastIndexOf(param[1]);
        spans.add(at, at + param[1].length, 'blue', 70); locals.add(param[1]);
      }
      pendingFunction = true;
      if (line.includes('{')) {
        inFunction = true; pendingFunction = false; functionDepth = braces + 1;
      }
    }
    if (pendingFunction && line.includes('{')) {
      inFunction = true; pendingFunction = false; functionDepth = braces + 1;
    }
    const declaration = /^\s*([A-Za-z_]\w*(?:<[^>]+>)?)\s+([A-Za-z_]\w*)\s*(?::\s*(?!register\b)([A-Za-z_]\w*))?\s*(?::\s*register\([^)]*\))?\s*(?:[=;]|$)/.exec(line);
    if (declaration && !functionMatch) {
      const at = offset + line.indexOf(declaration[2], line.indexOf(declaration[1]) + declaration[1].length);
      const role = inAggregate ? 'purple' : inFunction ? 'blue' : language === 'shaderlab' && /^_/.test(declaration[2]) ? 'purple' : 'blue';
      spans.add(at, at + declaration[2].length, role, 70);
      (inAggregate ? members : inFunction ? locals : globals).add(declaration[2]);
      if (declaration[3]) {
        const semanticAt = offset + line.lastIndexOf(declaration[3]);
        spans.add(semanticAt, semanticAt + declaration[3].length, 'purple', 70);
      }
    }
    for (const property of line.matchAll(/\.([A-Za-z_]\w*)/g)) {
      spans.add(offset + property.index + 1, offset + property.index + property[0].length, 'purple', 75);
      members.add(property[1]);
    }
    for (const semantic of line.matchAll(/:\s*([A-Z][A-Z0-9_]*)/g)) {
      const at = offset + semantic.index + semantic[0].lastIndexOf(semantic[1]);
      spans.add(at, at + semantic[1].length, 'purple', 70);
    }
    braces += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
    if (inAggregate && /^\s*};/.test(line)) inAggregate = false;
    if (inFunction && braces < functionDepth) inFunction = false;
  });
  if (language === 'shaderlab') {
    for (const match of masked.matchAll(/\b(_[A-Za-z_]\w*)\s*\(/g)) {
      const at = match.index + match[0].lastIndexOf(match[1]);
      spans.add(at, at + match[1].length, 'purple', 75);
      globals.add(match[1]);
    }
  }
  for (const match of masked.matchAll(/\b[A-Za-z_]\w*\b/g)) {
    if (typeNames.has(match[0])) spans.add(match.index, match.index + match[0].length, 'white', 55);
    else if (members.has(match[0])) spans.add(match.index, match.index + match[0].length, 'purple', 35);
    else if (locals.has(match[0])) spans.add(match.index, match.index + match[0].length, 'blue', 35);
    else if (globals.has(match[0])) spans.add(match.index, match.index + match[0].length, 'yellow', 35);
  }
  for (const match of masked.matchAll(/\b([A-Za-z_]\w*)\s*\(/g)) {
    if (!typeNames.has(match[1])) {
      spans.add(match.index, match.index + match[1].length, 'yellow', 50);
    }
  }
  wordSpans(spans, masked, new Set(['struct', 'cbuffer', 'return', 'if', 'else', 'for', 'while', 'register',
    'Shader', 'Properties', 'SubShader', 'Tags', 'LOD', 'Pass', 'CGPROGRAM', 'ENDCG', 'pragma', 'include']), 'yellow', 45);
  for (const match of masked.matchAll(/\b\d+(?:\.\d+)?(?:[fFhH])?\b/g)) spans.add(match.index, match.index + match[0].length, 'orange', 50);
  return spans.finish();
}

function refinePowerShell(source) {
  const spans = new Spans(source.length);
  const masked = mask(source, spans, /#[^\n]*/, /"(?:`.|[^"`])*(?:"|$)|'(?:''|[^'])*(?:'|$)/);
  const functions = new Set();
  const members = new Set();
  let inClass = false;
  let pendingClass = false;
  let classDepth = 0;
  let depth = 0;
  for (const match of masked.matchAll(/\[([^\]]+)\]/g)) {
    spans.add(match.index + 1, match.index + match[0].length - 1, 'white', 60);
  }
  for (const match of masked.matchAll(/\bclass\s+([A-Za-z_]\w*)/gi)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'blue', 70);
  }
  for (const match of masked.matchAll(/\bfunction\s+([A-Za-z_][\w-]*)/gi)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'blue', 70); functions.add(match[1].toLowerCase());
  }
  lines(masked, (line, offset) => {
    if (/^\s*class\b/i.test(line)) pendingClass = true;
    if (pendingClass && line.includes('{')) {
      inClass = true; pendingClass = false;
      classDepth = depth + 1;
    }
    let match = /^\s*\[[^\r\n]+\]\s+\$([A-Za-z_]\w*)\s*$/.exec(line);
    if (match && inClass) {
      const at = offset + line.lastIndexOf(match[1]);
      spans.add(at - 1, at + match[1].length, 'purple', 70); members.add(match[1].toLowerCase());
    }
    match = /^\s*(?:\[[^\r\n]+\]\s+)?([A-Za-z_]\w*)\s*\(/.exec(line);
    if (match && inClass && !/^(?:if|for|foreach|while|switch|param|process)$/i.test(match[1])) {
      const at = offset + line.indexOf(match[1]);
      spans.add(at, at + match[1].length, 'purple', 65); members.add(match[1].toLowerCase());
    }
    for (const key of line.matchAll(/^\s*([A-Za-z_]\w*)\s*=/g)) {
      const at = offset + key.index + key[0].indexOf(key[1]);
      spans.add(at, at + key[1].length, 'purple', 65);
    }
    depth += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
    if (inClass && depth < classDepth) inClass = false;
  });
  for (const match of source.matchAll(/\$(this|_|ErrorActionPreference)\b/gi)) {
    spans.add(match.index, match.index + match[0].length, 'yellow', 75);
  }
  for (const match of source.matchAll(/\.([A-Za-z_]\w*)/g)) {
    spans.add(match.index, match.index + 1, 'white', 76);
    spans.add(match.index + 1, match.index + match[0].length, 'purple', 75);
  }
  for (const match of masked.matchAll(/\$[A-Za-z_]\w*/g)) {
    spans.add(match.index, match.index + match[0].length, 'blue', 45);
  }
  for (const string of source.matchAll(/"(?:`.|[^"`])*(?:"|$)/g)) {
    for (const match of string[0].matchAll(/\$\{([A-Za-z_]\w*)\}|\$([A-Za-z_]\w*)/g)) {
      const name = match[1] ?? match[2];
      const at = string.index + match.index;
      if (match[1]) {
        spans.add(at, at + 2, 'green', 70);
        spans.add(at + 2, at + 2 + name.length, 'blue', 72);
        spans.add(at + match[0].length - 1, at + match[0].length, 'green', 70);
      } else spans.add(at, at + match[0].length, 'blue', 72);
    }
  }
  for (const match of masked.matchAll(/::([A-Za-z_]\w*)/g)) {
    const at = match.index + 2;
    spans.add(at, at + match[1].length, 'purple', 70);
  }
  for (const match of masked.matchAll(/\b[A-Za-z_][\w-]*\b/g)) {
    if (functions.has(match[0].toLowerCase()) && !/\bfunction\s+$/i.test(masked.slice(Math.max(0, match.index - 12), match.index))) {
      spans.add(match.index, match.index + match[0].length, 'yellow', 45);
    }
  }
  wordSpans(spans, masked, new Set(['class', 'function', 'param', 'process', 'return', 'if', 'else', 'foreach', 'in', 'switch', 'true', 'false']), 'yellow', 50);
  for (const match of masked.matchAll(/\b\d+(?:\.\d+)?\b/g)) spans.add(match.index, match.index + match[0].length, 'orange', 45);
  return spans.finish();
}

function refinePerl(source, language) {
  const spans = new Spans(source.length);
  const masked = mask(source, spans, /(?<!\$)#[^\n]*/, /qq?\{[^}]*\}|"(?:\\.|[^"\\])*(?:"|$)|'(?:\\.|[^'\\])*(?:'|$)/);
  const raku = language === 'raku';
  for (const match of masked.matchAll(/\b(?:package|class|enum)\s+([A-Za-z_]\w*)/g)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'blue', 70);
  }
  const mainPackage = source.search(/\bpackage\s+main\b/);
  for (const match of masked.matchAll(/\b(method|sub)\s+([A-Za-z_][\w-]*)/g)) {
    const at = match.index + match[0].lastIndexOf(match[2]);
    const member = match[1] === 'method' || (!raku && (mainPackage < 0 || match.index < mainPackage));
    spans.add(at, at + match[2].length, member ? 'purple' : 'blue', 70);
  }
  const variablePattern = raku ? /[$@%](?:[!.#]|\^)?[A-Za-z_][\w-]*/g : /[$@%](?:[!.#]|\^)?[A-Za-z_]\w*/g;
  for (const match of masked.matchAll(variablePattern)) {
    const member = /^\$[!.]/.test(match[0]);
    spans.add(match.index, match.index + match[0].length, member ? 'purple' : 'blue', 60);
  }
  for (const string of source.matchAll(/"(?:\\.|[^"\\])*(?:"|$)/g)) {
    for (const match of string[0].matchAll(variablePattern)) {
      const member = /^\$[!.]/.test(match[0]);
      spans.add(string.index + match.index, string.index + match.index + match[0].length,
        member ? 'purple' : 'blue', 70);
    }
  }
  for (const match of masked.matchAll(/(?:->|\.)([A-Za-z_][\w-]*)/g)) {
    const lineStart = masked.lastIndexOf('\n', match.index) + 1;
    if (raku && /^\s*use\s+v6\b/.test(masked.slice(lineStart, match.index))) continue;
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'purple', 70);
  }
  for (const match of masked.matchAll(/\b([A-Za-z_]\w*)\s*=>/g)) {
    spans.add(match.index, match.index + match[1].length, 'purple', 65);
  }
  for (const match of source.matchAll(/(?:->)?\{([A-Za-z_]\w*)\}/g)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'purple', 70);
  }
  for (const match of masked.matchAll(/\b([A-Z][A-Za-z_]\w*)\s*(?=->)/g)) {
    spans.add(match.index, match.index + match[1].length, 'yellow', 65);
  }
  for (const match of masked.matchAll(/(?<![\w$])\/(?!\/)(?:\\.|[^\/\n])+(?:\/[a-z]*)?/g)) {
    spans.add(match.index, match.index + match[0].length, 'green', 65);
  }
  if (raku) {
    for (const match of masked.matchAll(/\benum\s+[A-Za-z_]\w*\s+<([^>]*)>/g)) {
      const valuesAt = match.index + match[0].indexOf(match[1]);
      for (const value of match[1].matchAll(/[A-Za-z_]\w*/g)) {
        spans.add(valuesAt + value.index, valuesAt + value.index + value[0].length, 'purple', 70);
      }
    }
    for (const match of masked.matchAll(/::([A-Za-z_]\w*)/g)) {
      spans.add(match.index + 2, match.index + 2 + match[1].length, 'purple', 70);
    }
    for (const match of masked.matchAll(/[{}()[\],;]/g)) spans.add(match.index, match.index + 1, 'white', 58);
  }
  wordSpans(spans, masked, new Set(['package', 'class', 'enum', 'has', 'is', 'required', 'method', 'sub', 'my', 'our', 'use', 'return', 'if', 'else', 'given', 'when', 'default', 'new', 'False', 'True']), 'yellow', 50);
  wordSpans(spans, masked, new Set(raku ? ['Str', 'Array', 'Bool', 'Seq', 'Int'] : ['scalar']), 'white', 55);
  for (const match of masked.matchAll(/\b\d+(?:\.\d+)?\b/g)) spans.add(match.index, match.index + match[0].length, 'orange', 45);
  return spans.finish();
}

function refineVisualBasic(source) {
  const spans = new Spans(source.length);
  const masked = mask(source, spans, /'[^\n]*/i, /"(?:""|[^"])*(?:"|$)/);
  const members = new Set();
  const bindings = new Set();
  for (const match of masked.matchAll(/\b(?:Class|Module|Structure|Enum)[ \t]+([A-Za-z_]\w*)/gi)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'blue', 70);
  }
  for (const match of masked.matchAll(/\b(?:Property|Function|Sub)[ \t]+([A-Za-z_]\w*)/gi)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'purple', 70); members.add(match[1].toLowerCase());
  }
  for (const match of masked.matchAll(/\b(?:Function|Sub)[ \t]+[A-Za-z_]\w*\s*\(([^)]*)\)/gi)) {
    const parametersAt = match.index + match[0].indexOf(match[1]);
    for (const parameter of match[1].matchAll(/(?:^|,)\s*(?:Optional\s+)?([A-Za-z_]\w*)\s+As\b/gi)) {
      const at = parametersAt + parameter.index + parameter[0].lastIndexOf(parameter[1]);
      spans.add(at, at + parameter[1].length, 'blue', 70);
      bindings.add(parameter[1].toLowerCase());
    }
  }
  for (const match of masked.matchAll(/\bDim\s+([A-Za-z_]\w*)|\bFor\s+Each\s+([A-Za-z_]\w*)/gi)) {
    const name = match[1] ?? match[2];
    const at = match.index + match[0].lastIndexOf(name);
    spans.add(at, at + name.length, 'blue', 70);
    bindings.add(name.toLowerCase());
  }
  for (const match of masked.matchAll(/\.([A-Za-z_]\w*)/g)) {
    const lineStart = masked.lastIndexOf('\n', match.index) + 1;
    if (/^\s*Imports\b/i.test(masked.slice(lineStart, match.index))) continue;
    spans.add(match.index + 1, match.index + match[0].length, 'purple', 75);
  }
  for (const match of masked.matchAll(/\bNew[ \t]+([A-Za-z_]\w*)/gi)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'yellow', 70);
  }
  for (const string of source.matchAll(/\$"(?:""|[^"])*(?:"|$)/g)) {
    spans.add(string.index, string.index + 2, 'green', 72);
    for (const expression of string[0].matchAll(/\{([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)*)\}/g)) {
      const at = string.index + expression.index;
      spans.add(at, at + 1, 'green', 72);
      spans.add(at + expression[0].length - 1, at + expression[0].length, 'green', 72);
      let cursor = at + 1;
      for (const [index, name] of expression[1].split('.').entries()) {
        const lower = name.toLowerCase();
        spans.add(cursor, cursor + name.length,
          index > 0 || members.has(lower) ? 'purple' : bindings.has(lower) ? 'blue' : 'purple', 80);
        cursor += name.length + 1;
      }
    }
  }
  wordSpans(spans, masked, new Set(['String', 'Boolean', 'Integer', 'Long', 'Double', 'Single', 'Object', 'Void']), 'white', 60);
  wordSpans(spans, masked, new Set(['Imports', 'Public', 'Private', 'Protected', 'Friend', 'ReadOnly', 'NotInheritable', 'Class', 'Module', 'Property', 'Function', 'Sub', 'New', 'As', 'Of', 'Return', 'Iterator', 'For', 'Each', 'In', 'If', 'Then', 'Else', 'Yield', 'End', 'Dim', 'Optional', 'True', 'False']), 'yellow', 50);
  for (const match of masked.matchAll(/\b\d+(?:\.\d+)?\b/g)) spans.add(match.index, match.index + match[0].length, 'orange', 45);
  return spans.finish();
}

function refineHandlebars(source) {
  const spans = new Spans(source.length);
  const aliases = new Set();
  for (const block of source.matchAll(/\bas\s+\|([^|]+)\|/g)) {
    for (const name of block[1].matchAll(/[A-Za-z_]\w*/g)) aliases.add(name[0]);
  }
  for (const match of source.matchAll(/\{\{!--[\s\S]*?--\}\}|\{\{![\s\S]*?\}\}/g)) {
    addComment(spans, source, match.index, match.index + match[0].length);
  }
  for (const match of source.matchAll(/\{\{\{?[\s\S]*?\}\}\}?/g)) {
    if (/^\{\{!/.test(match[0])) continue;
    const open = match[0].startsWith('{{{') ? 3 : 2;
    const close = match[0].endsWith('}}}') ? 3 : 2;
    spans.add(match.index, match.index + open, 'white', 60);
    spans.add(match.index + match[0].length - close, match.index + match[0].length, 'white', 60);
    const bodyAt = match.index + open;
    const body = match[0].slice(open, -close);
    for (const name of body.matchAll(/@?[A-Za-z_][\w-]*/g)) {
      const at = bodyAt + name.index;
      const previous = body.slice(0, name.index).match(/\.\s*$/);
      const hashKey = new RegExp(`\\b${name[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*=`).test(body.slice(name.index));
      let role = previous || hashKey ? 'purple' : aliases.has(name[0]) ? 'blue' : 'yellow';
      if (['if', 'each', 'else', 'as'].includes(name[0])) role = 'yellow';
      spans.add(at, at + name[0].length, role, 65);
    }
  }
  return spans.finish();
}

function addShifted(spans, source, start, language = 'javascript') {
  for (const span of refineTypeScript(source, language)) {
    spans.add(start + span.start, start + span.end, span.role, 75, span.fontStyle);
  }
}

function refinePug(source) {
  const spans = new Spans(source.length);
  const aliases = new Set();
  lines(source, (line, offset) => {
    const leading = line.search(/\S|$/);
    const body = line.slice(leading);
    if (!body) return;
    if (body.startsWith('//-')) {
      addComment(spans, source, offset + leading, offset + line.length);
      return;
    }
    if (/^-\s+/.test(body)) {
      spans.add(offset + leading, offset + leading + 1, 'white', 80);
      const expressionAt = offset + leading + body.indexOf('-') + 1;
      addShifted(spans, line.slice(expressionAt - offset), expressionAt);
      return;
    }
    let match = /^mixin\s+([A-Za-z_]\w*)\s*\(([^)]*)\)/.exec(body);
    if (match) {
      spans.add(offset + leading, offset + leading + 5, 'yellow', 70);
      const nameAt = offset + leading + body.indexOf(match[1]);
      spans.add(nameAt, nameAt + match[1].length, 'blue', 75);
      const argsAt = offset + leading + body.indexOf(match[2], body.indexOf(match[1]) + match[1].length);
      for (const arg of match[2].matchAll(/[A-Za-z_]\w*/g)) {
        aliases.add(arg[0]);
        spans.add(argsAt + arg.index, argsAt + arg.index + arg[0].length, 'blue', 75);
      }
      return;
    }
    match = /^each\s+(.+?)\s+in\s+(.+)$/.exec(body);
    if (match) {
      spans.add(offset + leading, offset + leading + 4, 'yellow', 70);
      const namesAt = offset + leading + body.indexOf(match[1]);
      for (const name of match[1].matchAll(/[A-Za-z_]\w*/g)) {
        aliases.add(name[0]);
        spans.add(namesAt + name.index, namesAt + name.index + name[0].length, 'blue', 75);
      }
      const expressionAt = offset + leading + body.lastIndexOf(match[2]);
      addShifted(spans, match[2], expressionAt);
      return;
    }
    match = /^(if|else)(?:\s+(.+))?$/.exec(body);
    if (match) {
      spans.add(offset + leading, offset + leading + match[1].length, 'yellow', 70);
      if (match[2]) {
        const expressionAt = offset + leading + body.indexOf(match[2]);
        addShifted(spans, match[2], expressionAt);
      }
      return;
    }
    match = /^\+([A-Za-z_]\w*)\s*\(([^)]*)\)/.exec(body);
    if (match) {
      const nameAt = offset + leading + 1;
      spans.add(nameAt, nameAt + match[1].length, 'yellow', 75);
      const argsAt = offset + leading + body.indexOf(match[2]);
      addShifted(spans, match[2], argsAt);
    }
    if (/^doctype\b/.test(body)) spans.add(offset + leading, offset + line.length, 'brown', 65);
    const tag = /^([A-Za-z][\w-]*)/.exec(body);
    if (tag && !['mixin', 'each', 'if', 'else', 'doctype'].includes(tag[1])) {
      spans.add(offset + leading, offset + leading + tag[1].length, 'brown', 65);
      const selectorPrefix = /^(?:[.#][A-Za-z_][\w-]*)+/.exec(body.slice(tag[1].length))?.[0] ?? '';
      for (const selector of selectorPrefix.matchAll(/([.#])([A-Za-z_][\w-]*)/g)) {
        const at = offset + leading + tag[1].length + selector.index;
        spans.add(at, at + selector[0].length, 'yellow', 65);
      }
    }
    for (const interpolation of body.matchAll(/#\{([^}]*)\}/g)) {
      const at = offset + leading + interpolation.index;
      spans.add(at, at + 2, 'green', 80);
      addShifted(spans, interpolation[1], at + 2);
      spans.add(at + interpolation[0].length - 1, at + interpolation[0].length, 'green', 80);
    }
    const equals = body.match(/(?:^|\s)=\s*(.+)$/);
    if (equals) {
      const expressionAt = offset + leading + body.lastIndexOf(equals[1]);
      addShifted(spans, equals[1], expressionAt);
    }
    for (const attributes of body.matchAll(/\(([^)]*)\)/g)) {
      const contentAt = offset + leading + attributes.index + 1;
      for (const attribute of attributes[1].matchAll(/([A-Za-z_:][\w:-]*)\s*=\s*("(?:\\.|[^"])*"|'(?:\\.|[^'])*'|`(?:\\.|[^`])*`|[^\s]+)/g)) {
        const nameAt = contentAt + attribute.index;
        spans.add(nameAt, nameAt + attribute[1].length, 'yellow', 75);
        const valueAt = contentAt + attribute.index + attribute[0].lastIndexOf(attribute[2]);
        if (/^["'`]/.test(attribute[2])) spans.add(valueAt, valueAt + attribute[2].length, 'green', 65);
        else addShifted(spans, attribute[2], valueAt);
      }
    }
    for (const name of aliases) {
      for (const use of body.matchAll(new RegExp(`\\b${name}\\b`, 'g'))) {
        const before = body.slice(0, use.index);
        const adjacent = `${body[use.index - 1] ?? ''}${body[use.index + name.length] ?? ''}`;
        if (!/\.\s*$/.test(before) && !/[\w+-]/.test(adjacent)) spans.add(offset + leading + use.index,
          offset + leading + use.index + name.length, 'blue', 78);
      }
    }
  });
  return spans.finish();
}

function refineBatch(source) {
  const spans = new Spans(source.length);
  for (const match of source.matchAll(/^:([A-Za-z_][\w.-]*)\s*$/gm)) {
    spans.add(match.index + 1, match.index + 1 + match[1].length, 'purple', 70);
  }
  for (const match of source.matchAll(/\bcall\s+:([A-Za-z_][\w.-]*)/gim)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'purple', 70);
  }
  return spans.finish();
}

function refineCoffeeScript(source) {
  const spans = new Spans(source.length);
  const masked = mask(source, spans, /#[^\n]*/);
  for (const match of masked.matchAll(/\bclass\s+([A-Za-z_]\w*)/g)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'blue', 70);
  }
  for (const match of masked.matchAll(/^\s*([A-Za-z_]\w*)\s*:\s*(?:\([^)]*\)\s*)?[-=]>/gm)) {
    const at = match.index + match[0].indexOf(match[1]);
    spans.add(at, at + match[1].length, 'purple', 70);
  }
  for (const match of masked.matchAll(/^\s*[A-Za-z_]\w*\s*:\s*\(([^)]*)\)\s*[-=]>/gm)) {
    const parametersAt = match.index + match[0].indexOf(match[1]);
    for (const parameter of match[1].matchAll(/[A-Za-z_]\w*/g)) {
      spans.add(parametersAt + parameter.index,
        parametersAt + parameter.index + parameter[0].length, 'blue', 72);
    }
  }
  for (const match of source.matchAll(/@[A-Za-z_]\w*/g)) spans.add(match.index, match.index + match[0].length, 'purple', 80);
  for (const match of masked.matchAll(/\.([A-Za-z_]\w*)/g)) spans.add(match.index + 1, match.index + match[0].length, 'purple', 70);
  for (const match of masked.matchAll(/^\s*([A-Za-z_]\w*)\s*=|\bfor\s+([A-Za-z_]\w*)\s+in\b/gm)) {
    const name = match[1] ?? match[2];
    const at = match.index + match[0].indexOf(name);
    spans.add(at, at + name.length, 'blue', 65);
  }
  addBraceInterpolations(spans, source, /"(?:\\.|[^"\\])*(?:"|$)/g);
  return spans.finish();
}

function refineClojure(source) {
  const spans = new Spans(source.length);
  const masked = mask(source, spans, /;[^\n]*/);
  const globals = new Set();
  const types = new Set();
  const localBindings = [];
  const declarations = new Set();
  const special = new Set(['ns', 'require', 'defrecord', 'defprotocol', 'extend-protocol', 'def', 'defn',
    'when-let', 'let', 'if', 'when', 'fn', 'function', 'for', 'doseq']);

  const forms = [];
  let depth = 0;
  let formStart = -1;
  for (let index = 0; index < masked.length; index++) {
    if (masked[index] === '(') {
      if (depth === 0) formStart = index;
      depth++;
    } else if (masked[index] === ')' && depth > 0) {
      depth--;
      if (depth === 0 && formStart >= 0) forms.push({ start: formStart, end: index + 1 });
    }
  }
  const formAt = (at) => forms.find((form) => form.start <= at && form.end >= at) ?? { start: 0, end: source.length };
  const addLocal = (name, at) => localBindings.push({ name, ...formAt(at) });

  for (const match of masked.matchAll(/\((ns|defrecord|defprotocol|def|defn)\s+([^\s()[\]{}]+)/g)) {
    const name = match[2];
    const at = match.index + match[0].lastIndexOf(name);
    spans.add(at, at + name.length, 'blue', 75);
    globals.add(name); declarations.add(at);
    if (match[1] === 'defrecord' || match[1] === 'defprotocol') types.add(name);
    if (match[1] === 'defrecord') {
      const rest = masked.slice(at + name.length);
      const vector = /^\s*\[([^\]]*)\]/.exec(rest);
      if (vector) for (const field of vector[1].matchAll(/[A-Za-z_][\w-]*/g)) {
        const fieldAt = at + name.length + vector.index + vector[0].indexOf(vector[1]) + field.index;
        spans.add(fieldAt, fieldAt + field[0].length, 'purple', 70);
      }
    }
  }
  for (const match of masked.matchAll(/\((?:defn|fn)\s+[^\s()[\]{}]+\s+\[([^\]]*)\]/g)) {
    const parameters = match[1];
    const parametersAt = match.index + match[0].indexOf(parameters);
    for (const name of parameters.matchAll(/[A-Za-z_][\w-]*/g)) {
      spans.add(parametersAt + name.index, parametersAt + name.index + name[0].length, 'blue', 70);
      addLocal(name[0], match.index);
    }
  }
  for (const match of masked.matchAll(/\(render\s+\[\{[^}]*\}\s+([A-Za-z_][\w-]*)\]/g)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'blue', 70);
    addLocal(match[1], match.index);
  }
  for (const match of masked.matchAll(/:keys\s+\[([^\]]*)\]|when-let\s+\[([A-Za-z_][\w-]*)/g)) {
    const names = match[1] ?? match[2];
    const namesAt = match.index + match[0].indexOf(names);
    for (const name of names.matchAll(/[A-Za-z_][\w-]*/g)) {
      spans.add(namesAt + name.index, namesAt + name.index + name[0].length, 'blue', 70);
      addLocal(name[0], match.index);
    }
  }
  for (const match of masked.matchAll(/:[A-Za-z_][\w-]*/g)) {
    spans.add(match.index, match.index + match[0].length, 'purple', 60);
  }
  for (const match of masked.matchAll(/\(\s*([^\s()[\]{}]+)/g)) {
    const symbol = match[1];
    const at = match.index + match[0].lastIndexOf(symbol);
    if (symbol.startsWith(':')) spans.add(at, at + symbol.length, 'purple', 72);
    else if (special.has(symbol)) spans.add(at, at + symbol.length, 'yellow', 70);
    else if (symbol.includes('/')) {
      const slash = symbol.indexOf('/');
      spans.add(at, at + slash, 'yellow', 65);
      spans.add(at + slash + 1, at + symbol.length, 'purple', 70);
    } else if (!declarations.has(at)) spans.add(at, at + symbol.length, 'yellow', 60);
  }
  for (const match of masked.matchAll(/\((?:defprotocol)\s+[^\s()[\]{}]+[\s\S]*?\(\s*([A-Za-z_][\w-]*)\s+\[/g)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'purple', 78);
  }
  for (const match of masked.matchAll(/\((?:map|filter|remove|keep|reduce)\s+([A-Za-z_][\w?!-]*)/g)) {
    const at = match.index + match[0].lastIndexOf(match[1]);
    spans.add(at, at + match[1].length, 'yellow', 72);
  }
  for (const match of masked.matchAll(/\b[A-Za-z_][\w-]*\b/g)) {
    if (localBindings.some((binding) => binding.name === match[0] && binding.start <= match.index && binding.end >= match.index)) {
      spans.add(match.index, match.index + match[0].length, 'blue', 45);
    } else if (types.has(match[0]) && !declarations.has(match.index)) {
      spans.add(match.index, match.index + match[0].length, 'white', 50);
    } else if (globals.has(match[0]) && !declarations.has(match.index)) {
      spans.add(match.index, match.index + match[0].length, 'yellow', 45);
    }
  }
  return spans.finish();
}

function refineLegacy(source, language) {
  if (language === 'fsharp') return refineFsharp(source);
  if (language === 'hlsl' || language === 'shaderlab') return refineShader(source, language);
  if (language === 'powershell') return refinePowerShell(source);
  if (language === 'perl' || language === 'raku') return refinePerl(source, language);
  if (language === 'vb') return refineVisualBasic(source);
  if (language === 'handlebars') return refineHandlebars(source);
  if (language === 'jade') return refinePug(source);
  if (language === 'bat') return refineBatch(source);
  if (language === 'coffeescript') return refineCoffeeScript(source);
  if (language === 'clojure') return refineClojure(source);
  return [];
}

const legacyLanguages = ['fsharp', 'hlsl', 'shaderlab', 'powershell', 'perl', 'raku', 'vb',
  'handlebars', 'jade', 'bat', 'coffeescript', 'clojure'];

module.exports = { refineLegacy, legacyLanguages };
