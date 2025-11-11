import z from "zod"
import { FloodlightDeviceSchema, FloodlightLinkSchema, FloodlightSwitchSchema } from "./schema"

export type FloodlightSwitch = z.infer<typeof FloodlightSwitchSchema>

export type FloodlightLink = z.infer<typeof FloodlightLinkSchema>

export type FloodlightDevice = z.infer<typeof FloodlightDeviceSchema>
