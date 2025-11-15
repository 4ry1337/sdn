import z from 'zod'
import { FloodlightDeviceResponseSchema } from './schema'

export type FloodlightDeviceResponse = z.infer<typeof FloodlightDeviceResponseSchema>

