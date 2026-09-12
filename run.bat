@echo off
setlocal EnableDelayedExpansion
title Rakt-Link Web Application

:: Set console codepage to UTF-8
chcp 65001 >nul 2>nul

:: Switch to script directory
cd /d "%~dp0"

:: Resolve the project directory containing package.json
if exist "%~dp0package.json" (
    set "PROJECT_DIR=%~dp0"
) else if exist "%~dp0rakt-link-main\package.json" (
    set "PROJECT_DIR=%~dp0rakt-link-main"
) else (
    echo ============================================================
    echo [ERROR] Could not find package.json!
    echo Please make sure this batch file is in the project folder.
    echo ============================================================
    pause
    exit /b 1
)

cd /d "!PROJECT_DIR!"

:: 1. Check for Node.js
where node >nul 2>nul
if errorlevel 1 goto node_missing

:: 2. Check for npm
where npm >nul 2>nul
if errorlevel 1 goto npm_missing

:: 3. Ensure .env exists (copy from .env.example if missing)
if not exist ".env" (
    if exist ".env.example" (
        echo [*] Notice: .env file not found. Creating default .env from .env.example...
        copy /y ".env.example" ".env" >nul
        echo [+] Created .env file successfully.
        echo.
    )
)

:: 4. Ensure node_modules exists
if not exist "node_modules\" (
    echo ============================================================
    echo [*] Project dependencies are not installed yet.
    echo [*] Running 'npm install' now [this may take 1-2 minutes]...
    echo ============================================================
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ============================================================
        echo [ERROR] Dependency installation failed!
        echo Please review the error messages above.
        echo ============================================================
        pause
        exit /b 1
    )
    echo.
    echo [+] Dependencies installed successfully!
    echo.
)

:: 5. Handle command-line argument if passed
if not "%~1"=="" (
    set "IS_INTERACTIVE=0"
    set "ARG=%~1"
    if /i "!ARG!"=="dev" goto cmd_dev
    if /i "!ARG!"=="start" goto cmd_dev
    if /i "!ARG!"=="run" goto cmd_dev
    if /i "!ARG!"=="build" goto cmd_build
    if /i "!ARG!"=="build:dev" goto cmd_build_dev
    if /i "!ARG!"=="preview" goto cmd_preview
    if /i "!ARG!"=="install" goto cmd_install
    if /i "!ARG!"=="lint" goto cmd_lint
    if /i "!ARG!"=="format" goto cmd_format
    if /i "!ARG!"=="help" goto cmd_help
    if /i "!ARG!"=="/?" goto cmd_help
    if /i "!ARG!"=="-h" goto cmd_help
    echo [!] Unknown option: %~1
    goto cmd_help
)

set "IS_INTERACTIVE=1"

:menu
cls
echo ============================================================
echo           Rakt-Link - Healthcare Web Application
echo    India's National Sickle Cell Anaemia Elimination Mission
echo ============================================================
echo.
echo   [1] Start Dev Server    (npm run dev) [Default]
echo   [2] Build for Production (npm run build)
echo   [3] Preview Build        (npm run preview)
echo   [4] Install Dependencies (npm install)
echo   [5] Run Linter           (npm run lint)
echo   [6] Format Code          (npm run format)
echo   [0] Exit
echo.
echo ============================================================
set "CHOICE=1"
set /p "CHOICE=Select an option [0-6, default: 1]: "

if "%CHOICE%"=="1" goto cmd_dev
if "%CHOICE%"=="2" goto cmd_build
if "%CHOICE%"=="3" goto cmd_preview
if "%CHOICE%"=="4" goto cmd_install
if "%CHOICE%"=="5" goto cmd_lint
if "%CHOICE%"=="6" goto cmd_format
if "%CHOICE%"=="0" goto cmd_exit

echo.
echo [!] Invalid selection '%CHOICE%'. Please choose an option between 0 and 6.
timeout /t 2 >nul
goto menu

:cmd_dev
cls
echo ============================================================
echo Starting Rakt-Link Development Server...
echo Local URL: http://localhost:8080
echo Press Ctrl+C in this window to stop the server.
echo ============================================================
echo.
call npm run dev
goto finished

:cmd_build
cls
echo ============================================================
echo Building Rakt-Link for Production...
echo ============================================================
echo.
call npm run build
goto finished

:cmd_build_dev
cls
echo ============================================================
echo Building Rakt-Link (Development Mode)...
echo ============================================================
echo.
call npm run build:dev
goto finished

:cmd_preview
cls
echo ============================================================
echo Previewing Production Build...
echo Press Ctrl+C in this window to stop preview.
echo ============================================================
echo.
call npm run preview
goto finished

:cmd_install
cls
echo ============================================================
echo Installing Dependencies (npm install)...
echo ============================================================
echo.
call npm install
goto finished

:cmd_lint
cls
echo ============================================================
echo Running ESLint...
echo ============================================================
echo.
call npm run lint
goto finished

:cmd_format
cls
echo ============================================================
echo Formatting code with Prettier...
echo ============================================================
echo.
call npm run format
goto finished

:cmd_help
echo.
echo Usage: run.bat [option]
echo.
echo Options:
echo   dev       Start development server at http://localhost:8080 (default)
echo   build     Build for production
echo   preview   Preview production build
echo   install   Install or reinstall npm dependencies
echo   lint      Run ESLint
echo   format    Format code with Prettier
echo   help      Show this help message
echo.
goto finished

:node_missing
echo ============================================================
echo [ERROR] Node.js is not installed or not found in your PATH.
echo.
echo Please download and install Node.js (v18 or higher recommended)
echo from: https://nodejs.org/
echo After installing Node.js, re-run this script.
echo ============================================================
echo.
pause
exit /b 1

:npm_missing
echo ============================================================
echo [ERROR] npm is not installed or not found in your PATH.
echo.
echo Please ensure Node.js and npm are properly installed.
echo ============================================================
echo.
pause
exit /b 1

:finished
set "EXIT_CODE=%ERRORLEVEL%"
if %EXIT_CODE% neq 0 (
    echo.
    echo [!] Command exited with code %EXIT_CODE%.
)
if "!IS_INTERACTIVE!"=="1" (
    echo.
    echo Press any key to return to menu...
    pause >nul
    goto menu
)
exit /b %EXIT_CODE%

:cmd_exit
echo Exiting...
exit /b 0
