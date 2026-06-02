import { useState, useEffect } from 'react'
import { GROUPS, ALL_SUBS } from '../lib/categories'

export default function EntryModal({ entry, onSave, onDelete, onClose }) {
  const isEdit = !!entry

  const [name,   setName]   = useState(entry?.name   ?? '')
  const [catId,  setCatId]  = useState(entry?.cat_id ?? ALL_SUBS[0].id)
  const [amount, setAmount] = useState(entry?.amount ?? '')

  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  function handleSubmit(e) {
    e.preventDefault()
    const amt = parseInt(String(amount).replace(/,/g, ''), 10)
    if (!name.trim() || !amt) return
    onSave({ name: name.trim(), cat_id: catId, amount: amt })
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>{isEdit ? '지출 수정' : '지출 추가'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="modal-field">
            <label>내용</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="지출 항목 이름"
              autoFocus
            />
          </div>
          <div className="modal-field">
            <label>카테고리</label>
            <select value={catId} onChange={e => setCatId(e.target.value)}>
              {GROUPS.map(g => (
                <optgroup key={g.id} label={`[${g.name}]`}>
                  {g.subs.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.emoji} {s.mid ? `${s.mid} › ` : ''}{s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div className="modal-field">
            <label>금액 (₩)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              min="0"
            />
          </div>
          <div className="modal-actions">
            {isEdit && (
              <button type="button" className="btn-danger" onClick={onDelete}>삭제</button>
            )}
            <button type="button" className="btn-secondary" onClick={onClose}>취소</button>
            <button type="submit" className="btn-primary">
              {isEdit ? '저장' : '추가'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
