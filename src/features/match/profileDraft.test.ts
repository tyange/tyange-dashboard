import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearProfileDraft, loadProfileDraft, saveProfileDraft } from './profileDraft'

describe('profile draft storage', () => {
  const store = new Map<string, string>()

  beforeEach(() => {
    store.clear()
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value)
        },
        removeItem: (key: string) => {
          store.delete(key)
        },
        clear: () => {
          store.clear()
        },
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    store.clear()
  })

  it('stores and reloads a draft by user id', () => {
    saveProfileDraft('me@example.com', {
      displayName: '내 이름',
      bio: '짧은 소개',
    })

    expect(loadProfileDraft('me@example.com')).toEqual({
      displayName: '내 이름',
      bio: '짧은 소개',
    })
  })

  it('removes draft when cleared', () => {
    saveProfileDraft('me@example.com', {
      displayName: '내 이름',
      bio: '짧은 소개',
    })

    clearProfileDraft('me@example.com')

    expect(loadProfileDraft('me@example.com')).toBeNull()
  })
})
