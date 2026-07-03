const btn = document.getElementById('save');
const statusEl = document.getElementById('status');

function setStatus(text) {
  statusEl.textContent = text;
}

btn.addEventListener('click', async () => {
  btn.disabled = true;
  setStatus('대화 추출 중…');
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const extracted = await chrome.tabs.sendMessage(tab.id, { type: 'S2M_EXTRACT' }).catch(() => {
      throw new Error(
        '지원 페이지가 아니거나 새로고침이 필요합니다.\n지원: chatgpt.com · claude.ai · gemini.google.com'
      );
    });
    if (extracted.error) throw new Error(extracted.error);

    setStatus(`다운로드 중… (이미지 ${extracted.images.length}개)`);
    const result = await chrome.runtime.sendMessage({ type: 'S2M_DOWNLOAD', payload: extracted });
    if (result.error) throw new Error(result.error);

    const imgNote =
      result.imageCount > 0
        ? `\n이미지 ${result.imageCount - result.failed}/${result.imageCount}개 저장`
        : '';
    setStatus(`저장 완료 ✓\n다운로드/${result.folder}/${imgNote}`);
  } catch (e) {
    setStatus(e.message);
  } finally {
    btn.disabled = false;
  }
});
