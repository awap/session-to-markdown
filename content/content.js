// 팝업의 추출 요청을 받아 현재 세션을 Markdown으로 변환해 돌려준다.
(() => {
  const S2M = window.S2M;

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type !== 'S2M_EXTRACT') return;
    extract()
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true; // 비동기 응답
  });

  async function extract() {
    const adapter = S2M.pickAdapter();
    if (!adapter) return { error: '지원하지 않는 사이트입니다.' };

    const turns = adapter.getTurns();
    if (!turns.length) {
      return { error: '대화 내용을 찾지 못했습니다. 대화 화면에서 다시 시도해 주세요.' };
    }

    const ctx = { images: [], codeBlocks: [] };
    const parts = turns.map((t) => {
      const heading = t.role === 'user' ? '## 🧑 사용자' : `## 🤖 ${adapter.label}`;
      return `${heading}\n\n${S2M.serialize(t.root, ctx)}`;
    });

    const title = adapter.getTitle() || '대화';
    let markdown = [
      `# ${title}`,
      '',
      `- 서비스: ${adapter.label}`,
      `- URL: ${location.href}`,
      `- 저장 시각: ${new Date().toLocaleString('ko-KR')}`,
      `- 턴 수: ${turns.length}`,
      '',
      '---',
      '',
      parts.join('\n\n---\n\n'),
      '',
    ].join('\n');

    // 본문의 이미지 토큰은 background가 실제 다운로드 파일명 확정 후 치환한다
    // (Chrome이 실제 포맷에 맞춰 확장자를 바꿀 수 있어서 여기서 확정 불가)
    const images = [];
    for (let i = 0; i < ctx.images.length; i++) {
      const { url, ext } = await resolveImage(ctx.images[i].src, ctx.images[i].alt);
      images.push({
        token: `\x00IMG_${i + 1}\x00`,
        filename: `image-${String(i + 1).padStart(2, '0')}.${ext}`,
        url,
      });
    }

    return { service: adapter.label, title, markdown, images };
  }

  // blob:/data: URL은 페이지 밖에서 접근 불가하므로 여기서 data URL로 변환한다.
  async function resolveImage(src, alt) {
    try {
      if (src.startsWith('data:')) {
        return { url: src, ext: extFromMime(src.slice(5).split(/[;,]/)[0]) };
      }
      if (src.startsWith('blob:')) {
        const blob = await (await fetch(src)).blob();
        return { url: await blobToDataUrl(blob), ext: extFromMime(blob.type) };
      }
      const urlExt = new URL(src).pathname.match(/\.(png|jpe?g|webp|gif|svg)$/i);
      if (urlExt) return { url: src, ext: normalizeExt(urlExt[1]) };
      // URL에 확장자가 없으면 실제 바이트를 받아 MIME으로 확정한다.
      // alt 파일명은 믿을 수 없다: Claude는 alt가 .png여도 webp로 서빙하고,
      // Chrome이 저장 시 실제 포맷으로 확장자를 바꿔 md 참조가 깨진다.
      try {
        const res = await fetch(src, { credentials: 'include' });
        if (res.ok) {
          const blob = await res.blob();
          if (blob.type.startsWith('image/')) {
            return { url: await blobToDataUrl(blob), ext: extFromMime(blob.type) };
          }
        }
      } catch {
        // CORS 등으로 못 읽으면 아래 alt 추정으로 폴백
      }
      const m = (alt || '').match(/\.(png|jpe?g|webp|gif|svg)$/i);
      return { url: src, ext: m ? normalizeExt(m[1]) : 'png' };
    } catch {
      return { url: src, ext: 'png' };
    }
  }

  function normalizeExt(ext) {
    const e = ext.toLowerCase();
    return e === 'jpeg' ? 'jpg' : e;
  }

  function extFromMime(mime) {
    const map = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
    };
    if (map[mime]) return map[mime];
    const sub = (mime.split('/')[1] || '').replace(/[^\w]/g, '');
    return sub || 'png';
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('이미지 변환 실패'));
      reader.readAsDataURL(blob);
    });
  }
})();
