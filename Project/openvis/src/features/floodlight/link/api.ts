import axios, { AxiosError } from 'axios'
import z from 'zod'
import { Graph } from '@/entities/graph'
import { FloodlightLinkResponseSchema } from './schema'
import { add_prefix } from '@/shared/lib/utils'

export const floodlight_fetch_links = async (
  url: string,
  port_stats_map: Map<string, any[]>,
  port_desc_map: Map<string, any[]>
): Promise<Graph> => {
  try {
    let links_response = await axios.get( `${url}/wm/topology/links/json`, { timeout: 5000 } )
    let links = z.array( FloodlightLinkResponseSchema ).parse( links_response.data )

    return {
      nodes: [],
      links: links.map( value => {
        const src_switch = value[ 'src-switch' ]
        const dst_switch = value[ 'dst-switch' ]
        const src_port = value[ 'src-port' ].toString()
        const dst_port = value[ 'dst-port' ].toString()

        const src_stats = port_stats_map.get( src_switch )?.find( ( p: any ) => p.port_number === src_port )
        const dst_stats = port_stats_map.get( dst_switch )?.find( ( p: any ) => p.port_number === dst_port )

        const src_desc = port_desc_map.get( src_switch )?.find( ( p: any ) => p.port_number === src_port )
        const dst_desc = port_desc_map.get( dst_switch )?.find( ( p: any ) => p.port_number === dst_port )

        const duration_sec = Math.max( src_stats?.duration_sec || 1, dst_stats?.duration_sec || 1 )
        const tx_bandwidth = duration_sec > 0 ? ( src_stats?.transmit_bytes || 0 ) / duration_sec : 0
        const rx_bandwidth = duration_sec > 0 ? ( dst_stats?.receive_bytes || 0 ) / duration_sec : 0
        const utilization = ( tx_bandwidth + rx_bandwidth ) / 2

        return {
          source_id: add_prefix( url, src_switch ),
          target_id: add_prefix( url, dst_switch ),
          metrics: {
            utilization: utilization,
            transmit_bytes: ( src_stats?.transmit_bytes || 0 ) + ( dst_stats?.transmit_bytes || 0 ),
            receive_bytes: ( src_stats?.receive_bytes || 0 ) + ( dst_stats?.receive_bytes || 0 ),
            transmit_packets: ( src_stats?.transmit_packets || 0 ) + ( dst_stats?.transmit_packets || 0 ),
            receive_packets: ( src_stats?.receive_packets || 0 ) + ( dst_stats?.receive_packets || 0 ),
            transmit_errors: ( src_stats?.transmit_errors || 0 ) + ( dst_stats?.transmit_errors || 0 ),
            receive_errors: ( src_stats?.receive_errors || 0 ) + ( dst_stats?.receive_errors || 0 ),
            transmit_dropped: ( src_stats?.transmit_dropped || 0 ) + ( dst_stats?.transmit_dropped || 0 ),
            receive_dropped: ( src_stats?.receive_dropped || 0 ) + ( dst_stats?.receive_dropped || 0 ),
            latency: value.latency,
          },
          metadata: {
            src_port,
            dst_port,
            link_type: value.type,
            direction: value.direction,
            src_port_name: src_desc?.name,
            dst_port_name: dst_desc?.name,
          }
        }
      } )
    }
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      throw new Error( `Invalid links request data from Floodlight: ${error.message}` )
    }
    if ( axios.isAxiosError( error ) ) {
      const axiosError = error as AxiosError
      if ( axiosError.code === 'ECONNABORTED' ) throw new Error( `Floodlight links request timed out after 5s. Controller may be unresponsive at ${url}` )
      if ( axiosError.code === 'ERR_NETWORK' || !axiosError.response ) throw new Error( `Cannot connect to Floodlight controller at ${url}. Check if the controller is running and the URL is correct.` )
      if ( axiosError.response ) {
        const status = axiosError.response.status
        const endpoint = axiosError.config?.url || 'unknown endpoint'
        if ( status === 404 ) throw new Error( `Floodlight links endpoint not found: ${endpoint}. This may be an unsupported Floodlight version.` )
        if ( status === 503 ) throw new Error( `Floodlight links controller is unavailable (503). Service may be starting up or overloaded.` )
        if ( status >= 500 ) throw new Error( `Floodlight links internal error (${status}) at ${endpoint}. Check controller logs.` )
        throw new Error( `Floodlight links API error (${status}): ${axiosError.response.statusText} at ${endpoint}` )
      }
    }
    throw error
  }
}
