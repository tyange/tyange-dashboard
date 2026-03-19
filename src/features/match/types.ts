export type ApiEnvelope<T = null> = {
  status: boolean
  data?: T | null
  message?: string | null
}

export type MatchStatus = 'pending' | 'matched' | 'rejected' | 'cancelled' | 'unmatched' | string

export type MatchSummary = {
  match_id: number
  status: MatchStatus
  requester_user_id: string
  target_user_id: string
  counterpart_user_id: string
  created_at: string
  responded_at: string | null
}

export type MatchMessage = {
  message_id: number
  match_id: number
  sender_user_id: string
  receiver_user_id: string
  content: string
  created_at: string
}

export type MatchMessagesResponse = {
  match_id: number
  counterpart_user_id: string
  messages: MatchMessage[]
}
