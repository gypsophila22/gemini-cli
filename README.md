# 🚀 Gemini CLI Assistant (V1.0)

> **실시간 검색과 대화 맥락을 기억하는 프로페셔널 Node.js 백엔드 개발 비서**
> 단순한 API 호출을 넘어, 구글 검색을 통한 팩트 체크와 파일 분석 기능이 탑재된 터미널 전역 도구입니다.

---

## ✨ Key Features

- **🌐 Google Search Grounding**: 최신 정보나 역사적 사실이 필요할 때 AI가 자동으로 구글 검색을 수행하고 출처를 제시합니다. (2026년 최신 사건 대응 완료)
- **🧠 Persistent Chat History**: `.history.json`을 통해 세션 간 대화 맥락을 유지합니다. 마지막 대화 시점으로부터의 경과 시간을 계산하여 답변 톤을 조절합니다.
- **📄 File Context Analysis**: 특정 파일의 내용을 질문과 함께 전달하여 즉각적인 코드 리뷰 및 로직 분석이 가능합니다.
- **⚡ High Performance**: `esbuild`를 통한 번들링으로 `tsx` 컴파일 과정 없이 즉각적인 실행 속도를 보장합니다.
- **🛡️ Smart Model Fallback**: `gemini-2.5-pro` 할당량 초과 시 자동으로 `gemini-2.5-flash`로 전환하여 안정적인 사용 환경을 제공합니다.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (v20+)
- **Language**: TypeScript
- **AI Model**: Google Gemini 2.5 Pro / Flash (Multi-model Fallback)
- **Bundler**: `esbuild` (Fast & Light)
- **Core Library**: `@google/generative-ai`, `chalk`, `ora`, `dotenv`

---

## 📋 Prerequisites

1. **Node.js**: v20.19.0 이상의 버전이 권장됩니다.
2. **Gemini API Key**: [Google AI Studio](https://aistudio.google.com/)에서 발급받은 API 키가 필요합니다.

---

## ⚙️ Installation & Setup

### 1. Repository Clone & Install

```bash
git clone [https://github.com/gypsophila22/gemini-cli.git](https://github.com/gypsophila22/gemini-cli.git)
cd gemini-cli
npm install
```

### 2. Environment Variables

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 발급받은 API 키를 입력합니다.

```bash
cp .env.example .env
# .env 파일을 열어 API_KEY=your_key_here 를 입력하세요.
```

### 3. Build & Global Install

개발용 소스 코드를 최적화된 JavaScript로 빌드하고 시스템 전역 명령어로 등록합니다.

```bash
# 빌드 실행 (dist/index.js 생성)
npm run build

# 전역 설치 (어디서든 'ask' 명령어 사용 가능)
npm install -g .
```

---

## 🚀 Usage

명령어 뒤에 질문을 입력하세요. 파일 분석이 필요한 경우 두 번째 인자로 파일 경로를 전달합니다.

```bash
# 일반 기술 질문
ask "Node.js의 이벤트 루프와 워커 스레드의 차이점을 설명해줘"

# 특정 파일 분석 및 리뷰
ask "이 파일의 에러 핸들링 로직을 개선해줘" index.ts

# 실시간 정보 기반 질문 (자동 검색 활성화)
ask "현재 이란-이스라엘 분쟁의 최신 전황을 요약해줘"
```

---

## 📂 Project Structure

| 폴더/파일       | 역할                                         |
| :-------------- | :------------------------------------------- |
| `index.ts`      | 메인 로직 (History, Tool Use, Fallback 제어) |
| `dist/index.js` | `esbuild`로 최적화된 배포용 단일 실행 파일   |
| `.history.json` | 대화 세션 기록 및 타임스탬프 저장소 (로컬)   |
| `package.json`  | 빌드 스크립트 및 전역 `bin` 명령어 설정      |

---

## 👤 Author

**심하원 (Shim Ha-won)**

- Node.js Backend Developer
- GitHub: [@gypsophila22](https://github.com/gypsophila22)
