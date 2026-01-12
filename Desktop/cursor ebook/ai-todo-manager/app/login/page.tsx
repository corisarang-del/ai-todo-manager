/**
 * 로그인 페이지
 * 이메일/비밀번호 기반 로그인 및 회원가입 링크 제공
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 이미 로그인된 사용자 체크
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // 이미 로그인되어 있으면 메인 페이지로 리다이렉트
          router.push("/");
          router.refresh();
        }
      } catch (error) {
        console.error("세션 확인 오류:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkSession();
  }, [router]);

  // 로그인 처리
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // 입력값 검증
      if (!email || !password) {
        throw new Error("이메일과 비밀번호를 입력해줘");
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("올바른 이메일 형식을 입력해줘");
      }

      // 비밀번호 공백 방지
      if (password.trim() !== password || password.trim().length === 0) {
        throw new Error("비밀번호에 공백을 포함할 수 없어");
      }

      // Supabase 로그인
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // 로그인 성공
      if (data.session) {
        setSuccess("로그인 성공! 메인 페이지로 이동할게...");
        
        // 메인 페이지로 이동
        setTimeout(() => {
          router.push("/");
          router.refresh(); // 서버 컴포넌트 갱신
        }, 1000);
      }
    } catch (err: any) {
      // 사용자 친화적인 에러 메시지
      let errorMessage = "로그인에 실패했어";
      
      if (err.message?.includes("Invalid login credentials")) {
        errorMessage = "이메일 또는 비밀번호가 올바르지 않아";
      } else if (err.message?.includes("Email not confirmed")) {
        errorMessage = "이메일 인증이 필요해. 이메일을 확인해줘";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 세션 확인 중일 때
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-white animate-pulse" />
          </div>
          <p className="text-gray-600">확인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* 서비스 로고 및 소개 */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AI Todo Manager</h1>
          <p className="text-gray-600">
            자연어로 할 일을 입력하면 AI가 구조화하고,
            <br />
            버튼 한 번으로 오늘과 이번 주 할 일을 요약해주는 서비스
          </p>
        </div>

        {/* 로그인 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>로그인</CardTitle>
            <CardDescription>이메일과 비밀번호로 로그인해줘</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              {/* 에러 메시지 */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 성공 메시지 */}
              {success && (
                <Alert className="border-green-500 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {/* 이메일 입력 */}
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              {/* 비밀번호 입력 */}
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "로그인 중..." : "로그인"}
              </Button>
              
              {/* 회원가입 링크 */}
              <div className="text-center text-sm text-gray-600">
                계정이 없어?{" "}
                <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                  회원가입하기
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* 추가 안내 */}
        <p className="text-center text-xs text-gray-500">
          로그인하면 서비스 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주돼
        </p>
      </div>
    </div>
  );
}
