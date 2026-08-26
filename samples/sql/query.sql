SELECT
  theme_name,
  accent_color,
  COUNT(*) AS usage_count
FROM theme_usage
WHERE enabled = TRUE
GROUP BY theme_name, accent_color
ORDER BY usage_count DESC;
