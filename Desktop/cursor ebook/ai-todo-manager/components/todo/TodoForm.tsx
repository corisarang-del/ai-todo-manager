/**
 * 할 일 추가/편집 폼 컴포넌트
 * AI 기반 자연어 입력 지원
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Sparkles, Loader2 } from "lucide-react";

interface TodoFormProps {
  initialData?: {
    id?: string;
    title: string;
    description?: string;
    due_date?: string;
    priority: "high" | "medium" | "low";
    category?: string[];
  };
  onSubmit: (data: {
    title: string;
    description?: string;
    due_date?: string;
    priority: "high" | "medium" | "low";
    category?: string[];
  }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const categoryOptions = ["업무", "개인", "학습", "기타"];

export const TodoForm = ({ initialData, onSubmit, onCancel, isLoading = false }: TodoFormProps) => {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [dueDate, setDueDate] = useState(initialData?.due_date || "");
  const [priority, setPriority] = useState<"high" | "medium" | "low">(
    initialData?.priority || "medium"
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initialData?.category || []
  );
  const [customCategory, setCustomCategory] = useState("");

  // AI 생성 관련 상태
  const [aiInput, setAiInput] = useState("");
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  // 카테고리 추가
  const handleAddCategory = (category: string) => {
    if (category && !selectedCategories.includes(category)) {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // 카테고리 제거
  const handleRemoveCategory = (category: string) => {
    setSelectedCategories(selectedCategories.filter((c) => c !== category));
  };

  // 커스텀 카테고리 추가
  const handleAddCustomCategory = () => {
    if (customCategory.trim()) {
      handleAddCategory(customCategory.trim());
      setCustomCategory("");
    }
  };

  // AI로 할 일 생성
  const handleAiGenerate = async () => {
    if (!aiInput.trim()) {
      alert("할 일 내용을 입력해줘");
      return;
    }

    setIsAiGenerating(true);
    try {
      const response = await fetch("/api/generate-todo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input: aiInput }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "AI 생성에 실패했어");
      }

      const data = await response.json();

      // 생성된 데이터를 폼에 입력
      setTitle(data.title || "");
      setDescription(data.description || "");
      setDueDate(data.due_date ? data.due_date.slice(0, 16) : "");
      setPriority(data.priority || "medium");
      setSelectedCategories(data.category || []);

      // AI 입력 초기화
      setAiInput("");
    } catch (error) {
      console.error("AI 생성 오류:", error);
      alert(error instanceof Error ? error.message : "AI 생성 중 오류가 발생했어");
    } finally {
      setIsAiGenerating(false);
    }
  };

  // 폼 제출
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert("제목을 입력해줘");
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      due_date: dueDate || undefined,
      priority,
      category: selectedCategories.length > 0 ? selectedCategories : undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{initialData?.id ? "할 일 수정" : "새 할 일 추가"}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* 편집 모드가 아닐 때만 AI 생성 탭 표시 */}
        {!initialData?.id ? (
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="manual">직접 입력</TabsTrigger>
              <TabsTrigger value="ai">
                <Sparkles className="w-4 h-4 mr-2" />
                AI로 생성
              </TabsTrigger>
            </TabsList>

            {/* AI 생성 탭 */}
            <TabsContent value="ai" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-input">자연어로 할 일 입력</Label>
                <Textarea
                  id="ai-input"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="예: 내일 오후 3시까지 중요한 팀 회의 준비하기"
                  rows={4}
                  disabled={isAiGenerating}
                />
                <p className="text-sm text-muted-foreground">
                  날짜, 시간, 우선순위를 포함해서 자연스럽게 입력해줘
                </p>
              </div>
              <Button
                type="button"
                onClick={handleAiGenerate}
                disabled={isAiGenerating || !aiInput.trim()}
                className="w-full"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    AI가 생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI로 생성
                  </>
                )}
              </Button>
            </TabsContent>

            {/* 직접 입력 탭 */}
            <TabsContent value="manual">
              <ManualForm
                title={title}
                setTitle={setTitle}
                description={description}
                setDescription={setDescription}
                dueDate={dueDate}
                setDueDate={setDueDate}
                priority={priority}
                setPriority={setPriority}
                selectedCategories={selectedCategories}
                handleAddCategory={handleAddCategory}
                handleRemoveCategory={handleRemoveCategory}
                customCategory={customCategory}
                setCustomCategory={setCustomCategory}
                handleAddCustomCategory={handleAddCustomCategory}
              />
            </TabsContent>
          </Tabs>
        ) : (
          // 편집 모드일 때는 직접 입력 폼만 표시
          <ManualForm
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            dueDate={dueDate}
            setDueDate={setDueDate}
            priority={priority}
            setPriority={setPriority}
            selectedCategories={selectedCategories}
            handleAddCategory={handleAddCategory}
            handleRemoveCategory={handleRemoveCategory}
            customCategory={customCategory}
            setCustomCategory={setCustomCategory}
            handleAddCustomCategory={handleAddCustomCategory}
          />
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "처리 중..." : initialData?.id ? "수정" : "추가"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          취소
        </Button>
      </CardFooter>
    </Card>
  );
};

// 직접 입력 폼 컴포넌트
interface ManualFormProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  dueDate: string;
  setDueDate: (value: string) => void;
  priority: "high" | "medium" | "low";
  setPriority: (value: "high" | "medium" | "low") => void;
  selectedCategories: string[];
  handleAddCategory: (category: string) => void;
  handleRemoveCategory: (category: string) => void;
  customCategory: string;
  setCustomCategory: (value: string) => void;
  handleAddCustomCategory: () => void;
}

const ManualForm = ({
  title,
  setTitle,
  description,
  setDescription,
  dueDate,
  setDueDate,
  priority,
  setPriority,
  selectedCategories,
  handleAddCategory,
  handleRemoveCategory,
  customCategory,
  setCustomCategory,
  handleAddCustomCategory,
}: ManualFormProps) => {
  return (
    <div className="space-y-4">
      {/* 제목 */}
      <div className="space-y-2">
        <Label htmlFor="title">제목 *</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="할 일 제목을 입력해줘"
          required
        />
      </div>

      {/* 설명 */}
      <div className="space-y-2">
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="할 일에 대한 설명을 입력해줘"
          rows={3}
        />
      </div>

      {/* 마감일 */}
      <div className="space-y-2">
        <Label htmlFor="due_date">마감일</Label>
        <Input
          id="due_date"
          type="datetime-local"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      {/* 우선순위 */}
      <div className="space-y-2">
        <Label htmlFor="priority">우선순위</Label>
        <Select value={priority} onValueChange={(value: "high" | "medium" | "low") => setPriority(value)}>
          <SelectTrigger id="priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="high">높음</SelectItem>
            <SelectItem value="medium">보통</SelectItem>
            <SelectItem value="low">낮음</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 카테고리 */}
      <div className="space-y-2">
        <Label>카테고리</Label>
        <div className="flex gap-2">
          <Select onValueChange={handleAddCategory}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 커스텀 카테고리 입력 */}
        <div className="flex gap-2">
          <Input
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="직접 입력"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddCustomCategory();
              }
            }}
          />
          <Button type="button" onClick={handleAddCustomCategory} variant="outline">
            추가
          </Button>
        </div>

        {/* 선택된 카테고리 */}
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedCategories.map((cat) => (
              <Badge key={cat} variant="secondary" className="gap-1">
                {cat}
                <button
                  type="button"
                  onClick={() => handleRemoveCategory(cat)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
