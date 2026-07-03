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
        return q('[data-testid="user-message"], .font-claude-message, [data-testid="assistant-message"]').map(
          (el) => ({
            role: el.matches('[data-testid="user-message"]') ? 'user' : 'assistant',
            root: el,
          })
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
        return (el?.textContent || document.title.replace(/\s*[-|]\s*Gemini\s*$/i, '')).trim();
      },
      getTurns() {
        return q('user-query, model-response').map((el) => {
          const isUser = el.tagName.toLowerCase() === 'user-query';
          return {
            role: isUser ? 'user' : 'assistant',
            root:
              (isUser
                ? el.querySelector('.query-text, .query-content')
                : el.querySelector('message-content')) || el,
          };
        });
      },
    },
  ];

  S2M.pickAdapter = () => S2M.adapters.find((a) => a.hosts.includes(location.hostname));
})();
