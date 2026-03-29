#!/usr/bin/env tsx

/**
 * @project Gemini-CLI Assistant
 * @description 터미널에서 즉시 호출 가능한 AI 백엔드 개발 비서
 * @author Sim Ha-won
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ---------------------------------------------------------
// 1. Environment & Path Configuration
// ---------------------------------------------------------
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HISTORY_FILE = path.join(__dirname, '.last_run.json');

/** API Key Validation */
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY가 등록되지 않았습니다.');
}

// ---------------------------------------------------------
// 2. Initialize Gemini AI
// ---------------------------------------------------------
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Main execution logic
 */
async function run() {
  // A. Context Gathering (마지막 대화 시점 계산)
  let timeContext = '사용자와의 첫 대화입니다.';
  if (fs.existsSync(HISTORY_FILE)) {
    try {
      const rawData = fs.readFileSync(HISTORY_FILE, 'utf-8');
      const { lastTimestamp } = JSON.parse(rawData);
      const diffMs = Date.now() - lastTimestamp;
      const diffMin = Math.floor(diffMs / (1000 * 60)); // 분 단위 변환
      timeContext = `사용자와의 마지막 대화로부터 ${diffMin}분 지났습니다.`;
    } catch (e) {
      // JSON 파싱 에러 등을 대비한 방어 코드
      timeContext = '이전 기록을 읽는 중 오류가 발생했습니다.';
    }
  }

  // B. AI Model Configuration (시스템 페르소나 설정)
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: `
    - 당신은 유능한 Node.js 백엔드 개발 비서입니다.
    - 현재 일시: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
    - 사용자 이름: 심하원
    - 환경: 터미널 CLI 도구
    - 항상 한국어로 답변하며, 실시간 상황을 인지하고 답변하세요.
    - 대화 간격이 길다면 반갑게 인사하고, 짧다면 바로 본론으로 들어가세요.
  `,
  });

  // C. Input Validation (사용자 입력 검증)
  const prompt = process.argv[2];
  if (!prompt || prompt.trim() === '') {
    console.error('질문이 없습니다. 질문을 입력해주세요. 💡예시: ask "안녕?"');
    return;
  }

  // D. Request & Response Handling
  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const answer = response.text();

    // 결과 출력
    console.log(answer);

    // E. Persistence (대화 시점 기록 갱신)
    const metadata = { lastTimestamp: Date.now() };
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(metadata));
  } catch (error) {
    console.error('❌ Gemini API Error:', error);
  }
}

// 실행문
run();
