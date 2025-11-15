import z from "zod"

export const FloodlightVersionSchema = z.object( {
  name: z.string(),
  version: z.string()
} )
