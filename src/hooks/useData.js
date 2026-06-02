import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ── entries ──────────────────────────────────────────────────────────────────

export function useEntries(userId) {
  const [entries, setEntries] = useState([])   // [{ id, day_key, name, cat_id, amount, ts }]
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', userId)
      .order('ts', { ascending: true })
    setEntries(data ?? [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

const addEntry = async ({ day_key, name, cat_id, amount }) => {
  console.log('addEntry 호출됨', { day_key, name, cat_id, amount, userId })
  const row = { user_id: userId, day_key, name, cat_id, amount, ts: Date.now() }
  const { data, error } = await supabase.from('entries').insert(row).select().single()
  console.log('결과:', data, error)
  if (data) setEntries(prev => [...prev, data])
  return data
}

  const updateEntry = async (id, fields) => {
    const { data } = await supabase.from('entries').update(fields).eq('id', id).select().single()
    if (data) setEntries(prev => prev.map(e => e.id === id ? data : e))
  }

  const deleteEntry = async (id) => {
    await supabase.from('entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const deleteByDayKeys = async (dayKeys) => {
    await supabase.from('entries').delete().in('day_key', dayKeys).eq('user_id', userId)
    setEntries(prev => prev.filter(e => !dayKeys.includes(e.day_key)))
  }

  return { entries, loading, addEntry, updateEntry, deleteEntry, deleteByDayKeys, refetch: fetch }
}

// ── income ────────────────────────────────────────────────────────────────────

export function useIncome(userId) {
  const [incomeMap, setIncomeMap] = useState({})   // { 'YYYY-MM': amount }

  useEffect(() => {
    if (!userId) return
    supabase.from('income').select('*').eq('user_id', userId).then(({ data }) => {
      const map = {}
      ;(data ?? []).forEach(r => { map[r.month_key] = r.amount })
      setIncomeMap(map)
    })
  }, [userId])

  const setIncome = async (month_key, amount) => {
    setIncomeMap(prev => ({ ...prev, [month_key]: amount }))
    await supabase.from('income').upsert(
      { user_id: userId, month_key, amount, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,month_key' }
    )
  }

  return { incomeMap, setIncome }
}
