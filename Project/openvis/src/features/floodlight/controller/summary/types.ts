import z from "zod"
import { FloodlightSummerySchema } from './schema'

export type FloodlightSummery = z.infer<typeof FloodlightSummerySchema>
