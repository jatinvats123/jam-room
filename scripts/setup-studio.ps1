<#
  Jam Room studio setup (Windows).
  Usage:  powershell -ExecutionPolicy Bypass -File scripts\setup-studio.ps1 [-Target C:\path\to\jam-studio]

  Copies studio-kit/ into the target folder, runs npm install, and makes it a git repo.
  Safe to re-run: kit files (STUDIO.md, starter/, tools/, package.json) are refreshed,
  while games/ and the generated arcade index.html are never overwritten.
#>
param([string]$Target = (Join-Path $env:USERPROFILE 'jam-studio'))
$ErrorActionPreference = 'Stop'

$Kit = Join-Path (Split-Path -Parent $PSScriptRoot) 'studio-kit'
if (-not (Test-Path (Join-Path $Kit 'STUDIO.md'))) { throw "studio-kit not found at $Kit" }
foreach ($cmd in 'node', 'npm', 'git') {
  if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "$cmd is not installed or not on PATH." }
}
$major = [int]((node -v).TrimStart('v').Split('.')[0])
if ($major -lt 20) { throw "Node 20+ is required (found $(node -v))." }

Write-Host "Jam Room studio -> $Target" -ForegroundColor Magenta
New-Item -ItemType Directory -Force -Path $Target | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $Target 'games') | Out-Null

# Kit-owned files: always refreshed from the kit.
foreach ($item in 'STUDIO.md', 'package.json', '.gitignore', '.gitattributes') {
  Copy-Item -Force (Join-Path $Kit $item) (Join-Path $Target $item)
}
New-Item -ItemType Directory -Force -Path (Join-Path $Target '.claude') | Out-Null
Copy-Item -Force (Join-Path $Kit '.claude\settings.json') (Join-Path $Target '.claude\settings.json')
foreach ($dir in 'starter', 'tools') {
  $dest = Join-Path $Target $dir
  if (Test-Path $dest) { Remove-Item -Recurse -Force $dest }
  Copy-Item -Recurse -Force (Join-Path $Kit $dir) $dest
}
$keep = Join-Path $Target 'games\.gitkeep'
if (-not (Test-Path $keep)) { New-Item -ItemType File -Path $keep | Out-Null }

Push-Location $Target
try {
  Write-Host 'Installing packages...'
  npm install --no-fund --no-audit --loglevel=error
  if ($LASTEXITCODE -ne 0) { throw 'npm install failed.' }
  Write-Host 'Installing headless Chromium for the playtester...'
  npx playwright install chromium
  if ($LASTEXITCODE -ne 0) { throw 'Playwright browser install failed.' }

  node tools/build-arcade.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Building the arcade page failed.' }

  if (-not (Test-Path '.git')) {
    git init -q -b main
    if ($LASTEXITCODE -ne 0) { git init -q; git checkout -q -b main }
  }
  if (-not (git config user.email)) {
    git config user.name 'Jam Room'
    git config user.email 'jam-room@localhost'
  }
  git add -A
  git diff --cached --quiet
  if ($LASTEXITCODE -ne 0) {
    $msg = if (git rev-parse --verify -q HEAD) { 'update studio kit' } else { 'studio setup' }
    git commit -q -m $msg
    Write-Host "Committed: $msg"
  } else {
    Write-Host 'Studio already up to date.'
  }
} finally { Pop-Location }

Write-Host ''
Write-Host 'Studio ready.' -ForegroundColor Green
Write-Host "Next steps:"
Write-Host "  1. cd `"$Target`""
Write-Host '  2. npm run serve            (arcade at http://localhost:8080/)'
Write-Host '  3. Point your three Switch agents at this folder (see the README).'
