import { useState, useEffect, useRef } from 'react'
import { GROUPS, ALL_SUBS } from '../lib/categories'

// flat list for arrow-key navigation
const SUB_LIST = GROUPS.flatMap(g => g.subs.map(s => ({ ...s, groupId: g.id, groupName: g.name, groupColor: g.color })))

export default function EntryModal({ entry, onSave, onDelete, onClose }) {
  const isEdit = !!entry

  const [name,   setName]   = useState(entry?.name   ?? '')
  const [catIdx, setCatIdx] = useState(() => {
    const idx = SUB_LIST.findIndex(s => s.id === (entry?.cat_id ?? ALL_SUBS[0].id))
    return idx >= 0 ? idx : 0
  })
  const [amount, setAmount] = useState(entry?.amount ?? '')
  const [field,  setField]  = useState(0)   // 0=name, 1=cat, 2=amount

  const nameRef   = useRef(null)
  const catRef    = useRef(null)
  const amountRef = useRef(null)
  const refs      = [nameRef, catRef, amountRef]

  const currentSub = SUB_LIST[catIdx]

  // focus the active field whenever it changes
  useEffect(() => {
    refs[field]?.current?.focus()
  }, [field])

  // initial focus on name
  useEffect(() => {
    nameRef.current?.focus()
  }, [])

  // ── keyboard handler ────────────────────────────────────────────────────────
  function onKeyDown(e) {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); return }

    if (e.key === 'Tab') {
      e.preventDefault()
      setField(f => (f + (e.shiftKey ? -1 + 3 : 1)) % 3)
      return
    }

    // category field: arrow keys to navigate
    if (field === 1) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCatIdx(i => Math.min(SUB_LIST.length - 1, i + 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCatIdx(i => Math.max(0, i - 1))
        return
      }
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (field < 2) {
        setField(f => f + 1)
      } else {
        handleSubmit()
      }
    }
  }

  function handleSubmit() {
    const amt = parseInt(String(amount).replace(/,/g, ''), 10)
    if (!name.trim() || !amt) return
    onSave({ name: name.trim(), cat_id: currentSub.id, amount: amt })
  }

  const fieldStyle = (idx) => ({
    outline: field === idx ? '2px solid var(--olive)' : 'none',
    outlineOffset: 2,
  })

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" onKeyDown={onKeyDown}>
        <h3>{isEdit ? '지출 수정' : '지출 추가'}</h3>

        {/* hint */}
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12, display: 'flex', gap: 10 }}>
          <span><kbd style={kbdStyle}>Tab</kbd> 다음 칸</span>
          <span><kbd style={kbdStyle}>↑↓</kbd> 카테고리 선택</span>
          <span><kbd style={kbdStyle}>Enter</kbd> 확인/저장</span>
          <span><kbd style={kbdStyle}>Esc</kbd> 닫기</span>
        </div>

        {/* name */}
        <div className="modal-field" onClick={() => setField(0)}>
          <label>내용</label>
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="지출 항목 이름"
            style={fieldStyle(0)}
            onFocus={() => setField(0)}
          />
        </div>

        {/* category — custom arrow-key picker */}
        <div className="modal-field" onClick={() => setField(1)}>
          <label>카테고리 <span style={{ color: 'var(--text3)', fontWeight: 400 }}>({catIdx + 1}/{SUB_LIST.length})</span></label>
          {/* hidden input to receive focus events */}
          <input
            ref={catRef}
            type="text"
            readOnly
            value=""
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0, pointerEvents: 'none' }}
            onFocus={() => setField(1)}
          />
          {/* visual picker */}
          <div style={{
            border: `1px solid ${field === 1 ? 'var(--olive)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            background: 'var(--surface2)',
            padding: '6px 10px',
            cursor: 'pointer',
            outline: field === 1 ? '2px solid var(--olive)' : 'none',
            outlineOffset: 2,
          }} onClick={() => setField(1)}>
            {/* group label */}
            <div style={{ fontSize: 10, color: currentSub.groupColor, fontWeight: 600, marginBottom: 2 }}>
              [{currentSub.groupName}]
            </div>
            {/* current sub */}
            <div style={{ fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{currentSub.emoji}</span>
              <span style={{ fontWeight: 500 }}>{currentSub.name}</span>
            </div>
            {/* mini list: show surrounding items */}
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {SUB_LIST.slice(Math.max(0, catIdx - 2), Math.min(SUB_LIST.length, catIdx + 3)).map((s, i) => {
                const absIdx = Math.max(0, catIdx - 2) + i
                const isSelected = absIdx === catIdx
                return (
                  <div
                    key={s.id}
                    onClick={e => { e.stopPropagation(); setCatIdx(absIdx); setField(1) }}
                    style={{
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: isSelected ? 'var(--olive-light)' : 'transparent',
                      color: isSelected ? 'var(--olive)' : 'var(--text3)',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                    }}
                  >
                    {s.emoji} {s.name}
                    {isSelected && <span style={{ marginLeft: 4, fontSize: 9 }}>◀</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* amount */}
        <div className="modal-field" onClick={() => setField(2)}>
          <label>금액 (₩)</label>
          <input
            ref={amountRef}
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            style={fieldStyle(2)}
            onFocus={() => setField(2)}
          />
        </div>

        <div className="modal-actions">
          {isEdit && <button type="button" className="btn-danger" onClick={onDelete}>삭제</button>}
          <button type="button" className="btn-secondary" onClick={onClose}>취소</button>
          <button type="button" className="btn-primary" onClick={handleSubmit}>
            {isEdit ? '저장' : '추가'}
          </button>
        </div>
      </div>
    </div>
  )
}

const kbdStyle = {
  display: 'inline-block',
  padding: '1px 5px',
  border: '1px solid var(--border2)',
  borderRadius: 4,
  background: 'var(--surface)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--text2)',
}
