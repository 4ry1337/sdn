import z from "zod"
import { FloodlightUptimeSchema } from './schema'

export type FloodlightUptime = z.infer<typeof FloodlightUptimeSchema>
