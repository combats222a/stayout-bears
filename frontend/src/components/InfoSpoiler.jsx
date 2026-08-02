import { useState } from 'react';

// Универсальный сворачиваемый блок-подсказка «Как это работает».
// Виден всем без исключения (гостям и авторизованным) — просто статичный
// текст, который по умолчанию свёрнут, чтобы не перекрывать основной
// контент страницы. Состояние открыт/закрыт запоминается в localStorage
// по ключу storageKey, если он передан.

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

function BlockBody({ body }) {
  if (Array.isArray(body)) {
    return (
      <ul className="info-spoiler-list">
        {body.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    );
  }
  return <p>{body}</p>;
}

export default function InfoSpoiler({ icon, title, blocks, defaultOpen = false, storageKey }) {
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
        {icon && <span className="info-spoiler-icon">{icon}</span>}
        <span>{title}</span>
        <span className="info-spoiler-chevron" aria-hidden="true">▾</span>
      </button>
      {/*
        Контент рендерится всегда (не размонтируется при закрытии) —
        так текст остаётся в DOM и для поисковых систем, и для скринридеров,
        а видимость/высота управляются только CSS через data-open на родителе.
      */}
      <div className="info-spoiler-body" hidden={!open}>
        {blocks.map((block, i) => (
          <div className="info-spoiler-block" key={i}>
            <h4>{block.heading}</h4>
            <BlockBody body={block.body} />
          </div>
        ))}
      </div>
    </div>
  );
}
