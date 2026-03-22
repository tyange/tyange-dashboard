import { describe, expect, it } from 'vitest'
import { buildProfileViewModel, buildRelationshipState, buildTimelineEntries } from './presentation'
import type { MatchMessage, MatchSummary } from './types'

describe('match presentation helpers', () => {
  it('builds a deterministic self profile view model', () => {
    const profile = buildProfileViewModel('me@example.com', 'me@example.com')

    expect(profile.displayName).toBe('나')
    expect(profile.handle).toBe('@me@example.com')
    expect(profile.initials).toBe('ME')
    expect(profile.bio).toContain('내 프로필')
  })

  it('maps pending incoming relationships for the counterpart profile', () => {
    const summary: MatchSummary = {
      match_id: 7,
      status: 'pending',
      requester_user_id: 'partner@example.com',
      target_user_id: 'me@example.com',
      counterpart_user_id: 'partner@example.com',
      created_at: '2026-03-22 10:00:00',
      responded_at: null,
    }

    expect(buildRelationshipState(summary, 'me@example.com', 'partner@example.com')).toMatchObject({
      kind: 'pending-incoming',
      label: '내 응답 필요',
    })
  })

  it('creates date dividers inside timeline entries', () => {
    const messages: MatchMessage[] = [
      {
        message_id: 1,
        match_id: 9,
        sender_user_id: 'me@example.com',
        receiver_user_id: 'partner@example.com',
        content: '첫 메시지',
        created_at: '2026-03-22 10:00:00',
      },
      {
        message_id: 2,
        match_id: 9,
        sender_user_id: 'partner@example.com',
        receiver_user_id: 'me@example.com',
        content: '둘째 메시지',
        created_at: '2026-03-23 11:00:00',
      },
    ]

    const entries = buildTimelineEntries(messages, 'me@example.com')

    expect(entries.filter((entry) => entry.type === 'day')).toHaveLength(2)
    expect(entries.filter((entry) => entry.type === 'message')).toHaveLength(2)
  })
})
