# Script de compilación del instalador para Iglesia EFESO
# Requisitos:
#   - Windows 10/11
#   - Node.js 18+ instalado
#   - Inno Setup 6+ instalado (https://jrsoftware.org/isinfo.php)
#   - Git (opcional, para clonar el repositorio)
#
# Uso:
#   1. Clonar o copiar el proyecto completo
#   2. Abrir PowerShell como Administrador
#   3. Ejecutar: .\setup\build-installer.ps1
#
# El instalador se generará en: setup\output\

Write-Host "=== Compilación del Instalador Iglesia EFESO ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar Node.js
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "[ERROR] Node.js no está instalado. Instálelo desde https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Node.js $nodeVersion" -ForegroundColor Green

# 2. Verificar Inno Setup
$innoPath = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe"
if (-not (Test-Path $innoPath)) {
    $innoPath = "${env:ProgramFiles}\Inno Setup 6\ISCC.exe"
}
if (-not (Test-Path $innoPath)) {
    Write-Host "[ERROR] Inno Setup 6 no encontrado. Instálelo desde https://jrsoftware.org/isinfo.php" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Inno Setup encontrado" -ForegroundColor Green

# 3. Instalar dependencias del backend
Write-Host ""
Write-Host "[1/3] Instalando dependencias del backend..." -ForegroundColor Yellow
Set-Location (Join-Path $PSScriptRoot "..\backend")
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error al instalar dependencias del backend" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Dependencias del backend instaladas" -ForegroundColor Green

# 4. Instalar dependencias y construir frontend
Write-Host "[2/3] Construyendo frontend..." -ForegroundColor Yellow
Set-Location (Join-Path $PSScriptRoot "..\frontend")
npm install
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error al construir el frontend" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Frontend construido" -ForegroundColor Green

# 5. Compilar instalador con Inno Setup
Write-Host "[3/3] Compilando instalador..." -ForegroundColor Yellow
Set-Location (Join-Path $PSScriptRoot)
& $innoPath "setup.iss"
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Error al compilar el instalador" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Instalador compilado exitosamente ===" -ForegroundColor Cyan
Write-Host "Archivo: setup\output\IglesiaEFESO-Setup-1.0.0.exe" -ForegroundColor White
