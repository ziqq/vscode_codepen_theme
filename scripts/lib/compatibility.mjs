export function parseVersion(value) {
  const match = String(value).match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version ${value}`);
  }
  return match.slice(1).map(Number);
}

export function compareVersions(leftValue, rightValue) {
  const left = Array.isArray(leftValue) ? leftValue : parseVersion(leftValue);
  const right = Array.isArray(rightValue) ? rightValue : parseVersion(rightValue);
  for (let index = 0; index < 3; index += 1) {
    if (left[index] !== right[index]) {
      return left[index] - right[index];
    }
  }
  return 0;
}

export function satisfiesVersionRange(version, range) {
  return range.split(/\s+/).every((constraint) => {
    const match = constraint.match(/^(>=|>|<=|<|=)?(\d+\.\d+\.\d+)$/);
    if (!match) {
      throw new Error(`Unsupported version constraint ${constraint}`);
    }
    const comparison = compareVersions(version, match[2]);
    switch (match[1] ?? '=') {
      case '>=':
        return comparison >= 0;
      case '>':
        return comparison > 0;
      case '<=':
        return comparison <= 0;
      case '<':
        return comparison < 0;
      default:
        return comparison === 0;
    }
  });
}

export function providerVersionFor(provider, vscodeVersion) {
  if (provider.kind === 'builtin') {
    return vscodeVersion;
  }
  const band = provider.compatibility?.find((candidate) =>
    satisfiesVersionRange(vscodeVersion, candidate.vscode),
  );
  if (!band) {
    throw new Error(
      `${provider.id} has no compatible version for VS Code ${vscodeVersion}`,
    );
  }
  return band.version;
}
