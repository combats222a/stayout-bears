import { useState, useEffect, useRef } from 'react';

// Оставляем только цифры, максимум segments*2 штук
function onlyDigits(str, maxLen) {
  return (str || '').replace(/\D/g, '').slice(0, maxLen);
}

// "233523" (segments=3) -> "23:35:23"
// "0913"   (segments=2) -> "09:13"
function formatDigits(digits, segments) {
  const parts = [];
  for (let i = 0; i < segments; i++) {
    parts.push(digits.slice(i * 2, i * 2 + 2));
  }
  return parts.filter((p, i) => p !== '' || i === 0 || digits.length > i * 2).join(':') || '';
}

// Сколько цифр находится в formatted-строке до символа с индексом pos
// (двоеточия не считаются) — нужно, чтобы понять, какую именно цифру
// удалять при Backspace/Delete, не завися от того, стоит курсор до или
// после двоеточия.
function countDigitsBefore(formatted, pos) {
  let count = 0;
  for (let i = 0; i < pos && i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) count++;
  }
  return count;
}

// Обратное преобразование: позиция в отформатированной строке (с учётом
// двоеточий) для курсора, стоящего после digitIndex-й цифры новой строки
// digits длиной digitsLen.
function digitIndexToFormattedPos(digitsLen, digitIndex, segments) {
  let extra = 0;
  for (let s = 1; s < segments; s++) {
    const boundary = s * 2;
    if (digitsLen > boundary && digitIndex >= boundary) extra++;
  }
  return digitIndex + extra;
}

/**
 * Маскированный ввод времени: игрок вводит только цифры,
 * двоеточия расставляются автоматически.
 *
 * segments = 3 → ЧЧ:ММ:СС (медведи)
 * segments = 2 → ЧЧ:ММ    (сияние)
 *
 * value      — начальные цифры (например "233523" или "" для пустого поля)
 * onChange   — (digits, formatted) => void, вызывается при каждом изменении
 * onEnter    — () => void
 */
export default function MaskedTimeInput({
  segments = 3,
  value = '',
  onChange,
  onEnter,
  placeholder,
  autoFocus,
  className = 'modal-input',
}) {
  const maxLen = segments * 2;
  const [digits, setDigits] = useState(() => onlyDigits(value, maxLen));
  const inputRef = useRef(null);

  useEffect(() => {
    setDigits(onlyDigits(value, maxLen));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputRef.current?.focus();
        const len = inputRef.current?.value.length ?? 0;
        inputRef.current?.setSelectionRange(len, len);
      }, 50);
    }
  }, [autoFocus]);

  function handleChange(e) {
    const raw = onlyDigits(e.target.value, maxLen);
    setDigits(raw);
    onChange?.(raw, formatDigits(raw, segments));
  }

  // Ставим курсор в нужное место уже после того, как React перерисует
  // input с новым (отформатированным) значением.
  function placeCaret(newDigits, newDigitIndex) {
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      const pos = digitIndexToFormattedPos(newDigits.length, newDigitIndex, segments);
      el.setSelectionRange(pos, pos);
    });
  }

  function commit(newDigits, newDigitIndex) {
    setDigits(newDigits);
    onChange?.(newDigits, formatDigits(newDigits, segments));
    placeCaret(newDigits, newDigitIndex);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') { onEnter?.(); return; }

    if (e.key !== 'Backspace' && e.key !== 'Delete') return;

    // Перехватываем удаление сами: иначе браузер может стереть
    // символ двоеточия (не цифру), из-за чего строка цифр не меняется
    // и кажется, что Backspace "не работает" или стирает не то.
    e.preventDefault();
    const el = e.target;
    const selStart = el.selectionStart ?? digits.length;
    const selEnd = el.selectionEnd ?? selStart;
    const formatted = formatDigits(digits, segments);

    if (selStart !== selEnd) {
      // Есть выделение — удаляем все цифры внутри него.
      const startIdx = countDigitsBefore(formatted, selStart);
      const endIdx = countDigitsBefore(formatted, selEnd);
      const newDigits = digits.slice(0, startIdx) + digits.slice(endIdx);
      commit(newDigits, startIdx);
      return;
    }

    if (e.key === 'Backspace') {
      const idx = countDigitsBefore(formatted, selStart);
      if (idx === 0) return; // удалять нечего
      const newDigits = digits.slice(0, idx - 1) + digits.slice(idx);
      commit(newDigits, idx - 1);
    } else {
      // Delete
      const idx = countDigitsBefore(formatted, selStart);
      if (idx >= digits.length) return; // удалять нечего
      const newDigits = digits.slice(0, idx) + digits.slice(idx + 1);
      commit(newDigits, idx);
    }
  }

  const placeholderMask = Array(segments).fill('--').join(':');

  return (
    <input
      ref={inputRef}
      className={className}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete="off"
      value={formatDigits(digits, segments)}
      placeholder={placeholder || placeholderMask}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={e => e.target.select()}
    />
  );
}

// Собрать HH:MM(:SS) строку из введённых цифр (дополняя недостающее нулями)
export function digitsToTimeStr(digits, segments) {
  const padded = digits.padEnd(segments * 2, '0');
  const parts = [];
  for (let i = 0; i < segments; i++) parts.push(padded.slice(i * 2, i * 2 + 2));
  return parts.join(':');
}

export function isDigitsComplete(digits, segments) {
  return digits.length === segments * 2;
}
