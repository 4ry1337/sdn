import z from "zod"
import { FloodlightDeviceSchema, FloodlightLinkSchema } from "./schema"

export type FloodlightLink = z.infer<typeof FloodlightLinkSchema>

export type FloodlightDevice = z.infer<typeof FloodlightDeviceSchema>
