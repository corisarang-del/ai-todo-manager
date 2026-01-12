/**
 * 회원가입 페이지
 * 이메일/비밀번호 기반 회원가입 및 로그인 링크 제공
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

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

  // 회원가입 처리
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      // 입력 검증
      if (!name || !email || !password || !confirmPassword) {
        throw new Error("모든 필드를 입력해줘");
      }

      // 이메일 형식 검증
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error("올바른 이메일 형식을 입력해줘");
      }

      if (password !== confirmPassword) {
        throw new Error("비밀번호가 일치하지 않아");
      }

      if (password.length < 6) {
        throw new Error("비밀번호는 최소 6자 이상이어야 해");
      }

      // Supabase 회원가입
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: name,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      // 회원가입 성공
      if (data.user) {
        setSuccess("회원가입 성공! 메인 페이지로 이동할게...");
        
        // 메인 페이지로 이동
        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (err: any) {
      // 사용자 친화적인 에러 메시지
      let errorMessage = "회원가입에 실패했어";
      
      if (err.message?.includes("already registered")) {
        errorMessage = "이미 등록된 이메일이야";
      } else if (err.message?.includes("password")) {
        errorMessage = "비밀번호가 너무 약해. 더 강력한 비밀번호를 사용해줘";
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

        {/* 회원가입 폼 */}
        <Card>
          <CardHeader>
            <CardTitle>회원가입</CardTitle>
            <CardDescription>이메일과 비밀번호로 계정을 만들어줘</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
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

              {/* 이름 입력 */}
              <div className="space-y-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

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
                  minLength={6}
                />
                <p className="text-xs text-gray-500">최소 6자 이상 입력해줘</p>
              </div>

              {/* 비밀번호 확인 */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  minLength={6}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "회원가입 중..." : "회원가입"}
              </Button>
              
              {/* 로그인 링크 */}
              <div className="text-center text-sm text-gray-600">
                이미 계정이 있어?{" "}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  로그인하기
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* 추가 안내 */}
        <p className="text-center text-xs text-gray-500">
          회원가입하면 서비스 이용약관 및 개인정보 처리방침에 동의하는 것으로 간주돼
        </p>
      </div>
    </div>
  );
}
