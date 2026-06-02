@echo off
echo Iniciando Servidor B2B CYH OS (Next.js)...
echo Por favor, espera unos segundos a que compile el entorno de desarrollo.
echo.
echo Presiona CTRL+C para detener el servidor en cualquier momento.
echo.

:: Opcional: Descomenta la siguiente linea si deseas que abra el navegador automaticamente.
:: timeout /t 5 >nul && start http://localhost:3000

npm run dev
pause
