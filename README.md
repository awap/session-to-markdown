# Session to Markdown

ChatGPT · Claude · Gemini 대화 세션 **전체**를 버튼 한 번으로 Markdown 파일로 저장하는 Chrome 확장 프로그램입니다.

LLM 웹 UI는 턴 단위 복사만 지원해서 세션 전체 백업이 번거롭습니다. 이 확장은 현재 열려 있는 대화를 통째로 추출해 다운로드 폴더에 저장합니다.

## 지원 사이트

- ChatGPT — `chatgpt.com`
- Claude — `claude.ai`
- Gemini — `gemini.google.com`

## 결과물

기본 모드 (세션별 폴더)

```
다운로드/
└── ChatGPT-대화제목-20260703-1530/
    ├── 대화제목.md          # 세션 전체 (턴 구분, 역할 표시)
    └── images/
        ├── image-01.png     # 대화에 등장한 이미지
        └── image-02.jpg
```

- 모든 md 파일 상단에 **YAML frontmatter**(`title`, `service`, `url`, `date`, `turns`, `tags`)가 붙습니다. Obsidian Properties 패널과 Dataview 쿼리의 대상이 됩니다.
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

### Obsidian 모드

Vault 관례대로 **노트는 Inbox에, 이미지는 Attachments에** 나눠 저장하는 모드입니다.

1. Chrome 설정 → 다운로드 → 위치를 **Vault 루트 폴더**로 지정합니다.
   (확장은 다운로드 폴더 밖에 파일을 쓸 수 없어서, 노트 폴더와 첨부 폴더를 형제로 두려면 루트가 기준이어야 합니다)
2. 확장 팝업 → **저장 위치 설정** → "Obsidian Vault 구조" 선택, 노트 폴더와 첨부 폴더에 **Vault의 실제 폴더명을 그대로** 입력합니다. 기본값 `Inbox`/`Attachments`는 예시일 뿐이라 PARA의 `00 Inbox`든 `999 첨부`든 자유롭게 적으면 되고, `01 Projects/AI 대화`처럼 중첩 경로도 됩니다.
   (주의: 존재하지 않는 이름을 적으면 에러 없이 그 폴더가 새로 생성됩니다 — 오타에 주의하세요)
3. 저장 버튼을 누르면 이렇게 저장됩니다.

```
Vault/
├── Inbox/
│   └── ChatGPT-대화제목-20260703-1530.md
└── Attachments/
    ├── ChatGPT-대화제목-20260703-1530-image-01.png   # 세션 접두사로 충돌 방지
    └── ChatGPT-대화제목-20260703-1530-image-02.jpg
```

md 안의 이미지 링크는 노트 폴더 깊이에 맞춰 `../Attachments/…` 상대경로로 자동 계산되므로 Obsidian에서 바로 렌더링됩니다.

> 참고: Chrome 다운로드 폴더를 Vault 루트로 바꾸면 브라우저의 **다른 다운로드도** 거기로 갑니다. 신경 쓰이면 Chrome 프로필을 분리하거나, 기본 모드로 받아서 세션 폴더를 수동으로 옮기는 방법도 있습니다.

### 왜 잘 맞나

- **frontmatter 기본 탑재**: 저장된 노트가 곧바로 Properties 패널·Dataview 쿼리 대상이 됩니다. `service`별 대화 목록, 월별 통계 같은 걸 바로 뽑을 수 있습니다.
- **턴별 헤더 = 자동 목차**: `## 🧑 사용자` / `## 🤖 ChatGPT` 헤더가 옵시디언 Outline 뷰에서 목차 역할을 해서, 긴 대화도 턴 단위로 바로 점프할 수 있습니다.
- **Claude의 옵시디언 제어와 조합**: 저장은 이 확장이, 이후 태깅·주제별 MOC 연결·요약은 Claude(옵시디언 MCP 연동)가 맡는 구조를 그리고 있습니다. "웹에서 대화 → 원클릭 저장 → Claude가 자동 정리"까지 이어지는 것이 이 프로젝트의 지향점입니다.

### 로드맵

- [x] 정식 YAML frontmatter (`title`, `service`, `url`, `date`, `turns`, `tags`)
- [x] Obsidian 모드 — 노트/첨부 폴더 분리 저장
- [ ] 사이드바에서 여러 대화를 선택해 한 번에 일괄 내보내기
- [ ] frontmatter에 모델명·글자수·이미지 개수 등 추가 메타데이터

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
