import z from "zod"
import axios, { AxiosError } from "axios"
import { Graph, Link, Node } from "@/entities/graph"
import { floodlight_fetch_switches } from './switch'
import { floodlight_fetch_hosts } from './host'
import { floodlight_fetch_links } from './link'
import { floodlight_fetch_controller } from './controller'
import { remove_prefix } from '@/shared/lib/utils'

export async function fetch_floodlight_topology( url: string ): Promise<Graph> {
  try {
    // Fetch controller and switches first (switches include all port data)
    const [ controller_response, switches_response, links_response, devices_response ] = await Promise.all( [
      floodlight_fetch_controller( url ),
      floodlight_fetch_switches( url ),
      floodlight_fetch_links( url ),
      floodlight_fetch_hosts( url )
    ] )

    // Extract port data from switch nodes to avoid duplicate fetching
    const port_stats_map = new Map()
    const port_desc_map = new Map()

    switches_response.nodes.forEach( node => {
      if ( node.type === 'switch' && node.port ) {
        const dpid = node.id.split( '::' )[ 1 ]
        if ( dpid ) {
          port_stats_map.set( dpid, node.port.map( p => ( { ...p.metrics, port_number: p.port_number } ) ) )
          port_desc_map.set( dpid, node.port.map( p => ( { ...p.metadata, port_number: p.port_number } ) ) )
        }
      }
    } )

    // Enrich host links with port metrics and metadata
    const enriched_host_links = devices_response.links.map( link => {
      const src_port = link.metadata?.src_port
      const switch_dpid = remove_prefix( link.target_id )

      const port_stats = port_stats_map.get( switch_dpid )?.find( ( p: any ) => p.port_number === src_port )
      const port_desc = port_desc_map.get( switch_dpid )?.find( ( p: any ) => p.port_number === src_port )

      const duration_sec = port_stats?.duration_sec || 1
      const tx_bandwidth = duration_sec > 0 ? ( port_stats?.transmit_bytes || 0 ) / duration_sec : 0
      const rx_bandwidth = duration_sec > 0 ? ( port_stats?.receive_bytes || 0 ) / duration_sec : 0
      const utilization = ( tx_bandwidth + rx_bandwidth ) / 2

      return {
        ...link,
        metrics: {
          utilization: utilization,
          transmit_bytes: port_stats?.transmit_bytes,
          receive_bytes: port_stats?.receive_bytes,
          transmit_packets: port_stats?.transmit_packets,
          receive_packets: port_stats?.receive_packets,
          transmit_errors: port_stats?.transmit_errors,
          receive_errors: port_stats?.receive_errors,
          transmit_dropped: port_stats?.transmit_dropped,
          receive_dropped: port_stats?.receive_dropped,
        },
        metadata: {
          ...link.metadata,
          src_port_name: port_desc?.name,
        }
      }
    } )

    // Enrich switch-to-switch links with port metrics and metadata
    const enriched_switch_links = links_response.links.map( link => {
      const src_switch = remove_prefix( link.source_id )
      const dst_switch = remove_prefix( link.target_id )
      const src_port = link.metadata?.src_port
      const dst_port = link.metadata?.dst_port

      const src_stats = port_stats_map.get( src_switch )?.find( ( p: any ) => p.port_number === src_port )
      const dst_stats = port_stats_map.get( dst_switch )?.find( ( p: any ) => p.port_number === dst_port )

      const src_desc = port_desc_map.get( src_switch )?.find( ( p: any ) => p.port_number === src_port )
      const dst_desc = port_desc_map.get( dst_switch )?.find( ( p: any ) => p.port_number === dst_port )

      const duration_sec = Math.max( src_stats?.duration_sec || 1, dst_stats?.duration_sec || 1 )
      const tx_bandwidth = duration_sec > 0 ? ( src_stats?.transmit_bytes || 0 ) / duration_sec : 0
      const rx_bandwidth = duration_sec > 0 ? ( dst_stats?.receive_bytes || 0 ) / duration_sec : 0
      const utilization = ( tx_bandwidth + rx_bandwidth ) / 2

      return {
        ...link,
        metrics: {
          ...link.metrics,
          utilization: utilization,
          transmit_bytes: ( src_stats?.transmit_bytes || 0 ) + ( dst_stats?.transmit_bytes || 0 ),
          receive_bytes: ( src_stats?.receive_bytes || 0 ) + ( dst_stats?.receive_bytes || 0 ),
          transmit_packets: ( src_stats?.transmit_packets || 0 ) + ( dst_stats?.transmit_packets || 0 ),
          receive_packets: ( src_stats?.receive_packets || 0 ) + ( dst_stats?.receive_packets || 0 ),
          transmit_errors: ( src_stats?.transmit_errors || 0 ) + ( dst_stats?.transmit_errors || 0 ),
          receive_errors: ( src_stats?.receive_errors || 0 ) + ( dst_stats?.receive_errors || 0 ),
          transmit_dropped: ( src_stats?.transmit_dropped || 0 ) + ( dst_stats?.transmit_dropped || 0 ),
          receive_dropped: ( src_stats?.receive_dropped || 0 ) + ( dst_stats?.receive_dropped || 0 ),
        },
        metadata: {
          ...link.metadata,
          src_port_name: src_desc?.name,
          dst_port_name: dst_desc?.name,
        }
      }
    } )

    const nodes: Node[] = [
      controller_response,
      ...switches_response.nodes,
      ...devices_response.nodes
    ]

    const links: Link[] = [
      ...switches_response.links,
      ...enriched_switch_links,
      ...enriched_host_links
    ]

    return {
      nodes,
      links,
    }
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      throw new Error( `Invalid topology data from Floodlight: ${error.message}` )
    }
    if ( axios.isAxiosError( error ) ) {
      const axiosError = error as AxiosError
      if ( axiosError.code === 'ECONNABORTED' ) throw new Error( `Floodlight request timed out after 5s. Controller may be unresponsive at ${url}` )
      if ( axiosError.code === 'ERR_NETWORK' || !axiosError.response ) throw new Error( `Cannot connect to Floodlight controller at ${url}. Check if the controller is running and the URL is correct.` )
      if ( axiosError.response ) {
        const status = axiosError.response.status
        const endpoint = axiosError.config?.url || 'unknown endpoint'
        if ( status === 404 ) throw new Error( `Floodlight endpoint not found: ${endpoint}. This may be an unsupported Floodlight version.` )
        if ( status === 503 ) throw new Error( `Floodlight controller is unavailable (503). Service may be starting up or overloaded.` )
        if ( status >= 500 ) throw new Error( `Floodlight internal error (${status}) at ${endpoint}. Check controller logs.` )
        throw new Error( `Floodlight API error (${status}): ${axiosError.response.statusText} at ${endpoint}` )
      }
    }
    throw error
  }
}
