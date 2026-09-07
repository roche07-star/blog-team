@echo off
cd /d C:\project\blog-team
node auto-generate-blogspot.js > C:\project\blog-team\logs\blogspot_%date:~0,4%%date:~5,2%%date:~8,2%.log 2>&1
exit /b %ERRORLEVEL%
