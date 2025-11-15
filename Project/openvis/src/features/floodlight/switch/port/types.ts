import z from 'zod'

import { FloodlightPortReplySchema, FloodlightPortStatsResponseSchema, FloodlightPortStatsSchema } from './schema'

export type FloodlightPortStats = z.infer<typeof FloodlightPortStatsSchema>
export type FloodlightPortReply = z.infer<typeof FloodlightPortReplySchema>
export type FloodlightPortStatsResponse = z.infer<typeof FloodlightPortStatsResponseSchema>
