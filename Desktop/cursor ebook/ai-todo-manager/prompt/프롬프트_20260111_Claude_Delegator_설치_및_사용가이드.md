# Claude Delegator 설치 및 사용 가이드 작성 프롬프트

**날짜**: 2026-01-11
**작업**: Claude Delegator 플러그인 설치 및 사용 가이드 문서화
**목적**: GPT-5.2 Codex 전문가 에이전트 활용을 위한 설정 및 사용법 정리

---

## 실행된 프롬프트

### 1단계: 설치 검증

```bash
# Codex CLI 확인
which codex 2>/dev/null && codex --version 2>&1 | head -1 || echo "CODEX_MISSING"

# 현재 설정 읽기
cat ~/.claude/settings.json 2>/dev/null || echo "{}"
```

### 2단계: MCP 서버 설정

```json
// ~/.claude/settings.json에 추가
{
  "pluginConfigs": {
    "claude-delegator@jarrodwatts-claude-delegator": {
      "mcpServers": {
        "codex": {
          "type": "stdio",
          "command": "codex",
          "args": ["-m", "gpt-5.2-codex", "mcp-server"]
        }
      }
    }
  }
}
```

### 3단계: 규칙 파일 설치

```bash
# 규칙 파일 복사
mkdir -p "$HOME/.claude/rules/delegator"
cp "$HOME/.claude/plugins/cache/jarrodwatts-claude-delegator/claude-delegator/1.0.0/rules/"*.md "$HOME/.claude/rules/delegator/"
```

### 4단계: 검증

```bash
# Codex CLI 버전
codex --version 2>&1 | head -1

# MCP 설정 확인
cat ~/.claude/settings.json | grep -A 10 "claude-delegator"

# 규칙 파일 개수
ls /c/Users/khc/.claude/rules/delegator/*.md 2>/dev/null | wc -l

# 인증 상태
codex login status 2>&1 | head -1

# MCP 서버 테스트
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | codex -m gpt-5.2-codex mcp-server 2>&1 | head -20
```

---

## 문서 조사 프롬프트

### 규칙 파일 읽기

```bash
# 트리거 규칙
cat /c/Users/khc/.claude/rules/delegator/triggers.md

# 전문가 프롬프트
cat /c/Users/khc/.claude/plugins/cache/jarrodwatts-claude-delegator/claude-delegator/1.0.0/prompts/architect.md
cat /c/Users/khc/.claude/plugins/cache/jarrodwatts-claude-delegator/claude-delegator/1.0.0/prompts/code-reviewer.md
cat /c/Users/khc/.claude/plugins/cache/jarrodwatts-claude-delegator/claude-delegator/1.0.0/prompts/security-analyst.md
```

---

## 생성된 문서

### 1. 개발일지 (개발일지/20260111_Claude_Delegator_사용가이드.md)

**내용 구성**:
- 📋 개요: 플러그인 소개, 핵심 개념
- 🎯 5가지 전문가 에이전트 상세 설명
  - Architect (아키텍트)
  - Plan Reviewer (계획 검토자)
  - Scope Analyst (범위 분석가)
  - Code Reviewer (코드 리뷰어)
  - Security Analyst (보안 분석가)
- 🎨 사용 방법: 자동/명시적 호출
- 💡 동작 모드: 자문 vs 구현
- 📚 실전 사용 시나리오 5가지
- ⚠️ 사용하지 말아야 할 경우
- 🔧 고급 팁
- 📊 의사결정 프레임워크
- 🎯 베스트 프랙티스
- 🔍 문제 해결
- 📝 체크리스트

---

## 핵심 인사이트

### 전문가 선택 로직

```
명시적 요청 > 보안 문제 > 아키텍처 결정 > 실패 에스컬레이션 > 직접 처리
```

### 트리거 패턴

| 전문가 | 트리거 키워드 |
|--------|--------------|
| Architect | "어떻게 구조화", "트레이드오프", "[A] vs [B]" |
| Plan Reviewer | "계획 검토", "계획이 완전한가" |
| Scope Analyst | "범위 명확화", "빠진 게 뭐야" |
| Code Reviewer | "코드 리뷰", "문제점 찾아줘" |
| Security Analyst | "안전한가", "취약점", "보안" |

### 동작 모드

- **자문 모드** (`read-only`): 분석, 권장사항만 제공
- **구현 모드** (`workspace-write`): 실제 파일 수정

---

## 참고 자료

- Plugin CLAUDE.md: /c/Users/khc/.claude/plugins/cache/jarrodwatts-claude-delegator/claude-delegator/1.0.0/CLAUDE.md
- Plugin README.md: /c/Users/khc/.claude/plugins/cache/jarrodwatts-claude-delegator/claude-delegator/1.0.0/README.md
- Rules: /c/Users/khc/.claude/rules/delegator/
- Expert Prompts: /c/Users/khc/.claude/plugins/cache/jarrodwatts-claude-delegator/claude-delegator/1.0.0/prompts/

---

## 태그

#claude-delegator #gpt-5.2-codex #mcp-server #ai-experts #설치가이드 #사용가이드
