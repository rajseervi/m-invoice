@echo off
setlocal enabledelayedexpansion

echo ============================================
echo   Firestore Index Generator - All Indexes
echo ============================================
echo.

:: Get the directory where this batch file is located
cd /d "%~dp0"
echo Project Directory: %cd%
echo.

:: Step 1: Simple Index Generator
echo [1/3] Running Simple Index Generator...
echo -----------------------------------------------
call npm run indexes:generate
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Simple Index Generator failed.
    goto :error
)
echo [DONE] Simple indexes generated successfully.
echo.

:: Step 2: Smart Analyzer
echo [2/3] Running Smart Code Analyzer...
echo -----------------------------------------------
call npm run indexes:smart 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Smart Analyzer skipped (may require glob dependency).
    echo        Essential indexes have already been generated.
) else (
    echo [DONE] Smart analysis completed.
)
echo.

:: Step 3: Comprehensive Generator
echo [3/3] Running Comprehensive Generator...
echo -----------------------------------------------
call npm run indexes:comprehensive
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] Comprehensive generator had issues, but core indexes exist.
) else (
    echo [DONE] Comprehensive indexes generated.
)
echo.

:: Collect all generated indexes
echo ============================================
echo   Consolidating Generated Indexes
echo ============================================
echo.

if not exist "generated-indexes" (
    echo [ERROR] generated-indexes folder not found!
    goto :error
)

cd generated-indexes

:: Show generated files
echo Generated files:
dir /b *.json *.sh *.js 2>nul
echo.

:: Show index counts from each file
if exist "firestore.indexes.json" (
    echo Checking firestore.indexes.json...
    node -e "try{var d=require('./firestore.indexes.json');console.log('  Total indexes: '+d.indexes.length)}catch(e){console.log('  Could not parse')}" 2>nul
)

if exist "smart-indexes.json" (
    echo Checking smart-indexes.json...
    node -e "try{var d=require('./smart-indexes.json');console.log('  Total indexes: '+d.indexes.length)}catch(e){console.log('  Could not parse')}" 2>nul
)

echo.
echo ============================================
echo   Index Generation Complete!
echo ============================================
echo.
echo Output files are in: generated-indexes\
echo.
echo Available files:
echo   - firestore.indexes.json  (main - recommended for deployment)
echo   - smart-indexes.json      (code-analysis based)
echo   - deploy-indexes.sh       (deployment script for Mac/Linux)
echo   - validate-indexes.js     (validation script)
echo   - README.md               (documentation)
echo.
echo ============================================
echo   Next Steps
echo ============================================
echo.
echo 1. Validate indexes:
echo    node generated-indexes\validate-indexes.js
echo.
echo 2. Deploy to Firebase:
echo    firebase deploy --only firestore:indexes
echo    OR on Mac/Linux: cd generated-indexes ^&^& ./deploy-indexes.sh
echo.
echo 3. Monitor in Firebase Console:
echo    https://console.firebase.google.com/project/_/firestore/indexes
echo.

:: Ask if user wants to deploy
set /p deploy="Deploy indexes to Firebase now? (y/N): "
if /i "%deploy%"=="y" (
    echo.
    echo Deploying to Firebase...
    cd /d "%~dp0"
    firebase deploy --only firestore:indexes
    if %ERRORLEVEL% EQU 0 (
        echo [SUCCESS] Indexes deployed successfully!
    ) else (
        echo [ERROR] Deployment failed. Check Firebase CLI setup.
        goto :error
    )
)

echo.
echo All done! Press any key to exit...
pause >nul
exit /b 0

:error
echo.
echo ============================================
echo   ERROR: Index generation encountered issues
echo ============================================
echo.
echo Please check the errors above and try:
echo   - Running individual commands manually
echo   - npm run indexes:generate  (simple generator)
echo   - npm run indexes:comprehensive (advanced)
echo.
pause
exit /b 1
