import z from "zod"
import { NextRequest, NextResponse } from "next/server"
import { check_floodlight } from "@/features/floodlight/controller/health"

const GetFloodlightTopologyQuerySchema = z.object( {
  url: z.url( 'Invalid controller URL' ),
} )

export async function GET( req: NextRequest ) {
  const search_params = req.nextUrl.searchParams
  const params = {
    url: search_params.get( "url" ),
  }

  // Validate query parameters
  const validation = GetFloodlightTopologyQuerySchema.safeParse( params )
  if ( !validation.success ) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid parameters',
          details: validation.error.issues,
        }
      },
      { status: 400 }
    )
  }

  const { url } = validation.data

  try {
    const health = await check_floodlight( url )
    return NextResponse.json( health, { status: 200 } )

  } catch ( e ) {
    const errorMessage = e instanceof Error ? e.message : 'Unknown error'
    console.error( "[API] Floodlight topology fetch failed:", {
      url,
      error: errorMessage,
      timestamp: new Date().toISOString()
    } )

    let statusCode = 500
    let errorCode = 'INTERNAL_ERROR'

    if ( errorMessage.includes( 'timed out' ) ) {
      statusCode = 504 // Gateway Timeout
      errorCode = 'TIMEOUT_ERROR'
    } else if ( errorMessage.includes( 'Cannot connect' ) ) {
      statusCode = 503 // Service Unavailable
      errorCode = 'CONNECTION_ERROR'
    } else if ( errorMessage.includes( 'not found' ) ) {
      statusCode = 502 // Bad Gateway
      errorCode = 'ENDPOINT_NOT_FOUND'
    } else if ( errorMessage.includes( 'Invalid' ) && errorMessage.includes( 'data' ) ) {
      statusCode = 502 // Bad Gateway
      errorCode = 'VALIDATION_ERROR'
    }

    return NextResponse.json( {
      error: {
        code: errorCode,
        message: errorMessage,
        url,
        timestamp: new Date().toISOString(),
      }
    }, { status: statusCode } )
  }
}
