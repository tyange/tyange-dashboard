import { createAuthorizedHeaders, getApiBaseUrl, getRequiredAccessToken } from '../../auth/api'
import type {
  ApiStatusResponse,
  BudgetPlanPayload,
  BudgetSummary,
  BudgetUpsertPayload,
  CreateSpendingResponse,
  SpendRecord,
  SpendingImportCommitResponse,
  SpendingImportPreviewResponse,
  SpendingListResponse,
} from './types'

const apiBaseUrl = getApiBaseUrl()

async function getErrorMessage(response: Response, fallbackMessage: string) {
  const bodyText = await response.text()

  if (!bodyText) {
    return fallbackMessage
  }

  try {
    const payload = JSON.parse(bodyText) as { message?: string; statusMessage?: string }
    return payload.message || payload.statusMessage || bodyText
  } catch {
    return bodyText
  }
}

function unwrapApiData<T>(payload: T | ApiStatusResponse<T>): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as ApiStatusResponse<T>).data as T
  }

  return payload as T
}

async function fetchJsonOrThrow<T>(input: string, init: RequestInit, fallbackMessage: string): Promise<T> {
  const response = await fetch(input, init)

  if (!response.ok) {
    const message = await getErrorMessage(response, fallbackMessage)
    throw new Error(`API ${response.status}: ${message}`)
  }

  return response.json() as Promise<T>
}

function getAuthHeaders(init?: HeadersInit) {
  return createAuthorizedHeaders(getRequiredAccessToken(), init)
}

export async function fetchBudgetSummary(): Promise<BudgetSummary> {
  return fetchJsonOrThrow<BudgetSummary>(
    `${apiBaseUrl}/budget`,
    {
      headers: getAuthHeaders(),
    },
    '예산 요약 조회 실패',
  )
}

export async function createBudgetPlan(
  payload: BudgetPlanPayload,
): Promise<ApiStatusResponse<BudgetSummary>> {
  return fetchJsonOrThrow<ApiStatusResponse<BudgetSummary>>(
    `${apiBaseUrl}/budget/plan`,
    {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(payload),
    },
    '예산 생성 실패',
  )
}

export async function updateBudget(
  payload: BudgetUpsertPayload,
): Promise<ApiStatusResponse<BudgetSummary>> {
  return fetchJsonOrThrow<ApiStatusResponse<BudgetSummary>>(
    `${apiBaseUrl}/budget`,
    {
      method: 'PUT',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(payload),
    },
    '예산 수정 실패',
  )
}

export async function fetchSpendingGroups(): Promise<SpendingListResponse> {
  return fetchJsonOrThrow<SpendingListResponse>(
    `${apiBaseUrl}/budget/spending`,
    {
      headers: getAuthHeaders(),
    },
    '소비 기록 조회 실패',
  )
}

export async function createSpendRecord(
  amount: number,
  merchant: string | null,
  transactedAt: string,
): Promise<CreateSpendingResponse> {
  return fetchJsonOrThrow<CreateSpendingResponse>(
    `${apiBaseUrl}/budget/spending`,
    {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        amount,
        merchant,
        transacted_at: transactedAt,
      }),
    },
    '소비 기록 저장 실패',
  )
}

export async function updateSpendRecord(
  recordId: number,
  amount: number,
  merchant: string | null,
  transactedAt: string,
): Promise<SpendRecord> {
  const payload = await fetchJsonOrThrow<SpendRecord | ApiStatusResponse<SpendRecord>>(
    `${apiBaseUrl}/budget/spending/${recordId}`,
    {
      method: 'PUT',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({
        amount,
        merchant,
        transacted_at: transactedAt,
      }),
    },
    '소비 기록 수정 실패',
  )

  return unwrapApiData(payload)
}

export async function deleteSpendRecord(recordId: number): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/budget/spending/${recordId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const message = await getErrorMessage(response, '소비 기록 삭제 실패')
    throw new Error(`API ${response.status}: ${message}`)
  }
}

export async function deleteAllSpendRecords(): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/budget/spending`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })

  if (!response.ok) {
    const message = await getErrorMessage(response, '소비 기록 일괄 삭제 실패')
    throw new Error(`API ${response.status}: ${message}`)
  }
}

export async function importSpendingPreview(file: File): Promise<SpendingImportPreviewResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${apiBaseUrl}/budget/spending/import-preview`, {
    method: 'POST',
    headers: getAuthHeaders({
      Accept: 'application/json',
    }),
    body: formData,
  })

  if (!response.ok) {
    const message = await getErrorMessage(response, '가져오기 미리보기 실패')
    throw new Error(`API ${response.status}: ${message}`)
  }

  const payload = unwrapApiData(
    (await response.json()) as SpendingImportPreviewResponse | ApiStatusResponse<SpendingImportPreviewResponse>,
  )

  return {
    ...payload,
    rows: Array.isArray(payload?.rows) ? payload.rows : [],
  }
}

export async function importSpendingCommit(
  file: File,
  selectedFingerprints: string[],
): Promise<SpendingImportCommitResponse> {
  const formData = new FormData()
  formData.append('file', file)
  selectedFingerprints.forEach((fingerprint) => {
    formData.append('selected_fingerprints', fingerprint)
  })

  const response = await fetch(`${apiBaseUrl}/budget/spending/import-commit`, {
    method: 'POST',
    headers: getAuthHeaders({
      Accept: 'application/json',
    }),
    body: formData,
  })

  if (!response.ok) {
    const message = await getErrorMessage(response, '가져오기 반영 실패')
    throw new Error(`API ${response.status}: ${message}`)
  }

  return unwrapApiData(
    (await response.json()) as SpendingImportCommitResponse | ApiStatusResponse<SpendingImportCommitResponse>,
  )
}
