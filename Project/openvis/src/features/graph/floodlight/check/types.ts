import z from 'zod'
import { FloodlightHealthResponseSchema } from './schema'

export type FloodlightHealthResponse = z.infer<typeof FloodlightHealthResponseSchema>
