import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import { useEntries, useIncome } from './hooks/useData'
import LoginPage  from './pages/LoginPage'
import WeekView   from './pages/WeekView'
import MonthView  from './pages/MonthView'
import YearView   from './pages/YearView'

export default function App() {
  const [session,  setSession]  = useState(undefined)
  const [view,     setView]     = useState('week')
  const [theme,    setTheme]    = useState(() => localStorage.getItem('kb_theme') || 'light')
  const [readOnly, setReadOnly] = useState(false)

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  // ── Theme ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    localStorage.setItem('kb_theme', theme)
  }, [theme])

  // ── 전역 단축키 (모든 뷰에서 작동) ────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      switch (e.key) {
        case 'd': case 'D':
          e.preventDefault()
          setTheme(t => t === 'dark' ? 'light' : 'dark')
          break
        case 'r': case 'R':
          e.preventDefault()
          setReadOnly(r => !r)
          break
        case '1': e.preventDefault(); setView('week');  break
        case '2': e.preventDefault(); setView('month'); break
        case '3': e.preventDefault(); setView('year');  break
        default: break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Data hooks ────────────────────────────────────────────────────────────
  const userId = session?.user?.id ?? null
  const { entries, loading, addEntry, updateEntry, deleteEntry, deleteByDayKeys } = useEntries(userId)
  const { incomeMap, setIncome } = useIncome(userId)

  if (session === undefined) {
    return <div className="loading-wrap"><div className="spinner" />로딩 중...</div>
  }

  if (!session) return <LoginPage />

  const userEmail = session.user.email

  const tabs = [
    { id: 'week',  label: '주간' },
    { id: 'month', label: '월간결산' },
    { id: 'year',  label: '연말결산' },
  ]

  return (
    <div className="app-shell">
      <header className="header">
        <div className="logo">
          가계부
          <span>{userEmail}</span>
        </div>

        <nav className="nav-tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`nav-tab ${view === t.id ? 'active' : ''}`}
              onClick={() => setView(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="header-actions">
          {readOnly && <span className="read-badge">읽기 전용</span>}
          <button className="btn-icon" onClick={() => setReadOnly(r => !r)}>
            {readOnly ? '✏️ 편집' : '👁 읽기'}
          </button>
          <button className="btn-icon" onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <button className="btn-icon" onClick={() => supabase.auth.signOut()}>로그아웃</button>
        </div>
      </header>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" />데이터 불러오는 중...</div>
      ) : (
        <>
          {view === 'week' && (
            <WeekView
              entries={entries}
              addEntry={addEntry}
              updateEntry={updateEntry}
              deleteEntry={deleteEntry}
              deleteByDayKeys={deleteByDayKeys}
              incomeMap={incomeMap}
              setIncome={setIncome}
              readOnly={readOnly}
              onViewChange={setView}
              onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              onToggleReadOnly={() => setReadOnly(r => !r)}
            />
          )}
          {view === 'month' && (
            <MonthView entries={entries} incomeMap={incomeMap} />
          )}
          {view === 'year' && (
            <YearView entries={entries} incomeMap={incomeMap} />
          )}
        </>
      )}
    </div>
  )
}
