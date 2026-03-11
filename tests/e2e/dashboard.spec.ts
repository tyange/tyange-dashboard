import { expect, test } from '@playwright/test'

const authSession = {
  access_token: 'playwright-access-token',
  refresh_token: 'playwright-refresh-token',
  user_id: 'playwright-user',
  user_role: 'user',
}

function budgetSummary(overrides?: Partial<Record<string, unknown>>) {
  return {
    budget_id: 1,
    total_budget: 2_500_000,
    from_date: '2026-02-22',
    to_date: '2026-03-21',
    total_spent: 2_440_311,
    remaining_budget: 59_689,
    usage_rate: 0.9761244,
    alert: false,
    alert_threshold: 0.85,
    ...overrides,
  }
}

async function mockAuthenticatedBudgetApp(page: Parameters<typeof test>[0]['page'], summaryOverrides?: Partial<Record<string, unknown>>) {
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
      }),
    })
  })

  await page.route('**/budget', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue()
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(budgetSummary(summaryOverrides)),
    })
  })

  await page.route('**/budget/spending', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fulfill({ status: 204, body: '' })
      return
    }

    const summary = budgetSummary(summaryOverrides)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        budget_id: summary.budget_id,
        from_date: summary.from_date,
        to_date: summary.to_date,
        total_spent: summary.total_spent,
        remaining: summary.remaining_budget,
        weeks: [],
      }),
    })
  })
}

test('dashboard removes records card and exposes records link inside spend card', async ({ page }) => {
  await mockAuthenticatedBudgetApp(page)

  await page.goto('/dashboard')

  await expect(page.getByRole('heading', { name: '현재 적용 예산' })).toBeVisible()
  await expect(page.getByText('98% 사용')).toHaveCount(0)
  await expect(page.getByRole('button', { name: '열기' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: '소비 기록 보기' })).toBeVisible()

  await page.getByRole('button', { name: '소비 기록 보기' }).click()
  await expect(page).toHaveURL(/\/records$/)
  await expect(page.getByRole('heading', { name: '소비 기록' })).toBeVisible()
})

test('dashboard uses green ring in normal state', async ({ page }) => {
  await mockAuthenticatedBudgetApp(page, { alert: false, remaining_budget: 59_689, usage_rate: 0.74 })

  await page.goto('/dashboard')

  const ring = page.locator('#active-budget [style*="conic-gradient"]').first()
  await expect(ring).toHaveAttribute('style', /rgb\(32,\s*201,\s*151\)/)
})

test('dashboard uses red remaining budget treatment in overspent state', async ({ page }) => {
  await mockAuthenticatedBudgetApp(page, { alert: true, remaining_budget: -15_000, usage_rate: 0.91, is_overspent: true })

  await page.goto('/dashboard')

  await expect(page.getByText('-₩15,000')).toHaveClass(/text-red-400/)
  await expect(page.getByText('총 예산 ₩2,500,000')).toBeVisible()
})
