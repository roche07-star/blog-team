@echo off
cd /d C:\project\blog-team
git pull origin master
if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] Git pull SUCCESS >> C:\project\blog-team\logs\git-pull.log
) else (
    echo [%date% %time%] Git pull FAILED >> C:\project\blog-team\logs\git-pull.log
)
exit
