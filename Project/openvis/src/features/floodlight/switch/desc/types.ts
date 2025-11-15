import z from 'zod'
import { FloodlightDescSchema } from './schema'

export type FloodlightDesc = z.infer<typeof FloodlightDescSchema>

