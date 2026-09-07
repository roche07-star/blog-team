@echo off
REM PC 시작 시 자동 git pull

cd /d C:\project\blog-team

REM Git pull 실행
git pull origin master

REM 성공 여부 확인
if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] ✅ Git pull 성공 >> C:\project\blog-team\logs\git-pull.log
) else (
    echo [%date% %time%] ❌ Git pull 실패 >> C:\project\blog-team\logs\git-pull.log
)

exit
