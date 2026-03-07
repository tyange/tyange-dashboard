import type { BudgetWeeksResponse, SpendRecord, WeeklySummary } from './types'

const apiBaseUrl = (import.meta.env.VITE_CMS_API_BASE_URL ?? 'http://localhost:8080').replace(
  /\/$/,
  '',
)

export async function fetchWeeklySummary(): Promise<WeeklySummary> {
  const response = await fetch(`${apiBaseUrl}/budget/weekly`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '주간 요약 조회 실패'}`)
  }

  return response.json()
}

export async function fetchWeeklySummaryByWeekKey(weekKey: string): Promise<WeeklySummary> {
  const response = await fetch(`${apiBaseUrl}/budget/weekly/${weekKey}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '주간 요약 조회 실패'}`)
  }

  return response.json()
}

export async function fetchBudgetWeeks(): Promise<BudgetWeeksResponse> {
  const response = await fetch(`${apiBaseUrl}/budget/weeks`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '주차 목록 조회 실패'}`)
  }

  return response.json()
}

export async function fetchWeeklyRecords(weekKey: string): Promise<SpendRecord[]> {
  const response = await fetch(`${apiBaseUrl}/budget/weekly/${weekKey}/records`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const bodyText = await response.text()
    throw new Error(`API ${response.status}: ${bodyText || '소비 기록 조회 실패'}`)
  }

  return response.json()
}
