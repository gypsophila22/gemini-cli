import { GoogleGenerativeAI, type Tool } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import chalk from 'chalk';
import ora from 'ora';
import {
  getFilename,
  loadHistory,
  hasRenderedHtml,
  saveHistory,
  readTargetFile,
  HISTORY_FILE,
} from './utils.js';

import type { ExtendedMetadata } from './types.js';
dotenv.config();

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || process.env.API_KEY;
if (!GOOGLE_API_KEY) {
  console.error(
    chalk.red.bold('❌ 에러: GOOGLE_API_KEY가 설정되지 않았습니다.'),
  );
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

async function run() {
  const userPrompt = process.argv[2];
  const targetFileName = process.argv[3];

  if (!userPrompt || userPrompt.trim() === '') {
    console.error(chalk.yellow('\n💡 사용법: ask "질문 내용" [파일명(선택)]'));
    return;
  }

  // A. 이전 기록 로드 (히스토리 포함)
  const historyData = await loadHistory(HISTORY_FILE);
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
    [중요 수칙]
    1. **사실 확인 최우선**: 실시간 뉴스, 시사, 역사적 사건에 대해서는 본인의 기억에 의존하지 말고 반드시 'googleSearch' 도구를 호출하여 확인하세요.
    2. **환각 방지**: 확실하지 않은 정보를 사실인 것처럼 지어내지 마세요. 검색 결과가 없으면 솔직하게 "최신 정보를 찾을 수 없다"고 답변하세요.
    3. **출처 명시**: 검색을 수행했다면 답변 끝에 반드시 출처를 포함하세요.
    4. 모든 답변은 한국어로 명확하게 작성하세요.
    [검색 최적화 지침]
    1. 검색을 수행할 때는 문장 전체를 던지지 말고, **'2026년 이란 전쟁 현황', '이란 공습 뉴스'**와 같이 핵심 키워드 위주로 검색어를 생성하세요.
    2. 검색 결과 중에서 '예측(Prediction)', '시나리오(Scenario)', '가상(Fiction)' 등의 단어가 포함된 소스는 제외하고, **주요 언론사의 실시간 보도**만 신뢰하세요.
    3. 현재 발생 중인 사건에 대해 "이미 알고 있다"고 자만하지 말고, 검색 결과의 날짜와 내용을 대조하여 팩트 체크를 먼저 하세요.
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
      const metadata = result.response.candidates?.[0]?.groundingMetadata as
        | ExtendedMetadata
        | undefined;

      // 2. 답변을 받았으니 즉시 스피너 중지
      spinner.stop();

      // 3. 메인 답변 출력
      console.log(
        chalk.gray('--------------------------------------------------'),
      );
      console.log(chalk.green.bold(`📝 AI 답변 (${modelName}):`));
      console.log(answer);

      // 4. AI가 실제로 검색한 키워드 출력
      if (metadata) {
        let displayQueries: string[] = [];

        // 실제 검색 쿼리가 있는지 먼저 확인
        if (metadata.webSearchQueries && metadata.webSearchQueries.length > 0) {
          displayQueries = metadata.webSearchQueries.slice(0, 3);
        }
        // 쿼리가 없다면 문장에서 추출 (Fallback)
        else if (metadata.groundingSupports) {
          displayQueries = metadata.groundingSupports
            .map((s) => s.segment?.text?.split(' ').slice(0, 3).join(' '))
            .filter((text): text is string => !!text) // null/undefined 제거 및 타입 가드
            .map((text) =>
              text.length > 20 ? text.substring(0, 20) + '...' : text,
            )
            .slice(0, 3);
        }

        if (displayQueries.length > 0) {
          console.log(chalk.magenta.bold('\n🔍 AI 검색 키워드:'));
          console.log(chalk.gray(`   > ${displayQueries.join(' / ')}`));
        }
      }

      // 5. 검색 출처가 있다면 답변 아래에 이어서 출력
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
      } else if (metadata?.searchEntryPoint) {
        const entryPoint =
          result.response.candidates?.[0]?.groundingMetadata?.searchEntryPoint;
        if (hasRenderedHtml(entryPoint)) {
          console.log(chalk.blue.bold('\n🔎 Google Search 결과가 존재합니다.'));
        }
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
