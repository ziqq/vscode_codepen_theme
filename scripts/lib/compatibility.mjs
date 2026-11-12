/**
 * @file Small exact-version and comparator helpers for the pinned provider contract.
 * The accepted range syntax is deliberately narrower than full npm semver.
 */

/**
 * @typedef {object} Provider
 * @property {string} id Canonical publisher.name extension ID.
 * @property {'builtin' | 'recommended'} kind Whether VS Code supplies this grammar.
 * @property {{vscode: string, version: string}[]} [compatibility] Exact provider pins by editor range.
 */

/**
 * Parse the exact three-component versions used by the compatibility contract.
 *
 * @throws {Error} When the version contains unsupported suffixes or missing components.
 * @param {string} value Version in major.minor.patch form.
 * @returns {number[]} Numeric major, minor, and patch.
 */
export function parseVersion(value) {
  const match = String(value).match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid version ${value}`);
  }
  return match.slice(1).map(Number);
}

/**
 * Compare exact versions numerically, accepting already parsed triples.
 *
 * @param {string | number[]} leftValue Left version.
 * @param {string | number[]} rightValue Right version.
 * @returns {number} Negative, zero, or positive comparison result.
 */
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

/**
 * Evaluate the contract's whitespace-separated comparator constraints.
 * This deliberately does not implement npm caret, tilde, OR, or prerelease ranges.
 *
 * @param {string} version Exact version to evaluate.
 * @param {string} range Conjunction of supported exact/comparator constraints.
 * @returns {boolean} Whether every constraint matches.
 */
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

/**
 * Select the exact language-provider version compatible with a VS Code version.
 *
 * @param {Provider} provider Built-in or recommended provider record.
 * @param {string} vscodeVersion Exact editor version under test.
 * @returns {string} Editor version for built-ins, otherwise the matching pinned provider version.
 */
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
