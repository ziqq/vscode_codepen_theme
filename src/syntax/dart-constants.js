/**
 * @file Resolve ambiguous static Dart tokens through actual definition locations.
 * Only parser-confirmed const declarations are recolored; stale tasks preserve input.
 */

const vscode = require('vscode');
const { maximumDocumentLength } = require('./refine');

// Dart exposes const and static-final fields with the same semantic token.
// Resolve only static references, then inspect their actual declarations in the worker.
/**
 * Resolve static Dart references to their definitions before applying the constant role.
 * The provider cannot distinguish const from static final, so source declarations
 * are inspected in the parser worker. Stale work returns the original spans.
 *
 * @param {import('vscode').TextDocument} document Referencing Dart document.
 * @param {import('./spans').Span[]} spans Structural refinements to preserve except verified constants.
 * @param {(source: string, offsets: number[]) => Promise<boolean[]>} analyze Worker-backed inspection of defining documents.
 * @param {() => boolean} current Liveness/version guard checked across asynchronous boundaries.
 * @returns {Promise<import('./spans').Span[]>} Original spans or a copy with verified constant references colored blue.
 */
async function resolveDartConstants(document, spans, analyze, current) {
  const provider = vscode.extensions.getExtension('Dart-Code.dart-code');
  if (!provider) return spans;
  await provider.activate();
  const range = new vscode.Range(document.positionAt(0), document.positionAt(document.getText().length));
  let legend, tokens;
  for (let attempt = 0; attempt < 40 && current(); attempt++) {
    [legend, tokens] = await Promise.all([
      vscode.commands.executeCommand('vscode.provideDocumentRangeSemanticTokensLegend', document.uri, range),
      vscode.commands.executeCommand('vscode.provideDocumentRangeSemanticTokens', document.uri, range),
    ]);
    if (legend && tokens?.data?.length) break;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!current() || !legend || !tokens?.data?.length) return spans;
  const staticModifier = legend.tokenModifiers.indexOf('static');
  if (staticModifier < 0) return spans;
  const candidates = [];
  // Semantic-token positions are delta encoded; columns reset after a line delta.
  let line = 0, character = 0;
  for (let index = 0; index < tokens.data.length; index += 5) {
    const [deltaLine, deltaCharacter, length, type, modifiers] = tokens.data.slice(index, index + 5);
    line += deltaLine;
    character = deltaLine ? deltaCharacter : character + deltaCharacter;
    if (!(modifiers & (1 << staticModifier)) ||
        !['property', 'variable'].includes(legend.tokenTypes[type])) continue;
    const position = new vscode.Position(line, character);
    const start = document.offsetAt(position);
    if (spans.some((span) => span.start <= start && span.end >= start + length && span.role === 'blue')) continue;
    candidates.push({ position, start, end: start + length });
  }
  const definitions = await Promise.all(candidates.map(async (candidate) => {
    if (!current()) return;
    const locations = await vscode.commands.executeCommand('vscode.executeDefinitionProvider', document.uri, candidate.position);
    const location = locations?.[0];
    if (!location) return;
    return { ...candidate, uri: location.targetUri ?? location.uri,
      position: (location.targetSelectionRange ?? location.range).start };
  }));
  // A symbol can be referenced repeatedly. Parse each defining document once per pass.
  const groups = new Map();
  for (const definition of definitions.filter(Boolean)) {
    const key = definition.uri.toString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(definition);
  }
  const constants = [];
  for (const group of groups.values()) {
    if (!current()) return spans;
    const target = await vscode.workspace.openTextDocument(group[0].uri);
    const source = target.getText();
    if (source.length > maximumDocumentLength) continue;
    const version = target.version;
    const matches = await analyze(source, group.map((item) => target.offsetAt(item.position)));
    if (target.version !== version) continue;
    constants.push(...group.filter((_, index) => matches[index]));
  }
  if (!current()) return spans;
  let result = spans;
  // Split only intersecting intervals, preserving neighboring roles and typography.
  for (const constant of constants) result = result.flatMap((span) => {
    if (span.end <= constant.start || span.start >= constant.end) return [span];
    return [
      ...(span.start < constant.start ? [{ ...span, end: constant.start }] : []),
      { ...span, start: Math.max(span.start, constant.start), end: Math.min(span.end, constant.end), role: 'blue' },
      ...(span.end > constant.end ? [{ ...span, start: constant.end }] : []),
    ];
  });
  return result;
}

module.exports = { resolveDartConstants };
