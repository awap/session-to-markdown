// 서비스 워커: 추출 결과를 다운로드 폴더에 저장한다.
// 결과 트리 — 다운로드/{서비스}-{제목}-{타임스탬프}/{제목}.md + images/…
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== 'S2M_DOWNLOAD') return;
  downloadSession(msg.payload)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err.message }));
  return true; // 비동기 응답
});

async function downloadSession({ service, title, markdown, images }) {
  const safeTitle = sanitize(title);
  const folder = `${sanitize(service)}-${safeTitle}-${timestamp()}`;

  const mdUrl = 'data:text/markdown;charset=utf-8;base64,' + b64EncodeUtf8(markdown);
  await chrome.downloads.download({
    url: mdUrl,
    filename: `${folder}/${safeTitle}.md`,
    conflictAction: 'uniquify',
  });

  let failed = 0;
  for (const img of images) {
    try {
      await chrome.downloads.download({
        url: img.url,
        filename: `${folder}/images/${img.filename}`,
        conflictAction: 'uniquify',
      });
    } catch {
      failed++;
    }
  }

  return { folder, imageCount: images.length, failed };
}

// 파일명에 쓸 수 없는 문자 제거 + 길이 제한
function sanitize(name) {
  const cleaned = name
    .replace(/[\\/:*?"<>|\x00-\x1f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60)
    .trim();
  return cleaned || 'untitled';
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
