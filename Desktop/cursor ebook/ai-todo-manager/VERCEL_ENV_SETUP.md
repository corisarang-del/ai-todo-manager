# Vercel 환경 변수 설정 가이드

Vercel 대시보드에서 다음 환경 변수들을 설정해야 해:

## 필수 환경 변수

### Supabase 설정
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Google AI (Gemini) 설정
```
GOOGLE_API_KEY=your-google-api-key
```

## 설정 방법

1. Vercel 대시보드 접속
2. 프로젝트 선택 (ai-todo-manager)
3. Settings → Environment Variables 메뉴
4. 각 변수 추가:
   - Name: 변수명 입력
   - Value: 값 입력
   - Environment: Production, Preview, Development 모두 선택
5. Save 클릭

## 재배포

환경 변수 설정 후:
1. Deployments 탭으로 이동
2. 최신 배포의 ... 메뉴 클릭
3. "Redeploy" 선택
4. "Use existing Build Cache" 체크 해제
5. Redeploy 클릭

## 로컬 환경 변수 확인

`.env.local` 파일에 있는 값들을 Vercel에 동일하게 설정하면 돼.
