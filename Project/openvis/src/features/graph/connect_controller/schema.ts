import { ControllerTypeSchema } from '@/entities/controller'
import z from "zod"

export const ConnectControllerSchema = z.object( {
  url: z.url( "Invalid URL format" ),
  interval: z.number( "Interval must be a number" )
    .min( 999, "Polling interval must be at least 1000ms" ),
  type: ControllerTypeSchema
} )
