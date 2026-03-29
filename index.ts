#!/usr/bin/env tsx

import { GoogleGenerativeAI, type Content } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';
import type { Tool } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HISTORY_FILE = path.join(__dirname, '.history.json');

// 100개의 메시지(약 50쌍의 대화) 유지
const MAX_HISTORY = 100;

interface HistoryData {
  lastTimestamp: number;
  history: Content[]; // 대화 내역 저장을 위한 배열 추가
}

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.API_KEY;
if (!GOOGLE_API_KEY) {
  console.error(
    chalk.red.bold('❌ 에러: GOOGLE_API_KEY가 설정되지 않았습니다.'),
  );
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

// ---------------------------------------------------------
// 2. Utility Functions
// ---------------------------------------------------------

/** 히스토리 데이터 로드 */
async function loadHistory(): Promise<HistoryData> {
  const defaultData: HistoryData = { lastTimestamp: Date.now(), history: [] };

  if (!fs.existsSync(HISTORY_FILE)) return defaultData;

  try {
    const rawData = await fsp.readFile(HISTORY_FILE, 'utf-8');
    return JSON.parse(rawData);
  } catch (error) {
    console.warn(chalk.yellow(`⚠️ 기록 파일 읽기 실패. 새 대화를 시작합니다.`));
    return defaultData;
  }
}

/** 히스토리 데이터 저장 (Sliding Window 적용) */
async function saveHistory(history: Content[]): Promise<void> {
  try {
    // 최근 100개만 유지 (FIFO)
    const slicedHistory = history.slice(-MAX_HISTORY);
    const data: HistoryData = {
      lastTimestamp: Date.now(),
      history: slicedHistory,
    };
    await fsp.writeFile(HISTORY_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(
      chalk.red(`\n❌ 기록 저장 실패: ${(error as Error).message}`),
    );
  }
}

/** 파일 읽기 유틸리티 */
async function readTargetFile(fileName: string): Promise<string | null> {
  const filePath = path.resolve(process.cwd(), fileName);
  try {
    if (!fs.existsSync(filePath)) throw new Error('파일이 존재하지 않습니다.');
    return await fsp.readFile(filePath, 'utf-8');
  } catch (error) {
    console.warn(chalk.yellow(`\n⚠️ 파일 읽기 실패: ${fileName}`));
    return null;
  }
}

// ---------------------------------------------------------
// 3. Main Logic
// ---------------------------------------------------------
async function run() {
  const userPrompt = process.argv[2];
  const targetFileName = process.argv[3];

  if (!userPrompt || userPrompt.trim() === '') {
    console.error(chalk.yellow('\n💡 사용법: ask "질문 내용" [파일명(선택)]'));
    return;
  }

  // A. 이전 기록 로드 (히스토리 포함)
  const historyData = await loadHistory();
  const diffMin = Math.floor(
    (Date.now() - historyData.lastTimestamp) / (1000 * 60),
  );
  const timeContext =
    historyData.history.length === 0
      ? '사용자와의 첫 대화입니다.'
      : `사용자와의 마지막 대화로부터 ${diffMin}분 지났습니다.`;

  const fileContent = targetFileName
    ? await readTargetFile(targetFileName)
    : null;
  const finalPrompt = fileContent
    ? `참고 파일: ${targetFileName}\n내용:\n${fileContent}\n\n질문: ${userPrompt}`
    : userPrompt;

  const systemInstruction = `
    - 당신은 유능한 Node.js 백엔드 개발 비서입니다.
    - 현재 일시: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
    - 사용자 이름: 심하원
    - ${timeContext}
    - 항상 한국어로 답변하며, 제공된 대화 기록(history)을 바탕으로 맥락을 유지하세요.
  `;

  const modelsToTry = ['gemini-2.5-pro', 'gemini-2.5-flash'];
  let success = false;

  const spinner = ora({
    text: chalk.blueBright('제미나이가 생각 중입니다...'),
    color: 'blue',
  }).start();

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        tools: [
          {
            googleSearch: {}, // 빈 객체로 설정하면 자동 모드로 작동합니다.
          } as unknown as Tool,
        ],
      });

      // B. Chat Session 시작 (기존 히스토리 주입)
      const chat = model.startChat({
        history: historyData.history,
      });

      // 1. 답변과 메타데이터 먼저 확보
      const result = await chat.sendMessage(finalPrompt);
      const answer = result.response.text();
      const metadata = result.response.candidates?.[0]?.groundingMetadata;

      // 2. 답변을 받았으니 즉시 스피너 중지 (로그 찍기 전 필수!)
      spinner.stop();

      // 3. 메인 답변 출력
      console.log(
        chalk.gray('--------------------------------------------------'),
      );
      console.log(chalk.green.bold(`📝 AI 답변 (${modelName}):`));
      console.log(answer);

      // 4. 검색 출처가 있다면 답변 아래에 이어서 출력
      if (metadata?.groundingChunks && metadata.groundingChunks.length > 0) {
        console.log(chalk.blue.bold('\n🔗 참고 출처:'));

        const sourceMap = new Map();
        metadata.groundingChunks.forEach((chunk: any) => {
          if (chunk.web?.uri) {
            sourceMap.set(chunk.web.uri, chunk.web.title || '출처 제목 없음');
          }
        });

        Array.from(sourceMap.entries()).forEach(([uri, title], index) => {
          console.log(
            chalk.gray(`  [${index + 1}] `) +
              chalk.white(title) +
              chalk.gray(' - ') +
              chalk.cyan.underline(uri),
          );
        });
      }

      console.log(
        chalk.gray('--------------------------------------------------'),
      );

      // C. 새로운 대화 내용 파일에 저장
      // chat.getHistory()를 사용하면 이번에 주고받은 내용까지 포함된 전체 리스트를 가져옵니다.
      await saveHistory(await chat.getHistory());

      success = true;
      break;
    } catch (error: any) {
      if (
        error.message?.includes('429') &&
        modelName !== modelsToTry[modelsToTry.length - 1]
      ) {
        spinner.warn(chalk.yellow(`${modelName} 할당량 초과. 전환 중...`));
        spinner.start();
        continue;
      }
      spinner.fail(chalk.red.bold(`에러 발생 (${modelName})`));
      console.error(chalk.red(error.message));
      break;
    }
  }
}

run();
