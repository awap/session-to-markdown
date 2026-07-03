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

    // 이미지 URL 확정 후 본문의 토큰을 실제 상대 경로로 치환
    const images = [];
    for (let i = 0; i < ctx.images.length; i++) {
      const { url, ext } = await resolveImage(ctx.images[i].src, ctx.images[i].alt);
      const filename = `image-${String(i + 1).padStart(2, '0')}.${ext}`;
      markdown = markdown.split(`\x00IMG_${i + 1}\x00`).join(`images/${filename}`);
      images.push({ filename, url });
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
      // URL 경로 → alt의 원본 파일명(ChatGPT는 alt에 업로드 파일명이 남음) 순으로 확장자 추정
      const m =
        new URL(src).pathname.match(/\.(png|jpe?g|webp|gif|svg)$/i) ||
        (alt || '').match(/\.(png|jpe?g|webp|gif|svg)$/i);
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
    return map[mime] || 'png';
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
