# 🚀 Gemini CLI Assistant (V1.0)

> **실시간 검색과 대화 맥락을 기억하는 프로페셔널 Node.js 백엔드 개발 비서**
> 구글 검색을 통한 팩트 체크와 파일 분석 기능이 탑재된 크로스 플랫폼(Windows/Linux) 터미널 도구입니다.

---

## ✨ Key Features

- **🌐 Google Search Grounding**: 최신 정보가 필요할 때 AI가 자동으로 구글 검색을 수행하고 출처를 제시합니다.
- **🧠 Persistent Chat History**: `.history.json`을 통해 대화 맥락을 유지하며, 마지막 대화 시점으로부터의 경과 시간을 인지합니다.
- **📄 File Context Analysis**: 특정 파일의 내용을 질문과 함께 전달하여 즉각적인 코드 리뷰 및 로직 분석이 가능합니다.
- **⚡ High Performance**: `esbuild` 번들링을 통해 즉각적인 실행 속도를 보장합니다.
- **🛡️ Cross-Platform Stability**: ESM/CJS 호환성 로직을 적용하여 Windows PowerShell 및 Linux 환경에서 모두 안정적으로 작동합니다.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (v20+)
- **Language**: TypeScript
- **AI Model**: Google Gemini 2.5 Pro / Flash
- **Bundler**: `esbuild` (Target: Node CJS)

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

```bash
# 빌드 실행 (dist/index.cjs 생성)
npm run build

# 전역 설치 (어디서든 'ask' 명령어 사용 가능)
npm install -g .
```

---

## 🚀 Usage

```bash
# 일반 기술 질문
ask "Node.js의 이벤트 루프와 워커 스레드의 차이점을 설명해줘"

# 특정 파일 분석 및 리뷰
ask "이 파일의 에러 핸들링 로직을 개선해줘" index.ts

# 실시간 정보 기반 질문
ask "현재 이란-이스라엘 분쟁의 최신 전황을 요약해줘"
```

---

## 📂 Project Structure

| 폴더/파일        | 역할                                            |
| :--------------- | :---------------------------------------------- |
| `index.ts`       | 메인 로직 (History, Tool Use, Path 제어)        |
| `dist/index.cjs` | `esbuild`로 빌드된 배포용 CJS 실행 파일         |
| `.history.json`  | 대화 세션 기록 및 타임스탬프 저장소 (자동 생성) |
| `.env`           | API Key 등 환경 변수 관리 (Git 제외)            |

---

## 👤 Author

**심하원 (Shim Ha-won)**

- Node.js Backend Developer
- GitHub: [@gypsophila22](https://github.com/gypsophila22)
