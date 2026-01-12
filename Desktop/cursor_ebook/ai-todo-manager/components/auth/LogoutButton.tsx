/**
 * 로그아웃 버튼 컴포넌트
 * 로그인 상태에서만 표시되며, 클릭 시 로그아웃 처리
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async () => {
    setIsLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: signOutError } = await supabase.auth.signOut();

      if (signOutError) {
        throw signOutError;
      }

      // 로그아웃 성공 - 로그인 페이지로 이동
      router.push("/login");
      router.refresh(); // 서버 컴포넌트 갱신
    } catch (err: any) {
      // 사용자 친화적인 에러 메시지
      let errorMessage = "로그아웃에 실패했어";
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button
        onClick={handleLogout}
        disabled={isLoading}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        {isLoading ? "로그아웃 중..." : "로그아웃"}
      </Button>
    </div>
  );
}
