import { useState, useMemo } from 'react'
import { GROUPS, getGroup, fmt } from '../lib/categories'
import { monthKey, MONTH_SHORT } from '../lib/dates'

const CAT_LIST = [
  { id: '_total', name: '전체 지출', emoji: '📊', color: '#4e6b27' },
  ...GROUPS.flatMap(g => g.subs.map(s => ({ id: s.id, name: s.name, emoji: s.emoji, color: g.color, groupName: g.name })))
]

function LineChart({ data, color, maxVal }) {
  const W = 580, H = 160, padL = 52, padR = 16, padT = 16, padB = 32
  const max = maxVal || Math.max(...data, 1)

  const pts = data.map((v, i) => ({
    x: padL + (i / 11) * (W - padL - padR),
    y: padT + (1 - v / max) * (H - padT - padB),
    v,
  }))

  const pathD = 'M' + pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')
  const areaD = pathD + ` L${pts[11].x.toFixed(1)},${(H - padB).toFixed(1)} L${pts[0].x.toFixed(1)},${(H - padB).toFixed(1)} Z`

  // y-axis labels (3 ticks)
  const ticks = [0, Math.round(max / 2), max]

  return (
    <svg className="line-chart-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>

      {/* grid lines */}
      {ticks.map((t, i) => {
        const y = padT + (1 - t / max) * (H - padT - padB)
        return (
          <g key={i}>
            <line x1={padL} y1={y.toFixed(1)} x2={W - padR} y2={y.toFixed(1)}
              stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
            <text x={padL - 4} y={y + 4} textAnchor="end" fill="var(--text3)" fontSize="9" fontFamily="DM Mono,monospace">
              {t >= 10000 ? `${Math.round(t / 1000)}k` : t.toLocaleString()}
            </text>
          </g>
        )
      })}

      {/* axes */}
      <line x1={padL} y1={padT} x2={padL} y2={H - padB} stroke="var(--border)" strokeWidth="0.5" />
      <line x1={padL} y1={H - padB} x2={W - padR} y2={H - padB} stroke="var(--border)" strokeWidth="0.5" />

      {/* area */}
      <path d={areaD} fill={`url(#grad-${color.replace('#','')})`} />

      {/* line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {/* dots + labels */}
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="4" fill={color} />
          {p.v > 0 && (
            <text x={p.x.toFixed(1)} y={(p.y - 9).toFixed(1)} textAnchor="middle"
              fill="var(--text2)" fontSize="9" fontFamily="DM Mono,monospace">
              {p.v >= 100000 ? `${Math.round(p.v / 10000)}만` : `${Math.round(p.v / 1000)}k`}
            </text>
          )}
          <text x={p.x.toFixed(1)} y={H - padB + 14} textAnchor="middle"
            fill="var(--text3)" fontSize="10">
            {MONTH_SHORT[i]}
          </text>
        </g>
      ))}
    </svg>
  )
}

export default function YearView({ entries, incomeMap }) {
  const [year, setYear]   = useState(() => new Date().getFullYear())
  const [catIdx, setCatIdx] = useState(0)

  const totalCats = CAT_LIST.length
  const currentCat = CAT_LIST[catIdx]

  // per-month totals for selected category
  const monthData = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => {
      const prefix = monthKey(year, m) + '-'
      const mEntries = entries.filter(e => e.day_key.startsWith(prefix))
      if (currentCat.id === '_total') return mEntries.reduce((s, e) => s + e.amount, 0)
      return mEntries.filter(e => e.cat_id === currentCat.id).reduce((s, e) => s + e.amount, 0)
    })
  }, [entries, year, currentCat.id])

  // year summary
  const yearTotal  = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => monthKey(year, m) + '-')
      .flatMap(prefix => entries.filter(e => e.day_key.startsWith(prefix)))
      .reduce((s, e) => s + e.amount, 0)
  }, [entries, year])

  const yearIncome = useMemo(() => {
    return Array.from({ length: 12 }, (_, m) => incomeMap[monthKey(year, m)] || 0)
      .reduce((s, v) => s + v, 0)
  }, [incomeMap, year])

  const yearBalance = yearIncome - yearTotal

  return (
    <>
      <div className="week-nav">
        <button className="btn-nav" onClick={() => setYear(y => y - 1)}>‹ 이전</button>
        <span className="week-label">{year}년 연말결산</span>
        <button className="btn-nav" onClick={() => setYear(y => y + 1)}>다음 ›</button>
      </div>

      {/* year summary */}
      <div className="summary-cards">
        <div className="scard">
          <div className="scard-label">연간 소득</div>
          <div className="scard-val income-v">{fmt(yearIncome)}</div>
        </div>
        <div className="scard">
          <div className="scard-label">연간 지출</div>
          <div className="scard-val expense">{fmt(yearTotal)}</div>
        </div>
        <div className="scard">
          <div className="scard-label">연간 잔액</div>
          <div className={`scard-val ${yearBalance >= 0 ? 'pos' : 'neg'}`}>{fmt(yearBalance)}</div>
        </div>
      </div>

      {/* carousel */}
      <div className="section-title">카테고리별 월간 추이</div>
      <div className="year-carousel">
        <div className="carousel-header">
          <span className="carousel-title" style={{ color: currentCat.color }}>
            {currentCat.emoji} {currentCat.name}
            {currentCat.groupName && (
              <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400, marginLeft: 6 }}>
                ({currentCat.groupName})
              </span>
            )}
          </span>
          <div className="carousel-nav">
            <button className="btn-nav" onClick={() => setCatIdx(i => (i - 1 + totalCats) % totalCats)}>‹</button>
            <span className="carousel-counter">{catIdx + 1} / {totalCats}</span>
            <button className="btn-nav" onClick={() => setCatIdx(i => (i + 1) % totalCats)}>›</button>
          </div>
        </div>
        <div className="chart-card">
          <LineChart data={monthData} color={currentCat.color} />
        </div>
      </div>

      {/* all-groups overview table */}
      <div className="section-title">연간 그룹 합계</div>
      <div className="group-table">
        {GROUPS.map(g => {
          const gTotal = Array.from({ length: 12 }, (_, m) => {
            const prefix = monthKey(year, m) + '-'
            return entries
              .filter(e => e.day_key.startsWith(prefix) && getGroup(e.cat_id).id === g.id)
              .reduce((s, e) => s + e.amount, 0)
          }).reduce((s, v) => s + v, 0)

          const monthAvg = Math.round(gTotal / 12)

          return (
            <div className="group-row" key={g.id}>
              <span className="group-emoji">
                {g.id === 'living' ? '🥗' : g.id === 'monthly' ? '📋' : '⚡'}
              </span>
              <div className="group-info">
                <div className="group-name" style={{ color: g.color }}>{g.name}</div>
                <div className="group-subs">월 평균 {fmt(monthAvg)}</div>
              </div>
              <span className="group-amt" style={{ color: g.color }}>{fmt(gTotal)}</span>
            </div>
          )
        })}
      </div>
    </>
  )
}
