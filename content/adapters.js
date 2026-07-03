// 사이트별 어댑터. DOM 셀렉터 변경 시 이 파일만 수정하면 된다.
(() => {
  const S2M = (window.S2M = window.S2M || {});

  // 매칭된 요소 중 다른 매칭 요소에 포함된 것(중복)을 제거
  function topLevel(els) {
    return els.filter((el) => !els.some((other) => other !== el && other.contains(el)));
  }

  function q(selector) {
    return topLevel(Array.from(document.querySelectorAll(selector)));
  }

  S2M.adapters = [
    {
      id: 'chatgpt',
      label: 'ChatGPT',
      hosts: ['chatgpt.com', 'chat.openai.com'],
      getTitle() {
        return document.title.replace(/\s*[-|]\s*ChatGPT\s*$/i, '').trim();
      },
      getTurns() {
        return q('[data-message-author-role]').map((el) => ({
          role: el.getAttribute('data-message-author-role') === 'user' ? 'user' : 'assistant',
          root: el,
        }));
      },
    },
    {
      id: 'claude',
      label: 'Claude',
      hosts: ['claude.ai'],
      getTitle() {
        const el = document.querySelector('[data-testid="chat-menu-trigger"], header .truncate');
        return (el?.textContent || document.title.replace(/\s*[-|]\s*Claude\s*$/i, '')).trim();
      },
      getTurns() {
        return q('[data-testid="user-message"], .font-claude-response, .font-claude-message').map(
          (el) => {
            const isUser = el.matches('[data-testid="user-message"]');
            return {
              role: isUser ? 'user' : 'assistant',
              // 첨부 썸네일은 user-message 밖(턴 래퍼)에 있어 사용자 턴은 래퍼로 확장
              root: isUser ? el.closest('[data-test-render-count]') || el : el,
            };
          }
        );
      },
    },
    {
      id: 'gemini',
      label: 'Gemini',
      hosts: ['gemini.google.com'],
      getTitle() {
        const el = document.querySelector(
          '.conversation-title, [data-test-id="conversation-title"]'
        );
        return (el?.textContent || document.title.replace(/\s*[-|]\s*(Google )?Gemini\s*$/i, '')).trim();
      },
      getTurns() {
        return q('user-query, model-response').map((el) => {
          const isUser = el.tagName.toLowerCase() === 'user-query';
          return {
            role: isUser ? 'user' : 'assistant',
            // 사용자 턴은 user-query 전체: 첨부 이미지(.preview-image)가 .query-text 밖에 있다
            root: isUser ? el : el.querySelector('message-content') || el,
          };
        });
      },
    },
  ];

  S2M.pickAdapter = () => S2M.adapters.find((a) => a.hosts.includes(location.hostname));
})();
