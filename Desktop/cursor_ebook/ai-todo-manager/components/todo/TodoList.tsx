/**
 * 할 일 목록을 표시하는 컴포넌트
 */

import { TodoCard } from "./TodoCard";

interface Todo {
  id: string;
  title: string;
  description?: string;
  due_date?: string;
  priority: "high" | "medium" | "low";
  category?: string[];
  completed: boolean;
  completed_at?: string;
}

interface TodoListProps {
  todos: Todo[];
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export const TodoList = ({ todos, onToggleComplete, onEdit, onDelete }: TodoListProps) => {
  // 빈 상태 처리
  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg text-muted-foreground mb-2">할 일이 없어</p>
        <p className="text-sm text-muted-foreground">새로운 할 일을 추가해봐</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {todos.map((todo) => (
        <TodoCard
          key={todo.id}
          todo={todo}
          onToggleComplete={onToggleComplete}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};
