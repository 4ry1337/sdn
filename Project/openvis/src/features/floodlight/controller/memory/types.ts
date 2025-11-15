import z from "zod"
import { FloodlightMemorySchema } from './schema'

export type FloodlightMemory = z.infer<typeof FloodlightMemorySchema>
