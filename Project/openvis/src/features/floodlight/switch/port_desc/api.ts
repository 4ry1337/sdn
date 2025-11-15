import axios, { AxiosError } from 'axios'
import z from 'zod'
import { FloodlightPortDescResponseSchema } from './schema'
import { FloodlightPortDescResponse } from './types'

export const fetch_switch_port_desc = async ( url: string, dpid: string ): Promise<FloodlightPortDescResponse> => {
  try {
    const response = await axios.get( `${url}/wm/core/switch/${dpid}/port-desc/json`, { timeout: 5000 } )
    return FloodlightPortDescResponseSchema.parse( response.data )
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      throw new Error( `Invalid switch port desc data from Floodlight: ${error.message}` )
    }
    if ( axios.isAxiosError( error ) ) {
      const axiosError = error as AxiosError
      if ( axiosError.code === 'ECONNABORTED' ) throw new Error( `Switch port desc timed out after 5s for ${url}` )
      if ( axiosError.code === 'ERR_NETWORK' || !axiosError.response ) throw new Error( `Cannot connect to Floodlight at ${url}` )
      if ( axiosError.response ) {
        const status = axiosError.response.status
        throw new Error( `Switch port desc failed with status ${status}: ${axiosError.response.statusText}` )
      }
    }
    throw error
  }
}
