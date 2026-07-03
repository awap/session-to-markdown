const DEFAULTS = {
  mode: 'session',
  noteFolder: 'Inbox',
  attachmentFolder: 'Attachments',
};

const btn = document.getElementById('save');
const statusEl = document.getElementById('status');
const obsidianFields = document.getElementById('obsidianFields');
const noteFolderEl = document.getElementById('noteFolder');
const attachmentFolderEl = document.getElementById('attachmentFolder');

function setStatus(text) {
  statusEl.textContent = text;
}

document.getElementById('version').textContent = `v${chrome.runtime.getManifest().version}`;

// ----- 설정 -----

async function loadSettings() {
  const s = await chrome.storage.sync.get(DEFAULTS);
  document.querySelector(`input[name="mode"][value="${s.mode}"]`).checked = true;
  noteFolderEl.value = s.noteFolder;
  attachmentFolderEl.value = s.attachmentFolder;
  reflectMode(s.mode);
}

function reflectMode(mode) {
  obsidianFields.classList.toggle('disabled', mode !== 'obsidian');
}

function saveSettings() {
  const mode = document.querySelector('input[name="mode"]:checked').value;
  reflectMode(mode);
  chrome.storage.sync.set({
    mode,
    noteFolder: noteFolderEl.value.trim(),
    attachmentFolder: attachmentFolderEl.value.trim(),
  });
}

document.querySelectorAll('input[name="mode"]').forEach((el) =>
  el.addEventListener('change', saveSettings)
);
noteFolderEl.addEventListener('input', saveSettings);
attachmentFolderEl.addEventListener('input', saveSettings);
loadSettings();

// ----- 저장 -----

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
    setStatus(`저장 완료 ✓\n${result.location}${imgNote}`);
  } catch (e) {
    setStatus(e.message);
  } finally {
    btn.disabled = false;
  }
});
