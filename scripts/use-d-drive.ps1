$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$cacheDir = Join-Path $projectRoot ".npm-cache"
$tempDir = Join-Path $projectRoot ".tmp"

New-Item -ItemType Directory -Path $cacheDir, $tempDir -Force | Out-Null

$env:npm_config_cache = $cacheDir
$env:TEMP = $tempDir
$env:TMP = $tempDir
$env:NODE_COMPILE_CACHE = Join-Path $tempDir "node-compile-cache"
$env:XDG_CONFIG_HOME = Join-Path $tempDir "config"

Write-Output "npm cache and temporary files: $projectRoot"
