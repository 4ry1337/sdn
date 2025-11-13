import axios, { AxiosError } from "axios"
import { FloodlightHealthResponseSchema } from './schema'
import { FloodlightHealthResponse } from './types'
import z from 'zod'

export async function check_floodlight( url: string ): Promise<FloodlightHealthResponse> {
  try {
    const response = await axios.get( `${url}/wm/core/health/json`, {
      timeout: 5000,
      headers: { 'Accept': 'application/json' },
    } )
    return FloodlightHealthResponseSchema.parse( response.data )
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      throw new Error( `Invalid health data from Floodlight: ${error.message}` )
    }
    if ( axios.isAxiosError( error ) ) {
      const axiosError = error as AxiosError
      if ( axiosError.code === 'ECONNABORTED' ) throw new Error( `Health check timed out after 5s for ${url}` )
      if ( axiosError.code === 'ERR_NETWORK' || !axiosError.response ) throw new Error( `Cannot connect to Floodlight at ${url}` )
      if ( axiosError.response ) {
        const status = axiosError.response.status
        throw new Error( `Health check failed with status ${status}: ${axiosError.response.statusText}` )
      }
    }
    throw error
  }
}
