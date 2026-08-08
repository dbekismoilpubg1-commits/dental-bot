@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   Запуск Dental Bot + Туннель
echo ========================================
echo.

REM Запускаем бота
start "Dental Bot" cmd /c "node bot.js"
echo [1/2] Бот запущен...

timeout /t 3 /nobreak >nul

REM Запускаем туннель
start "LocalTunnel" cmd /c "node node_modules\localtunnel\bin\lt.js --port 3000"
echo [2/2] Туннель запускается...

echo.
echo ========================================
echo   Бот запущен! 
echo   Откройте в Telegram: @ClinicDentall_bot
echo   Нажмите /start
echo ========================================
echo.
echo   Не закрывайте это окно!
echo.
pause
