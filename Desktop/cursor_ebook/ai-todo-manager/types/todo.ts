/**
 * Todo 관련 TypeScript 타입 정의
 * Supabase todos 테이블 스키마와 일치
 */

export type PriorityLevel = 'high' | 'medium' | 'low';

/**
 * Todo 전체 타입 (Supabase에서 조회한 데이터)
 */
export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  created_date: string;
  updated_at: string;
  due_date?: string;
  priority: PriorityLevel;
  category?: string[];
  completed: boolean;
  completed_at?: string;
}

/**
 * Todo 생성 시 필요한 타입
 */
export interface TodoInsert {
  user_id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: PriorityLevel;
  category?: string[];
}

/**
 * Todo 수정 시 필요한 타입 (모든 필드 선택적)
 */
export interface TodoUpdate {
  title?: string;
  description?: string;
  due_date?: string;
  priority?: PriorityLevel;
  category?: string[];
  completed?: boolean;
}
