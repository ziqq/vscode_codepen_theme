module example.com/codepen-theme-sample

go 1.25.0

// Exercise dependency and replacement scopes.
require example.com/codepen-theme-dependency v1.2.3

replace example.com/codepen-theme-dependency => ../dependency
