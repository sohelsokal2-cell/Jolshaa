@echo off
title Jolshaa - Git Push

echo.
echo ========================================
echo     JOLSHAA - GIT PUSH TOOL
echo ========================================
echo.

cd /d "%~dp0"

git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Git is not installed!
    pause
    exit /b 1
)

if not exist ".git" (
    echo [ERROR] Not a git repository!
    pause
    exit /b 1
)

echo [INFO] Current branch:
git branch --show-current
echo.

echo [INFO] Changed files:
git status --short
echo.

echo [1/3] Staging all files...
git add -A
echo Done.
echo.

set /p commitMsg="Enter commit message (press Enter for default): "
if "%commitMsg%"=="" set "commitMsg=Update %date%"

echo.
echo [2/3] Committing...
git commit -m "%commitMsg%"
if %errorlevel% neq 0 (
    echo Nothing to commit.
    pause
    exit /b 0
)
echo Done.
echo.

echo [3/3] Pushing to GitHub...
git push origin main
if %errorlevel% neq 0 (
    echo Trying master branch...
    git push origin master
)

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo     PUSH SUCCESSFUL!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo     PUSH FAILED - Check your remote
    echo ========================================
)

echo.
pause
