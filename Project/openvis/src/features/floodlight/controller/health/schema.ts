import z from 'zod'

//http://www.localhost:8080/wm/core/health/json
export const FloodlightHealthResponseSchema = z.object( {
  healthy: z.boolean(),
} )
