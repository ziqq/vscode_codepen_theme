WITH active_themes AS (
  SELECT
    theme_name,
    accent_color,
    background_color,
    enabled
  FROM theme_usage
  WHERE enabled = TRUE
), usage_summary AS (
  SELECT
    theme_name,
    accent_color,
    COUNT(*) AS usage_count,
    MAX(updated_at) AS last_used_at
  FROM active_themes
  GROUP BY theme_name, accent_color
)
SELECT
  summary.theme_name,
  summary.accent_color,
  summary.usage_count,
  CASE
    WHEN summary.usage_count >= 10 THEN 'popular'
    ELSE 'preview'
  END AS status
FROM usage_summary AS summary
WHERE summary.accent_color IS NOT NULL
  AND summary.usage_count > 0
ORDER BY summary.usage_count DESC, summary.theme_name ASC;

INSERT INTO theme_usage (theme_name, accent_color, background_color, enabled)
VALUES ('CodePen Theme Original', '#96b38a', '#1d1e22', TRUE)
ON CONFLICT (theme_name) DO UPDATE
SET accent_color = EXCLUDED.accent_color,
    background_color = EXCLUDED.background_color,
    updated_at = CURRENT_TIMESTAMP
RETURNING theme_name, updated_at;

SELECT
  theme_name,
  ROW_NUMBER() OVER (PARTITION BY enabled ORDER BY updated_at DESC) AS rank,
  LAG(accent_color) OVER (ORDER BY updated_at) AS previous_accent
FROM theme_usage
WHERE updated_at >= CURRENT_DATE - INTERVAL '30 days';

-- ---------------------------------------------------------------------------
-- Extended showcase: DDL, constraints, functions, triggers, upserts, JSON.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS palette_tokens (
  id BIGSERIAL PRIMARY KEY,
  theme_id INTEGER NOT NULL REFERENCES themes (id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL,
  color CHAR(7) NOT NULL CHECK (color ~ '^#[0-9a-f]{6}$'),
  weight NUMERIC(5, 2) DEFAULT 1.0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT palette_tokens_role_unique UNIQUE (theme_id, role)
);

CREATE INDEX CONCURRENTLY IF NOT EXISTS palette_tokens_color_idx
  ON palette_tokens USING btree (color)
  WHERE weight > 0.5;

/* Keep updated_at in sync on every change. */
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER themes_touch_updated_at
  BEFORE UPDATE ON themes
  FOR EACH ROW
  EXECUTE FUNCTION touch_updated_at();

INSERT INTO palette_tokens (theme_id, role, color, weight, metadata)
VALUES
  (1, 'keyword', '#ddca7e', 2.5, '{"italic": false}'),
  (1, 'string', '#96b38a', 1.0, '{"italic": false}'),
  (1, 'comment', '#717790', 0.75, '{"italic": true}')
ON CONFLICT (theme_id, role) DO UPDATE
  SET color = EXCLUDED.color,
      weight = GREATEST(palette_tokens.weight, EXCLUDED.weight)
RETURNING id, role, color;

BEGIN;
UPDATE themes AS t
SET enabled = FALSE
FROM (
  SELECT theme_id, COUNT(*) AS token_count
  FROM palette_tokens
  GROUP BY theme_id
  HAVING COUNT(*) < 3
) AS sparse
WHERE t.id = sparse.theme_id
  AND t.name NOT LIKE 'CodePen%'
  AND t.updated_at BETWEEN '2026-01-01' AND '2026-12-31';
DELETE FROM palette_tokens WHERE metadata ->> 'deprecated' = 'true' OR color IS NULL;
COMMIT;

SELECT
  t.name,
  p.role,
  UPPER(p.color) AS color,
  CASE
    WHEN p.weight >= 2 THEN 'strong'
    WHEN p.weight BETWEEN 1 AND 2 THEN 'normal'
    ELSE 'weak'
  END AS emphasis,
  COALESCE((p.metadata ->> 'italic')::BOOLEAN, FALSE) AS italic,
  CAST(EXTRACT(EPOCH FROM p.created_at) AS INTEGER) AS created_epoch
FROM themes AS t
INNER JOIN palette_tokens AS p ON p.theme_id = t.id
LEFT JOIN LATERAL (
  SELECT jsonb_agg(role ORDER BY role) AS roles
  FROM palette_tokens
  WHERE theme_id = t.id
) AS agg ON TRUE
WHERE t.enabled IS TRUE
  AND p.role IN ('keyword', 'string', 'comment')
  AND EXISTS (SELECT 1 FROM theme_usage AS u WHERE u.theme_name = t.name)
ORDER BY t.name ASC, p.weight DESC NULLS LAST
LIMIT 50 OFFSET 0;
