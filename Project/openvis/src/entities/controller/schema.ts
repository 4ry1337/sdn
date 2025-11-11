import z from "zod"

export const ControllerTypeSchema = z.enum( [ 'floodlight' ] )

export const ControllerStatusSchema = z.enum( [ 'connecting', 'connected', 'unreachable', 'error', 'disconnected' ] )

export const ControllerSchema = z.object( {
  url: z.url(),
  interval: z.number().gt( 0 ),
  status: ControllerStatusSchema,
} )
