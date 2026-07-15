import { useState, useEffect } from 'react';

const QUERY = '(max-width: 640px)';

// Раньше мобильная и десктопная версии строки таблицы рендерились ОБЕ
// одновременно, а переключались через CSS display:none/table-row.
// На слабых телефонах (Redmi 8 Pro и т.п.) это означало вдвое больше DOM-узлов
// и вдвое больше работы на каждый секундный тик таймера в каждой строке —
// движок не успевал перерисовать всё за кадр, и получались "внахлёст" куски
// старого и нового кадра (дублирующиеся кнопки/строки на скриншотах).
//
// Этот хук определяет мобильный режим через matchMedia, и компонент строки
// рендерит только ОДИН вариант <tr> — так в DOM всегда вдвое меньше узлов.
export default function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(QUERY).matches : false
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handler = e => setIsMobile(e.matches);
    if (mql.addEventListener) mql.addEventListener('change', handler);
    else mql.addListener(handler); // старые WebView на слабых телефонах
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', handler);
      else mql.removeListener(handler);
    };
  }, []);

  return isMobile;
}
