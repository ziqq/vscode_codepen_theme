// Programming-language roles map the structural hierarchy borrowed from
// GitHub Theme onto the classic CodePen palette. Data and stylesheet refiners
// intentionally keep their own domain-specific color contracts.
const codeRoles = Object.freeze({
  annotation: 'blue',
  binding: 'white',
  declarationKeyword: 'blue',
  enumMember: 'white',
  flowKeyword: 'yellow',
  functionDeclaration: 'purple',
  global: 'white',
  keyword: 'yellow',
  method: 'purple',
  namedArgument: 'white',
  property: 'white',
  type: 'yellow',
});

// These words introduce declarations, modifiers, or language metadata. They
// share the blue role across programming languages even when grammars expose
// them through a generic `keyword.control` scope.
const declarationKeywords = new Set([
  'abstract', 'alias', 'as', 'asserts', 'base', 'cbuffer', 'class', 'const',
  'constexpr', 'covariant', 'data',
  'def', 'define', 'defn', 'defprotocol', 'defrecord', 'dim', 'dynamic',
  'enum', 'export', 'extend-protocol', 'extension', 'extern', 'external',
  'extends', 'factory', 'final', 'fn', 'friend', 'fun', 'func', 'get', 'given',
  'from', 'global', 'has',
  'impl',
  'implementation', 'implements', 'import', 'imports', 'include', 'inline',
  'interface', 'internal', 'iterator', 'late', 'let', 'library', 'method',
  'local', 'mixin', 'mod', 'module', 'mut', 'mutable', 'my', 'namespace', 'native', 'ns',
  'nonlocal', 'notinheritable', 'open', 'operator', 'optional', 'our', 'out',
  'of', 'override', 'package', 'param', 'part', 'private', 'process',
  'properties', 'property',
  'protected', 'protocol', 'pub', 'public', 'readonly', 'record', 'ref',
  'register', 'reified', 'required', 'sealed', 'set', 'shader', 'static',
  'struct', 'sub', 'subshader', 'sync', 'synchronized', 'template', 'trait',
  'transient', 'type', 'typedef',
  'typealias', 'union', 'use', 'using', 'val', 'var', 'virtual', 'void',
  'volatile', 'where',
]);

// Branching, transfer, and asynchronous control flow use the blue annotation
// role. Function introducers and language values (`this`, `self`, `super`)
// intentionally stay in the yellow keyword role.
const controlKeywords = new Set([
  'async', 'await', 'break', 'case', 'catch', 'continue', 'default', 'defer',
  'do', 'elif', 'else', 'end', 'except', 'finally', 'for', 'foreach', 'goto',
  'if', 'in', 'match', 'raise', 'redo', 'rescue', 'return', 'rethrow', 'select',
  'switch', 'then', 'throw', 'try', 'unless', 'when', 'when-let', 'while',
  'yield',
]);

const literalKeywords = new Set([
  'nil', 'none', 'some',
]);

/** Resolve a keyword by meaning rather than by provider-specific scope names. */
function keywordStyle(value) {
  const annotation = value.startsWith('@');
  const keyword = value.replace(/^@/, '').toLowerCase();
  if (keyword === 'null') return { role: 'orange', fontStyle: 'normal' };
  if (keyword === 'true' || keyword === 'false') {
    return { role: 'orange', fontStyle: 'normal' };
  }
  if (keyword === 'void') return { role: codeRoles.type, fontStyle: 'normal' };
  if (keyword === 'sizeof') return { role: codeRoles.type, fontStyle: 'normal' };
  if (literalKeywords.has(keyword)) return { role: 'yellow' };
  return {
    role: annotation || declarationKeywords.has(keyword) || controlKeywords.has(keyword)
      ? codeRoles.declarationKeyword
      : codeRoles.flowKeyword,
    fontStyle: 'italic',
  };
}

module.exports = { codeRoles, keywordStyle };
