import z from "zod"

// http://www.localhost:8080/wm/core/system/uptime/json
export const FloodlightUptimeSchema = z.object( {
  systemUptimeMsec: z.number()
} )
