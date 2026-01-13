# Vercel 배포 오류 해결

**작성시각**: 2026-01-12 19:33

## 해결하고자 한 문제

폴더 이름 변경 후 Vercel 배포 시 다음 오류 발생:
```
Error: A Serverless Function has an invalid name: "'Desktop/cursor ebook/ai-todo-manager/___next_launcher.cjs'". 
They must be less than 128 characters long and must not contain any space.
```

### 문제 원인
- 이전 폴더 경로에 공백이 포함됨 (`Desktop/cursor ebook/ai-todo-manager`)
- Vercel 빌드 캐시에 이전 경로가 남아있음
- 서버리스 함수 이름에 공백이 허용되지 않음

## 해결 방법

### 1. 로컬 빌드 캐시 정리
```bash
# .next 폴더 삭제
rmdir /s /q .next

# 또는 수동으로 .next 폴더 삭제
```

### 2. Git을 통한 재배포
```bash
# 변경사항 추가
git add .

# 커밋
git commit -m "fix: clean build for vercel deployment after folder rename"

# 푸시 (Vercel 자동 재배포 트리거)
git push
```

### 3. Vercel 대시보드에서 캐시 없이 재배포 (대안)
1. Vercel Dashboard 접속
2. Deployments 탭 이동
3. 최신 실패한 배포 선택
4. "Redeploy" 클릭
5. **"Use existing Build Cache" 체크 해제**
6. Redeploy 실행

## 해결 상태

- [x] `.next` 폴더 삭제
- [x] Git 커밋 및 푸시 (2026-01-12 19:37 완료)
- [x] Vercel 재배포 성공 확인 (2026-01-12 20:44 완료)

### 해결 완료
✅ 폴더 이름 변경으로 인한 Vercel 서버리스 함수 이름 오류 해결 완료
✅ 빌드 캐시 정리 후 정상 배포 성공

## 향후 개발을 위한 컨텍스트

### 주의사항
- 프로젝트 경로에 **공백을 포함하지 않도록** 주의
- Vercel 배포 시 서버리스 함수 이름 제약사항:
  - 128자 미만
  - 공백 불포함
  
### 폴더 이름 변경 시 체크리스트
1. 로컬 빌드 캐시 삭제 (`.next` 폴더)
2. `node_modules` 재설치 (선택사항)
3. Git 커밋 및 푸시
4. Vercel 재배포 확인

### 관련 문서
- [Vercel Functions Limitations](https://vercel.com/docs/functions/limitations#functions-name)
- `FOLDER_RENAME_GUIDE.md` - 폴더 이름 변경 가이드
