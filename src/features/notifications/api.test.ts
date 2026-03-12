import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchPushPublicKeyState } from './api'

vi.mock('../../auth/api', () => ({
  createAuthorizedHeaders: () => ({
    Accept: 'application/json',
    Authorization: 'token',
  }),
  getApiBaseUrl: () => 'https://cms.test/api/cms',
  getRequiredAccessToken: () => 'token',
}))

describe('fetchPushPublicKeyState', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('returns available when the public key request succeeds', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          status: true,
          data: {
            public_key: 'test-public-key',
          },
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    )

    await expect(fetchPushPublicKeyState()).resolves.toEqual({
      availability: 'available',
      publicKey: 'test-public-key',
    })
  })

  it('returns unavailable when the server responds with 503', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'VAPID_PUBLIC_KEY missing',
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    )

    await expect(fetchPushPublicKeyState()).resolves.toEqual({
      availability: 'unavailable',
      publicKey: null,
    })
  })

  it('returns error for other failures', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'internal error',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    )

    const result = await fetchPushPublicKeyState()

    expect(result.availability).toBe('error')
    if (result.availability === 'error') {
      expect(result.error.message).toBe('API 500: internal error')
    }
  })
})
