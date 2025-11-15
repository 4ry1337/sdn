import z from "zod"
import { FloodlightTablesSchema } from './schema'

export type FloodlightTables = z.infer<typeof FloodlightTablesSchema>
