@echo off
rem Inicia o Atlas da Matemática 3D no Windows (clique duas vezes neste arquivo).
chcp 65001 >nul
cd /d "%~dp0"
where py >nul 2>nul && (py -3 servidor.py & goto :fim)
where python >nul 2>nul && (python servidor.py & goto :fim)
where npx >nul 2>nul && (npx --yes http-server -c-1 -o & goto :fim)
echo.
echo Nao encontrei o Python 3 nem o Node.js neste computador.
echo Instale o Python em https://www.python.org/downloads/ e rode este arquivo de novo.
echo.
pause
:fim
