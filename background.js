// 서비스 워커: 추출 결과를 다운로드 폴더에 저장한다.
//
// 저장 모드 (팝업의 설정에서 선택, chrome.storage.sync)
// - session:  다운로드/{서비스}-{제목}-{타임스탬프}/{제목}.md + images/…  (기본)
// - obsidian: {노트 폴더}/{서비스}-{제목}-{타임스탬프}.md
//             {첨부 폴더}/{서비스}-{제목}-{타임스탬프}-image-01.png …
//             Chrome 다운로드 폴더를 Vault 루트로 지정해야 한다.
//             (downloads API는 다운로드 폴더 밖으로 나갈 수 없으므로
//              노트 폴더와 첨부 폴더가 형제가 되려면 루트가 기준이어야 함)

const DEFAULTS = {
  mode: 'session', // 'session' | 'obsidian'
  noteFolder: 'Inbox',
  attachmentFolder: 'Attachments',
};

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'S2M_DOWNLOAD') return;
  downloadSession(msg.payload)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err.message }));
  return true; // 비동기 응답
});

async function downloadSession({ service, title, markdown, images }) {
  const settings = await chrome.storage.sync.get(DEFAULTS);
  const base = `${sanitize(service)}-${sanitize(title)}-${timestamp()}`;

  let mdPath, imgPathFor, linkFor;
  if (settings.mode === 'obsidian') {
    const noteFolder = sanitizePath(settings.noteFolder);
    const attachFolder = sanitizePath(settings.attachmentFolder) || 'Attachments';
    // 노트 폴더 깊이만큼 올라가서 첨부 폴더로 내려가는 상대 링크
    const depth = noteFolder ? noteFolder.split('/').length : 0;
    const linkPrefix = '../'.repeat(depth) + attachFolder + '/';
    mdPath = joinPath(noteFolder, `${base}.md`);
    // 공유 첨부 폴더에서는 image-01.png가 세션 간 충돌하므로 세션 접두사를 붙인다
    imgPathFor = (name) => `${attachFolder}/${base}-${name}`;
    linkFor = (finalName) => encodeURI(linkPrefix + finalName);
  } else {
    mdPath = `${base}/${sanitize(title)}.md`;
    imgPathFor = (name) => `${base}/images/${name}`;
    linkFor = (finalName) => encodeURI(`images/${finalName}`);
  }

  // 이미지를 먼저 받는다. Chrome은 서버가 알려준 실제 포맷에 맞춰 확장자를
  // 바꿔 저장할 수 있으므로(Claude: alt는 .png인데 실제는 webp), 확정된
  // 파일명을 읽어 md 본문의 토큰에 반영한 뒤 md를 마지막에 저장한다.
  let failed = 0;
  for (const img of images) {
    const requested = imgPathFor(img.filename);
    // 다운로드가 실패해도 의도했던 파일명으로 참조를 남긴다
    // — "여기 이미지가 있었다"는 기록이 목적
    let finalName = requested.split('/').pop();
    try {
      const id = await chrome.downloads.download({
        url: img.url,
        filename: requested,
        conflictAction: 'uniquify',
      });
      finalName = (await resolveFinalBasename(id)) || finalName;
    } catch {
      failed++;
    }
    markdown = markdown.split(img.token).join(linkFor(finalName));
  }

  const mdUrl = 'data:text/markdown;charset=utf-8;base64,' + b64EncodeUtf8(markdown);
  await chrome.downloads.download({
    url: mdUrl,
    filename: mdPath,
    conflictAction: 'uniquify',
  });

  return { location: mdPath, imageCount: images.length, failed };
}

// 다운로드 항목의 최종 파일명(확장자 교정·uniquify 반영)을 얻는다
async function resolveFinalBasename(id) {
  for (let i = 0; i < 20; i++) {
    const [item] = await chrome.downloads.search({ id });
    if (item && item.filename) {
      return item.filename.split(/[\\/]/).pop();
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return null;
}

// 파일명에 쓸 수 없는 문자 제거 + 길이 제한
function sanitize(name) {
  return sanitizeSegment(name).slice(0, 60).trim() || 'untitled';
}

function sanitizeSegment(seg) {
  return String(seg)
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 설정에서 온 폴더 경로: 구분자 '/'는 허용하되 각 구간을 정리하고 '..'은 버린다
function sanitizePath(p) {
  return String(p || '')
    .split('/')
    .map(sanitizeSegment)
    .filter((seg) => seg && seg !== '.' && seg !== '..')
    .join('/');
}

function joinPath(dir, file) {
  return dir ? `${dir}/${file}` : file;
}

function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function b64EncodeUtf8(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}
