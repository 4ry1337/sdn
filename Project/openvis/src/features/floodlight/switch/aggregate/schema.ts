import z from 'zod'

export const FloodlightAggregateSchema = z.object( {
  version: z.string(),
  flow_count: z.coerce.number(),
  packet_count: z.coerce.number(),
  byte_count: z.coerce.number(),
} )

