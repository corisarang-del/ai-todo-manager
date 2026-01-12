/**
 * AI 할 일 분석 및 요약 API Route
 * Gemini API를 사용해 사용자의 할 일 목록을 분석하고 인사이트 제공
 */

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// 분석 결과 스키마 정의
const analysisSchema = z.object({
  summary: z.string().describe('전체 요약 (한국어, 친근한 문체)'),
  urgentTasks: z.array(z.string()).describe('긴급 작업 목록 (제목만)'),
  insights: z.array(z.string()).describe('인사이트 3-5개 (구체적이고 실행 가능한)'),
  recommendations: z.array(z.string()).describe('추천사항 3-5개 (구체적이고 실행 가능한)'),
});

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const { todos, period } = await request.json();

    // 입력 검증
    if (!todos || !Array.isArray(todos)) {
      return NextResponse.json(
        { error: '할 일 목록 데이터가 필요해' },
        { status: 400 }
      );
    }

    if (!period || !['today', 'week'].includes(period)) {
      return NextResponse.json(
        { error: '분석 기간을 선택해줘 (today 또는 week)' },
        { status: 400 }
      );
    }

    // 할 일이 없는 경우
    if (todos.length === 0) {
      return NextResponse.json({
        summary: period === 'today' 
          ? '오늘 등록된 할 일이 없어. 새로운 할 일을 추가해보는 건 어때?'
          : '이번 주 등록된 할 일이 없어. 계획을 세워보는 건 어때?',
        urgentTasks: [],
        insights: ['할 일을 추가하면 AI가 분석해줄게'],
        recommendations: ['새로운 할 일을 추가해봐'],
      });
    }

    // API 키 확인
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.error('GOOGLE_API_KEY 환경변수가 설정되지 않았어.');
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았어. 관리자에게 문의해줘.' },
        { status: 500 }
      );
    }

    // 통계 계산
    const totalTodos = todos.length;
    const completedTodos = todos.filter((t: any) => t.completed).length;
    const completionRate = totalTodos > 0 ? ((completedTodos / totalTodos) * 100) : 0;
    const completionRateStr = completionRate.toFixed(1);
    
    const priorityCount = {
      high: todos.filter((t: any) => t.priority === 'high').length,
      medium: todos.filter((t: any) => t.priority === 'medium').length,
      low: todos.filter((t: any) => t.priority === 'low').length,
    };

    // 카테고리별 분포
    const categoryCount: Record<string, number> = {};
    todos.forEach((t: any) => {
      if (t.category && Array.isArray(t.category)) {
        t.category.forEach((cat: string) => {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
      }
    });

    // 마감일 분석
    const now = new Date();
    const overdueTodos = todos.filter((t: any) => {
      if (!t.due_date) return false;
      return new Date(t.due_date) < now && !t.completed;
    });

    const todayTodos = todos.filter((t: any) => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      const today = new Date();
      return dueDate.toDateString() === today.toDateString();
    });

    // 시간대별 분석 (오전/오후/저녁)
    const timeDistribution = {
      morning: 0,   // 06:00-12:00
      afternoon: 0, // 12:00-18:00
      evening: 0,   // 18:00-24:00
    };

    todos.forEach((t: any) => {
      if (t.due_date) {
        const hour = new Date(t.due_date).getHours();
        if (hour >= 6 && hour < 12) timeDistribution.morning++;
        else if (hour >= 12 && hour < 18) timeDistribution.afternoon++;
        else if (hour >= 18 || hour < 6) timeDistribution.evening++;
      }
    });

    // Gemini API를 사용해 분석
    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      schema: analysisSchema,
      prompt: `당신은 할 일 관리 전문가이자 생산성 코치입니다. 사용자의 할 일 목록을 깊이 있게 분석하고, 실행 가능하며 동기부여가 되는 조언을 제공해주세요.

**분석 기간**: ${period === 'today' ? '오늘' : '이번 주'}

**할 일 목록 데이터**:
${JSON.stringify(todos.map((t: any) => ({
  title: t.title,
  completed: t.completed,
  priority: t.priority,
  category: t.category,
  due_date: t.due_date,
  created_date: t.created_date,
})), null, 2)}

**통계**:
- 전체 할 일: ${totalTodos}개
- 완료: ${completedTodos}개 (${completionRateStr}%)
- 미완료: ${totalTodos - completedTodos}개
- 우선순위 분포: 높음 ${priorityCount.high}개, 보통 ${priorityCount.medium}개, 낮음 ${priorityCount.low}개
- 카테고리 분포: ${JSON.stringify(categoryCount)}
- 마감일 지난 할 일: ${overdueTodos.length}개
- 오늘 마감: ${todayTodos.length}개
- 시간대 분포: 오전 ${timeDistribution.morning}개, 오후 ${timeDistribution.afternoon}개, 저녁 ${timeDistribution.evening}개

## 분석 가이드라인

### 1. 완료율 분석
- ${period === 'today' ? '일일' : '주간'} 완료율 (${completionRateStr}%)을 평가하고 격려
- 우선순위별 완료 패턴 파악 (높음/보통/낮음 중 어떤 우선순위를 잘 완료하는지)
- 완료율이 높으면 칭찬, 낮으면 격려와 함께 개선 방향 제시

### 2. 시간 관리 분석
- 마감일 준수율 계산 (마감일 지난 할 일: ${overdueTodos.length}개)
- 연기된 할 일의 빈도와 패턴 파악
- 시간대별 업무 집중도 분석 (오전/오후/저녁 중 어디에 집중되어 있는지)
- 가장 효율적인 시간 활용 방법 제안

### 3. 생산성 패턴
- 가장 생산적인 시간대 도출 (완료된 할 일의 시간대 분석)
- 자주 미루는 작업 유형 식별 (미완료 + 마감일 지난 작업의 공통점)
- 완료하기 쉬운 작업의 특징 도출 (카테고리, 우선순위 등)
- 업무 과부하 여부 판단 (할 일 개수와 시간 분포 기반)

### 4. 실행 가능한 추천
- **구체적인 시간 관리 팁**: "오전 9-11시에 중요한 업무 2개를 먼저 처리해봐"
- **우선순위 조정 제안**: "긴급하지 않은 낮은 우선순위 작업은 다음 주로 미뤄도 괜찮아"
- **일정 재배치 전략**: "오후에 집중된 5개 할 일 중 2개는 내일 오전으로 옮겨봐"
- **업무 분산 전략**: "하루에 3-4개씩 나눠서 처리하면 부담이 줄어들 거야"

### 5. 긍정적인 피드백
- **잘하고 있는 부분 강조**: "완료율 ${completionRateStr}%는 정말 훌륭해! 👏"
- **개선점을 격려하는 톤**: "조금만 더 힘내면 100% 달성할 수 있어!"
- **동기부여 메시지**: "오늘도 한 걸음씩 나아가고 있어. 잘하고 있어! 💪"
- **성취감 부여**: "이미 ${completedTodos}개나 완료했어. 대단해!"

### 6. 기간별 차별화
${period === 'today' 
  ? `**오늘의 요약 특화**:
- 당일 집중도 분석 (남은 시간 고려)
- 남은 할 일의 우선순위 제시
- 오늘 안에 완료 가능한 현실적인 목표 제안
- 내일을 위한 간단한 준비 사항`
  : `**이번 주 요약 특화**:
- 주간 패턴 분석 (요일별 생산성)
- 이번 주 성과 요약 및 칭찬
- 다음 주 계획 제안
- 주말 활용 방법 제시`}

## 출력 형식

1. **summary** (1-2문장):
   - 전체 상황을 한눈에 파악할 수 있는 요약
   - 완료율과 가장 중요한 특징 포함
   - 긍정적이고 격려하는 톤
   - 예: "총 ${totalTodos}개 중 ${completedTodos}개 완료! (${completionRateStr}%) ${completionRate >= 70 ? '정말 잘하고 있어! 👏' : '조금만 더 힘내봐! 💪'}"

2. **urgentTasks** (최대 5개):
   - 긴급하게 처리해야 할 작업 (제목만)
   - 우선순위 high + 마감일 임박 우선
   - 없으면 빈 배열

3. **insights** (3-5개):
   - **완료율 인사이트**: 우선순위별 완료 패턴
   - **시간 관리 인사이트**: 마감일 준수율, 시간대별 분포
   - **생산성 패턴**: 가장 생산적인 시간, 미루는 작업 유형
   - **긍정적 발견**: 잘하고 있는 부분
   - 데이터 기반으로 구체적이고 실용적인 내용

4. **recommendations** (3-5개):
   - **즉시 실행 가능**: "지금 바로 가장 긴급한 작업부터 시작해봐"
   - **구체적 시간 제안**: "오전 10시에 30분만 투자해서 X를 완료해봐"
   - **우선순위 조정**: "낮은 우선순위 Y는 내일로 미뤄도 괜찮아"
   - **동기부여**: "한 번에 하나씩, 천천히 해도 괜찮아"
   - **다음 단계**: "${period === 'today' ? '내일을 위해 오늘 저녁에 5분만 계획을 세워봐' : '다음 주는 월요일에 주간 계획을 먼저 세워봐'}"

**중요**:
- 한국어 반말로 친근하게
- 긍정적이고 격려하는 톤 유지
- 구체적이고 즉시 실행 가능한 조언
- 사용자의 노력을 인정하고 칭찬
- 데이터를 기반으로 한 객관적 인사이트

이제 분석 결과를 생성해주세요.`,
    });

    console.log('AI 분석 결과:', JSON.stringify(object, null, 2));

    // 분석 결과 반환
    return NextResponse.json(object);
  } catch (error) {
    console.error('AI 분석 오류:', error);
    
    // 오류 타입에 따라 다른 메시지 반환
    if (error instanceof Error) {
      // API 호출 한도 초과 (429)
      if (error.message.includes('quota') || error.message.includes('rate limit') || error.message.includes('429')) {
        return NextResponse.json(
          { error: 'API 호출 한도를 초과했어. 잠시 후 다시 시도해줘.' },
          { status: 429 }
        );
      }
      
      // 일반 AI 처리 실패 (500)
      return NextResponse.json(
        { error: `AI 분석 중 오류가 발생했어. 잠시 후 다시 시도해줘. (${error.message})` },
        { status: 500 }
      );
    }

    // 알 수 없는 오류 (500)
    return NextResponse.json(
      { error: 'AI 분석 중 알 수 없는 오류가 발생했어. 잠시 후 다시 시도해줘.' },
      { status: 500 }
    );
  }
}
