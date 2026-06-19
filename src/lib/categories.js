// 대그룹 (GROUP)  →  소카테고리 (SUB)
// 색은 대그룹 단위로 공유, 이모티콘은 소카테고리마다 다름

export const GROUPS = [
  {
    id: 'living',
    name: '생활비',
    color: '#5a7a2e',
    colorLight: '#eef3e6',
    subs: [
      { id: 'homemeal',   name: '집밥',    emoji: '🥘', mid: '식비' },
      { id: 'snack',      name: '간식',    emoji: '🍪', mid: '식비' },
      { id: 'restaurant', name: '외식',    emoji: '🍽️', mid: '식비' },
      { id: 'supplies',   name: '생활용품', emoji: '🧴', mid: null   },
    ],
  },
  {
    id: 'monthly',
    name: '월청구액',
    color: '#6b7c5a',
    colorLight: '#f0f2ec',
    subs: [
      { id: 'mgmt',       name: '관리비',   emoji: '🏠' },
      { id: 'gas',        name: '도시가스', emoji: '🔥' },
      { id: 'telecom',    name: '통신비',   emoji: '📱' },
      { id: 'rental',     name: '렌탈비',   emoji: '📺' },
      { id: 'insurance',  name: '보험료',   emoji: '🛡️' },
      { id: 'membership', name: '계비',     emoji: '💳' },
      { id: 'childcare',  name: '양육',     emoji: '🧒' },
    ],
  },
  {
    id: 'extra',
    name: '돌발지출',
    color: '#8a6a3a',
    colorLight: '#f5f0e8',
    subs: [
      { id: 'clothes',    name: '의류미용', emoji: '👗' },
      { id: 'medical',    name: '병원의료', emoji: '🏥' },
      { id: 'hobby',      name: '취미활동', emoji: '🎮' },
      { id: 'edu',        name: '교육',     emoji: '📚' },
      { id: 'allowance',  name: '용돈',     emoji: '💸' },
      { id: 'tax',        name: '세금',     emoji: '🏛️' },
      { id: 'etc',        name: '기타',     emoji: '📦' },
    ],
  },
]

export const ALL_SUBS = GROUPS.flatMap(g => g.subs.map(s => ({ ...s, groupId: g.id })))

export function getGroup(subId) {
  return GROUPS.find(g => g.subs.some(s => s.id === subId)) ?? GROUPS[0]
}

export function getSub(subId) {
  return ALL_SUBS.find(s => s.id === subId) ?? ALL_SUBS[0]
}

export function fmt(n) {
  return '₩' + Math.round(n || 0).toLocaleString('ko-KR')
}
