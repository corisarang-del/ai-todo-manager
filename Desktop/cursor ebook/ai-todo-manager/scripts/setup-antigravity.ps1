# Antigravity Manager 환경변수 설정 (PowerShell)

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "Antigravity Manager 환경변수 설정" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 환경변수 설정
$env:ANTHROPIC_API_KEY = "sk-antigravity"
$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:8045"

Write-Host "✓ 환경변수 설정 완료:" -ForegroundColor Green
Write-Host "  ANTHROPIC_API_KEY=$env:ANTHROPIC_API_KEY" -ForegroundColor Yellow
Write-Host "  ANTHROPIC_BASE_URL=$env:ANTHROPIC_BASE_URL" -ForegroundColor Yellow
Write-Host ""

Write-Host "Antigravity Manager의 API Proxy가 실행 중인지 확인하세요." -ForegroundColor Magenta
Write-Host ""

# Claude Code CLI 실행
Write-Host "Claude Code CLI를 실행합니다..." -ForegroundColor Cyan
Write-Host ""

try {
    claude
} catch {
    Write-Host ""
    Write-Host "❌ 오류 발생!" -ForegroundColor Red
    Write-Host "1. Antigravity Manager가 실행 중인지 확인" -ForegroundColor Yellow
    Write-Host "2. API Proxy가 활성화되어 있는지 확인" -ForegroundColor Yellow
    Write-Host "3. Claude Code CLI가 설치되어 있는지 확인" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "오류 상세: $_" -ForegroundColor Red
}
