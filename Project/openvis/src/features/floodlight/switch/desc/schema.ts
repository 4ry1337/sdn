import z from 'zod'

export const FloodlightDescSchema = z.object( {
  manufacturer_description: z.string(),
  hardware_description: z.string(),
  software_description: z.string(),
  serial_number: z.string(),
  datapath_description: z.string()
} )

