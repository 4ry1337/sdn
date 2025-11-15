import z from 'zod'
import { FloodlightAggregateSchema } from './schema'

export type FloodlightAggregate = z.infer<typeof FloodlightAggregateSchema>

