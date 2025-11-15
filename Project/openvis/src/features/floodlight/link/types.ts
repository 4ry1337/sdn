import z from 'zod'
import { FloodlightLinkResponseSchema } from './schema'

export type FloodlightLinkResponse = z.infer<typeof FloodlightLinkResponseSchema>

