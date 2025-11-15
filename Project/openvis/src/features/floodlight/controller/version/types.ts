import z from "zod"
import { FloodlightVersionSchema } from './schema'

export type FloodlightVersion = z.infer<typeof FloodlightVersionSchema>
