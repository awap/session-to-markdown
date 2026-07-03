const t = (key, subs) => chrome.i18n.getMessage(key, subs);

// 정적 텍스트 국제화
document.querySelectorAll('[data-i18n]').forEach((el) => {
  el.textContent = t(el.dataset.i18n);
});
document.querySelectorAll('[data-i18n-ph]').forEach((el) => {
  el.placeholder = t(el.dataset.i18nPh);
});
document.getElementById('version').textContent = `v${chrome.runtime.getManifest().version}`;

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
  setStatus(t('statusExtracting'));
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const extracted = await chrome.tabs.sendMessage(tab.id, { type: 'S2M_EXTRACT' }).catch(() => {
      throw new Error(t('errUnsupported'));
    });
    if (extracted.error) throw new Error(extracted.error);

    setStatus(t('statusDownloading', [String(extracted.images.length)]));
    const result = await chrome.runtime.sendMessage({ type: 'S2M_DOWNLOAD', payload: extracted });
    if (result.error) throw new Error(result.error);

    const imgNote =
      result.imageCount > 0
        ? '\n' + t('statusImages', [String(result.imageCount - result.failed), String(result.imageCount)])
        : '';
    setStatus(`${t('statusDone')}\n${result.location}${imgNote}`);
  } catch (e) {
    setStatus(e.message);
  } finally {
    btn.disabled = false;
  }
});
