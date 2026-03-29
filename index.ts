#!/usr/bin/env tsx

/**
 * @project Gemini-CLI Assistant
 * @description 터미널에서 즉시 호출 가능한 AI 백엔드 개발 비서
 * @author Sim Ha-won
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

// ---------------------------------------------------------
// 1. Types & Configuration
// ---------------------------------------------------------
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HISTORY_FILE = path.join(__dirname, '.last_run.json');

interface HistoryData {
  lastTimestamp: number;
}

/** API Key Validation */
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.API_KEY;
if (!GOOGLE_API_KEY) {
  console.error(
    chalk.red.bold(
      '❌ 에러: GOOGLE_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.',
    ),
  );
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

// ---------------------------------------------------------
// 2. Utility Functions (관심사 분리)
// ---------------------------------------------------------

/** 마지막 대화 시점과 현재의 차이를 계산하여 문맥 생성 */
async function getTimestampContext(): Promise<string> {
  if (!fs.existsSync(HISTORY_FILE)) {
    return '사용자와의 첫 대화입니다.';
  }

  try {
    const rawData = await fsp.readFile(HISTORY_FILE, 'utf-8');
    const { lastTimestamp }: HistoryData = JSON.parse(rawData);
    const diffMin = Math.floor((Date.now() - lastTimestamp) / (1000 * 60));

    return `사용자와의 마지막 대화로부터 ${diffMin}분 지났습니다.`;
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.warn(
        chalk.yellow(
          `⚠️  경고: 기록 파일(${HISTORY_FILE})이 손상되었습니다. 새 기록을 생성합니다.`,
        ),
      );
    } else {
      console.warn(
        chalk.yellow(
          `⚠️  경고: 기록을 읽는 중 오류 발생: ${(error as Error).message}`,
        ),
      );
    }
    return '이전 대화 맥락을 불러올 수 없습니다.';
  }
}

/** 파일 내용을 안전하게 읽어오는 함수 */
async function readTargetFile(fileName: string): Promise<string | null> {
  const filePath = path.resolve(process.cwd(), fileName);
  try {
    if (!fs.existsSync(filePath)) throw new Error('파일이 존재하지 않습니다.');
    return await fsp.readFile(filePath, 'utf-8');
  } catch (error) {
    console.warn(
      chalk.yellow(
        `\n⚠️  경고: '${fileName}' 읽기 실패 - ${(error as Error).message}`,
      ),
    );
    return null;
  }
}

/** 현재 실행 시점을 파일에 저장 */
async function saveLastRunTimestamp(): Promise<void> {
  try {
    const data: HistoryData = { lastTimestamp: Date.now() };
    await fsp.writeFile(HISTORY_FILE, JSON.stringify(data), 'utf-8');
  } catch (error) {
    console.error(
      chalk.red(`\n❌ 기록 저장 실패: ${(error as Error).message}`),
    );
  }
}

// ---------------------------------------------------------
// 3. Main Execution Logic
// ---------------------------------------------------------
async function run() {
  const userPrompt = process.argv[2];
  const targetFileName = process.argv[3];

  if (!userPrompt || userPrompt.trim() === '') {
    console.error(chalk.yellow('\n💡 사용법: ask "질문 내용" [파일명(선택)]'));
    return;
  }

  const timeContext = await getTimestampContext();
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
    - 항상 한국어로 답변하며 실시간 상황을 인지하세요.
    - 대화 간격이 짧으면 간결하게, 길면 반갑게 인사하며 답변하세요.
  `;

  // --- 모델 폴백 리스트 설정 ---
  const modelsToTry = ['gemini-2.5-pro', 'gemini-2.5-flash'];
  let success = false;

  const spinner = ora({
    text: chalk.blueBright('제미나이가 답변을 생성하고 있습니다...'),
    color: 'blue',
  }).start();

  // 순차적으로 모델 시도
  for (const modelName of modelsToTry) {
    try {
      spinner.text = chalk.blueBright(`[${modelName}] 답변 생성 중...`);

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
      });

      const result = await model.generateContent(finalPrompt);
      const answer = result.response.text();

      spinner.stop();

      console.log(
        chalk.gray('--------------------------------------------------'),
      );
      console.log(chalk.green.bold(`📝 AI 답변 (${modelName}):`)); // 어떤 모델이 답했는지 표시
      console.log(answer);
      console.log(
        chalk.gray('--------------------------------------------------'),
      );

      await saveLastRunTimestamp();
      success = true;
      break; // 성공 시 루프 탈출
    } catch (error: any) {
      // 429 에러(할당량 초과)이고 다음 모델이 남아있다면 계속 진행
      if (
        error.message?.includes('429') &&
        modelName !== modelsToTry[modelsToTry.length - 1]
      ) {
        spinner.warn(
          chalk.yellow(`${modelName} 할당량 초과. 다음 모델로 전환합니다...`),
        );
        spinner.start(); // 다음 모델을 위해 스피너 재시작
        continue;
      }

      // 그 외 에러이거나 모든 모델 실패 시
      spinner.fail(chalk.red.bold(`에러 발생 (${modelName})`));
      console.error(chalk.red(error.message));
      break;
    }
  }

  if (!success) {
    console.error(chalk.red.bold('\n❌ 모든 모델 호출에 실패했습니다.'));
  }
}

run();
