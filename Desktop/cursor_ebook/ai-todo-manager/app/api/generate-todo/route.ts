/**
 * AI 기반 할 일 생성 API Route
 * Gemini API를 사용해 자연어 입력을 구조화된 할 일 데이터로 변환
 * 입력 검증, 전처리, 후처리 포함
 */

import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';

// 할 일 데이터 스키마 정의
const todoSchema = z.object({
  title: z.string().describe('할 일의 제목 (간결하게)'),
  description: z.string().optional().describe('할 일의 상세 설명'),
  due_date: z.string().describe('마감일 (ISO 8601 형식: YYYY-MM-DDTHH:mm:ss+09:00) - 필수'),
  priority: z.enum(['high', 'medium', 'low']).describe('우선순위 (high: 긴급/중요, medium: 보통, low: 낮음)'),
  category: z.array(z.string()).describe('카테고리 배열 (최소 1개 필수, 예: ["업무"], ["개인", "건강"])'),
});

/**
 * 입력 검증 함수
 */
function validateInput(input: string): { valid: boolean; error?: string } {
  // 빈 문자열 체크
  if (!input || input.trim().length === 0) {
    return { valid: false, error: '할 일 내용을 입력해줘' };
  }
  
  // 최소 길이 제한 (2자)
  if (input.trim().length < 2) {
    return { valid: false, error: '최소 2자 이상 입력해줘' };
  }
  
  // 최대 길이 제한 (500자)
  if (input.length > 500) {
    return { valid: false, error: '최대 500자까지 입력 가능해 (현재: ' + input.length + '자)' };
  }
  
  return { valid: true };
}

/**
 * 전처리 함수
 */
function preprocessInput(input: string): string {
  // 앞뒤 공백 제거
  let processed = input.trim();
  
  // 연속된 공백을 하나로 통합
  processed = processed.replace(/\s+/g, ' ');
  
  // 특수 문자나 이모지는 그대로 유지 (사용자 의도 존중)
  
  return processed;
}

/**
 * 후처리 함수
 */
function postprocessTodo(todo: any, currentTime: Date): any {
  const result = { ...todo };
  
  // 1. 생성된 날짜가 과거인지 확인 (실제 과거만 체크)
  if (result.due_date) {
    const dueDate = new Date(result.due_date);
    const now = new Date(); // 현재 시각 (UTC)
    
    // 실제로 과거인 경우만 조정 (같은 날이면 통과)
    if (dueDate < now) {
      console.log('과거 날짜 감지, 내일로 조정:', result.due_date);
      // 과거 날짜면 내일 09:00으로 설정
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      // KST로 변환
      const kstTomorrow = new Date(tomorrow.getTime() + (9 * 60 * 60 * 1000));
      result.due_date = kstTomorrow.toISOString().slice(0, 19) + '+09:00';
    }
  }
  
  // 2. 제목 길이 자동 조절
  if (result.title) {
    if (result.title.length > 50) {
      result.title = result.title.slice(0, 47) + '...';
    }
    if (result.title.length < 2) {
      result.title = '새 할 일';
    }
  }
  
  // 3. 필수 필드 기본값 설정
  if (!result.title || result.title.trim().length === 0) {
    result.title = '새 할 일';
  }
  
  if (!result.priority) {
    result.priority = 'medium';
  }
  
  if (!result.category || result.category.length === 0) {
    result.category = ['기타'];
  }
  
  if (!result.due_date) {
    // 우선순위에 따라 기본 날짜 설정
    const defaultDate = new Date(currentTime);
    if (result.priority === 'high') {
      defaultDate.setDate(defaultDate.getDate() + 1); // 내일
    } else if (result.priority === 'medium') {
      defaultDate.setDate(defaultDate.getDate() + 3); // 3일 후
    } else {
      defaultDate.setDate(defaultDate.getDate() + 7); // 7일 후
    }
    defaultDate.setHours(9, 0, 0, 0);
    result.due_date = defaultDate.toISOString().slice(0, 19) + '+09:00';
  }
  
  return result;
}

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const { input } = await request.json();

    // 1. 입력 검증
    const validation = validateInput(input);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // 2. 전처리
    const processedInput = preprocessInput(input);
    console.log('전처리된 입력:', processedInput);

    // API 키 확인
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey) {
      console.error('GOOGLE_API_KEY 환경변수가 설정되지 않았어.');
      return NextResponse.json(
        { error: 'API 키가 설정되지 않았어. 관리자에게 문의해줘.' },
        { status: 500 }
      );
    }

    // 현재 날짜/시간 (한국 시간)
    const now = new Date();
    const kstNow = new Date(now.getTime() + (9 * 60 * 60 * 1000));
    const currentDateTime = kstNow.toISOString().slice(0, 19) + '+09:00';
    const currentDate = kstNow.toISOString().slice(0, 10);
    const currentTime = kstNow.toISOString().slice(11, 16);
    const currentDayOfWeek = kstNow.toLocaleDateString('ko-KR', { weekday: 'long' });

    // 3. Gemini API를 사용해 구조화된 데이터 생성
    const { object } = await generateObject({
      model: google('gemini-2.0-flash-exp'),
      schema: todoSchema,
      prompt: `당신은 한국어 자연어 입력을 구조화된 할 일 데이터로 변환하는 AI 어시스턴트입니다.

**현재 날짜/시간 정보**:
- 날짜: ${currentDate}
- 시각: ${currentTime}
- 요일: ${currentDayOfWeek}
- 전체: ${currentDateTime}

**사용자 입력**: "${processedInput}"

다음 규칙을 **정확히** 따라 할 일 데이터를 생성해주세요:

## 1. 날짜 처리 규칙 (반드시 준수)
- "오늘" → ${currentDate}
- "내일" → 현재 날짜 + 1일
- "모레" → 현재 날짜 + 2일
- "이번 주 금요일" → 가장 가까운 금요일
- **"다음 주까지", "다음주까지"** → 다음 주 일요일 (다음 주의 마지막 날)
- "다음 주 월요일" → 다음 주의 월요일
- "월요일", "화요일" 등 요일만 언급 → 다음 해당 요일
- 날짜 미명시 → 우선순위에 따라 기본값 설정
  * high → 내일
  * medium → 3일 후
  * low → 7일 후

## 2. 시간 처리 규칙 (반드시 준수)
- "아침" → 09:00
- "점심" → 12:00
- "오후" → 14:00
- "저녁" → 18:00
- "밤" → 21:00
- "오전 X시" → 0X:00 (예: 오전 9시 → 09:00)
- "오후 X시" → 1X:00 (예: 오후 3시 → 15:00)
- **중요**: "오늘 ~까지", "오늘 중", "오늘 안에" 등 오늘 마감이면서 시간 미명시 → **23:59** (당일 자정)
- 기타 시간 미명시 → **09:00 기본값**

## 3. 우선순위 키워드 (반드시 준수)
- **high**: "급하게", "중요한", "빨리", "꼭", "반드시", "긴급", "시급"
- **medium**: "보통", "적당히", 또는 키워드 없음 (기본값)
- **low**: "여유롭게", "천천히", "언젠가", "나중에"

## 4. 카테고리 분류 키워드 (반드시 준수 - 필수 항목!)
**중요**: 카테고리는 **반드시 1개 이상** 포함해야 합니다!

- **업무**: "회의", "보고서", "프로젝트", "업무", "미팅", "발표", "제안서", "문서"
- **개인**: "쇼핑", "친구", "가족", "개인", "약속", "모임"
- **건강**: "운동", "병원", "건강", "요가", "헬스", "조깅", "산책"
- **학습**: "공부", "책", "강의", "학습", "인강", "세미나", "강좌", "과제", "기획", "수업", "강의", "교육"
- **기타**: 위 카테고리에 해당하지 않으면 "기타" 사용

**분류 우선순위**:
1. 키워드가 명확히 일치하면 해당 카테고리 사용
2. "과제", "기획" 등 학습/교육 관련 → ["학습"]
3. 여러 카테고리에 해당하면 최대 2개까지 포함
4. 판단이 어려우면 → ["기타"]

## 5. 출력 형식 (JSON - 반드시 준수)
{
  "title": "간결한 제목 (동사형 어미 제거)",
  "description": "부가 설명 (선택)",
  "due_date": "YYYY-MM-DDTHH:mm:ss+09:00",
  "priority": "high | medium | low",
  "category": ["카테고리1", "카테고리2"]
}

**중요 사항**:
- due_date는 가능한 한 **항상 포함**
- 날짜/시간 규칙을 **정확히** 따를 것
- 우선순위 키워드를 **엄격히** 적용
- 카테고리는 키워드 기반으로 **정확히** 분류
- JSON 형식을 **반드시** 준수

이제 사용자 입력을 변환해주세요.`,
    });

    // 4. 후처리
    const finalTodo = postprocessTodo(object, kstNow);
    
    // 디버깅: 생성된 데이터 확인
    console.log('AI 생성 데이터:', JSON.stringify(object, null, 2));
    console.log('후처리 완료 데이터:', JSON.stringify(finalTodo, null, 2));

    // 5. 생성된 데이터 반환
    return NextResponse.json(finalTodo);
  } catch (error) {
    console.error('AI 생성 오류:', error);
    
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
        { error: `AI 처리 중 오류가 발생했어. 잠시 후 다시 시도해줘. (${error.message})` },
        { status: 500 }
      );
    }

    // 알 수 없는 오류 (500)
    return NextResponse.json(
      { error: 'AI 생성 중 알 수 없는 오류가 발생했어. 잠시 후 다시 시도해줘.' },
      { status: 500 }
    );
  }
}
