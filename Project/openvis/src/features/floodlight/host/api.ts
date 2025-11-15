import axios, { AxiosError } from 'axios'
import z from 'zod'
import { Graph } from '@/entities/graph'
import { add_prefix } from '@/shared/lib/utils'
import { FloodlightDeviceResponseSchema } from './schema'

export const floodlight_fetch_hosts = async ( url: string ): Promise<Graph> => {
  try {
    let devices_response = await axios.get( `${url}/wm/device/`, { timeout: 5000 } )
    let { devices } = z.object( { "devices": z.array( FloodlightDeviceResponseSchema ) } ).parse( devices_response.data )

    const devices_with_attachment = devices.filter( d => d.attachmentPoint && d.attachmentPoint.length > 0 )

    return {
      nodes: devices_with_attachment.map( value => ( {
        id: add_prefix( url, value.mac[ 0 ] ),
        label: value.mac[ 0 ],
        type: 'host' as const,
        metadata: {
          entity_class: value.entityClass,
          mac: value.mac,
          ipv4: value.ipv4,
          ipv6: value.ipv6,
          vlan: value.vlan,
          attachment_point: value.attachmentPoint,
        },
        metrics: {
          last_seen: value.lastSeen,
        },
      } ) ),
      links: devices_with_attachment.map( value => {
        const attachment = value.attachmentPoint[ 0 ]
        const switch_dpid = attachment.switch
        const port_num = attachment.port.toString()

        return {
          source_id: add_prefix( url, value.mac[ 0 ] ),
          target_id: add_prefix( url, switch_dpid ),
          metadata: {
            src_port: port_num,
            link_type: 'host-switch',
          }
        }
      } ),
    }
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      throw new Error( `Invalid device request data from Floodlight: ${error.message}` )
    }
    if ( axios.isAxiosError( error ) ) {
      const axiosError = error as AxiosError
      if ( axiosError.code === 'ECONNABORTED' ) throw new Error( `Floodlight device request timed out after 5s. Controller may be unresponsive at ${url}` )
      if ( axiosError.code === 'ERR_NETWORK' || !axiosError.response ) throw new Error( `Cannot connect to Floodlight controller at ${url}. Check if the controller is running and the URL is correct.` )
      if ( axiosError.response ) {
        const status = axiosError.response.status
        const endpoint = axiosError.config?.url || 'unknown endpoint'
        if ( status === 404 ) throw new Error( `Floodlight device endpoint not found: ${endpoint}. This may be an unsupported Floodlight version.` )
        if ( status === 503 ) throw new Error( `Floodlight device controller is unavailable (503). Service may be starting up or overloaded.` )
        if ( status >= 500 ) throw new Error( `Floodlight device internal error (${status}) at ${endpoint}. Check controller logs.` )
        throw new Error( `Floodlight device API error (${status}): ${axiosError.response.statusText} at ${endpoint}` )
      }
    }
    throw error
  }
}
