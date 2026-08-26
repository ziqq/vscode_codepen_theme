import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const mode = process.argv[2] ?? '--check';
if (!['--check', '--write'].includes(mode)) {
  throw new Error('Usage: node scripts/render-visual-baseline.mjs [--check|--write]');
}

const compatibility = JSON.parse(
  await readFile('compatibility/scopes.json', 'utf8'),
);
const theme = JSON.parse(await readFile('themes/codepen-theme.json', 'utf8'));
const providers = new Map(
  compatibility.providers.map((provider) => [
    provider.id.toLowerCase(),
    provider,
  ]),
);

const selectors = theme.tokenColors.flatMap((rule) => {
  const scopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
  return scopes
    .filter(
      (scope) =>
        typeof scope === 'string' &&
        !/[\s,*|]/.test(scope) &&
        scope.length > 0,
    )
    .map((scope) => ({ scope, settings: rule.settings ?? {} }));
});

function resolveStyle(scope) {
  const style = { foreground: theme.colors['editor.foreground'] };
  for (const selector of selectors) {
    if (
      scope === selector.scope ||
      scope.startsWith(`${selector.scope}.`)
    ) {
      Object.assign(style, selector.settings);
    }
  }
  return style;
}

const escapeXml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

function renderSvg() {
  const width = 1280;
  const headerHeight = 112;
  const rowHeight = 122;
  const height = headerHeight + compatibility.cases.length * rowHeight + 32;
  const background = theme.colors['editor.background'];
  const surface = theme.colors['tab.activeBackground'] ?? '#2d303a';
  const foreground = theme.colors['editor.foreground'];
  const muted = theme.colors['sideBar.foreground'] ?? '#717790';

  const rows = compatibility.cases.map((item, index) => {
    const y = headerHeight + index * rowHeight;
    const provider = providers.get(item.provider.toLowerCase());
    const scopes = item.requiredScopes.map((scope, scopeIndex) => {
      const x = 430 + (scopeIndex % 2) * 410;
      const scopeY = y + 32 + Math.floor(scopeIndex / 2) * 39;
      const style = resolveStyle(scope);
      const fontStyle = style.fontStyle?.includes('italic')
        ? 'font-style="italic"'
        : '';
      return [
        `<rect x="${x}" y="${scopeY - 15}" width="14" height="14" rx="3" fill="${escapeXml(style.foreground)}"/>`,
        `<text x="${x + 24}" y="${scopeY - 3}" fill="${escapeXml(style.foreground)}" ${fontStyle}>${escapeXml(scope)}</text>`,
      ].join('');
    });

    return [
      `<rect x="24" y="${y}" width="1232" height="106" rx="10" fill="${surface}"/>`,
      `<text class="language" x="48" y="${y + 35}" fill="${foreground}">${escapeXml(item.language)}</text>`,
      `<text x="48" y="${y + 62}" fill="${muted}">${escapeXml(item.languageId)} · ${escapeXml(item.rootScope)}</text>`,
      `<text x="48" y="${y + 87}" fill="${muted}">${escapeXml(provider.id)} @ ${escapeXml(provider.version)}</text>`,
      scopes.join(''),
    ].join('');
  });

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    '<style>text{font:14px SFMono-Regular,Consolas,Liberation Mono,monospace}.title{font-size:24px;font-weight:700}.language{font-size:17px;font-weight:700}</style>',
    `<rect width="100%" height="100%" fill="${background}"/>`,
    `<text class="title" x="32" y="42" fill="${foreground}">CodePen Theme compatibility baseline</text>`,
    `<text x="32" y="70" fill="${muted}">VS Code ${escapeXml(compatibility.verifiedVscodeVersion)} · verified ${escapeXml(compatibility.verifiedAt)} · ${compatibility.cases.length} syntax fixtures</text>`,
    `<text x="32" y="94" fill="${muted}">Generated from themes/codepen-theme.json and compatibility/scopes.json</text>`,
    rows.join(''),
    '</svg>',
    '',
  ].join('\n');
}

function readWebpDimensions(buffer) {
  if (
    buffer.toString('ascii', 0, 4) !== 'RIFF' ||
    buffer.toString('ascii', 8, 12) !== 'WEBP'
  ) {
    throw new Error('Not a WebP image');
  }

  const chunk = buffer.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') {
    return {
      width: buffer.readUInt16LE(26) & 0x3fff,
      height: buffer.readUInt16LE(28) & 0x3fff,
    };
  }
  if (chunk === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >> 14) & 0x3fff) + 1,
    };
  }
  if (chunk === 'VP8X') {
    return {
      width: buffer.readUIntLE(24, 3) + 1,
      height: buffer.readUIntLE(27, 3) + 1,
    };
  }
  throw new Error(`Unsupported WebP chunk ${chunk}`);
}

async function renderAssetManifest() {
  const languagesByAsset = new Map();
  for (const item of compatibility.cases) {
    for (const screenshot of item.screenshots ?? []) {
      const languages = languagesByAsset.get(screenshot) ?? [];
      languages.push(item.language);
      languagesByAsset.set(screenshot, languages);
    }
  }

  const assets = [];
  for (const [path, languages] of [...languagesByAsset].sort()) {
    const buffer = await readFile(path);
    const dimensions = readWebpDimensions(buffer);
    if (dimensions.width > 888) {
      throw new Error(`${path} is wider than its 888px rendered size`);
    }
    assets.push({
      path,
      languages,
      ...dimensions,
      bytes: buffer.length,
      sha256: createHash('sha256').update(buffer).digest('hex'),
    });
  }

  return `${JSON.stringify(
    {
      schemaVersion: 1,
      generatedFrom: 'compatibility/scopes.json',
      assets,
    },
    null,
    2,
  )}\n`;
}

const svg = renderSvg();
const assetManifest = await renderAssetManifest();
const svgPath = 'compatibility/visual-baseline.svg';
const assetManifestPath = 'compatibility/visual-baselines.json';

if (mode === '--write') {
  await writeFile(svgPath, svg);
  await writeFile(assetManifestPath, assetManifest);
  console.log('Updated visual compatibility baselines.');
} else {
  const currentSvg = await readFile(svgPath, 'utf8');
  const currentAssetManifest = await readFile(assetManifestPath, 'utf8');
  if (currentSvg !== svg || currentAssetManifest !== assetManifest) {
    throw new Error(
      'Visual baseline is stale; review the theme in Extension Development Host, then run npm run visual:update',
    );
  }
  console.log('Visual compatibility baselines are current.');
}
