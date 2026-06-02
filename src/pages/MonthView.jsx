import { useState, useMemo } from 'react'
import { GROUPS, getGroup, getSub, fmt } from '../lib/categories'
import { monthKey, getMonthWeeks, getDaysInMonth, dayKey } from '../lib/dates'

function PieChart({ data, total }) {
  const cx = 90, cy = 90, r = 72
  let cum = -Math.PI / 2
  const slices = data.map(d => {
    const angle = total > 0 ? (d.amount / total) * Math.PI * 2 : 0
    const x1 = cx + r * Math.cos(cum), y1 = cy + r * Math.sin(cum)
    const x2 = cx + r * Math.cos(cum + angle), y2 = cy + r * Math.sin(cum + angle)
    const large = angle > Math.PI ? 1 : 0
    const path = `M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`
    cum += angle
    return { ...d, path }
  })

  return (
    <svg viewBox="0 0 180 180" width="180" height="180">
      {total === 0
        ? <circle cx={cx} cy={cy} r={r} fill="var(--surface2)" />
        : slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity="0.88" />)
      }
      <circle cx={cx} cy={cy} r={38} fill="var(--surface)" />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--text2)" fontSize="11" fontFamily="DM Mono,monospace">
        {total > 0 ? `${((total / (s => s)) * 100).toFixed(0)}` : '0'}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--text3)" fontSize="9">지출 내역</text>
    </svg>
  )
}

export default function MonthView({ entries, incomeMap }) {
  const [baseDate, setBaseDate] = useState(() => new Date())
  const year  = baseDate.getFullYear()
  const month = baseDate.getMonth()
  const mk    = monthKey(year, month)

  const income = incomeMap[mk] || 0

  // filter entries for this month
  const prefix = mk + '-'
  const mEntries = entries.filter(e => e.day_key.startsWith(prefix))
  const total    = mEntries.reduce((s, e) => s + e.amount, 0)
  const balance  = income - total

  // ── sub-category breakdown ──
  const subMap = useMemo(() => {
    const map = {}
    mEntries.forEach(e => {
      if (!map[e.cat_id]) map[e.cat_id] = 0
      map[e.cat_id] += e.amount
    })
    return map
  }, [mEntries])

  // ── group breakdown ──
  const groupMap = useMemo(() => {
    const map = {}
    GROUPS.forEach(g => { map[g.id] = { group: g, amount: 0 } })
    mEntries.forEach(e => {
      const g = getGroup(e.cat_id)
      map[g.id].amount += e.amount
    })
    return map
  }, [mEntries])

  // pie data (by large group)
  const pieData = GROUPS.map(g => ({
    name: g.name,
    emoji: '●',
    color: g.color,
    amount: groupMap[g.id]?.amount || 0,
  })).filter(d => d.amount > 0)

  // ── weekly bars ──
  const weeks = getMonthWeeks(year, month)
  const weekTotals = weeks.map(w => {
    return w.days
      .filter(d => d.getMonth() === month)
      .reduce((s, d) => {
        const dk = dayKey(d)
        return s + entries.filter(e => e.day_key === dk).reduce((a, e) => a + e.amount, 0)
      }, 0)
  })
  const maxWeek = Math.max(...weekTotals, 1)

  function prevMonth() { const d = new Date(baseDate); d.setMonth(d.getMonth() - 1); setBaseDate(d) }
  function nextMonth() { const d = new Date(baseDate); d.setMonth(d.getMonth() + 1); setBaseDate(d) }

  return (
    <>
      {/* navigation */}
      <div className="week-nav">
        <button className="btn-nav" onClick={prevMonth}>‹ 이전</button>
        <span className="week-label">{year}년 {month + 1}월 결산</span>
        <button className="btn-nav" onClick={nextMonth}>다음 ›</button>
      </div>

      {/* summary cards */}
      <div className="summary-cards">
        <div className="scard">
          <div className="scard-label">월 소득</div>
          <div className="scard-val income-v">{fmt(income)}</div>
        </div>
        <div className="scard">
          <div className="scard-label">총 지출</div>
          <div className="scard-val expense">{fmt(total)}</div>
        </div>
        <div className="scard">
          <div className="scard-label">잔액</div>
          <div className={`scard-val ${balance >= 0 ? 'pos' : 'neg'}`}>{fmt(balance)}</div>
        </div>
      </div>

      {/* pie + legend */}
      <div className="section-title">카테고리별 지출</div>
      <div className="pie-section">
        {/* SVG pie */}
        {(() => {
          const cx = 90, cy = 90, r = 72
          let cum = -Math.PI / 2
          return (
            <svg viewBox="0 0 180 180" width="180" height="180">
              {total === 0
                ? <circle cx={cx} cy={cy} r={r} fill="var(--surface2)" />
                : pieData.map((d, i) => {
                    const angle = (d.amount / total) * Math.PI * 2
                    const x1 = cx + r * Math.cos(cum), y1 = cy + r * Math.sin(cum)
                    const x2 = cx + r * Math.cos(cum + angle), y2 = cy + r * Math.sin(cum + angle)
                    const large = angle > Math.PI ? 1 : 0
                    const path = `M${cx},${cy} L${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`
                    cum += angle
                    return <path key={i} d={path} fill={d.color} opacity="0.88" />
                  })
              }
              <circle cx={cx} cy={cy} r={38} fill="var(--surface)" />
              <text x={cx} y={cy - 5} textAnchor="middle" fill="var(--text2)" fontSize="12" fontFamily="DM Mono,monospace">
                {income > 0 ? `${Math.round((total / income) * 100)}%` : '-'}
              </text>
              <text x={cx} y={cy + 9} textAnchor="middle" fill="var(--text3)" fontSize="9">지출률</text>
            </svg>
          )
        })()}

        {/* legend */}
        <div className="pie-legend">
          {pieData.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--text3)' }}>데이터 없음</span>
          )}
          {pieData.map((d, i) => (
            <div className="legend-row" key={i}>
              <span className="legend-dot" style={{ background: d.color }} />
              <span className="legend-name">{d.name}</span>
              <span className="legend-amt">{fmt(d.amount)}</span>
              <span className="legend-pct">{total > 0 ? `${Math.round((d.amount / total) * 100)}%` : '0%'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* weekly bars */}
      <div className="section-title">주차별 지출</div>
      <div className="weekly-bars">
        {weeks.map((w, i) => (
          <div className="bar-row" key={i}>
            <span className="bar-week-label">{i + 1}주차</span>
            <div className="bar-track">
              <div
                className="bar-fill"
                style={{ width: `${Math.round((weekTotals[i] / maxWeek) * 100)}%` }}
              />
            </div>
            <span className="bar-amt">{fmt(weekTotals[i])}</span>
          </div>
        ))}
      </div>

      {/* group table: 생활비 / 월청구액 / 돌발지출 */}
      <div className="section-title">지출 그룹별</div>
      <div className="group-table">
        {GROUPS.map(g => {
          const gdata = groupMap[g.id]
          // sub-items for this group
          const subRows = g.subs
            .map(s => ({ sub: s, amount: subMap[s.id] || 0 }))
            .filter(r => r.amount > 0)

          return (
            <div className="group-row" key={g.id}>
              <span className="group-emoji" style={{ fontSize: 20 }}>
                {g.id === 'living' ? '🥗' : g.id === 'monthly' ? '📋' : '⚡'}
              </span>
              <div className="group-info">
                <div className="group-name" style={{ color: g.color }}>{g.name}</div>
                <div className="group-subs">
                  {subRows.length > 0
                    ? subRows.map(r => `${r.sub.emoji} ${r.sub.name} ${fmt(r.amount)}`).join('  ·  ')
                    : '지출 없음'}
                </div>
              </div>
              <span className="group-amt" style={{ color: g.color }}>{fmt(gdata?.amount || 0)}</span>
            </div>
          )
        })}
      </div>

      {/* sub-category detail */}
      <div className="section-title">세부 카테고리</div>
      <div className="group-table">
        {Object.entries(subMap).length === 0 && (
          <div style={{ padding: '18px 16px', color: 'var(--text3)', fontSize: 13, textAlign: 'center' }}>
            이번 달 데이터가 없습니다
          </div>
        )}
        {GROUPS.flatMap(g =>
          g.subs
            .filter(s => (subMap[s.id] || 0) > 0)
            .map(s => (
              <div className="group-row" key={s.id}>
                <span className="group-emoji">{s.emoji}</span>
                <div className="group-info">
                  <div className="group-name">{s.name}</div>
                  <div className="group-subs" style={{ color: g.color }}>{g.name}</div>
                </div>
                <span className="group-amt" style={{ color: g.color }}>{fmt(subMap[s.id])}</span>
              </div>
            ))
        )}
      </div>
    </>
  )
}
