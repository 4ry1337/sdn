import z from 'zod'
import axios, { AxiosError } from 'axios'
import { FloodlightAggregateSchema } from './schema'
import { FloodlightAggregate } from './types'

export const floodlight_fetch_switches_aggregate = async ( url: string, dpid: string ): Promise<FloodlightAggregate> => {
  try {
    let aggregate_response = await axios.get( `${url}/wm/core/switch/${dpid}/aggregate/json`, { timeout: 5000 } )
    let { aggregate } = z.object( { 'aggregate': FloodlightAggregateSchema } ).parse( aggregate_response.data )
    return aggregate
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      throw new Error( `Invalid switch desc request data from Floodlight: ${error.message}` )
    }
    if ( axios.isAxiosError( error ) ) {
      const axiosError = error as AxiosError
      if ( axiosError.code === 'ECONNABORTED' ) throw new Error( `Floodlight switch desc request timed out after 5s. Controller may be unresponsive at ${url}` )
      if ( axiosError.code === 'ERR_NETWORK' || !axiosError.response ) throw new Error( `Cannot connect to Floodlight controller at ${url}. Check if the controller is running and the URL is correct.` )
      if ( axiosError.response ) {
        const status = axiosError.response.status
        const endpoint = axiosError.config?.url || 'unknown endpoint'
        if ( status === 404 ) throw new Error( `Floodlight switch endpoint not found: ${endpoint}. This may be an unsupported Floodlight version.` )
        if ( status === 503 ) throw new Error( `Floodlight switch controller is unavailable (503). Service may be starting up or overloaded.` )
        if ( status >= 500 ) throw new Error( `Floodlight switch internal error (${status}) at ${endpoint}. Check controller logs.` )
        throw new Error( `Floodlight switch API error (${status}): ${axiosError.response.statusText} at ${endpoint}` )
      }
    }
    throw error
  }
}
