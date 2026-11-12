@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Exercise variables, labels, calls, loops, conditionals, and numbers.
set "THEME_NAME=CodePen Theme Original"
set "ACCENT=#96b38a"
set /a TOKEN_COUNT=3

for %%F in ("*.json") do (
  echo Inspecting %%~nxF
)

if defined THEME_NAME (
  call :render "%THEME_NAME%" %TOKEN_COUNT%
) else (
  echo Missing theme name 1>&2
  exit /b 1
)

exit /b 0

:render
set "LABEL=%~1"
for /L %%I in (1,1,%~2) do echo [%%I] !LABEL! !ACCENT!
goto :eof
