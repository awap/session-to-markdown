// 범용 DOM → Markdown 직렬화기.
// 코드블록 원문은 NUL 토큰으로 보호했다가 빈 줄 정리 후 복원한다.
(() => {
  const S2M = (window.S2M = window.S2M || {});

  const SKIP_TAGS = new Set([
    'script', 'style', 'noscript', 'svg', 'canvas',
    'video', 'audio', 'select', 'textarea', 'input', 'iframe', 'mat-icon',
  ]);

  function serialize(root, ctx) {
    let md = nodeToMd(root, ctx);
    md = md
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    // 코드블록 복원 — 리스트 안이면 해당 들여쓰기를 각 줄에 적용
    md = md.replace(/(^[ \t]*)?\x00CODE_(\d+)\x00/gm, (_, indent, i) => {
      const block = ctx.codeBlocks[+i];
      return indent ? block.split('\n').map((l) => indent + l).join('\n') : block;
    });
    return md;
  }

  function children(el, ctx) {
    let out = '';
    for (const child of el.childNodes) out += nodeToMd(child, ctx);
    return out;
  }

  function nodeToMd(node, ctx) {
    if (node.nodeType === Node.TEXT_NODE) {
      // white-space: pre* 요소(사용자 메시지 등)는 줄바꿈을 보존
      const parent = node.parentElement;
      if (parent && getComputedStyle(parent).whiteSpace.startsWith('pre')) {
        return node.nodeValue.replace(/[^\S\n]+/g, ' ');
      }
      return node.nodeValue.replace(/\s+/g, ' ');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node;
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return '';
    if (el.getAttribute('aria-hidden') === 'true') return '';
    // 스크린리더 전용 텍스트(Tailwind sr-only, Angular CDK visually-hidden)
    if (el.classList.contains('sr-only') || el.classList.contains('cdk-visually-hidden')) return '';
    // Gemini 코드블록 헤더 UI — 언어 라벨은 detectLang()이 별도로 회수
    if (el.classList.contains('code-block-decoration')) return '';

    switch (tag) {
      case 'button': {
        // 버튼 자체는 UI 요소라 버리지만, 첨부 이미지(라이트박스 트리거)는 건진다
        let out = '';
        for (const im of el.querySelectorAll('img')) out += imageRef(im, ctx);
        return out;
      }
      case 'br':
        return '\n';
      case 'hr':
        return '\n\n---\n\n';
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6':
        return `\n\n${'#'.repeat(+tag[1])} ${children(el, ctx).trim()}\n\n`;
      case 'strong': case 'b':
        return wrap(children(el, ctx), '**');
      case 'em': case 'i':
        return wrap(children(el, ctx), '*');
      case 'del': case 's':
        return wrap(children(el, ctx), '~~');
      case 'pre':
        return fenced(el, ctx);
      case 'code':
        return inlineCode(el);
      case 'a': {
        const text = children(el, ctx).trim();
        const href = el.getAttribute('href') || '';
        if (!href || href.startsWith('javascript:')) return text;
        return `[${text || el.href}](${el.href})`;
      }
      case 'img':
        return imageRef(el, ctx);
      case 'ul': case 'ol':
        return `\n\n${list(el, ctx)}\n\n`;
      case 'blockquote': {
        const inner = children(el, ctx).replace(/\n{3,}/g, '\n\n').trim();
        return `\n\n${inner.split('\n').map((l) => ('> ' + l).trimEnd()).join('\n')}\n\n`;
      }
      case 'table':
        return `\n\n${table(el, ctx)}\n\n`;
      case 'li':
        return children(el, ctx);
      case 'p': case 'div': case 'section': case 'article': case 'main':
      case 'header': case 'footer': case 'figure': case 'figcaption':
        return `\n\n${children(el, ctx).trim()}\n\n`;
      default:
        return children(el, ctx);
    }
  }

  function wrap(text, mark) {
    const t = text.trim();
    return t ? `${mark}${t}${mark}` : '';
  }

  function inlineCode(el) {
    const text = el.textContent.replace(/\n/g, ' ').trim();
    if (!text) return '';
    return text.includes('`') ? '`` ' + text + ' ``' : '`' + text + '`';
  }

  function fenced(pre, ctx) {
    const codeEl = pre.querySelector('code') || pre;
    // textContent가 아닌 innerText: 줄을 div로 렌더링하는 사이트(ChatGPT)에서도 줄바꿈 유지
    const text = (codeEl.innerText ?? codeEl.textContent).replace(/\n+$/, '');
    const lang = detectLang(pre, codeEl);
    const fence = text.includes('```') ? '````' : '```';
    const idx = ctx.codeBlocks.push(`${fence}${lang}\n${text}\n${fence}`) - 1;
    return `\n\n\x00CODE_${idx}\x00\n\n`;
  }

  function detectLang(pre, codeEl) {
    const m = String(codeEl.className || '').match(/language-([\w#+-]+)/);
    if (m) return m[1];
    // Gemini: <code-block> 헤더의 언어 라벨
    const deco = pre.closest('code-block')?.querySelector('.code-block-decoration span');
    if (deco) return deco.textContent.trim().toLowerCase().split(/\s/)[0];
    // ChatGPT: pre 헤더의 짧은 언어 라벨 텍스트 (버튼 제외)
    for (const el of pre.querySelectorAll('div, span')) {
      if (el.contains(codeEl) || codeEl.contains(el) || el.closest('button')) continue;
      const t = el.textContent.trim();
      if (t && t.length <= 15 && /^[\w#+.-]+$/.test(t)) return t.toLowerCase();
    }
    return '';
  }

  function imageRef(img, ctx) {
    const src = img.currentSrc || img.src || '';
    if (!src || isDecorative(img, src)) return '';
    // 같은 이미지의 UI 복제(라이트박스 미리보기 등)는 첫 등장만 남긴다
    if (!ctx.seenSrcs) ctx.seenSrcs = new Set();
    if (ctx.seenSrcs.has(src)) return '';
    ctx.seenSrcs.add(src);
    const n = ctx.images.push({ src, alt: img.getAttribute('alt') || '' });
    // chrome 가드: 확장 밖(개발 중 주입 테스트)에서도 동작하도록
    const fallbackAlt =
      typeof chrome !== 'undefined' && chrome.i18n
        ? chrome.i18n.getMessage('imageAltFallback', [String(n)])
        : `Image ${n}`;
    const alt = (img.getAttribute('alt') || fallbackAlt).replace(/[\[\]\n]/g, ' ').trim();
    return `\n\n![${alt}](\x00IMG_${n}\x00)\n\n`;
  }

  // 아이콘·아바타·프로필 사진·출처 파비콘은 본문 이미지에서 제외
  // 렌더링 크기 우선: 파비콘은 원본이 커도(128px) 화면에는 12px로 그려진다
  function isDecorative(img, src) {
    const rect = img.getBoundingClientRect();
    const w = rect.width || img.naturalWidth || 0;
    const h = rect.height || img.naturalHeight || 0;
    if (w > 0 && h > 0 && w <= 48 && h <= 48) return true;
    if (/googleusercontent\.com\/a[-/]/.test(src)) return true;
    // 주의: [class*="avatar"] 조상 검사는 쓰지 말 것 — Gemini가 업로드
    // 미리보기를 avatar 클래스 컨테이너로 감싸서 첨부 이미지가 오탐된다
    return false;
  }

  function list(listEl, ctx) {
    const ordered = listEl.tagName.toLowerCase() === 'ol';
    let n = parseInt(listEl.getAttribute('start') || '1', 10);
    if (Number.isNaN(n)) n = 1;
    const items = [];
    for (const li of listEl.children) {
      if (li.tagName.toLowerCase() !== 'li') continue;
      const marker = ordered ? `${n++}. ` : '- ';
      const indent = ' '.repeat(marker.length);
      const body = children(li, ctx).replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
      const lines = body.split('\n');
      items.push(
        marker + lines[0] + lines.slice(1).map((l) => '\n' + (l ? indent + l : '')).join('')
      );
    }
    return items.join('\n');
  }

  function table(tbl, ctx) {
    const rows = Array.from(tbl.querySelectorAll('tr'))
      .map((tr) =>
        Array.from(tr.querySelectorAll('th, td')).map((c) =>
          children(c, ctx).replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|').trim()
        )
      )
      .filter((r) => r.length);
    if (!rows.length) return '';
    const lines = [
      `| ${rows[0].join(' | ')} |`,
      `|${rows[0].map(() => ' --- |').join('')}`,
      ...rows.slice(1).map((r) => `| ${r.join(' | ')} |`),
    ];
    return lines.join('\n');
  }

  S2M.serialize = serialize;
})();
