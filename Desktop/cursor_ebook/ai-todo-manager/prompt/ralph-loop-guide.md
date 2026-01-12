# Ralph Loop 사용 가이드

## 개요
Ralph Loop는 AI가 자신의 작업을 반복적으로 개선하는 자기 참조 루프를 만드는 플러그인입니다. Stop hook이 Claude의 종료를 가로채고 같은 프롬프트를 다시 제공하여 반복 개선을 가능하게 합니다.

## 설치 상태
✓ 설치 완료: `~/.claude/plugins/ralph-loop/`

## 기본 명령어

### 1. Ralph Loop 시작
```bash
/ralph-loop "작업 설명" --completion-promise "완료_키워드" --max-iterations N
```

### 2. Ralph Loop 취소
```bash
/cancel-ralph
```

## 파라미터 설명

| 파라미터 | 설명 | 필수여부 | 기본값 |
|---------|------|---------|--------|
| `PROMPT` | 수행할 작업의 상세 설명 | 필수 | - |
| `--completion-promise` | 완료를 나타내는 정확한 문자열 | 선택 | 없음 |
| `--max-iterations` | 최대 반복 횟수 | 선택 | 무제한 |

## 실전 사용 예시

### 예시 1: 테스트 주도 개발 (TDD)
```bash
/ralph-loop "
사용자 인증 API를 TDD로 구현하세요.

요구사항:
- JWT 기반 인증
- 회원가입/로그인/로그아웃 엔드포인트
- 비밀번호 암호화 (bcrypt)
- 입력 검증
- 모든 테스트 통과 (coverage > 80%)

작업 순서:
1. 실패하는 테스트 작성
2. 최소한의 코드로 테스트 통과
3. 리팩토링
4. 1-3 반복

완료 시 출력: AUTH_COMPLETE
" --completion-promise "AUTH_COMPLETE" --max-iterations 30
```

### 예시 2: 버그 수정
```bash
/ralph-loop "
다음 버그를 수정하세요:
- 파일: src/services/user.ts
- 문제: 사용자 삭제 시 관련 데이터가 정리되지 않음
- 기대: 사용자 삭제 시 연관된 모든 데이터 CASCADE 삭제

수정 과정:
1. 버그 재현 테스트 작성
2. 버그 수정
3. 테스트 통과 확인
4. 회귀 테스트 실행

완료 시 출력: BUG_FIXED
" --completion-promise "BUG_FIXED" --max-iterations 15
```

### 예시 3: 기능 구현 (단계적)
```bash
/ralph-loop "
TODO CRUD API를 단계별로 구현하세요.

1단계 - 모델:
- Todo 스키마 정의
- DB 연동
- 단위 테스트

2단계 - CRUD:
- CREATE: POST /api/todos
- READ: GET /api/todos, GET /api/todos/:id
- UPDATE: PUT /api/todos/:id
- DELETE: DELETE /api/todos/:id
- 각 엔드포인트 테스트

3단계 - 검증:
- 입력 검증 미들웨어
- 에러 처리
- API 문서 (README)

각 단계 완료 시 다음 단계로 진행.
모든 단계 완료 시 출력: TODO_API_COMPLETE
" --completion-promise "TODO_API_COMPLETE" --max-iterations 50
```

### 예시 4: 리팩토링
```bash
/ralph-loop "
src/utils/formatters.ts를 리팩토링하세요.

현재 문제점:
- 중복 코드 존재
- 함수가 너무 김 (30줄 이상)
- 명확하지 않은 변수명
- 타입 안정성 부족

목표:
- 함수 분리 (각 함수 10줄 이내)
- 의미있는 이름 사용
- 완전한 타입 정의
- 기존 테스트 통과 유지

완료 시 출력: REFACTOR_COMPLETE
" --completion-promise "REFACTOR_COMPLETE" --max-iterations 20
```

### 예시 5: 마이그레이션
```bash
/ralph-loop "
JavaScript를 TypeScript로 마이그레이션하세요.

범위: src/api/users.js

순서:
1. tsconfig 확인
2. 타입 정의 (interfaces)
3. 점진적 변환 (.js → .ts)
4. 타입 에러 수정
5. 테스트 통과 확인

각 반복에서 하나의 파일/함수만 변환.
완료 시 출력: MIGRATION_COMPLETE
" --completion-promise "MIGRATION_COMPLETE" --max-iterations 40
```

## 프롬프트 작성 모범 사례

### ✅ 좋은 프롬프트
```markdown
명확한 완료 조건:
- 모든 단위 테스트 통과
- 코드 커버리지 80% 이상
- API 문서 작성 완료
- 린터 경고 없음

반복 가능한 단계:
1. 테스트 작성
2. 구현
3. 테스트 확인
4. 필요 시 리팩토링
5. 다음 단계

완료 신호: TASK_COMPLETE
```

### ❌ 나쁜 프롬프트
```markdown
"좋은 API 만들어" - 너무 모호
"완료되면 알려줘" - 완료 기준 없음
"최고의 코드 작성" - 주관적
```

## 안전 장치

### 항상 `--max-iterations` 설정
```bash
# 좋음: 안전 장치 있음
/ralph-loop "작업" --max-iterations 20

# 나쁨: 무한 루프 위험
/ralph-loop "작업"
```

### 프롬프트 내 탈출 조건
```markdown
작업 중 10회 반복 후에도 진전 없으면:
1. 현재까지 달성한 것 목록화
2. 블로킹 요소 정리
3. 다음 접근 방식 제안
4. BLOCKED 출력
```

## 작동 원리

```
사용자 실행 → Claude 작업 시작 → 종료 시도
                                ↓
                         Stop Hook 가로채기
                                ↓
                         같은 프롬프트 재제공
                                ↓
                         파일 변경사항 확인
                                ↓
                         Git 히스토리 확인
                                ↓
                         개선된 방향으로 재작업
                                ↓
                         반복...
```

## Ralph Loop에 적합한 작업

| 작업 유형 | 적합성 | 이유 |
|---------|--------|------|
| TDD | ⭐⭐⭐⭐⭐ | 테스트 실패 → 수정 → 반복 |
| 버그 수정 | ⭐⭐⭐⭐ | 재현 → 수정 → 검증 |
| API 구현 | ⭐⭐⭐⭐ | 요구사항 → 구현 → 테스트 |
| 리팩토링 | ⭐⭐⭐⭐ | 점진적 개선 |
| 마이그레이션 | ⭐⭐⭐⭐ | 점진적 변환 |
| 신규 기능 | ⭐⭐⭐ | 명확한 요구사항 시 |
| 디버깅 | ⭐⭐ | 복잡한 문제에만 |
| 일반 질문 | ⭐ | 반복 불필요 |

## Ralph Loop에 부적합한 작업

- 디자인 결정이 필요한 작업
- 사용자 피드백이 필요한 작업
- 일회성 작업
- 성공 기준이 모호한 작업
- 프로덕션 디버깅 (긴급)

## 문제 해결

### 루프가 멈추지 않을 때
```bash
# 강제 종료
/cancel-ralph
```

### 완료 키워드가 인식되지 않을 때
- 키워드가 정확히 일치하는지 확인
- 대소문자 구분 확인
- 불필요한 공백/줄바꿈 제거

### 진전이 없을 때
- 프롬프트의 완료 조건 재검토
- 작업을 더 작은 단위로 분리
- `--max-iterations`로 안전 장치 설정

## 추가 리소스

- 원본 기술: https://ghuntley.com/ralph/
- Ralph Orchestrator: https://github.com/mikeyobrien/ralph-orchestrator
- Claude Code 도움말: `/help`
