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
