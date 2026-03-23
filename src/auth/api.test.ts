import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { googleLoginRequest, loginRequest } from './api'

describe('auth api', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('creates a session after password login succeeds', async () => {
    vi.mocked(globalThis.fetch)
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: 'access-token',
            refresh_token: 'refresh-token',
            user_role: 'user',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            user_id: 'tester',
            user_role: 'user',
            display_name: 'Tester',
            avatar_url: 'https://example.com/avatar.png',
            bio: '소개',
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      )

    await expect(loginRequest({ user_id: 'tester', password: 'secret' })).resolves.toEqual({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      user_id: 'tester',
      user_role: 'user',
      display_name: 'Tester',
      avatar_url: 'https://example.com/avatar.png',
      bio: '소개',
    })
  })

  it('maps google 401 errors to a friendly message', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'invalid token',
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    )

    await expect(googleLoginRequest({ id_token: 'bad-token' })).rejects.toThrow(
      'API 401: Google 계정을 확인할 수 없어요. 다시 시도해주세요.',
    )
  })

  it('maps google 409 errors to a conflict message', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          message: 'account conflict',
        }),
        {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    )

    await expect(googleLoginRequest({ id_token: 'conflict-token' })).rejects.toThrow(
      'API 409: 이미 다른 방식으로 연결된 계정입니다. 기존 로그인 방법을 사용해주세요.',
    )
  })

  it('maps google network errors to a retryable message', async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(googleLoginRequest({ id_token: 'network-token' })).rejects.toThrow(
      '네트워크 상태를 확인한 뒤 다시 시도해주세요.',
    )
  })
})
