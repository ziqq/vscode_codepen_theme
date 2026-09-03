const { Spans } = require('./spans');
const { addComment } = require('./comments');
const { codeRoles } = require('./roles');

let compiler;
function refineTypeScript(source, language) {
  const ts = compiler ??= require('./vendor/typescript.js');
  const jsx = language.endsWith('react');
  const js = language.startsWith('javascript');
  const fileName = `preview.${jsx ? (js ? 'jsx' : 'tsx') : (js ? 'js' : 'ts')}`;
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true,
    jsx ? (js ? ts.ScriptKind.JSX : ts.ScriptKind.TSX) : (js ? ts.ScriptKind.JS : ts.ScriptKind.TS));
  // Never read project files, resolve imports, or run project code.
  const program = ts.createProgram([fileName], {
    noLib: true, noResolve: true, allowJs: true, checkJs: true,
    target: ts.ScriptTarget.Latest, jsx: ts.JsxEmit.Preserve,
  }, {
    getSourceFile: (name) => name === fileName ? file : undefined,
    getDefaultLibFileName: () => '', writeFile() {}, getCurrentDirectory: () => '',
    getDirectories: () => [], fileExists: (name) => name === fileName,
    readFile: (name) => name === fileName ? source : undefined,
    getCanonicalFileName: (name) => name, useCaseSensitiveFileNames: () => true,
    getNewLine: () => '\n',
  });
  const checker = program.getTypeChecker();
  const spans = new Spans(source.length);
  for (const match of source.matchAll(/\s+/g)) spans.add(match.index, match.index + match[0].length, 'white', 0);
  const S = ts.SyntaxKind;
  const ancestor = (node, predicate) => {
    for (let current = node.parent; current; current = current.parent) {
      if (predicate(current)) return current;
    }
  };
  const isMethod = (node) => ts.isMethodDeclaration(node) || ts.isMethodSignature(node);
  const isAccessor = (node) => ts.isGetAccessor(node) || ts.isSetAccessor(node);
  const isProperty = (node) => ts.isPropertyDeclaration(node) || ts.isPropertySignature(node) ||
    ts.isPropertyAssignment(node) || ts.isShorthandPropertyAssignment(node);
  const isCallableProperty = (node) =>
    (ts.isPropertyDeclaration(node) || ts.isPropertyAssignment(node)) &&
    Boolean(node.initializer &&
      (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)));
  const isCallableBinding = (node) => ts.isVariableDeclaration(node) &&
    Boolean(node.initializer &&
      (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)));
  const isParameterProperty = (node) => ts.isParameter(node) &&
    node.modifiers?.some((modifier) => [S.PublicKeyword, S.PrivateKeyword,
      S.ProtectedKeyword, S.ReadonlyKeyword].includes(modifier.kind));
  const isBindingDeclaration = (node) => ts.isVariableDeclaration(node) ||
    ts.isParameter(node) || ts.isBindingElement(node) || ts.isImportClause(node) ||
    ts.isImportSpecifier(node) || ts.isNamespaceImport(node) ||
    ts.isImportEqualsDeclaration(node);
  const isLocal = (node) => Boolean(ancestor(node, (parent) => ts.isFunctionLike(parent) ||
    ts.isBlock(parent) || ts.isForStatement(parent) || ts.isForOfStatement(parent) ||
    ts.isForInStatement(parent) || ts.isCatchClause(parent)));
  const inJsxTag = (node) => Boolean(ancestor(node, (parent) =>
    (ts.isJsxOpeningElement(parent) || ts.isJsxClosingElement(parent) || ts.isJsxSelfClosingElement(parent)) &&
    parent.tagName.pos <= node.pos && parent.tagName.end >= node.end));
  const inside = (node, parent) => Boolean(parent && parent.pos <= node.pos && parent.end >= node.end);
  const typeOnlyImport = (node) => ancestor(node, (parent) =>
    ts.isImportClause(parent) && parent.isTypeOnly);
  const satisfiesType = (node) => {
    const expression = ancestor(node, (parent) => ts.isSatisfiesExpression(parent));
    return expression && inside(node, expression.type);
  };
  const assertionPredicateType = (node) => {
    const predicate = ancestor(node, (parent) => ts.isTypePredicateNode(parent));
    return predicate?.assertsModifier && inside(node, predicate.type);
  };
  const namedTupleMember = (node) => ancestor(node, (parent) => ts.isNamedTupleMember(parent));
  const decoratorHead = (node) => {
    const decorator = ancestor(node, (parent) => ts.isDecorator(parent));
    if (!decorator) return false;
    const expression = ts.isCallExpression(decorator.expression)
      ? decorator.expression.expression
      : decorator.expression;
    return inside(node, expression);
  };

  function identifierRole(node) {
    const parent = node.parent;
    if (decoratorHead(node)) return codeRoles.annotation;
    if (inJsxTag(node)) return 'brown';
    if (ts.isJsxAttribute(parent) || ts.isJsxNamespacedName(parent)) return 'yellow';
    if ((ts.isJsxOpeningElement(parent) || ts.isJsxClosingElement(parent) ||
        ts.isJsxSelfClosingElement(parent)) && parent.tagName === node) return 'brown';
    if (ts.isPropertyAccessExpression(parent) && parent.name === node) {
      const called = ts.isCallExpression(parent.parent) && parent.parent.expression === parent;
      const declarations = checker.getSymbolAtLocation(node)?.declarations ?? [];
      if (declarations.some((declaration) => ts.isEnumMember(declaration))) return codeRoles.enumMember;
      if (declarations.some(isAccessor)) return codeRoles.property;
      return called || declarations.some((declaration) => isMethod(declaration) || isCallableProperty(declaration))
        ? codeRoles.method
        : codeRoles.property;
    }
    if (ts.isQualifiedName(parent) && parent.right === node) return codeRoles.type;
    if ((isMethod(parent) || isCallableProperty(parent)) && parent.name === node) return codeRoles.method;
    if (isAccessor(parent) && parent.name === node) return codeRoles.property;
    if ((isProperty(parent) && parent.name === node) ||
        (isParameterProperty(parent) && parent.name === node) ||
        (ts.isBindingElement(parent) && parent.propertyName === node)) return codeRoles.property;
    if (ts.isEnumMember(parent) && parent.name === node) return codeRoles.enumMember;
    if (ts.isTypeAliasDeclaration(parent) && parent.name === node) return codeRoles.type;
    if (parent.name === node && (ts.isClassLike(parent) || ts.isInterfaceDeclaration(parent) ||
        ts.isEnumDeclaration(parent))) return codeRoles.type;
    if (typeOnlyImport(node)) return codeRoles.type;
    if (satisfiesType(node) || assertionPredicateType(node)) return codeRoles.type;
    const tupleMember = namedTupleMember(node);
    if (tupleMember && tupleMember.name === node) return codeRoles.namedArgument;
    if (ts.isTypeParameterDeclaration(parent) && ts.isMappedTypeNode(parent.parent)) return codeRoles.type;
    if (ts.isParameter(parent) &&
        (ts.isFunctionTypeNode(parent.parent) || ts.isConstructorTypeNode(parent.parent))) return codeRoles.binding;
    if (ts.isModuleDeclaration(parent) && parent.name === node) return 'yellow';
    if (node.text === 'const' && ts.isTypeReferenceNode(parent) &&
        ts.isAsExpression(parent.parent)) return 'yellow';
    if (parent.name === node &&
        (ts.isFunctionDeclaration(parent) || ts.isFunctionExpression(parent))) {
      return codeRoles.functionDeclaration;
    }
    if (parent.name === node && isCallableBinding(parent)) {
      return codeRoles.functionDeclaration;
    }
    if (parent.name === node && (ts.isVariableDeclaration(parent) || ts.isParameter(parent) ||
        ts.isBindingElement(parent) ||
        ts.isImportClause(parent) || ts.isImportSpecifier(parent) || ts.isNamespaceImport(parent) ||
        ts.isImportEqualsDeclaration(parent))) return codeRoles.binding;
    if (ts.isImportSpecifier(parent)) return codeRoles.binding;
    if (ts.isCallExpression(parent) && parent.expression === node) return codeRoles.method;
    const typeContext = ancestor(node, (item) => ts.isTypeNode(item));
    if (ts.isTypeParameterDeclaration(parent) || typeContext &&
        !ts.isTypeQueryNode(typeContext) &&
        !(ts.isTypePredicateNode(typeContext) && typeContext.parameterName === node) &&
        !(js && ts.isExpressionWithTypeArguments(typeContext))) return codeRoles.type;
    const symbol = checker.getSymbolAtLocation(node);
    const declarations = symbol?.declarations ?? [];
    if (declarations.some((declaration) => isMethod(declaration) || isCallableProperty(declaration))) {
      return codeRoles.method;
    }
    if (declarations.some(isCallableBinding)) return codeRoles.functionDeclaration;
    if (declarations.some((declaration) => isProperty(declaration) || isParameterProperty(declaration) || isAccessor(declaration))) {
      return codeRoles.property;
    }
    if (declarations.some((item) => isBindingDeclaration(item) || isLocal(item))) return codeRoles.binding;
    return 'yellow';
  }

  const commentKeys = new Set();
  function comments(at, trailing = false) {
    const ranges = (trailing ? ts.getTrailingCommentRanges : ts.getLeadingCommentRanges)(source, at) ?? [];
    for (const range of ranges) {
      if (commentKeys.has(range.pos)) continue;
      commentKeys.add(range.pos);
      addComment(spans, source, range.pos, range.end);
    }
  }
  function visit(node) {
    const start = node.getStart(file);
    comments(node.pos);
    comments(node.end, true);
    if (ts.isIdentifier(node) || ts.isPrivateIdentifier(node)) {
      spans.add(start, node.end, identifierRole(node), 30);
      return;
    }
    if (ts.isStringLiteralLike(node) || ts.isRegularExpressionLiteral(node) ||
        [S.TemplateHead, S.TemplateMiddle, S.TemplateTail].includes(node.kind)) {
      spans.add(start, node.end, 'green', 40);
      return;
    }
    if (ts.isNumericLiteral(node) || ts.isBigIntLiteral(node)) {
      spans.add(start, node.end, 'orange', 30);
      return;
    }
    if (ts.isJsxText(node)) {
      for (const match of source.slice(start, node.end).matchAll(/&(?:#\d+|#x[\da-f]+|[a-z][\da-z]*);/gi)) {
        spans.add(start + match.index, start + match.index + match[0].length, 'yellow');
      }
      return;
    }
    const children = node.getChildren(file);
    if (children.length) { for (const child of children) visit(child); return; }
    if (node.kind === S.EndOfFileToken || start === node.end) return;
    const parent = node.parent;
    let role = 'white';
    if (node.kind >= S.FirstKeyword && node.kind <= S.LastKeyword) role = codeRoles.keyword;
    if (node.kind >= S.FirstTypeNode && node.kind <= S.LastTypeNode ||
        [S.StringKeyword, S.NumberKeyword, S.BooleanKeyword, S.AnyKeyword, S.UnknownKeyword,
          S.NeverKeyword, S.ObjectKeyword, S.SymbolKeyword, S.BigIntKeyword, S.VoidKeyword].includes(node.kind)) role = codeRoles.type;
    if (node.kind === S.VoidKeyword) role = codeRoles.keyword;
    if ([S.TrueKeyword, S.FalseKeyword].includes(node.kind)) role = 'yellow';
    if (node.kind === S.NullKeyword) role = 'orange';
    if (node.kind === S.AsKeyword) role = codeRoles.binding;
    if (node.kind === S.TypeKeyword && ts.isImportClause(parent) && parent.isTypeOnly) role = codeRoles.keyword;
    if (node.kind >= S.FirstPunctuation && node.kind <= S.LastPunctuation &&
        ![S.OpenBraceToken, S.CloseBraceToken, S.OpenParenToken, S.CloseParenToken,
          S.OpenBracketToken, S.CloseBracketToken, S.DotToken, S.SemicolonToken, S.CommaToken,
          S.ColonToken].includes(node.kind)) role = 'operator';
    if (node.kind === S.DotDotDotToken) role = 'purple';
    if (node.kind === S.QuestionDotToken) role = 'white';
    if (node.kind === S.AtToken && ts.isDecorator(parent)) role = codeRoles.annotation;
    if (inJsxTag(node)) role = 'brown';
    if (node.kind === S.ConstructorKeyword && ts.isConstructorDeclaration(parent)) {
      role = codeRoles.method;
    }
    if (node.kind === S.AsteriskToken && ts.isFunctionLike(parent)) role = codeRoles.keyword;
    if (node.kind === S.AsteriskToken &&
        (ts.isNamespaceImport(parent) || ts.isExportDeclaration(parent))) role = 'yellow';
    if (ts.isJsxAttribute(parent) && node.kind === S.EqualsToken) role = 'white';
    if ((ts.isJsxOpeningElement(parent) || ts.isJsxClosingElement(parent) ||
        ts.isJsxSelfClosingElement(parent) || ts.isJsxOpeningFragment(parent) ||
        ts.isJsxClosingFragment(parent)) &&
        [S.LessThanToken, S.GreaterThanToken, S.SlashToken].includes(node.kind)) role = 'brown';
    spans.add(start, node.end, role);
  }
  visit(file);
  return spans.finish();
}

module.exports = { refineTypeScript };
