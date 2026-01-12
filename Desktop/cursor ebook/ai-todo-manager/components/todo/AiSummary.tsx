/**
 * AI 요약 및 분석 컴포넌트 (개선된 UI)
 * 사용자의 할 일 목록을 AI로 분석하고 인사이트 제공
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  Loader2, 
  Lightbulb, 
  Target, 
  TrendingUp, 
  CheckCircle2,
  AlertTriangle,
  Zap,
  Calendar,
  RefreshCw
} from "lucide-react";
import type { Todo } from "@/types/todo";

interface AiSummaryProps {
  todos: Todo[];
}

interface AnalysisResult {
  summary: string;
  urgentTasks: string[];
  insights: string[];
  recommendations: string[];
}

export const AiSummary = ({ todos }: AiSummaryProps) => {
  const [activeTab, setActiveTab] = useState<"today" | "week">("today");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 오늘 할 일 필터링
  const getTodayTodos = () => {
    const today = new Date().toISOString().slice(0, 10);
    return todos.filter((t) => t.due_date?.startsWith(today));
  };

  // 이번 주 할 일 필터링
  const getWeekTodos = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return todos.filter((t) => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      return dueDate >= weekStart && dueDate <= weekEnd;
    });
  };

  // 완료율 계산
  const getCompletionRate = (targetTodos: Todo[]) => {
    if (targetTodos.length === 0) return 0;
    const completed = targetTodos.filter((t) => t.completed).length;
    return Math.round((completed / targetTodos.length) * 100);
  };

  // AI 분석 실행
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);
    setError(null);

    try {
      const targetTodos = activeTab === "today" ? getTodayTodos() : getWeekTodos();

      const response = await fetch("/api/analyze-todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          todos: targetTodos,
          period: activeTab,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "AI 분석에 실패했어");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("AI 분석 오류:", err);
      setError(err instanceof Error ? err.message : "AI 분석 중 오류가 발생했어");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const targetTodos = activeTab === "today" ? getTodayTodos() : getWeekTodos();
  const completionRate = getCompletionRate(targetTodos);
  const remainingTodos = targetTodos.filter((t) => !t.completed);

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          AI 요약 및 분석
        </CardTitle>
        <CardDescription>
          AI가 당신의 할 일을 분석하고 생산성을 높이는 인사이트를 제공해요
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "today" | "week")}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              오늘의 요약
            </TabsTrigger>
            <TabsTrigger value="week" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              이번 주 요약
            </TabsTrigger>
          </TabsList>

          {/* 오늘의 요약 탭 */}
          <TabsContent value="today" className="space-y-4">
            {/* 완료율 표시 */}
            <Card className="border-2 border-purple-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">오늘의 완료율</span>
                  <span className="text-3xl font-bold text-purple-600">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-3" />
                <p className="text-xs text-gray-500 mt-2">
                  {targetTodos.length}개 중 {targetTodos.filter((t) => t.completed).length}개 완료
                </p>
              </CardContent>
            </Card>

            {/* 남은 할 일 */}
            {remainingTodos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-4 h-4 text-orange-500" />
                    남은 할 일 ({remainingTodos.length}개)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {remainingTodos.slice(0, 5).map((todo) => (
                      <li key={todo.id} className="flex items-center gap-2 text-sm">
                        <Badge variant={todo.priority === 'high' ? 'destructive' : 'secondary'}>
                          {todo.priority}
                        </Badge>
                        <span className="flex-1">{todo.title}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* AI 요약 버튼 */}
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  AI가 분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  AI 요약 보기
                </>
              )}
            </Button>
          </TabsContent>

          {/* 이번 주 요약 탭 */}
          <TabsContent value="week" className="space-y-4">
            {/* 주간 완료율 */}
            <Card className="border-2 border-blue-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">이번 주 완료율</span>
                  <span className="text-3xl font-bold text-blue-600">{completionRate}%</span>
                </div>
                <Progress value={completionRate} className="h-3" />
                <p className="text-xs text-gray-500 mt-2">
                  {targetTodos.length}개 중 {targetTodos.filter((t) => t.completed).length}개 완료
                </p>
              </CardContent>
            </Card>

            {/* 주간 통계 */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">
                      {targetTodos.filter((t) => t.completed).length}
                    </p>
                    <p className="text-xs text-gray-500">완료</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <Zap className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-gray-800">
                      {targetTodos.filter((t) => t.priority === 'high').length}
                    </p>
                    <p className="text-xs text-gray-500">긴급</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI 요약 버튼 */}
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  AI가 분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  AI 요약 보기
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {/* 오류 표시 */}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyze}
                className="ml-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                재시도
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 분석 결과 표시 */}
        {result && (
          <div className="mt-6 space-y-4">
            {/* 전체 요약 */}
            <Card className="bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
                  <p className="text-lg font-medium text-gray-800 leading-relaxed">
                    {result.summary}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 긴급 작업 */}
            {result.urgentTasks && result.urgentTasks.length > 0 && (
              <Card className="border-2 border-red-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="w-5 h-5 text-red-500" />
                    긴급 작업
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.urgentTasks.map((task, index) => (
                      <Badge key={index} variant="destructive" className="px-3 py-1">
                        🔥 {task}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 인사이트 (카드형) */}
            {result.insights && result.insights.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  인사이트
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.insights.map((insight, index) => (
                    <Card key={index} className="border-2 border-yellow-100 hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                          <span className="text-2xl flex-shrink-0">💡</span>
                          <p className="text-sm text-gray-700">{insight}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 추천사항 (실행 가능한 형태) */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  추천사항
                </h3>
                <div className="space-y-2">
                  {result.recommendations.map((rec, index) => (
                    <Card key={index} className="border-2 border-green-100 hover:shadow-md transition-shadow">
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <span className="text-xl flex-shrink-0">✅</span>
                          <p className="text-sm text-gray-700 flex-1">{rec}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
