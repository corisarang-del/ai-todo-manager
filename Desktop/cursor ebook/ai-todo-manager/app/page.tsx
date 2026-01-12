/**
 * 메인 페이지 - AI Todo Manager
 * 할 일 목록 표시 및 관리 화면
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TodoForm, TodoList } from "@/components/todo";
import { AiSummary } from "@/components/todo/AiSummary";
import { Search, LogOut, CheckCircle2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Todo, TodoInsert, TodoUpdate } from "@/types/todo";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTodos, setIsLoadingTodos] = useState(false);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Supabase에서 할 일 목록 조회
  const fetchTodos = async () => {
    if (!user) return;

    setIsLoadingTodos(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_date", { ascending: false });

      if (error) {
        console.error("할 일 조회 오류:", error);
        alert("할 일 목록을 불러오는데 실패했어. 다시 시도해줘.");
        return;
      }

      setTodos(data || []);
    } catch (error) {
      console.error("할 일 조회 오류:", error);
      alert("네트워크 오류가 발생했어. 인터넷 연결을 확인해줘.");
    } finally {
      setIsLoadingTodos(false);
    }
  };

  // Supabase 세션 확인
  useEffect(() => {
    const supabase = createClient();
    
    // 현재 세션 가져오기
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
        } else {
          // 로그인되지 않은 경우 로그인 페이지로 이동
          router.push("/login");
        }
      } catch (error) {
        console.error("세션 확인 오류:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        router.push("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // 사용자 로그인 후 할 일 목록 조회
  useEffect(() => {
    if (user) {
      fetchTodos();
    }
  }, [user]);

  // 검색 및 필터링
  const filteredTodos = todos.filter((todo) => {
    // 검색
    const matchesSearch =
      todo.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (todo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    // 상태 필터
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "completed" && todo.completed) ||
      (statusFilter === "active" && !todo.completed);

    // 우선순위 필터
    const matchesPriority = priorityFilter === "all" || todo.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // 정렬
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (sortBy === "priority") {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (sortBy === "dueDate") {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    return 0; // created (기본)
  });

  // 할 일 완료 토글
  const handleToggleComplete = async (id: string, completed: boolean) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("todos")
        .update({ completed })
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) {
        console.error("할 일 완료 토글 오류:", error);
        alert("완료 상태 변경에 실패했어. 다시 시도해줘.");
        return;
      }

      // 목록 갱신
      await fetchTodos();
    } catch (error) {
      console.error("할 일 완료 토글 오류:", error);
      alert("네트워크 오류가 발생했어. 인터넷 연결을 확인해줘.");
    }
  };

  // 할 일 수정
  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowForm(true);
  };

  // 할 일 삭제
  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제할까?")) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("todos")
        .delete()
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) {
        console.error("할 일 삭제 오류:", error);
        alert("삭제에 실패했어. 다시 시도해줘.");
        return;
      }

      // 목록 갱신
      await fetchTodos();
    } catch (error) {
      console.error("할 일 삭제 오류:", error);
      alert("네트워크 오류가 발생했어. 인터넷 연결을 확인해줘.");
    }
  };

  // 할 일 추가/수정 폼 제출
  const handleFormSubmit = async (data: {
    title: string;
    description?: string;
    due_date?: string;
    priority: "high" | "medium" | "low";
    category?: string[];
  }) => {
    if (!user) {
      alert("로그인이 필요해.");
      return;
    }

    try {
      const supabase = createClient();

      if (editingId) {
        // 수정
        const updateData: TodoUpdate = {
          title: data.title,
          description: data.description,
          due_date: data.due_date,
          priority: data.priority,
          category: data.category,
        };

        const { error } = await supabase
          .from("todos")
          .update(updateData)
          .eq("id", editingId)
          .eq("user_id", user.id);

        if (error) {
          console.error("할 일 수정 오류:", error);
          alert("할 일 수정에 실패했어. 다시 시도해줘.");
          return;
        }
      } else {
        // 추가
        const insertData: TodoInsert = {
          user_id: user.id,
          title: data.title,
          description: data.description,
          due_date: data.due_date,
          priority: data.priority,
          category: data.category,
        };

        const { error } = await supabase
          .from("todos")
          .insert(insertData);

        if (error) {
          console.error("할 일 생성 오류:", error);
          alert("할 일 생성에 실패했어. 다시 시도해줘.");
          return;
        }
      }

      // 목록 갱신
      await fetchTodos();
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error("할 일 저장 오류:", error);
      alert("네트워크 오류가 발생했어. 인터넷 연결을 확인해줘.");
    }
  };

  // 폼 취소
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingId(null);
  };

  // 로그아웃
  const handleLogout = async () => {
    if (confirm("로그아웃할까?")) {
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
      } catch (error) {
        console.error("로그아웃 오류:", error);
        alert("로그아웃에 실패했어");
      }
    }
  };

  // 편집할 데이터 가져오기
  const editingTodo = editingId ? todos.find((todo) => todo.id === editingId) : null;

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 사용자 정보가 없으면 null 반환 (리다이렉트 처리됨)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">AI Todo Manager</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback className="bg-blue-500 text-white">
                    {user.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-700">{user.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="할 일 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 필터 */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">진행 중</SelectItem>
                  <SelectItem value="completed">완료</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="우선순위" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="high">높음</SelectItem>
                  <SelectItem value="medium">보통</SelectItem>
                  <SelectItem value="low">낮음</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="정렬" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created">생성일</SelectItem>
                  <SelectItem value="dueDate">마감일</SelectItem>
                  <SelectItem value="priority">우선순위</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* AI 요약 및 분석 섹션 */}
        <AiSummary todos={todos} />

        {/* 메인 컨텐츠 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* TodoForm */}
          <div className="lg:col-span-1">
            {showForm || editingId ? (
              <TodoForm
                initialData={editingTodo || undefined}
                onSubmit={handleFormSubmit}
                onCancel={handleFormCancel}
              />
            ) : (
              <Card className="p-6">
                <Button onClick={() => setShowForm(true)} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  새 할 일 추가
                </Button>
              </Card>
            )}
          </div>

          {/* TodoList */}
          <div className="lg:col-span-2">
            {isLoadingTodos ? (
              <Card className="p-12">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <p className="text-gray-600">할 일 목록을 불러오는 중...</p>
                </div>
              </Card>
            ) : (
              <TodoList
                todos={sortedTodos}
                onToggleComplete={handleToggleComplete}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
            
            {/* 통계 */}
            <div className="mt-4 text-sm text-gray-500 text-center">
              전체 {todos.length}개 · 완료 {todos.filter((t) => t.completed).length}개 · 진행 중{" "}
              {todos.filter((t) => !t.completed).length}개
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
