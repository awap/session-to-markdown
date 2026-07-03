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

  // 이미지를 먼저 받는다. Chrome은 서버가 알려준 실제 포맷에 맞춰 확장자를
  // 바꿔 저장할 수 있으므로(Claude: alt는 .png인데 실제는 webp), 확정된
  // 파일명을 읽어 md 본문의 토큰에 반영한 뒤 md를 마지막에 저장한다.
  let failed = 0;
  for (const img of images) {
    let finalName = img.filename;
    try {
      const id = await chrome.downloads.download({
        url: img.url,
        filename: `${folder}/images/${img.filename}`,
        conflictAction: 'uniquify',
      });
      finalName = (await resolveFinalBasename(id)) || finalName;
    } catch {
      failed++;
    }
    markdown = markdown.split(img.token).join(`images/${finalName}`);
  }

  const mdUrl = 'data:text/markdown;charset=utf-8;base64,' + b64EncodeUtf8(markdown);
  await chrome.downloads.download({
    url: mdUrl,
    filename: `${folder}/${safeTitle}.md`,
    conflictAction: 'uniquify',
  });

  return { folder, imageCount: images.length, failed };
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
