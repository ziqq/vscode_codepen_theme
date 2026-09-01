import { Fragment, useMemo } from 'react';

const tokens = [
  ['keyword', '#ddca7e'],
  ['string', '#96b38a'],
  ['comment', '#717790'],
];

export function ThemePreview({ name = 'CodePen Theme Original', onSelect }) {
  const rows = useMemo(
    () => tokens.map(([token, color], index) => ({ token, color, index })),
    [],
  );

  return (
    <section aria-label={name} className="theme-preview">
      <h1>{name}</h1>
      <ul data-count={rows.length}>
        {rows.map(({ token, color, index }) => (
          <li key={token} style={{ '--token-color': color }}>
            <button
              type="button"
              data-token={token}
              onClick={() => onSelect?.(token)}
            >
              <strong>{index + 1}. {token}</strong>
              <code>{color}</code>
            </button>
          </li>
        ))}
      </ul>
      {rows.length === 0 ? <em>No tokens</em> : <Fragment />}
    </section>
  );
}

export function TokenBadge({ token, color, compact = false, ...attributes }) {
  const label = compact ? token : `${token}: ${color ?? 'inherit'}`;

  return (
    <span
      {...attributes}
      className={`token-badge ${compact ? 'token-badge--compact' : ''}`}
      data-token={token}
      style={{ color }}
    >
      {color ? <code>{label}</code> : <del>{label}</del>}
    </span>
  );
}
