import z from "zod"

//http://www.localhost:8080/wm/core/memory/json
export const FloodlightMemorySchema = z.object( {
  total: z.number(),
  free: z.number()
} )
