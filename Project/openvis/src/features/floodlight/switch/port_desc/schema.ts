import z from 'zod'

export const FloodlightPortDescSchema = z.object( {
  port_number: z.string(),
  hardware_address: z.string(),
  name: z.string(),
  config: z.array( z.string() ),
  state: z.array( z.string() ),
  current_features: z.array( z.string() ),
  advertised_features: z.array( z.string() ),
  supported_features: z.array( z.string() ),
  peer_features: z.array( z.string() ),
  curr_speed: z.string(),
  max_speed: z.string(),
} )

export const FloodlightPortDescResponseSchema = z.object( {
  version: z.string(),
  port_desc: z.array( FloodlightPortDescSchema ),
} )
