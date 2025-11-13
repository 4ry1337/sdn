import axios, { AxiosError } from 'axios'
import { FloodlightPortStatsResponseSchema } from './schema'
import { FloodlightPortStats } from './types'
import z from 'zod'

export const fetch_switch_port_stats = async ( url: string, dpid: string ): Promise<FloodlightPortStats[]> => {
  try {
    const response = await axios.get( `${url}/wm/core/switch/${dpid}/port/json`, { timeout: 5000 } )
    const parsed = FloodlightPortStatsResponseSchema.parse( response.data )
    return parsed.port_reply.flatMap( reply => reply.port.filter( p => p.port_number !== 'local' ) ).flat()
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      throw new Error( `Invalid switch port statistics data from Floodlight: ${error.message}` )
    }
    if ( axios.isAxiosError( error ) ) {
      const axiosError = error as AxiosError
      if ( axiosError.code === 'ECONNABORTED' ) throw new Error( `Switch port statistics timed out after 5s for ${url}` )
      if ( axiosError.code === 'ERR_NETWORK' || !axiosError.response ) throw new Error( `Cannot connect to Floodlight at ${url}` )
      if ( axiosError.response ) {
        const status = axiosError.response.status
        throw new Error( `Switch port statistics failed with status ${status}: ${axiosError.response.statusText}` )
      }
    }
    throw error
  }
}
