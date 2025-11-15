import z from 'zod'

// http://localhost:8080/wm/core/switch/{dpid}/port/json
// Port statistics for bandwidth calculation
// Note: Floodlight returns all numbers as strings, so we need to coerce them
export const FloodlightPortStatsSchema = z.object( {
  port_number: z.string(),
  receive_packets: z.coerce.number(),
  transmit_packets: z.coerce.number(),
  receive_bytes: z.coerce.number(),
  transmit_bytes: z.coerce.number(),
  receive_dropped: z.coerce.number(),
  transmit_dropped: z.coerce.number(),
  receive_errors: z.coerce.number(),
  transmit_errors: z.coerce.number(),
  receive_frame_errors: z.coerce.number(),
  receive_overrun_errors: z.coerce.number(),
  receive_CRC_errors: z.coerce.number(),
  collisions: z.coerce.number(),
  duration_sec: z.coerce.number(),
  duration_nsec: z.coerce.number(),
} )

export const FloodlightPortReplySchema = z.object( {
  version: z.string().optional(),
  port: z.array( FloodlightPortStatsSchema ),
} )

export const FloodlightPortStatsResponseSchema = z.object( {
  port_reply: z.array( FloodlightPortReplySchema ),
} )
