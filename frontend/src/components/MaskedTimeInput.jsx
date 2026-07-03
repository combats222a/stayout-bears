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

  function handleKeyDown(e) {
    if (e.key === 'Enter') onEnter?.();
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
