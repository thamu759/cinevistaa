@echo off
echo ========================================================
echo   ThiraiPedia - Starting STAGING Environment
echo ========================================================
echo Backend:  http://localhost:5001/api (db.staging.json)
echo Frontend: http://localhost:5174
echo ========================================================

start "ThiraiPedia Staging Server" cmd /k "cd server && npm run staging"
start "ThiraiPedia Staging Client" cmd /k "cd client && npm run dev:staging"

echo Staging services launched in separate windows!

