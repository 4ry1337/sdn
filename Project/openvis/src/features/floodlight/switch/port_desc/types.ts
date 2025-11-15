import z from 'zod'
import { FloodlightPortDescResponseSchema, FloodlightPortDescSchema } from './schema'

export type FloodlightPortDesc = z.infer<typeof FloodlightPortDescSchema>
export type FloodlightPortDescResponse = z.infer<typeof FloodlightPortDescResponseSchema>
