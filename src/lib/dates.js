export function getMondayOfWeek(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d
}

export function getWeekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(d.getDate() + i)
    return d
  })
}

export function dayKey(date) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function monthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

export function getWeekNum(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7))
  const week1 = new Date(d.getFullYear(), 0, 4)
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
}

export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

export function getMonthWeeks(year, month) {
  const weeks = []
  const firstDay = new Date(year, month, 1)
  let mon = getMondayOfWeek(firstDay)
  if (mon > firstDay) mon.setDate(mon.getDate() - 7)

  for (let i = 0; i < 6; i++) {
    const start = new Date(mon)
    start.setDate(start.getDate() + i * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const days = Array.from({ length: 7 }, (_, j) => {
      const d = new Date(start); d.setDate(d.getDate() + j); return d
    })
    if (days.some(d => d.getMonth() === month)) weeks.push({ start, end, days })
  }
  return weeks
}

export const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']
export const MONTH_SHORT = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
