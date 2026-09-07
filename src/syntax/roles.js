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
  'covariant', 'data',
  'def', 'define', 'dim', 'dynamic', 'enum', 'export', 'extension', 'extern', 'external',
  'extends', 'factory', 'final', 'fn', 'friend', 'fun', 'func', 'get', 'given',
  'from', 'global', 'has',
  'impl',
  'implementation', 'implements', 'import', 'imports', 'include', 'inline',
  'interface', 'internal', 'iterator', 'late', 'let', 'library', 'method',
  'mixin', 'mod', 'module', 'mut', 'mutable', 'my', 'namespace', 'native', 'ns',
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

const literalKeywords = new Set([
  'false', 'nil', 'none', 'some', 'true',
]);

/** Resolve a keyword by meaning rather than by provider-specific scope names. */
function keywordStyle(value) {
  const annotation = value.startsWith('@');
  const keyword = value.replace(/^@/, '').toLowerCase();
  if (keyword === 'null') return { role: 'orange', fontStyle: 'normal' };
  if (keyword === 'void') return { role: codeRoles.type, fontStyle: 'normal' };
  if (literalKeywords.has(keyword)) return { role: 'yellow' };
  return {
    role: annotation || declarationKeywords.has(keyword)
      ? codeRoles.declarationKeyword
      : codeRoles.flowKeyword,
    fontStyle: 'italic',
  };
}

module.exports = { codeRoles, keywordStyle };
