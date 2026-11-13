Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Classes, attributes, typed parameters, splatting, interpolation, and pipelines.
class Theme {
    [string] $Name
    [string] $Accent
    [string[]] $Tokens

    Theme([string] $name, [string] $accent, [string[]] $tokens) {
        $this.Name = $name
        $this.Accent = $accent
        $this.Tokens = $tokens
    }

    [string] Label([string] $prefix) {
        return "${prefix}: $($this.Name) ($($this.Accent))"
    }
}

function Get-VisibleToken {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [string[]] $Token,
        [switch] $IncludeComments
    )

    process {
        $Token |
            Where-Object { $IncludeComments -or $_ -ne 'comment' } |
            ForEach-Object { $_.ToUpperInvariant() }
    }
}

$themeArgs = @{
    name = 'CodePen Theme Original'
    accent = '#96b38a'
    tokens = @('keyword', 'string', 'comment')
}
$theme = [Theme]::new($themeArgs.name, $themeArgs.accent, $themeArgs.tokens)
$visible = $theme.Tokens | Get-VisibleToken
Write-Output "$($theme.Label('theme')) -> $($visible -join ', ')"
