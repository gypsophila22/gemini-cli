# 🚀 Gemini CLI Assistant

> **Google Gemini API를 활용한 터미널 기반 인공지능 백엔드 개발 비서**
> 단순한 API 호출을 넘어, 마지막 대화 시점을 기억하고 현재 맥락(Context)을 이해하는 똑똑한 CLI 도구입니다.

---

## ✨ Key Features

- **Context-Aware Interactions**: 마지막 질문으로부터 경과된 시간을 계산하여 대화의 흐름을 조절합니다.
- **Developer Persona**: Node.js 백엔드 전문가 페르소나가 탑재되어 코드 리뷰 및 기술 질의에 특화되어 있습니다.
- **Global Access**: `npm link`를 통해 어느 디렉토리에서든 `ask` 명령어로 즉시 호출 가능합니다.
- **Modern Tech Stack**: TypeScript, ESM, `tsx`를 사용한 최신 Node.js 환경에서 구축되었습니다.

---

## 🛠 Tech Stack

- **Runtime**: Node.js (v20+)
- **Language**: TypeScript
- **AI Model**: Google Gemini 2.5 Flash
- **Tools**: `dotenv`, `tsx`, `@google/generative-ai`

---

## 📋 Prerequisites

시작하기 전, 아래 사항이 준비되어야 합니다.

1. **Node.js**: v20.19.0 이상의 버전이 설치되어 있어야 합니다.
2. **Gemini API Key**: [Google AI Studio](https://aistudio.google.com/)에서 발급받은 API 키가 필요합니다.

---

## ⚙️ Installation & Setup

### 1. Repository Clone & Install

```bash
git clone [https://github.com/](https://github.com/)[your-github-id]/gemini-cli.git
cd gemini-cli
npm install
```

### 2. Environment Variables

`.env.example` 파일을 복사하여 `.env` 파일을 생성하고 발급받은 API 키를 입력합니다.

```bash
cp .env.example .env
# .env 파일을 열어 API_KEY=your_key_here 를 입력하세요.
```

### 3. Global Command Registration

터미널 어디서든 사용할 수 있도록 전역 명령어로 등록합니다.

```bash
# tsx 전역 설치 (권한 에러 발생 시 sudo 사용)
npm install -g tsx

# 프로젝트 연결
npm link
```

---

## 🚀 Usage

명령어 뒤에 따옴표와 함께 질문을 입력하세요.

```bash
ask "Node.js에서 Stream과 Buffer의 차이점을 설명해줘"
```

### Interaction Example

- **1분 이내 재질문 시**: 불필요한 인사 없이 바로 핵심 답변을 제공합니다.
- **오랜만에 질문 시**: 현재 시간을 인지하고 반가운 인사와 함께 답변을 시작합니다.

---

## 📂 Project Structure

| 폴더/파일        | 역할                                    |
| :--------------- | :-------------------------------------- |
| `index.ts`       | CLI 메인 로직 및 Gemini API 통신 제어   |
| `.last_run.json` | 마지막 실행 타임스탬프 저장 (로컬 전용) |
| `.env`           | API Key 등 민감 정보 관리 (Git 제외)    |
| `package.json`   | 프로젝트 메타데이터 및 의존성 정의      |

---

## ⚠️ Troubleshooting

### 1. Permission Denied

`ask` 명령어 실행 시 권한 에러가 발생한다면 실행 권한을 부여하세요.

```bash
chmod +x index.ts
```

### 2. Unknown File Extension (.ts)

`tsx`가 전역으로 설치되어 있는지 확인하세요. 이 도구는 `node` 대신 `tsx` 엔진을 사용합니다.

---

## 👤 Author

**[심하원 (Sim Ha-won)]**

- Node.js Backend Developer
- GitHub: [@gypsophila22](https://github.com/gypsophila22)
