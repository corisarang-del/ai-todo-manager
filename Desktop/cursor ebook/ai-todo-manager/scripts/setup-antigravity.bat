@echo off
echo ====================================
echo Antigravity Manager 환경변수 설정
echo ====================================
echo.

REM 환경변수 설정
set ANTHROPIC_API_KEY=sk-antigravity
set ANTHROPIC_BASE_URL=http://127.0.0.1:8045

echo ✓ 환경변수 설정 완료:
echo   ANTHROPIC_API_KEY=%ANTHROPIC_API_KEY%
echo   ANTHROPIC_BASE_URL=%ANTHROPIC_BASE_URL%
echo.
echo Antigravity Manager의 API Proxy가 실행 중인지 확인하세요.
echo.

REM Claude Code CLI 실행
echo Claude Code CLI를 실행합니다...
echo.
claude

REM 에러가 발생하면 일시정지
if errorlevel 1 (
    echo.
    echo ❌ 오류 발생! 
    echo 1. Antigravity Manager가 실행 중인지 확인
    echo 2. API Proxy가 활성화되어 있는지 확인
    echo 3. Claude Code CLI가 설치되어 있는지 확인
    pause
)
