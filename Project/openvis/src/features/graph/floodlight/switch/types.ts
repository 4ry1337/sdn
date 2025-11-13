import z from 'zod'
import { FloodlightSwitchSchema } from './schema'

export type FloodlightSwitch = z.infer<typeof FloodlightSwitchSchema>

