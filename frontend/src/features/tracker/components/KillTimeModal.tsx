import { useState } from 'react';
import MaskedTimeInput, { digitsToTimeStr } from '../../../components/MaskedTimeInput';
import { useI18n } from '../../../i18n';

interface KillTimeModalProps {
  itemName: string;
  killedNounGenitive: string;
  parseLocalTimeInput: (timeStr: string) => string | null;
  onCommit: (iso: string) => void;
  onClose: () => void;
}

// itemName — имя существа (Ржавый, Северный...), killedNounGenitive — "медведя"/"драуга"
// (родительный падеж для фразы "убили ___"), parseLocalTimeInput — функция парсинга
// конкретного конфига (bears или draugs — код одинаковый, но берём из своего модуля).
export default function KillTimeModal({ itemName, killedNounGenitive, parseLocalTimeInput, onCommit, onClose }: KillTimeModalProps) {
  const { t } = useI18n();
  const [digits, setDigits] = useState(() => {
    // Pre-fill with current local time (только цифры)
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${hh}${mm}${ss}`;
  });
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!digits) { setError(t('tracker.modalErrorEmpty')); return; }
    const timeStr = digitsToTimeStr(digits, 3);
    const iso = parseLocalTimeInput(timeStr);
    if (!iso) { setError(t('tracker.modalErrorInvalid')); return; }
    onCommit(iso);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{t('tracker.modalTitlePrefix')} <span className="modal-bear-name">{itemName}</span></div>
        <div className="modal-body">
          <label className="modal-label">{t('tracker.modalLabelPrefix')} {killedNounGenitive} {t('tracker.modalLabelSuffix')}</label>
          <MaskedTimeInput
            segments={3}
            value={digits}
            onChange={d => { setDigits(d); setError(''); }}
            onEnter={handleSubmit}
            placeholder="09:35:00"
            autoFocus
          />
          {error && <div className="modal-error">{error}</div>}
          <div className="modal-hint">{t('tracker.modalHint')}</div>
        </div>
        <div className="modal-footer">
          <button className="modal-btn-cancel" onClick={onClose}>{t('tracker.modalCancel')}</button>
          <button className="modal-btn-ok btn-shiny" onClick={handleSubmit}>{t('tracker.modalSave')}</button>
        </div>
      </div>
    </div>
  );
}
