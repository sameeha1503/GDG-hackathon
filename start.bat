@echo off
setlocal EnableDelayedExpansion
title Rakt-Link Web Application

:: Set console codepage to UTF-8
chcp 65001 >nul 2>nul

cd /d "%~dp0"

:: If run.bat exists in the same folder, run 'run.bat dev'
if exist "%~dp0run.bat" (
    call "%~dp0run.bat" dev %*
    exit /b %ERRORLEVEL%
)

:: Otherwise check if rakt-link-main\run.bat exists
if exist "%~dp0rakt-link-main\run.bat" (
    call "%~dp0rakt-link-main\run.bat" dev %*
    exit /b %ERRORLEVEL%
)

:: Fallback if run.bat is not found
if exist "%~dp0rakt-link-main\package.json" (
    cd /d "%~dp0rakt-link-main"
)

call npm run dev
pause
