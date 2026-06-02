import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [mode, setMode]       = useState('login')   // 'login' | 'signup'
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr]         = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)      // signup confirmation

  async function handleSubmit(e) {
    e.preventDefault()
    setErr('')
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      setLoading(false)
      if (error) { setErr(error.message); return }
      setDone(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setLoading(false)
      if (error) { setErr('이메일 또는 비밀번호가 올바르지 않습니다.'); return }
      // App.jsx listens to onAuthStateChange → rerenders automatically
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">가계부</div>
        <div className="login-tagline">월별 생활비 관리 대시보드</div>

        {done ? (
          <div style={{ textAlign: 'center', color: 'var(--text2)', fontSize: 14, lineHeight: 1.6 }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>📬</div>
            가입 확인 이메일을 보냈어요.<br />
            이메일에서 인증 후 로그인해 주세요.
            <div
              className="login-mode"
              style={{ marginTop: 16 }}
              onClick={() => { setDone(false); setMode('login') }}
            >
              <span>로그인 화면으로 돌아가기</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="비밀번호 (6자 이상)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
            <button className="login-submit" type="submit" disabled={loading}>
              {loading ? '처리 중...' : mode === 'login' ? '로그인' : '회원가입'}
            </button>
            {err && <div className="login-err">{err}</div>}
            <div className="login-mode">
              {mode === 'login' ? (
                <>아직 계정이 없으신가요? <span onClick={() => { setMode('signup'); setErr('') }}>회원가입</span></>
              ) : (
                <>이미 계정이 있으신가요? <span onClick={() => { setMode('login'); setErr('') }}>로그인</span></>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
