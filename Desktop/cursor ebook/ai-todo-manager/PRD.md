# PRD — AI 기반 Todo 관리 서비스 (수정본 v1.1)

본 문서는 실제 개발에 바로 활용할 수 있도록 정리된 **제품 요구사항 정의서(PRD)**이다.  
자연어 기반 AI Todo 생성과 요약 기능을 중심으로 한 개인용 할 일 관리 서비스를 정의한다.

---

## 1. 프로젝트 개요

### 1.1 프로젝트 배경
기존 할 일 관리 서비스는 다음과 같은 한계를 가진다.

- 할 일 입력 이후 우선순위·마감일·카테고리 정리가 번거로움
- 할 일이 많아질수록 무엇을 먼저 해야 할지 판단이 어려움
- 단순 CRUD 중심으로, 분석·요약 기능이 부족함

### 1.2 프로젝트 목적
- 자연어 입력 기반 Todo 생성으로 입력 허들 최소화
- 검색·필터·정렬을 통한 빠른 할 일 파악
- AI 요약/분석을 통한 일일·주간 업무 방향 제시

### 1.3 제품 한 줄 정의
자연어로 할 일을 입력하면 AI가 구조화하고, 버튼 한 번으로 오늘과 이번 주 할 일을 요약해주는 AI Todo 서비스

---

## 2. 목표 및 성공 지표(KPI)

### 2.1 핵심 목표
- Todo 입력 소요 시간 감소
- 서비스 사용 지속성 향상
- 할 일 완료율 개선

### 2.2 KPI
- D1 / D7 Retention
- 전체 Todo 중 AI 생성 Todo 비율
- AI 요약 버튼 클릭률
- 주간 완료율 변화

---

## 3. 주요 기능

### 3.1 사용자 인증
- 이메일 / 비밀번호 회원가입 및 로그인
- Supabase Auth 사용
- 로그인 여부에 따른 라우트 보호
  - 비로그인: /login
  - 로그인: /app

---

### 3.2 할 일 관리 (CRUD)

#### Todo 데이터 필드

| 필드명 | 타입 | 설명 |
|------|----|----|
| id | uuid | PK |
| user_id | uuid | 사용자 ID |
| title | text | 제목 (필수) |
| description | text | 설명 |
| created_date | timestamptz | 생성일 |
| updated_at | timestamptz | 수정일 |
| due_date | timestamptz | 마감일 |
| priority | enum | high / medium / low |
| category | text[] | 업무, 개인, 학습 등 |
| completed | boolean | 완료 여부 |
| completed_at | timestamptz | 완료 시각 |

#### 기능
- 할 일 생성 / 조회 / 수정 / 삭제
- 본인 Todo만 접근 가능 (RLS 적용)

---

### 3.3 검색 / 필터 / 정렬

#### 검색
- title, description 대상 부분 검색

#### 필터
- 우선순위: high / medium / low
- 카테고리: 업무 / 개인 / 학습 / 기타
- 진행 상태
  - 진행 중: 미완료 & 마감 전
  - 완료
  - 지연: 미완료 & 마감일 경과

#### 정렬
- 우선순위 순
- 마감일 순
- 생성일 순

---

### 3.4 AI 할 일 생성

#### 입력 예시
내일 오전 10시에 팀 회의 준비

#### 출력 예시
```json
{
  "title": "팀 회의 준비",
  "description": "내일 오전 10시에 있을 팀 회의를 위해 자료를 준비합니다.",
  "due_date": "2026-01-08T10:00:00+09:00",
  "priority": "high",
  "category": ["업무"],
  "completed": false
}
```

#### 정책
- 날짜/시간 불명확 시 due_date는 null
- created_date는 서버에서 자동 생성
- 저장 전 미리보기 UI 제공

---

### 3.5 AI 요약 및 분석

#### 일일 요약
- 오늘 완료한 할 일
- 오늘 남은 할 일
- 마감 임박/지연 항목
- 추천 행동 1~3개

#### 주간 요약
- 주간 생성 수 / 완료 수
- 완료율
- 카테고리별 분포
- 지연 항목 요약

---

## 4. 화면 구성

### 4.1 로그인 / 회원가입 (/login)
- 이메일 / 비밀번호 입력
- 로그인 / 회원가입 토글
- 에러 상태 표시

### 4.2 메인 Todo 화면 (/app)
- Todo 리스트
- 검색 / 필터 / 정렬
- Todo 추가
- AI Todo 생성
- AI 요약 버튼

### 4.3 통계 / 분석 화면 (/app/stats)
- 주간 활동량
- 완료율
- 카테고리 비율

---

## 5. 기술 스택

### Frontend
- Next.js (App Router)
- Tailwind CSS
- shadcn/ui
- Zod

### Backend / DB
- Supabase
  - Auth
  - Postgres
  - Row Level Security

### AI
- Google Gemini API
- Next.js Route Handler에서 서버 호출

---

## 6. 보안 정책

- Supabase RLS 적용
- 사용자 본인 데이터만 접근 가능
- AI 호출 시 최소 데이터만 전송

---

## 7. 출시 단계

### v1 (MVP)
- Auth
- Todo CRUD
- 검색 / 필터 / 정렬
- AI Todo 생성
- AI 요약 (텍스트)

### v1.1
- 통계 시각화
- 사용자 카테고리 커스터마이즈
- 비밀번호 재설정 UX 개선

---

## 8. 수용 기준 요약

- 로그인 없이 보호 라우트 접근 불가
- Todo CRUD 정상 동작
- AI 생성 결과 검증 후 저장
- 일일/주간 요약 정상 출력
