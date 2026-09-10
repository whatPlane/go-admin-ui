import request from '@/utils/request'
import type { ApiResponse, PageQuery, PageResult } from '@/types/api'

export interface PlayerInfo {
  playerId: string
  accountId: string
  nickname: string
  gold: string
  diamond: string
  createdAt: string | null
}

export interface PlayerQuery {
  playerId?: string
  goldMin?: string
}

export function listPlayer(query: PlayerQuery & PageQuery) {
  return request<ApiResponse<PageResult<PlayerInfo>>>({
    url: '/api/v1/easy-players',
    method: 'get',
    params: query
  })
}

export function getPlayer(playerId: string) {
  return request<ApiResponse<PlayerInfo>>({
    url: `/api/v1/easy-players/${encodeURIComponent(playerId)}`,
    method: 'get'
  })
}
