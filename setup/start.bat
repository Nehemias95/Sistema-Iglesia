@echo off
title Iglesia EFESO - Sistema de Gestión
echo ============================================
echo   Iglesia EFESO - Sistema de GestiOn
echo   Iniciando servidor...
echo ============================================

:: Obtener la ruta del directorio actual
set "APP_DIR=%~dp0"

:: Verificar que Node.js esté instalado
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js no estA instalado.
    echo Por favor, ejecute el instalador completo o instale Node.js desde https://nodejs.org
    pause
    exit /b 1
)

:: Verificar que la base de datos esté disponible
echo [1/4] Verificando base de datos...
cd /d "%APP_DIR%backend"
node src/migrate.js >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] No se pudo conectar a la base de datos.
    echo AsegArese de que PostgreSQL estA instalado y en ejecuciOn.
    pause
    exit /b 1
)
echo       Base de datos OK

:: Iniciar el servidor backend
echo [2/4] Iniciando servidor backend...
start "IglesiaEFESO-Backend" /B cmd /c "node src/index.js"

:: Esperar a que el servidor esté listo
echo [3/4] Esperando servidor...
timeout /t 3 /nobreak >nul

:: Abrir el navegador
echo [4/4] Abriendo navegador...
start http://localhost:3001

echo ============================================
echo   Sistema iniciado correctamente
echo   Presione CTRL+C en esta ventana para cerrar
echo ============================================

:: Mantener la ventana abierta
pause
