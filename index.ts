#!/usr/bin/env tsx
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

// API KEY 확인
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY가 등록되지 않았습니다.');
}

// AI 생성
const genAI = new GoogleGenerativeAI(apiKey);

// 실행 함수
async function run() {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: `
    - 당신은 유능한 Node.js 백엔드 개발 비서입니다.
    - 현재 일시: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
    - 사용자 이름: 심하원
    - 환경: 터미널 CLI 도구
    - 항상 한국어로 답변하며, 실시간 상황을 인지하고 답변하세요.
  `,
  });

  // 질문
  const prompt = process.argv[2];
  // 빈 질문 예외처리
  if (!prompt || prompt.trim() === '') {
    console.error(
      '질문이 없습니다. 질문을 입력해주세요. 예시: npm start "안녕?"',
    );
    return;
  }

  try {
    // 결과
    const result = await model.generateContent(prompt);
    // 답변
    const response = await result.response;
    // 콘솔로그로 답변을 가시화
    console.log(response.text());
    //에러처리
  } catch (error) {
    console.error('제미나이 호출 중 에러 발생:', error);
  }
}

// 실행문
run();
