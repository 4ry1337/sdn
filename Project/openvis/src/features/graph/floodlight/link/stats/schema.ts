import z from 'zod'

export const FloodlightLinkResponseSchema = z.object( {
  'src-switch': z.string(),
  'src-port': z.number(),
  'dst-switch': z.string(),
  'dst-port': z.number(),
  type: z.string(),
  direction: z.string(),
  latency: z.number(),
} )
