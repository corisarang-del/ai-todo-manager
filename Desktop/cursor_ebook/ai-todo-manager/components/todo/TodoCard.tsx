/**
 * 개별 할 일을 표시하는 카드 컴포넌트
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface TodoCardProps {
  todo: {
    id: string;
    title: string;
    description?: string;
    due_date?: string;
    priority: "high" | "medium" | "low";
    category?: string[];
    completed: boolean;
    completed_at?: string;
  };
  onToggleComplete: (id: string, completed: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const priorityColors = {
  high: "bg-red-500 hover:bg-red-600",
  medium: "bg-yellow-500 hover:bg-yellow-600",
  low: "bg-green-500 hover:bg-green-600",
};

const priorityLabels = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

export const TodoCard = ({ todo, onToggleComplete, onEdit, onDelete }: TodoCardProps) => {
  // 마감일 경과 여부 확인
  const isOverdue = todo.due_date && !todo.completed && new Date(todo.due_date) < new Date();

  return (
    <Card className={`${todo.completed ? "opacity-60" : ""} ${isOverdue ? "border-red-500" : ""}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={todo.completed}
              onCheckedChange={(checked) => onToggleComplete(todo.id, checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <CardTitle className={`text-lg ${todo.completed ? "line-through" : ""}`}>
                {todo.title}
              </CardTitle>
              {todo.description && (
                <CardDescription className="mt-1">{todo.description}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(todo.id)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(todo.id)}
              className="h-8 w-8 text-red-500 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 items-center">
          {/* 우선순위 배지 */}
          <Badge className={priorityColors[todo.priority]}>
            {priorityLabels[todo.priority]}
          </Badge>

          {/* 카테고리 배지 */}
          {todo.category?.map((cat) => (
            <Badge key={cat} variant="outline">
              {cat}
            </Badge>
          ))}

          {/* 마감일 */}
          {todo.due_date && (
            <div className={`flex items-center gap-1 text-sm ${isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
              <Calendar className="h-4 w-4" />
              <span>
                {format(new Date(todo.due_date), "yyyy년 M월 d일 HH:mm", { locale: ko })}
              </span>
            </div>
          )}

          {/* 완료 시각 */}
          {todo.completed && todo.completed_at && (
            <div className="text-sm text-muted-foreground">
              완료: {format(new Date(todo.completed_at), "yyyy년 M월 d일 HH:mm", { locale: ko })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
