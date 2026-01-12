-- ============================================================================
-- AI 할 일 관리 서비스 Supabase 스키마
-- ============================================================================

-- 1. 사용자 프로필 테이블 (auth.users와 1:1 연결)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- users 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- users 테이블 RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- users 테이블 RLS 정책: 본인만 자신의 프로필 조회 가능
CREATE POLICY "Users can view their own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- users 테이블 RLS 정책: 본인만 자신의 프로필 수정 가능
CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- users 테이블 RLS 정책: 회원가입 시 프로필 생성 가능
CREATE POLICY "Users can insert their own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);


-- ============================================================================
-- 2. 할 일(Todo) 테이블
-- ============================================================================

-- priority enum 타입 생성
CREATE TYPE public.priority_level AS ENUM ('high', 'medium', 'low');

CREATE TABLE IF NOT EXISTS public.todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  due_date TIMESTAMPTZ,
  priority public.priority_level DEFAULT 'medium',
  category TEXT[] DEFAULT ARRAY[]::TEXT[],
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at TIMESTAMPTZ
);

-- todos 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON public.todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_due_date ON public.todos(due_date);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON public.todos(priority);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON public.todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_created_date ON public.todos(created_date);

-- todos 테이블 RLS 활성화
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- todos 테이블 RLS 정책: 본인 할 일만 조회 가능
CREATE POLICY "Users can view their own todos"
  ON public.todos
  FOR SELECT
  USING (auth.uid() = user_id);

-- todos 테이블 RLS 정책: 본인 할 일만 생성 가능
CREATE POLICY "Users can insert their own todos"
  ON public.todos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- todos 테이블 RLS 정책: 본인 할 일만 수정 가능
CREATE POLICY "Users can update their own todos"
  ON public.todos
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- todos 테이블 RLS 정책: 본인 할 일만 삭제 가능
CREATE POLICY "Users can delete their own todos"
  ON public.todos
  FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================================
-- 3. 트리거: updated_at 자동 갱신
-- ============================================================================

-- updated_at 자동 갱신 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users 테이블 updated_at 트리거
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- todos 테이블 updated_at 트리거
CREATE TRIGGER set_updated_at_todos
  BEFORE UPDATE ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


-- ============================================================================
-- 4. 트리거: completed_at 자동 설정
-- ============================================================================

-- completed_at 자동 설정 함수
CREATE OR REPLACE FUNCTION public.handle_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- completed가 true로 변경되면 completed_at 설정
  IF NEW.completed = TRUE AND OLD.completed = FALSE THEN
    NEW.completed_at = NOW();
  -- completed가 false로 변경되면 completed_at 초기화
  ELSIF NEW.completed = FALSE AND OLD.completed = TRUE THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- todos 테이블 completed_at 트리거
CREATE TRIGGER set_completed_at_todos
  BEFORE UPDATE ON public.todos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_completed_at();


-- ============================================================================
-- 5. auth.users 생성 시 public.users 자동 생성 트리거
-- ============================================================================

-- 신규 사용자 프로필 자동 생성 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users에 새 사용자 추가 시 public.users 자동 생성
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
