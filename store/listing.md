# Chrome Web Store 등록 정보

대시보드(https://chrome.google.com/webstore/devconsole)에 붙여넣을 문구 모음.

## 기본 정보

- **이름**: Session to Markdown
- **카테고리**: 생산성 → 도구 (Productivity → Tools)
- **언어**: 확장 자체가 다국어(_locales: en 기본, ko) — 스토어 등록 언어는 **영어를 기본**으로 하고, 콘솔의 "스토어 등록정보 → 언어 추가"로 한국어 등록정보를 추가해 아래 한국어 문구를 붙여넣는다. 브라우저/스토어 언어에 따라 사용자에게 해당 언어가 노출된다.

## 요약 (Summary, 132자 이내)

**한국어**
> ChatGPT·Claude·Gemini 대화 세션 전체를 클릭 한 번으로 Markdown 파일로 저장합니다. 코드블록·이미지 포함.

**English**
> Save entire ChatGPT, Claude, and Gemini conversations as Markdown files in one click — code blocks and images included.

## 상세 설명 (Description)

**한국어**

LLM 웹 UI는 턴 단위 복사만 지원해서 대화 전체를 백업하려면 전체선택-복붙에 의존해야 합니다. Session to Markdown은 현재 열려 있는 대화 세션 전체를 한 번의 클릭으로 Markdown 파일로 저장합니다.

주요 기능
- ChatGPT(chatgpt.com), Claude(claude.ai), Gemini(gemini.google.com) 지원
- 코드블록을 언어 정보와 함께 원문 그대로 보존
- 대화 속 이미지를 본문의 원래 위치에 삽입하고 images/ 폴더에 파일로 함께 저장
- YAML frontmatter(제목·서비스·URL·날짜·태그) 자동 생성 — Obsidian Properties/Dataview 대응
- 표·목록·인용·링크 등 마크다운 요소 변환
- 결과물은 "서비스-제목-날짜" 폴더로 다운로드 폴더에 저장
- Obsidian 모드: 노트는 Inbox로, 이미지는 Attachments로 분리 저장 (폴더명 설정 가능)
- 다국어 지원 (영어·한국어, 브라우저 언어 자동 감지)

개인정보
- 어떤 데이터도 외부로 전송하지 않습니다. 모든 변환은 브라우저 안에서 일어나며 결과물은 로컬에만 저장됩니다.

Obsidian과 함께 쓰기
- Chrome 기본 다운로드 폴더를 Vault의 Inbox 폴더로 지정해두면, 저장 버튼을 누르는 순간 대화가 이미지까지 통째로 Vault 안에 들어갑니다. AI와 나눈 대화를 개인 지식베이스로 옮겨 재가공하려는 분들에게 특히 유용합니다.

**English**

LLM web UIs only let you copy one turn at a time. Session to Markdown saves the entire conversation you're viewing as a Markdown file with a single click.

Features
- Supports ChatGPT (chatgpt.com), Claude (claude.ai), and Gemini (gemini.google.com)
- Preserves code blocks verbatim, with language tags
- Inserts images at their original position in the conversation and saves the files to an images/ folder
- Auto-generates YAML frontmatter (title, service, URL, date, tags) — works with Obsidian Properties/Dataview
- Converts tables, lists, quotes, and links
- Output is saved to your Downloads folder as "Service-Title-Date/"
- Obsidian mode: notes go to your Inbox folder, images to Attachments (folder names configurable)
- Localized UI (English & Korean, follows your browser language)

Privacy
- No data ever leaves your browser. All conversion happens locally and the output is saved only to your Downloads folder.

Works great with Obsidian
- Point Chrome's default download folder at your Vault's Inbox folder, and every saved conversation — images included — lands directly inside your Vault. Great for anyone turning AI conversations into a personal knowledge base.

## 단일 목적 설명 (Single purpose)

> 사용자가 보고 있는 LLM 대화 세션을 Markdown 파일로 변환해 로컬 다운로드 폴더에 저장한다.
> Convert the LLM conversation the user is viewing into a Markdown file saved to their local Downloads folder.

## 권한 사용 사유 (Permission justifications)

- **downloads**: 변환된 Markdown 파일과 대화 속 이미지를 사용자의 다운로드 폴더에 저장하기 위해 필요합니다.
  (Required to save the converted Markdown file and conversation images to the user's Downloads folder.)
- **storage**: 사용자가 선택한 저장 위치 설정(기본/Obsidian 모드, 폴더명)을 기억하기 위해 필요합니다.
  (Required to remember the user's save-location preferences: default/Obsidian mode and folder names.)
- **콘텐츠 스크립트 (chatgpt.com, chat.openai.com, claude.ai, gemini.google.com)**: 사용자가 저장 버튼을 눌렀을 때 현재 대화의 DOM을 읽어 Markdown으로 변환하기 위해 필요합니다. 페이지를 수정하지 않으며 데이터를 전송하지 않습니다.
  (Needed to read the current conversation's DOM and convert it to Markdown when the user clicks Save. The pages are never modified and no data is transmitted.)

## 데이터 사용 공시 (Data usage disclosure)

- 수집하는 사용자 데이터: **없음** (모든 항목 "아니요"로 체크)
- 원격 코드 사용: 없음

## 개인정보 처리방침 URL

- https://github.com/awap/session-to-markdown/blob/main/store/privacy.md
  (저장소 public 전환 완료 — 즉시 사용 가능)

## 제출 절차

1. https://chrome.google.com/webstore/devconsole 접속, 개발자 계정 등록 (1회 $5)
2. "새 항목" → `session-to-markdown-v0.3.0.zip` 업로드
3. 위 문구들 입력, 스크린샷 1280×800 최소 1장 첨부 (대화 페이지 + 팝업이 보이는 화면 권장)
4. 데이터 사용 공시 작성 → 검토 제출 (심사 보통 1~3일)

## 스크린샷 체크리스트

- [ ] 1280×800 스크린샷 1~5장 (필수 1장)
- [ ] 128×128 스토어 아이콘 = icons/icon128.png 재사용 가능
- [ ] (선택) 440×280 소형 프로모 타일
