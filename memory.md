# Tyange Dashboard Memory

Last updated: 2026-03-23 (Asia/Seoul)

## Project Snapshot
- Frontend: SolidJS + TypeScript + Vite
- Styling: Tailwind CSS v4 (via `@tailwindcss/vite`)
- UI primitives: prefer native Solid + Tailwind components; Kobalte is no longer required
- Default UI font: Pretendard
- Package/runtime: Bun (`bun.lock` present)
- Deploy target: AWS Lightsail/EC2 static files + Nginx (see `README.md`)

## Core Commands
- Install: `bun install`
- Dev server: `bun run dev` (default local URL: `http://localhost:3001`)
- Build: `bun run build`
- Preview build: `bun run preview`
- Test: `bun run test`
- E2E: `bun run test:e2e`

## Environment Notes
- Required runtime env var: `VITE_CMS_API_BASE_URL`
- Google login runtime env var: `VITE_GOOGLE_CLIENT_ID`
- Local fallback in code: `http://localhost:8080` (`src/features/budget/api.ts`)
- Local env template: `.env.example`; deploy workflow writes `.env.production` from GitHub Actions variables before build
- CI expectation: build should fail fast when `VITE_CMS_API_BASE_URL` is missing (README policy)

## Current Feature Structure
- Entry: `src/index.tsx`
- Main router entry: `src/App.tsx`
- Auth state/context: `src/auth/AuthProvider.tsx`
- Public pages: `src/pages/*`
- Authenticated layout: `src/components/AuthenticatedLayout.tsx`
- API key management UI: `src/features/api-keys/*`
- Notifications/RSS management UI: `src/features/notifications/*`
- Match UI: `src/features/match/*`
- Match profile page UI: `src/features/match/components/ProfilePage.tsx`
- Match presentation helpers: `src/features/match/presentation.ts`
- Match local profile draft storage: `src/features/match/profileDraft.ts`
- Budget domain: `src/features/budget/*`
- Main API layer: `src/features/budget/api.ts`
- Custom PWA service worker: `src/sw.ts`
- Budget dashboard route UI: `src/features/budget/components/BudgetDashboardPage.tsx`
- Spend records route UI: `src/features/budget/components/SpendRecordsRoutePage.tsx`
- Budget setup route UI: `src/features/budget/components/BudgetSetupPage.tsx`

## Behavior Conventions In Use
- Global theme uses semantic Tailwind tokens backed by CSS variables in `src/index.css`
- Theme switching uses `html[data-theme="light" | "dark"]` with persisted preference key `ui-theme`; `system` is the default mode
- Keep API fetch logic in `src/features/budget/api.ts`
- Public landing page lives at `/` and only introduces the app plus login guidance
- Login page lives at `/login` and exposes only Google Identity Services login UI backed by CMS API `POST /login/google`
- `/signup` is no longer exposed in the UI and redirects to `/login`; legacy login/signup APIs remain untouched on the backend side
- Protected pages live at `/dashboard`, `/subscriptions`, `/settings`, `/records`, and `/budget/setup`; unauthenticated access redirects to `/login?next=...`
- `/api-keys` redirects to `/settings`, `/notifications` redirects to `/subscriptions`, `/feed` redirects to `/subscriptions`, and `/match` redirects to `/dashboard`
- Protected default home at `/dashboard` is the 1:1 message hub; primary navigation is `타임라인`, `설정`
- Protected profile page lives at `/profile/:userId`; the top header exposes it through a compact profile trigger instead of a primary nav tab
- `/match` redirects to `/dashboard`; the dedicated match route surface is removed in favor of the main home timeline
- `/subscriptions`, `/notifications`, `/feed`는 현재 모두 `/settings`로 보낸다
- `GET /feed/items` 응답의 `unread_count` / `item.read`는 현재 UI 의미에 사용하지 않는다
- 메시지 허브 composer는 클라이언트에서 140자 제한을 강제한다
- 1:1 메시지 허브는 트위터형 단일 타임라인 컬럼을 우선하고, 카드로 화면을 과도하게 분절하지 않는다
- 메시지 허브와 프로필 페이지는 설명 문구를 최소화하고, 상태 안내도 한두 줄 이내의 유틸리티 카피로 유지한다
- 대시보드 첫 화면은 `1:1 TIMELINE` 라벨과 입력 영역만 남기고, 설명성 헤드라인과 빈 상태 문구를 두지 않는다
- 프로필 페이지는 현재 `user_id`와 활성 매칭 상태만으로 구성한 placeholder 프로필을 사용하며, 실제 avatar/bio/display name API가 들어오기 전까지 결정적 파생값을 노출한다
- Settings page includes API key management for the currently logged-in user
- Settings page also manages the current user's local profile draft and current 1:1 match status/teardown
- 알림 관리는 설정 페이지 내부 섹션으로만 노출하고, 등록된 브라우저 알림 목록은 해당 섹션 바로 아래에 보여준다
- Auth state uses `unknown | guest | authenticated` and restores persisted JWT session from `localStorage`
- Email/password login and Google login both converge on the same stored JWT session shape in `localStorage`
- Authenticated navigation uses a top header with pill-style tabs instead of a sidebar
- Authenticated layout owns the effective max width for both header and main content; page-level custom max-width wrappers는 최소화한다
- Authenticated header keeps the primary tabs as `타임라인`, `설정` only; profile access is handled by a right-side identity chip
- 보호 화면 헤더는 별도 브랜드/로고 행 없이 탭과 사용자 액션만 한 줄로 유지한다
- 보호 화면 헤더는 하단 border 없이 중성 배경만 유지한다
- 보호 화면 헤더/배경은 강한 장식색보다 중성 베이스를 우선하고, 모바일에서는 배지성 원형 요소를 최소화한다
- API errors are surfaced in UI as a top error alert block
- API key management uses `GET /api-keys`, `POST /api-keys`, and `DELETE /api-keys/:id` with JWT auth; plaintext keys are shown only immediately after creation and never reloaded from the list API
- 1:1 매칭 페이지는 `GET /match/me`, `POST /match/request`, `POST /match/:match_id/respond`, `DELETE /match/me`, `GET/POST /match/messages`를 사용하며, `pending`이면 신청/응답 상태를, `matched`이면 메시지 타임라인을 렌더링한다
- 알림 관리 페이지는 초기 진입 시 `/push/public-key`, `/push/subscriptions`를 조회하고, 브라우저 로컬 `PushSubscription`과 서버 저장 구독을 정합해 현재 브라우저 상태를 표시한다
- `/push/public-key`의 503은 서버 미설정 정상 분기이며, 알림 페이지는 이를 `unavailable` 상태로 처리해 푸시 등록 CTA를 비활성화하고 안내 문구를 보여준다
- 웹 푸시는 Vite PWA `injectManifest` 기반 커스텀 서비스 워커(`src/sw.ts`)에서 `push`와 `notificationclick`을 처리하며, 페이지 컴포넌트에는 서비스 워커 로직을 넣지 않는다
- 개발 서버에서도 알림 등록 플로우를 검증할 수 있도록 Vite PWA `devOptions.enabled`를 켜 둔다
- 대시보드는 `GET /budget` 단일 응답으로 활성 기간 총예산을 표시하고, 404는 "활성 예산 없음" 상태로 처리한다
- 예산 설정 페이지는 `GET /budget`으로 활성 기간 예산을 확인하고, `POST /budget/plan` 또는 `PUT /budget`으로 명시적으로 저장한다
- 예산 설정 페이지는 엑셀 기반 예산 계산/업로드 UI를 노출하지 않고, 활성 기간 예산 생성·수정만 담당한다
- 소비 기록 페이지는 `GET /budget/spending` 응답의 `weeks[]` 그룹을 그대로 렌더링하고 `POST /budget/spending`, `PUT /budget/spending/:record_id`, `DELETE /budget/spending/:record_id`, `DELETE /budget/spending` 후 `GET /budget` + `GET /budget/spending` 재조회로 요약과 목록을 동기화한다
- 소비 기록 페이지 초기 진입은 `GET /budget`을 먼저 확인하고, 그 응답이 성공한 뒤 `GET /budget/spending` 404가 오면 "기록 없음"으로 간주해 빈 목록 상태를 렌더링한다
- 소비 기록 페이지는 `POST /budget/spending/import-preview` -> 사용자 선택 -> `POST /budget/spending/import-commit` 흐름으로 신한카드 XLS 가져오기를 지원하며, 기본 선택은 `status=new` 행만 허용한다
- `tyange-cms-api` `6663a47` 이후 예산 총지출은 거래 원장에서 자동 계산되며, 예산 생성/수정 요청에 `total_spent`를 보내면 400으로 거절된다
- XLS import 반영 결과는 `period_total_spent_from_records`와 `remaining`을 반환하며, 대시보드/소비 기록 화면은 모두 동일한 원장 기준 합계를 사용한다
- Budget API requests require the raw access token in the `Authorization` header because `tyange-cms-api` `260308` protects all budget read/write routes with JWT auth
- 대시보드와 소비 기록 화면의 `weeks[]`는 표시용 그룹이며, 예산 계산 기준은 항상 활성 기간 전체 총액이다
- 예산/소비 관련 404는 기본적으로 "활성 기간 예산 없음" 또는 "기록 없음" 메시지로 처리하고 예산 설정 유도 화면을 노출한다
- 엑셀 계산 플로우는 업로드/계산, 버킷 검토, 활성 기간 예산 저장의 3단계를 명확히 분리한다
- 401은 세션 만료 메시지, 404는 활성 예산/기록 없음 메시지, 400 엑셀 계산 오류는 파일/입력값 오류 메시지로 매핑한다
- 보호 페이지 UI는 무거운 반복 카드보다 화면 목적에 맞는 정보 밀도를 우선하고, 관리 화면은 `문서형 헤더 + 인라인 통계 + 평평한 섹션 + 테이블/행` 패턴을 사용한다
- 보호 페이지의 페이지/섹션 헤더는 기본적으로 제목만 남기고 소개성 설명 문장은 두지 않는다
- 설정 페이지에서는 form 입력 요소의 underline만 유지하고, 섹션/표/상태 블록에는 기본적으로 수평 구분선을 두지 않는다
- 설정 페이지의 API 키 목록과 브라우저 알림 목록은 무경계 표 형태를 유지한다
- 사용자 노출 문구에서는 `활성`보다 `현재` 또는 `적용` 표현을 우선 사용한다

## Data Contracts (Budget)
- `BudgetSummary`: `budget_id`, `total_budget`, `from_date`, `to_date`, `total_spent`, `remaining_budget`, `usage_rate`, `alert`, `alert_threshold`, optional `is_overspent`
- `SpendRecord`: `record_id`, `amount`, `merchant`, `transacted_at`, `created_at`
- `SpendingListResponse`: `budget_id`, `from_date`, `to_date`, `total_spent`, `remaining`, `weeks[]`
- `SpendingWeekGroup`: `week_key`, `weekly_total`, `record_count`, `records[]`

## Practical Working Rules
- Prefer minimal, targeted edits over broad refactors
- Preserve Korean UI labels/messages unless explicitly requested to change
- When adding API calls, keep consistent error pattern: `API ${status}: ${bodyText || fallbackMessage}`
- Vitest unit runs exclude `tests/e2e/**`; browser E2E coverage stays on Playwright via `bun run test:e2e`
- When iterating on UX with the user, prefer small visual/layout adjustments in short cycles over large one-shot redesigns
- Treat user screenshots and DOM observations as high-signal feedback; fix the concrete awkward area first before expanding scope
- For new hub/feed concepts without backend support yet, it is acceptable to ship clearly labeled mock UI temporarily, but avoid fake navigation or speculative features that add no immediate value
- Prefer concise, service-like UI copy over explanatory marketing copy; avoid redundant section titles, duplicate settings surfaces, and unnecessary navigation actions
- On mobile navigation, avoid full-width menu pills when the information density is low; prefer compact stacked items or similarly restrained layouts

## Outstanding TODOs
- Revisit refresh-token handling when access token expiry UX becomes relevant
- Revisit `/records` direct-access behavior once expired-session recovery UX is defined

## Update Checklist (When Task Ends)
- If conventions changed, update this file
- If scripts/paths changed, update "Core Commands" and "Feature Structure"
- If new env vars were introduced, document them under "Environment Notes"
