import { expect, test } from '@playwright/test'

const authSession = {
  access_token: 'playwright-access-token',
  refresh_token: 'playwright-refresh-token',
  user_id: 'playwright-user',
  user_role: 'user',
  display_name: '플레이라이트 유저',
  avatar_url: 'https://example.com/playwright-user.png',
  bio: '테스트 프로필',
} as const

type MatchFixture = {
  match: Record<string, unknown> | null
  messages?: Array<Record<string, unknown>>
}

async function mockAuthenticatedMatchApp(page: Parameters<typeof test>[0]['page'], fixture: MatchFixture) {
  await page.addInitScript((session) => {
    window.localStorage.setItem('tyange-dashboard.auth', JSON.stringify(session))
  }, authSession)

  await page.route('**/me', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user_id: authSession.user_id,
        user_role: authSession.user_role,
        display_name: authSession.display_name,
        avatar_url: authSession.avatar_url,
        bio: authSession.bio,
      }),
    })
  })

  await page.route('**/match/me', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fulfill({ status: 204, body: '' })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixture.match),
    })
  })

  await page.route('**/match/messages', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          message_id: 99,
          match_id: 14,
          sender_user_id: authSession.user_id,
          receiver_user_id: 'partner@example.com',
          content: '새 메시지',
          created_at: '2026-03-22 14:00:00',
        }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        match_id: 14,
        counterpart_user_id: 'partner@example.com',
        messages: fixture.messages ?? [],
      }),
    })
  })
}

test('dashboard shows connect state when no active match exists', async ({ page }) => {
  await mockAuthenticatedMatchApp(page, { match: null })

  await page.goto('/dashboard')

  await expect(page.getByText('1:1 timeline', { exact: true })).toBeVisible()
  await expect(page.getByText('상대 사용자 ID', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: '요청 보내기' })).toBeVisible()
})

test('dashboard links to counterpart profile and shows recent conversation preview', async ({ page }) => {
  await mockAuthenticatedMatchApp(page, {
    match: {
      match_id: 14,
      status: 'matched',
      requester_user_id: authSession.user_id,
      target_user_id: 'partner@example.com',
      counterpart_user_id: 'partner@example.com',
      created_at: '2026-03-21 09:00:00',
      responded_at: '2026-03-21 09:30:00',
    },
    messages: [
      {
        message_id: 1,
        match_id: 14,
        sender_user_id: authSession.user_id,
        receiver_user_id: 'partner@example.com',
        content: '첫 인사',
        created_at: '2026-03-21 10:00:00',
      },
      {
        message_id: 2,
        match_id: 14,
        sender_user_id: 'partner@example.com',
        receiver_user_id: authSession.user_id,
        content: '답장 하나',
        created_at: '2026-03-21 10:30:00',
      },
    ],
  })

  await page.goto('/dashboard')

  await expect(page.getByText('2개 메시지')).toBeVisible()
  await expect(page.getByRole('link', { name: '@partner@example.com' }).first()).toBeVisible()
  await expect(page.getByText('답장 하나')).toBeVisible()

  await page.getByRole('link', { name: '@partner@example.com' }).first().click()

  await expect(page).toHaveURL(/\/profile\/partner%40example\.com$/)
  await expect(page.getByRole('heading', { name: '최근 대화' })).toBeVisible()
  await expect(page.getByText('답장 하나')).toBeVisible()
})
