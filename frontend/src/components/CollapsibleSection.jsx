import { useState } from 'react';

// Свернуть/развернуть произвольный блок контента. Использует те же CSS-классы
// и анимацию, что и InfoSpoiler, но принимает children вместо структуры
// { heading, body } — подходит для любого содержимого секции.
// Состояние открыт/закрыт запоминается в localStorage по storageKey.

function readStoredOpen(storageKey, defaultOpen) {
  if (!storageKey) return defaultOpen;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === null) return defaultOpen;
    return raw === '1';
  } catch {
    return defaultOpen;
  }
}

function writeStoredOpen(storageKey, value) {
  if (!storageKey) return;
  try {
    window.localStorage.setItem(storageKey, value ? '1' : '0');
  } catch {
    // localStorage может быть недоступен (приватный режим и т.п.) — игнорируем
  }
}

export default function CollapsibleSection({ title, defaultOpen = false, storageKey, children }) {
  const [open, setOpen] = useState(() => readStoredOpen(storageKey, defaultOpen));

  const toggle = () => {
    setOpen(prev => {
      const next = !prev;
      writeStoredOpen(storageKey, next);
      return next;
    });
  };

  return (
    <div className="info-spoiler" data-open={open}>
      <button
        type="button"
        className="info-spoiler-header"
        aria-expanded={open}
        onClick={toggle}
      >
        <span>{title}</span>
        <span className="info-spoiler-chevron" aria-hidden="true">▾</span>
      </button>
      {/* Контент рендерится всегда (не размонтируется) — важно для SEO/скринридеров */}
      <div className="info-spoiler-body" hidden={!open}>
        {children}
      </div>
    </div>
  );
}
