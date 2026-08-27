$ErrorActionPreference = 'Stop'
$Source = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host ''
Write-Host '=== ACTUALIZADOR APP MODULOS 2026 ===' -ForegroundColor Cyan
Write-Host "Carpeta corregida: $Source" -ForegroundColor Gray

$roots = @(
  (Join-Path $env:USERPROFILE 'Downloads'),
  (Join-Path $env:USERPROFILE 'Desktop'),
  (Join-Path $env:USERPROFILE 'Documents')
) | Where-Object { Test-Path $_ }

$candidates = @()
foreach ($root in $roots) {
  $exact = Join-Path $root 'app-modulo'
  if ((Test-Path $exact) -and (Test-Path (Join-Path $exact '.git'))) {
    $candidates += Get-Item $exact
  }
}
if ($candidates.Count -eq 0) {
  foreach ($root in $roots) {
    try {
      $found = Get-ChildItem $root -Directory -Force -Recurse -Depth 4 -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -eq 'app-modulo' -and (Test-Path (Join-Path $_.FullName '.git')) }
      $candidates += $found
    } catch {}
  }
}
$candidates = $candidates | Sort-Object FullName -Unique

if ($candidates.Count -eq 0) {
  Write-Host 'NO SE ENCONTRO el repositorio app-modulo.' -ForegroundColor Red
  Write-Host 'Busca tu carpeta original que contiene la carpeta oculta .git y vuelve a ejecutar este archivo.'
  Pause
  exit 1
}

if ($candidates.Count -eq 1) {
  $Repo = $candidates[0]
} else {
  Write-Host 'Se encontraron varios repositorios app-modulo:' -ForegroundColor Yellow
  for ($i=0; $i -lt $candidates.Count; $i++) { Write-Host "[$($i+1)] $($candidates[$i].FullName)" }
  $sel = Read-Host 'Escribe el numero de tu repositorio original'
  if (-not ($sel -as [int]) -or [int]$sel -lt 1 -or [int]$sel -gt $candidates.Count) { throw 'Seleccion no valida.' }
  $Repo = $candidates[[int]$sel-1]
}

Write-Host "Repositorio encontrado: $($Repo.FullName)" -ForegroundColor Green
Set-Location $Repo.FullName

$branch = (git branch --show-current).Trim()
if ($branch -ne 'main') { throw "El repositorio esta en la rama '$branch'. Cambia a main antes de continuar." }
$remote = (git remote get-url origin 2>$null).Trim()
Write-Host "Remote: $remote" -ForegroundColor Gray
if ($remote -notmatch 'github.com[/:]gemaortizprivados23-lgtm/app-modulo') {
  Write-Host 'ADVERTENCIA: el remote no coincide con el repositorio esperado.' -ForegroundColor Yellow
  $ok = Read-Host 'Es el repositorio correcto? Escribe SI para continuar'
  if ($ok -ne 'SI') { exit 1 }
}

$status = git status --porcelain
if ($status) {
  Write-Host 'Tu repositorio tiene cambios locales sin guardar:' -ForegroundColor Yellow
  git status --short
  throw 'Para proteger tu trabajo, primero guarda o haz commit de esos cambios. No se modifico nada.'
}

Write-Host 'Sincronizando main con GitHub...' -ForegroundColor Cyan
git fetch origin
git pull --rebase origin main

$backup = Join-Path (Split-Path $Repo.FullName -Parent) ("app-modulo-respaldo-" + (Get-Date -Format 'yyyyMMdd-HHmmss'))
Copy-Item $Repo.FullName $backup -Recurse -Force
Write-Host "Respaldo creado: $backup" -ForegroundColor Green

Write-Host 'Copiando la version corregida...' -ForegroundColor Cyan
$robocopyArgs = @(
  $Source, $Repo.FullName, '/E', '/COPY:DAT', '/DCOPY:DAT', '/R:1', '/W:1',
  '/XD', '.git', 'node_modules', 'dist',
  '/XF', '.env', 'CREDENCIALES_DOCENTES_2026.txt', 'ACTUALIZAR_REPOSITORIO.ps1'
)
& robocopy @robocopyArgs | Out-Host
if ($LASTEXITCODE -gt 7) { throw "Robocopy devolvio codigo $LASTEXITCODE. No se hizo commit." }

Write-Host 'Cambios detectados:' -ForegroundColor Cyan
git status --short

git add .
if (-not (git diff --cached --quiet)) {
  git commit -m 'Actualizar App Modulos 2026 y corregir reportes'
  git push origin main
  Write-Host ''
  Write-Host 'LISTO: cambios subidos a GitHub.' -ForegroundColor Green
  Write-Host 'Ahora entra en GitHub > Actions y espera Success.' -ForegroundColor Green
} else {
  Write-Host 'No hay cambios para subir.' -ForegroundColor Yellow
}
Write-Host ''
Write-Host 'No se tocaron .git ni .env.' -ForegroundColor Gray
Pause
