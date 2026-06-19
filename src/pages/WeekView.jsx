import { useState, useEffect, useRef, useCallback } from 'react'
import { getGroup, getSub, fmt } from '../lib/categories'
import { getMondayOfWeek, getWeekDays, dayKey, monthKey, getWeekNum, DAY_NAMES } from '../lib/dates'
import EntryModal from '../components/EntryModal'

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    const ga = getGroup(a.cat_id).id, gb = getGroup(b.cat_id).id
    if (ga !== gb) return ga.localeCompare(gb)
    const sa = getSub(a.cat_id).id, sb = getSub(b.cat_id).id
    if (sa !== sb) return sa.localeCompare(sb)
    return (a.ts || 0) - (b.ts || 0)
  })
}

const FOCUS_DAY   = 'day'
const FOCUS_ENTRY = 'entry'

export default function WeekView({
  entries, addEntry, updateEntry, deleteEntry, deleteByDayKeys,
  incomeMap, setIncome, readOnly,
  onViewChange, onToggleTheme, onToggleReadOnly
}) {
  const [monday, setMonday] = useState(() => getMondayOfWeek(new Date()))
  const [modal,  setModal]  = useState(null)
  const [focus,  setFocus]  = useState({ type: FOCUS_DAY, dayIdx: 0, entryIdx: 0 })
  const gridRef = useRef(null)

  const days        = getWeekDays(monday)
  const today       = new Date(); today.setHours(0,0,0,0)
  const year        = monday.getFullYear()
  const month       = monday.getMonth()
  const mk          = monthKey(year, month)
  const wNum        = getWeekNum(monday)
  const monthIncome = incomeMap[mk] || 0
  const weekDayKeys = days.map(dayKey)
  const weekTotal   = entries.filter(e => weekDayKeys.includes(e.day_key)).reduce((s,e) => s+e.amount, 0)
  const monthTotal  = entries.filter(e => e.day_key.startsWith(mk)).reduce((s,e) => s+e.amount, 0)
  const balance     = monthIncome - monthTotal

  const dayEntriesMap = days.reduce((acc, d) => {
    const dk = dayKey(d)
    acc[dk] = sortEntries(entries.filter(e => e.day_key === dk))
    return acc
  }, {})

  const clampFocus = useCallback((f) => {
    const di = Math.max(0, Math.min(6, f.dayIdx))
    const dk = dayKey(days[di])
    const dayEnts = dayEntriesMap[dk] || []
    if (f.type === FOCUS_ENTRY && dayEnts.length > 0) {
      const ei = Math.max(0, Math.min(dayEnts.length - 1, f.entryIdx))
      return { type: FOCUS_ENTRY, dayIdx: di, entryIdx: ei }
    }
    return { type: FOCUS_DAY, dayIdx: di, entryIdx: 0 }
  }, [days, dayEntriesMap])

  // 초기 포커스 — 그리드가 마운트되면 첫 번째 날짜 칸 포커스
  useEffect(() => {
    const el = gridRef.current?.querySelector('[data-focusday="0"]')
    el?.focus()
  }, [])

  // focus state 변화 시 DOM 포커스 이동
  useEffect(() => {
    if (modal) return
    const sel = focus.type === FOCUS_DAY
      ? `[data-focusday="${focus.dayIdx}"]`
      : `[data-focusentry="${focus.dayIdx}-${focus.entryIdx}"]`
    const el = gridRef.current?.querySelector(sel)
    el?.focus({ preventScroll: false })
  }, [focus, modal])

  // 전역 키보드 단축키
  useEffect(() => {
    function onKey(e) {
      if (modal) return
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      switch (e.key) {
        case 'd': case 'D':
          e.preventDefault(); onToggleTheme(); break

        case 'r': case 'R':
          e.preventDefault(); onToggleReadOnly(); break

        case '1': e.preventDefault(); onViewChange('week');  break
        case '2': e.preventDefault(); onViewChange('month'); break
        case '3': e.preventDefault(); onViewChange('year');  break

        case 'ArrowLeft': {
          e.preventDefault()
          if (focus.dayIdx === 0) {
            const d = new Date(monday); d.setDate(d.getDate() - 7)
            setMonday(getMondayOfWeek(d))
            setFocus({ type: FOCUS_DAY, dayIdx: 6, entryIdx: 0 })
          } else {
            setFocus(f => clampFocus({ ...f, type: FOCUS_DAY, dayIdx: f.dayIdx - 1 }))
          }
          break
        }

        case 'ArrowRight': {
          e.preventDefault()
          if (focus.dayIdx === 6) {
            const d = new Date(monday); d.setDate(d.getDate() + 7)
            setMonday(getMondayOfWeek(d))
            setFocus({ type: FOCUS_DAY, dayIdx: 0, entryIdx: 0 })
          } else {
            setFocus(f => clampFocus({ ...f, type: FOCUS_DAY, dayIdx: f.dayIdx + 1 }))
          }
          break
        }

        case 'ArrowDown': {
          e.preventDefault()
          const dk = dayKey(days[focus.dayIdx])
          const dayEnts = dayEntriesMap[dk] || []
          if (focus.type === FOCUS_DAY && dayEnts.length > 0) {
            setFocus(f => ({ type: FOCUS_ENTRY, dayIdx: f.dayIdx, entryIdx: 0 }))
          } else if (focus.type === FOCUS_ENTRY && focus.entryIdx < dayEnts.length - 1) {
            setFocus(f => ({ ...f, entryIdx: f.entryIdx + 1 }))
          }
          break
        }

        case 'ArrowUp': {
          e.preventDefault()
          if (focus.type === FOCUS_ENTRY && focus.entryIdx > 0) {
            setFocus(f => ({ ...f, entryIdx: f.entryIdx - 1 }))
          } else if (focus.type === FOCUS_ENTRY && focus.entryIdx === 0) {
            setFocus(f => ({ type: FOCUS_DAY, dayIdx: f.dayIdx, entryIdx: 0 }))
          }
          break
        }

        case 'Enter': case 'n': case 'N': {
          e.preventDefault()
          if (readOnly) break
          if (focus.type === FOCUS_DAY) {
            setModal({ mode: 'add', dayKey: dayKey(days[focus.dayIdx]) })
          } else {
            const dk = dayKey(days[focus.dayIdx])
            const entry = (dayEntriesMap[dk] || [])[focus.entryIdx]
            if (entry) setModal({ mode: 'edit', entry })
          }
          break
        }

        case 'Backspace': case 'Delete': {
          e.preventDefault()
          if (readOnly || focus.type !== FOCUS_ENTRY) break
          const dk = dayKey(days[focus.dayIdx])
          const entry = (dayEntriesMap[dk] || [])[focus.entryIdx]
          if (entry) {
            deleteEntry(entry.id)
            setFocus(f => clampFocus({ ...f, entryIdx: Math.max(0, f.entryIdx - 1) }))
          }
          break
        }

        case 'Escape':
          setFocus(f => ({ type: FOCUS_DAY, dayIdx: f.dayIdx, entryIdx: 0 }))
          break

        default: break
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [modal, focus, monday, days, dayEntriesMap, readOnly, clampFocus, onToggleTheme, onToggleReadOnly, onViewChange, deleteEntry])

  async function handleSave({ name, cat_id, amount }) {
    if (modal.mode === 'add') {
      await addEntry({ day_key: modal.dayKey, name, cat_id, amount })
    } else {
      await updateEntry(modal.entry.id, { name, cat_id, amount })
    }
    setModal(null)
  }

  async function handleDelete() {
    if (!confirm('삭제할까요?')) return
    await deleteEntry(modal.entry.id)
    setModal(null)
  }

  const fmt2 = d => `${d.getMonth()+1}/${d.getDate()}`

  return (
    <>
      {/* 단축키 힌트 */}
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {[
          ['←→', '날짜 이동'],
          ['↑↓', '항목 선택'],
          ['N/Enter', '추가·수정'],
          ['Del', '삭제'],
          ['D', '다크모드'],
          ['R', '읽기모드'],
          ['1·2·3', '탭 전환'],
        ].map(([k, v]) => (
          <span key={k}><kbd style={kbdStyle}>{k}</kbd> {v}</span>
        ))}
      </div>

      {/* 주간 네비게이션 */}
      <div className="week-nav">
        <button className="btn-nav" onClick={() => {
          const d = new Date(monday); d.setDate(d.getDate() - 7)
          setMonday(getMondayOfWeek(d))
        }}>‹ 이전</button>
        <span className="week-label">
          {year}년 {wNum}주차 ({fmt2(days[0])} – {fmt2(days[6])})
        </span>
        <button className="btn-nav" onClick={() => {
          const d = new Date(monday); d.setDate(d.getDate() + 7)
          setMonday(getMondayOfWeek(d))
        }}>다음 ›</button>
        {!readOnly && (
          <button className="btn-reset" onClick={async () => {
            if (!confirm(`${wNum}주차 데이터를 모두 삭제할까요?`)) return
            await deleteByDayKeys(weekDayKeys)
          }}>주간 초기화</button>
        )}
      </div>

      {/* 소득 바 */}
      <div className="income-bar">
        <span className="income-label">💰 {month+1}월 소득</span>
        <div className="income-inputs">
          <div className="income-input-wrap">
            <label>금액</label>
            <input
              className="income-input"
              type="text"
              defaultValue={monthIncome ? monthIncome.toLocaleString('ko-KR') : ''}
              onBlur={e => setIncome(mk, parseInt(e.target.value.replace(/,/g,''),10)||0)}
              placeholder="0"
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="income-stats">
          <span className="istat">이번 주 지출 <strong>{fmt(weekTotal)}</strong></span>
          <span className="istat">월 누적 지출 <strong>{fmt(monthTotal)}</strong></span>
          <span className={`istat ${balance >= 0 ? 'pos' : 'neg'}`}>잔액 <strong>{fmt(balance)}</strong></span>
        </div>
      </div>

      {/* 7열 그리드 */}
      <div className="week-grid" ref={gridRef}>
        {days.map((d, dayIdx) => {
          const dk       = dayKey(d)
          const isToday  = d.getTime() === today.getTime()
          const dow      = d.getDay()
          const dayEnts  = dayEntriesMap[dk] || []
          const dayTotal = dayEnts.reduce((s, e) => s + e.amount, 0)
          const isDayCol = focus.dayIdx === dayIdx

          return (
            <div
              className="day-col"
              key={dk}
              style={{
                position: 'relative',
                background: isToday ? 'var(--olive-light)' : undefined,
              }}
            >
              <div className="day-header" style={{ background: isToday ? 'var(--olive-dim)' : undefined }}>
                <div className="day-name">{DAY_NAMES[dow]}</div>
                <div className={[
                  'day-date',
                  isToday ? 'today' : '',
                  dow === 0 ? 'sun' : '',
                  dow === 6 ? 'sat' : '',
                ].join(' ')}>
                  {d.getDate()}
                </div>
              </div>

              <div className="day-body">
                {/* 날짜 칸 포커스 타겟 */}
                <div
                  data-focusday={dayIdx}
                  tabIndex={0}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', outline: 'none', zIndex: 0 }}
                  onFocus={() => setFocus({ type: FOCUS_DAY, dayIdx, entryIdx: 0 })}
                />

                {/* 날짜 칸 포커스 링 */}
                {isDayCol && focus.type === FOCUS_DAY && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    border: '2px solid var(--olive)',
                    borderRadius: 'var(--radius)',
                    pointerEvents: 'none',
                    zIndex: 2,
                  }} />
                )}

                {/* 항목 목록 */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  {dayEnts.map((entry, entryIdx) => {
                    const grp = getGroup(entry.cat_id)
                    const sub = getSub(entry.cat_id)
                    const isFocused = isDayCol && focus.type === FOCUS_ENTRY && focus.entryIdx === entryIdx
                    // 바로 이전 항목과 같은 카테고리면 카테고리 행 숨김
                    const prevEntry = entryIdx > 0 ? dayEnts[entryIdx - 1] : null
                    const showCat = !prevEntry || prevEntry.cat_id !== entry.cat_id
                    return (
                      <div
                        key={entry.id}
                        data-focusentry={`${dayIdx}-${entryIdx}`}
                        className={`entry ${isFocused ? 'selected' : ''} ${!showCat ? 'grouped' : ''}`}
                        tabIndex={0}
                        onClick={() => setFocus({ type: FOCUS_ENTRY, dayIdx, entryIdx })}
                        onFocus={() => setFocus({ type: FOCUS_ENTRY, dayIdx, entryIdx })}
                        onDoubleClick={() => !readOnly && setModal({ mode: 'edit', entry })}
                      >
                        {showCat && (
                          <div className="entry-cat-row">
                            <span className="cat-dot" style={{ background: grp.color }} />
                            <span className="entry-cat-name">{sub.emoji} {sub.name}</span>
                          </div>
                        )}
                        <div style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          justifyContent: 'space-between',
                          gap: 6,
                        }}>
                          <span className="entry-name" style={{ flex: 1, minWidth: 0 }}>{entry.name}</span>
                          <span className="entry-amount" style={{ color: grp.color, flexShrink: 0 }}>{fmt(entry.amount)}</span>
                        </div>
                      </div>
                    )
                  })}

                  {!readOnly && (
                    <button
                      className="add-entry-btn"
                      onClick={() => setModal({ mode: 'add', dayKey: dk })}
                    >+ 추가</button>
                  )}
                </div>
              </div>

              <div className="day-footer">
                <span className="day-total">{dayTotal > 0 ? fmt(dayTotal) : ''}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 주간 합계 */}
      <div className="week-summary">
        <div className="ws-item">
          <div className="ws-label">이번 주 지출</div>
          <div className="ws-val expense">{fmt(weekTotal)}</div>
        </div>
        <div className="ws-item">
          <div className="ws-label">{month+1}월 소득</div>
          <div className="ws-val income-v">{fmt(monthIncome)}</div>
        </div>
        <div className="ws-item">
          <div className="ws-label">월 누적 지출</div>
          <div className="ws-val">{fmt(monthTotal)}</div>
        </div>
        <div className="ws-item">
          <div className="ws-label">잔액</div>
          <div className={`ws-val ${balance >= 0 ? 'pos' : 'neg'}`}>{fmt(balance)}</div>
        </div>
      </div>

      {modal && (
        <EntryModal
          entry={modal.mode === 'edit' ? modal.entry : null}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}

const kbdStyle = {
  display: 'inline-block',
  padding: '1px 5px',
  border: '1px solid var(--border2)',
  borderRadius: 4,
  background: 'var(--surface2)',
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  color: 'var(--text2)',
}
