import axios, { AxiosError } from 'axios'
import z from 'zod'
import { Graph } from '@/entities/graph'
import { FloodlightLinkResponseSchema } from './schema'
import { add_prefix } from '@/shared/lib/utils'

export const floodlight_fetch_links = async ( url: string ): Promise<Graph> => {
  try {
    let links_response = await axios.get( `${url}/wm/topology/links/json`, { timeout: 5000 } )
    let links = z.array( FloodlightLinkResponseSchema ).parse( links_response.data )
    return {
      nodes: [],
      links: links.map( value => ( {
        source_id: add_prefix( url, value[ 'src-switch' ] ),
        target_id: add_prefix( url, value[ 'dst-switch' ] ),
      } ) )
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
