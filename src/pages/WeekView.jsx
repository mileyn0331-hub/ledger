import { useState, useCallback } from 'react'
import { GROUPS, getGroup, getSub, fmt } from '../lib/categories'
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

export default function WeekView({ entries, addEntry, updateEntry, deleteEntry, deleteByDayKeys, incomeMap, setIncome, readOnly }) {
  const [monday, setMonday] = useState(() => getMondayOfWeek(new Date()))
  const [modal, setModal]   = useState(null)   // { mode: 'add'|'edit', dayKey?, entry? }
  const [selectedId, setSelectedId] = useState(null)

  const days = getWeekDays(monday)
  const today = new Date(); today.setHours(0,0,0,0)
  const year  = monday.getFullYear()
  const month = monday.getMonth()
  const mk    = monthKey(year, month)
  const wNum  = getWeekNum(monday)

  const monthIncome = incomeMap[mk] || 0

  const weekDayKeys = days.map(dayKey)
  const weekEntries = entries.filter(e => weekDayKeys.includes(e.day_key))
  const weekTotal   = weekEntries.reduce((s, e) => s + e.amount, 0)

  // all entries for this month (for monthly balance)
  const monthEntries = entries.filter(e => e.day_key.startsWith(mk))
  const monthTotal   = monthEntries.reduce((s, e) => s + e.amount, 0)
  const balance      = monthIncome - monthTotal

  function prevWeek() { const d = new Date(monday); d.setDate(d.getDate() - 7); setMonday(getMondayOfWeek(d)) }
  function nextWeek() { const d = new Date(monday); d.setDate(d.getDate() + 7); setMonday(getMondayOfWeek(d)) }

  async function handleResetWeek() {
    if (!confirm(`${wNum}주차 데이터를 모두 삭제할까요?`)) return
    await deleteByDayKeys(weekDayKeys)
  }

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

function handleEntryKeyDown(e, entry) {
  if (e.key === 'Enter') {
    e.preventDefault()
    e.stopPropagation()
    if (!readOnly) setModal({ mode: 'edit', entry })
  }
  if ((e.key === 'Backspace' || e.key === 'Delete') && !readOnly) {
    e.preventDefault()
    deleteEntry(entry.id)
    setSelectedId(null)
  }
}

  function handleIncomeChange(e) {
    const val = parseInt(e.target.value.replace(/,/g, ''), 10) || 0
    setIncome(mk, val)
  }

  const fmt2 = d => `${d.getMonth()+1}/${d.getDate()}`

  return (
    <>
      {/* ── Week navigation ── */}
      <div className="week-nav">
        <button className="btn-nav" onClick={prevWeek}>‹ 이전</button>
        <span className="week-label">
          {year}년 {wNum}주차 ({fmt2(days[0])} – {fmt2(days[6])})
        </span>
        <button className="btn-nav" onClick={nextWeek}>다음 ›</button>
        {!readOnly && (
          <button className="btn-reset" onClick={handleResetWeek}>주간 초기화</button>
        )}
      </div>

      {/* ── Income bar ── */}
      <div className="income-bar">
        <span className="income-label">💰 {month+1}월 소득</span>
        <div className="income-inputs">
          <div className="income-input-wrap">
            <label>금액</label>
            <input
              className="income-input"
              type="text"
              defaultValue={monthIncome ? monthIncome.toLocaleString('ko-KR') : ''}
              onBlur={handleIncomeChange}
              placeholder="0"
              disabled={readOnly}
            />
          </div>
        </div>
        <div className="income-stats">
          <span className="istat">이번 주 지출 <strong>{fmt(weekTotal)}</strong></span>
          <span className="istat">월 누적 지출 <strong>{fmt(monthTotal)}</strong></span>
          <span className={`istat ${balance >= 0 ? 'pos' : 'neg'}`}>
            잔액 <strong>{fmt(balance)}</strong>
          </span>
        </div>
      </div>

      {/* ── 7-column grid ── */}
      <div className="week-grid">
        {days.map((d, i) => {
          const dk     = dayKey(d)
          const isToday = d.getTime() === today.getTime()
          const dow    = d.getDay()
          const dayEntries = sortEntries(entries.filter(e => e.day_key === dk))
          const dayTotal   = dayEntries.reduce((s, e) => s + e.amount, 0)

          return (
            <div className="day-col" key={dk}>
              <div className="day-header">
                <div className="day-name">{DAY_NAMES[dow]}</div>
                <div className={`day-date ${isToday ? 'today' : ''} ${dow === 0 ? 'sun' : ''} ${dow === 6 ? 'sat' : ''}`}>
                  {d.getDate()}
                </div>
              </div>

              <div className="day-body">
                {dayEntries.map(entry => {
                  const grp = getGroup(entry.cat_id)
                  const sub = getSub(entry.cat_id)
                  return (
                    <div
                      key={entry.id}
                      className={`entry ${selectedId === entry.id ? 'selected' : ''}`}
                      tabIndex={0}
                      onClick={() => setSelectedId(entry.id)}
                      onDoubleClick={() => !readOnly && setModal({ mode: 'edit', entry })}
                      onKeyDown={e => handleEntryKeyDown(e, entry)}
                    >
                      <div className="entry-cat-row">
                        <span className="cat-dot" style={{ background: grp.color }} />
                        <span className="entry-cat-name">{sub.emoji} {sub.name}</span>
                      </div>
                      <div className="entry-name">{entry.name}</div>
                      <div className="entry-amount" style={{ color: grp.color }}>{fmt(entry.amount)}</div>
                    </div>
                  )
                })}

                {!readOnly && (
                  <button
                    className="add-entry-btn"
                    onClick={() => setModal({ mode: 'add', dayKey: dk })}
                  >
                    + 추가
                  </button>
                )}
              </div>

              <div className="day-footer">
                <span className="day-total">{dayTotal > 0 ? fmt(dayTotal) : ''}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Week summary ── */}
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

      {/* ── Modal ── */}
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
