import axios, { AxiosError } from 'axios'
import z from 'zod'
import { FloodlightSwitchSchema } from './schema'
import { Graph } from '@/entities/graph'
import { add_prefix } from '@/shared/lib/utils'
import { fetch_switch_port_stats } from './stats/port'

export const floodlight_fetch_switches = async ( url: string ): Promise<Graph> => {
  try {
    let switches_response = await axios.get( `${url}/wm/core/controller/switches/json`, { timeout: 5000 } )
    let switches = z.array( FloodlightSwitchSchema ).parse( switches_response.data )

    const switch_port_stats = await Promise.all(
      switches.map( async ( value ) => ( {
        dpid: value.switchDPID,
        stats: await fetch_switch_port_stats( url, value.switchDPID )
      } ) )
    )

    const port_stats_map = new Map( switch_port_stats.map( ( { dpid, stats } ) => [ dpid, stats ] ) )

    return {
      nodes: switches.map( value => ( {
        id: add_prefix( url, value.switchDPID ),
        type: 'switch' as const,
        label: value.switchDPID,
        metrics: port_stats_map.get( value.switchDPID )
      } ) ),
      links: switches.map( value => ( {
        source_id: add_prefix( url, 'floodlight-controller' ),
        target_id: add_prefix( url, value.switchDPID )
      } ) )
    }
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      throw new Error( `Invalid switch request data from Floodlight: ${error.message}` )
    }
    if ( axios.isAxiosError( error ) ) {
      const axiosError = error as AxiosError
      if ( axiosError.code === 'ECONNABORTED' ) throw new Error( `Floodlight switch request timed out after 5s. Controller may be unresponsive at ${url}` )
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
