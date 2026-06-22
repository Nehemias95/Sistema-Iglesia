@echo off
title Iglesia EFESO - Deteniendo Servidor
echo Deteniendo el servidor Iglesia EFESO...
taskkill /f /im node.exe >nul 2>&1
echo Servidor detenido correctamente.
pause
