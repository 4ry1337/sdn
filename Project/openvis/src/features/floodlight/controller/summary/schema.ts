import z from "zod"

//http://www.localhost:8080/wm/core/switch/json
export const FloodlightSummerySchema = z.object( {
  // "# Switches": 3,
  // "# inter-switch links": 4,
  // "# quarantine ports": 0,
  // "# hosts": 7
  "# Switches": z.number(),
  "# inter-switch links": z.number(),
  "# quarantine ports": z.number(),
  "# hosts": z.number(),
} )
