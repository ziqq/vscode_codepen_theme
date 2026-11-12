module example.com/codepen-theme-sample

go 1.25.0

// Exercise dependency blocks, indirect requirements, replacements, and excludes.
require (
	example.com/codepen-theme-dependency v1.2.3
	example.com/codepen-theme-provider v0.4.0 // indirect
)

replace (
	example.com/codepen-theme-dependency => ../dependency
	example.com/codepen-theme-provider v0.4.0 => example.com/codepen-theme-provider v0.4.1
)

exclude example.com/codepen-theme-provider v0.3.0
