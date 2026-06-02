# 가계부 — 배포 가이드

React + Vite + Supabase + Vercel 스택으로 구성된 개인 가계부 웹앱입니다.

---

## 1단계 — Supabase 설정

### 1-1. 프로젝트 생성
1. [https://supabase.com](https://supabase.com) → **New project** 클릭
2. 프로젝트 이름, DB 비밀번호, 리전(Northeast Asia 권장) 설정 후 생성

### 1-2. 테이블 생성
대시보드 왼쪽 메뉴 **SQL Editor** → **New query** → 아래 SQL 전체 붙여넣기 후 **Run**

```sql
-- 지출 항목 테이블
create table public.entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  day_key     text not null,
  name        text not null,
  cat_id      text not null,
  amount      integer not null,
  ts          bigint not null,
  created_at  timestamptz default now()
);

-- 월 소득 테이블
create table public.income (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  month_key   text not null,
  amount      integer not null default 0,
  updated_at  timestamptz default now(),
  unique(user_id, month_key)
);

-- Row Level Security (사용자별 데이터 분리)
alter table public.entries enable row level security;
alter table public.income  enable row level security;

create policy "own entries" on public.entries
  for all using (auth.uid() = user_id);

create policy "own income" on public.income
  for all using (auth.uid() = user_id);
```

### 1-3. 이메일 인증 설정 (선택)
- **Authentication → Providers → Email** 에서 **Confirm email** 토글을 끄면 이메일 인증 없이 바로 로그인 가능
- 개인 사용 용도라면 끄는 걸 권장

### 1-4. API 키 확인
**Settings → API** 에서 아래 두 값을 복사해 둡니다:
- `Project URL`
- `anon / public` 키

---

## 2단계 — 로컬 개발 환경 설정

```bash
# 1. 이 폴더를 VS Code로 열고 터미널 실행

# 2. 의존성 설치
npm install

# 3. 환경변수 파일 생성
cp .env.example .env

# 4. .env 파일을 열고 Supabase 값 입력
#    VITE_SUPABASE_URL=https://xxxxxx.supabase.co
#    VITE_SUPABASE_ANON_KEY=eyJ...

# 5. 개발 서버 실행
npm run dev
# → http://localhost:5173 에서 확인
```

---

## 3단계 — GitHub 업로드

```bash
# GitHub에서 새 레포지토리 생성 후:
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/kakeibo.git
git push -u origin main
```

---

## 4단계 — Vercel 배포

1. [https://vercel.com](https://vercel.com) 로그인 → **Add New Project**
2. GitHub 레포지토리 선택
3. **Framework Preset: Vite** 자동 감지됨
4. **Environment Variables** 섹션에서 추가:
   - `VITE_SUPABASE_URL` = Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = Supabase anon key
5. **Deploy** 클릭

배포 완료 후 `https://your-project.vercel.app` 주소로 접근 가능합니다.

---

## 파일 구조

```
kakeibo/
├── src/
│   ├── lib/
│   │   ├── supabase.js      # Supabase 클라이언트
│   │   ├── categories.js    # 카테고리 정의
│   │   └── dates.js         # 날짜 유틸
│   ├── hooks/
│   │   └── useData.js       # entries / income 훅
│   ├── pages/
│   │   ├── LoginPage.jsx    # 로그인/회원가입
│   │   ├── WeekView.jsx     # 주간 뷰
│   │   ├── MonthView.jsx    # 월간결산
│   │   └── YearView.jsx     # 연말결산
│   ├── components/
│   │   └── EntryModal.jsx   # 지출 추가/수정 모달
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── vite.config.js
├── package.json
└── .env.example
```

---

## 기능 요약

| 기능 | 설명 |
|------|------|
| 로그인/회원가입 | 이메일+비밀번호, Supabase Auth |
| 주간 뷰 | 월~일 7열, 지출 추가/수정/삭제, 소득 입력, 주간 합계 |
| 월간결산 | 파이차트, 주차별 막대, 그룹 통합뷰 |
| 연말결산 | 카테고리별 꺾은선 그래프 (화살표 전환) |
| 다크모드 | 토글 + 설정 저장 |
| 읽기 전용 | 편집 잠금 모드 |
