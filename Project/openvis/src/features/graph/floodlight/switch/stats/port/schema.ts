import z from 'zod'

// http://localhost:8080/wm/core/switch/{dpid}/port/json
// Port statistics for bandwidth calculation
// Note: Floodlight returns all numbers as strings, so we need to coerce them
export const FloodlightPortStatsSchema = z.object( {
  port_number: z.string(),
  receive_packets: z.string(),
  transmit_packets: z.string(),
  receive_bytes: z.string(),
  transmit_bytes: z.string(),
  receive_dropped: z.string(),
  transmit_dropped: z.string(),
  receive_errors: z.string(),
  transmit_errors: z.string(),
  receive_frame_errors: z.string(),
  receive_overrun_errors: z.string(),
  receive_CRC_errors: z.string(),
  collisions: z.string(),
  duration_sec: z.string(),
  duration_nsec: z.string(),
} )

export const FloodlightPortReplySchema = z.object( {
  version: z.string().optional(),
  port: z.array( FloodlightPortStatsSchema ),
} )

export const FloodlightPortStatsResponseSchema = z.object( {
  port_reply: z.array( FloodlightPortReplySchema ),
} )
