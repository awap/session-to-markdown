# Session to Markdown

ChatGPT · Claude · Gemini 대화 세션 **전체**를 버튼 한 번으로 Markdown 파일로 저장하는 Chrome 확장 프로그램입니다.

LLM 웹 UI는 턴 단위 복사만 지원해서 세션 전체 백업이 번거롭습니다. 이 확장은 현재 열려 있는 대화를 통째로 추출해 다운로드 폴더에 저장합니다.

## 지원 사이트

- ChatGPT — `chatgpt.com`
- Claude — `claude.ai`
- Gemini — `gemini.google.com`

## 결과물

```
다운로드/
└── ChatGPT-대화제목-20260703-1530/
    ├── 대화제목.md          # 세션 전체 (턴 구분, 역할 표시)
    └── images/
        ├── image-01.png     # 대화에 등장한 이미지
        └── image-02.jpg
```

- **코드블록**은 언어 정보를 포함한 fenced code block으로 원문 그대로 보존됩니다.
- **이미지**는 본문의 원래 위치에 `![이미지 1](images/image-01.png)` 형태로 삽입되고, 실제 파일은 `images/` 폴더에 함께 저장됩니다. 다운로드가 실패해도 본문에 이미지가 있었다는 표시는 남습니다.
- 표, 목록, 인용, 링크 등 일반 마크다운 요소도 변환됩니다.

## 설치 (개발자 모드)

1. 이 저장소를 클론하거나 zip으로 받아 압축을 풉니다.
2. Chrome에서 `chrome://extensions` 접속.
3. 우측 상단 **개발자 모드** 켜기.
4. **압축해제된 확장 프로그램을 로드합니다** 클릭 → 이 폴더 선택.

## 사용법

1. 백업할 대화 페이지를 엽니다.
2. 긴 대화는 위로 스크롤해 과거 턴이 모두 로딩된 상태로 만듭니다. (사이트가 화면 밖 턴을 지연 로딩하는 경우 로딩된 부분만 저장됩니다)
3. 툴바의 확장 아이콘 클릭 → **이 대화를 Markdown으로 저장**.
4. 다운로드 폴더에서 결과 확인.

## Obsidian과 함께 쓰기

이 확장은 단순 백업을 넘어, **AI와 나눈 대화를 지식베이스로 흡수하는 입구**로 쓰기 좋게 설계했습니다.

- **Vault로 직행**: Chrome 설정에서 기본 다운로드 폴더를 Vault 안의 `Inbox/AI 대화` 같은 폴더로 지정해 두세요. 저장 버튼을 누르는 순간 노트가 이미지까지 통째로 Vault 안에 나타나고, 그래프 뷰에도 바로 반영됩니다.
- **턴별 헤더 = 자동 목차**: `## 🧑 사용자` / `## 🤖 ChatGPT` 헤더가 옵시디언 Outline 뷰에서 목차 역할을 해서, 긴 대화도 턴 단위로 바로 점프할 수 있습니다.
- **Claude의 옵시디언 제어와 조합**: 저장은 이 확장이, 이후 태깅·주제별 MOC 연결·요약은 Claude(옵시디언 MCP 연동)가 맡는 구조를 그리고 있습니다. "웹에서 대화 → 원클릭 저장 → Claude가 자동 정리"까지 이어지는 것이 이 프로젝트의 지향점입니다.

### 로드맵

- [ ] 정식 YAML frontmatter 지원 (`service`, `date`, `tags`, `url` 등) — Properties 패널·Dataview 쿼리 대상이 되도록
- [ ] 사이드바에서 여러 대화를 선택해 한 번에 일괄 내보내기
- [ ] frontmatter에 소스 URL·모델명·글자수·이미지 개수 자동 채움

아이디어나 요청은 [Issues](https://github.com/awap/session-to-markdown/issues)로 남겨주세요.

## 구조

```
manifest.json          MV3 매니페스트 (권한: downloads)
background.js          서비스 워커 — 파일 다운로드 실행
content/serializer.js  범용 DOM→Markdown 직렬화기
content/adapters.js    사이트별 셀렉터 (사이트 개편 시 이 파일만 수정)
content/content.js     추출 오케스트레이션, 이미지 URL 해석
popup/                 팝업 UI
icons/gen_icons.py     아이콘 생성 스크립트
```

## 개인정보

이 확장은 어떤 데이터도 외부로 전송하지 않습니다. 추출·변환은 전부 브라우저 안에서 일어나고, 결과물은 로컬 다운로드 폴더에만 저장됩니다.

## 라이선스

MIT
