@echo off
echo Stopping servers...
taskkill /fi "WINDOWTITLE eq Backend" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq Frontend" /f >nul 2>&1
echo Servers stopped.
