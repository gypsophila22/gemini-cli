import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import type { Content } from '@google/generative-ai';
import type { HistoryData } from './types.js';

// 경로 및 설정값 정의
// 1. 실행 환경에 따라 __dirname을 안전하게 추출하는 함수
const getDirname = () => {
  try {
    return path.dirname(fileURLToPath(import.meta.url));
  } catch {
    return __dirname;
  }
};

const _dirname = getDirname();

// 2. 외부에서 사용할 경로 설정
export const HISTORY_FILE = path.join(_dirname, '..', '.history.json');
const MAX_HISTORY = 100;

// 3. getFilename 함수
export const getFilename = (): string => {
  try {
    return fileURLToPath(import.meta.url);
  } catch {
    return __filename;
  }
};

export async function loadHistory(file: string): Promise<HistoryData> {
  const defaultData: HistoryData = { lastTimestamp: Date.now(), history: [] };
  if (!fs.existsSync(file)) return defaultData;
  try {
    const rawData = await fsp.readFile(file, 'utf-8');
    return JSON.parse(rawData);
  } catch {
    console.warn(chalk.yellow(`⚠️ 기록 파일 읽기 실패. 새 대화를 시작합니다.`));
    return defaultData;
  }
}

export function hasRenderedHtml(obj: any): obj is { renderedHtml: string } {
  return obj && typeof obj.renderedHtml === 'string';
}

export async function saveHistory(history: Content[]): Promise<void> {
  try {
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

export async function readTargetFile(fileName: string): Promise<string | null> {
  const filePath = path.resolve(process.cwd(), fileName);
  try {
    if (!fs.existsSync(filePath)) throw new Error('파일이 존재하지 않습니다.');
    return await fsp.readFile(filePath, 'utf-8');
  } catch (error) {
    console.warn(chalk.yellow(`\n⚠️ 파일 읽기 실패: ${fileName}`));
    return null;
  }
}
