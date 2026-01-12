# 폴더 이름 변경 가이드

## 단계별 실행 방법

### 1. 현재 열린 파일 모두 저장 및 닫기
- VS Code나 Cursor에서 열린 모든 파일 저장
- 에디터 완전히 종료

### 2. Windows 탐색기에서 폴더 이름 변경

**방법 A: 탐색기 사용**
1. Windows 탐색기 열기 (Win + E)
2. `C:\Users\khc\Desktop` 경로로 이동
3. `cursor ebook` 폴더 우클릭
4. "이름 바꾸기" 선택
5. `cursor_ebook`으로 변경
6. Enter 키 누르기

**방법 B: 명령 프롬프트 사용**
```cmd
cd C:\Users\khc\Desktop
ren "cursor ebook" cursor_ebook
```

### 3. 새 경로에서 프로젝트 열기

**Cursor/VS Code에서:**
1. File → Open Folder
2. `C:\Users\khc\Desktop\cursor_ebook\ai-todo-manager` 선택
3. 폴더 열기

### 4. Git 상태 확인

터미널에서 실행:
```bash
git status
```

Git 저장소는 정상 작동해야 함 (폴더 이동은 Git에 영향 없음)

### 5. 재배포

폴더 이름만 변경했으므로:
- 코드 변경 없음
- GitHub 저장소는 그대로
- Vercel이 다음 배포 시 새 경로 사용
- 기존 푸시된 코드로 자동 재배포됨

## 주의사항

- 폴더 이름 변경 시 에디터를 완전히 종료해야 함
- Git 저장소 내용은 변경되지 않음
- 로컬 경로만 변경됨
- 북마크나 바로가기는 수동으로 업데이트 필요

## 완료 후 확인

- [ ] 새 경로에서 프로젝트 정상 열림
- [ ] `git status` 정상 작동
- [ ] Vercel 재배포 시 에러 없음
